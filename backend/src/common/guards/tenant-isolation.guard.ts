import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  private readonly logger = new Logger(TenantIsolationGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If completely unauthenticated public request (e.g. login, health check, webhook):
    if (!user) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentication required');
    }

    // SuperAdmin / Owner retains cross-tenant ability
    if (user.role === UserRole.SUPER_ADMIN || user.isOwner) {
      if (request.query?.tenant && request.query.tenant !== 'all') {
        const slug = String(request.query.tenant).toLowerCase();
        request.tenant = {
          id: user.tenantId,
          slug,
          schema: `tenant_${slug}`,
          name: user.collegeName || slug,
          colgCd: request.query.colgcd || request.query.colg_cd || '1',
        };
        request.tenantSlug = slug;
      }
      return true;
    }

    // ALL other roles (COLLEGE_ADMIN, HOD, FACULTY, CLERK, STUDENT, STAFF, WARDEN)
    // are HARD-LOCKED to their verified JWT tenantSlug.
    if (!user.tenantSlug) {
      throw new UnauthorizedException('User is not associated with any college tenant');
    }

    let lockedSlug = user.tenantSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    if (lockedSlug === 'srms-cet') lockedSlug = 'srms-cet-bareilly';
    if (lockedSlug === 'srms-cetr') lockedSlug = 'srms-cetr-bareilly';
    const lockedColgCd = user.colgCd ? String(user.colgCd) : '1';

    // Override req.tenant strictly with verified JWT claims
    request.tenant = {
      id: user.tenantId,
      slug: lockedSlug,
      schema: `tenant_${lockedSlug}`,
      name: user.collegeName || lockedSlug,
      colgCd: lockedColgCd,
    };
    request.tenantSlug = lockedSlug;

    // Sanitize any user-supplied query/headers/body params to prevent parameter tampering
    if (request.query && typeof request.query === 'object') {
      if ('tenant' in request.query) request.query.tenant = lockedSlug;
    }

    if (request.headers) {
      request.headers['x-tenant-slug'] = lockedSlug;
      request.headers['x-tenant-id'] = `tenant_${lockedSlug}`;
      request.headers['x-tenant'] = lockedSlug;
    }

    if (request.body && typeof request.body === 'object') {
      if ('tenant' in request.body) request.body.tenant = lockedSlug;
      if ('tenantSlug' in request.body) request.body.tenantSlug = lockedSlug;
      if ('tenant_slug' in request.body) request.body.tenant_slug = lockedSlug;
    }

    return true;
  }
}
