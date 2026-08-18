import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If request has no authenticated user, let JwtAuthGuard handle rejection
    if (!user) return true;

    // SuperAdmin retains the ability to switch tenants for Central University administration
    if (user.role === UserRole.SUPER_ADMIN) {
      if (request.query?.tenant && request.query.tenant !== 'all') {
        const slug = String(request.query.tenant).toLowerCase();
        request.tenant = {
          id: user.tenantId,
          slug,
          schema: `tenant_${slug}`,
          name: user.collegeName || slug,
          colgCd: request.query.colgcd || request.query.colg_cd || '1',
        };
      }
      return true;
    }

    // ALL other roles (COLLEGE_ADMIN, HOD, FACULTY, CLERK, STUDENT, STAFF, WARDEN)
    // are HARD-LOCKED to their own college/tenant from their verified JWT token.
    if (!user.tenantSlug) {
      throw new UnauthorizedException('User is not associated with any college tenant');
    }

    const lockedSlug = user.tenantSlug.toLowerCase();
    const lockedColgCd = user.colgCd ? String(user.colgCd) : '1';

    // Override req.tenant strictly with verified JWT claims
    request.tenant = {
      id: user.tenantId,
      slug: lockedSlug,
      schema: `tenant_${lockedSlug}`,
      name: user.collegeName || lockedSlug,
      colgCd: lockedColgCd,
    };

    // Sanitize any user-supplied query/body params to prevent parameter tampering
    if (request.query) {
      request.query.tenant = lockedSlug;
      request.query.overrideTenant = lockedSlug;
      request.query.tenantSlug = lockedSlug;
      request.query.colgcd = lockedColgCd;
      request.query.colg_cd = lockedColgCd;
      request.query.collegeId = lockedColgCd;
    }

    if (request.body && typeof request.body === 'object') {
      if ('tenant' in request.body) request.body.tenant = lockedSlug;
      if ('tenantSlug' in request.body) request.body.tenantSlug = lockedSlug;
      if ('colgcd' in request.body) request.body.colgcd = lockedColgCd;
      if ('colg_cd' in request.body) request.body.colg_cd = lockedColgCd;
      if ('collegeId' in request.body) request.body.collegeId = lockedColgCd;
    }

    return true;
  }
}
