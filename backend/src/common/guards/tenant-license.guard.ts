import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_LICENSE_CHECK_KEY } from '../decorators/skip-license-check.decorator';
import { UserRole } from '../enums/role.enum';
import { FirmEntity, FirmStatus } from '../../database/entities/firm.entity';
import { LicenseKeyEntity, LicenseStatus } from '../../database/entities/license-key.entity';

@Injectable()
export class TenantLicenseGuard implements CanActivate {
  private readonly logger = new Logger(TenantLicenseGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipLicense = this.reflector.getAllAndOverride<boolean>(SKIP_LICENSE_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipLicense) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Platform SuperAdmin does not get blocked by single tenant license
    if (user?.role === UserRole.SUPER_ADMIN && !request.query?.tenant) {
      return true;
    }

    // Resolve tenant slug
    const tenantSlug =
      request.tenant?.slug ||
      user?.tenantSlug ||
      request.headers['x-tenant-slug'] ||
      request.query?.tenant ||
      request.query?.tenantSlug;

    if (!tenantSlug) {
      // If no tenant is scoped (e.g. system level endpoints), allow proceeding
      return true;
    }

    const cleanSlug = String(tenantSlug).toLowerCase().trim();

    const firmRepo = this.dataSource.getRepository(FirmEntity);
    const licenseRepo = this.dataSource.getRepository(LicenseKeyEntity);

    const firm = await firmRepo.findOne({
      where: { slug: cleanSlug },
      relations: ['license_keys'],
    });

    if (!firm) {
      // If firm has not yet been registered in firms table (e.g. legacy tenant during migration),
      // we log and permit or enforce registration
      this.logger.debug(`Firm with slug '${cleanSlug}' not found in firms registry`);
      return true;
    }

    const now = new Date();

    if (firm.status === FirmStatus.SUSPENDED) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'FIRM_SUSPENDED',
        message: 'This institution account has been suspended. Please contact platform administration.',
      });
    }

    if (firm.status === FirmStatus.EXPIRED) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'LICENSE_EXPIRED',
        message: 'Your institution subscription/trial has expired. Please renew your license key.',
      });
    }

    if (firm.status === FirmStatus.TRIAL) {
      if (firm.trial_ends_at && new Date(firm.trial_ends_at) < now) {
        // Auto-update to EXPIRED
        firm.status = FirmStatus.EXPIRED;
        await firmRepo.save(firm);

        throw new ForbiddenException({
          statusCode: 403,
          error: 'TRIAL_EXPIRED',
          message: 'The free trial period for this firm has expired. Please apply a valid license key.',
        });
      }
      return true;
    }

    if (firm.status === FirmStatus.ACTIVE) {
      const activeKey = await licenseRepo.findOne({
        where: { firm_id: firm.id, status: LicenseStatus.ACTIVE },
        order: { expires_at: 'DESC' },
      });

      if (!activeKey || new Date(activeKey.expires_at) < now) {
        if (activeKey) {
          activeKey.status = LicenseStatus.EXPIRED;
          await licenseRepo.save(activeKey);
        }
        firm.status = FirmStatus.EXPIRED;
        await firmRepo.save(firm);

        throw new ForbiddenException({
          statusCode: 403,
          error: 'LICENSE_EXPIRED',
          message: 'Active license key has expired. Please renew your license to continue access.',
        });
      }

      return true;
    }

    return true;
  }
}
