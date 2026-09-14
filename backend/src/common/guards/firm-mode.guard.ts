import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

export const REQUIRED_FIRM_MODE_KEY = 'required_firm_mode';
export const RequiresFirmMode = (mode: 'MED' | 'NONMED' = 'MED') => SetMetadata(REQUIRED_FIRM_MODE_KEY, mode);

@Injectable()
export class FirmModeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredMode = this.reflector.getAllAndOverride<'MED' | 'NONMED'>(
      REQUIRED_FIRM_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredMode) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const rawSlug =
      request.headers['x-tenant-slug'] ||
      request.headers['x-tenant-id'] ||
      request.query?.tenant ||
      request.tenantSlug ||
      request.tenant?.slug ||
      user?.tenantSlug ||
      '';

    const slug = String(rawSlug).toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');

    if (!slug) {
      if (user?.role === 'superadmin' || user?.isOwner) {
        return true;
      }
      throw new ForbiddenException('Tenant context is required for this operation.');
    }

    // Fast heuristic for well-known medical slugs
    if (slug.includes('ims') || slug.includes('med') || slug === 'rmribar' || slug === 'rmch-bareilly') {
      if (requiredMode === 'MED') return true;
    }

    // Query firm_mode from public.firms
    const firmRows = await this.dataSource.query(
      `SELECT firm_mode, timetable_module_type FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`,
      [slug],
    ).catch(() => []);

    let actualMode = firmRows[0]?.firm_mode;

    if (!actualMode) {
      const tenantRows = await this.dataSource.query(
        `SELECT firm_mode, timetable_module_type FROM public.tenants WHERE LOWER(slug) = $1 LIMIT 1`,
        [slug],
      ).catch(() => []);
      actualMode = tenantRows[0]?.firm_mode;
    }

    if (
      actualMode === requiredMode ||
      (requiredMode === 'MED' && (actualMode === 'MED' || firmRows[0]?.timetable_module_type === 'MEDICAL'))
    ) {
      return true;
    }

    throw new ForbiddenException(
      `Access denied. This module is restricted to '${requiredMode}' registered institutions. Current firm is configured as '${actualMode || 'NONMED'}'.`,
    );
  }
}
