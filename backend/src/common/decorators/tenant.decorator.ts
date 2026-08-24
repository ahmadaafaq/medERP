import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

/**
 * @TenantId() — extracts the current tenant ID from the request.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (user && user.role !== UserRole.SUPER_ADMIN && user.tenantId) {
      return user.tenantId;
    }
    return request.tenant?.id || user?.tenantId;
  },
);

/**
 * @TenantSlug() — extracts the tenant slug (used as schema prefix).
 * For non-SuperAdmin roles, this is HARD-LOCKED to the user's verified JWT tenantSlug.
 */
export const TenantSlug = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Hard-lock non-SuperAdmin roles to their own JWT tenantSlug
    if (user && user.role !== UserRole.SUPER_ADMIN && user.tenantSlug) {
      return user.tenantSlug;
    }

    return (
      (request.query?.tenant as string) ||
      (request.headers?.['x-tenant-slug'] as string) ||
      (request.headers?.['x-tenant-id'] as string)?.replace(/^tenant_/, '').replace(/^tenant-/, '') ||
      (request.headers?.['x-tenant'] as string) ||
      request.tenant?.slug ||
      user?.tenantSlug ||
      (request.body?.tenant_slug as string) ||
      'srms-cet-bareilly'
    );
  },
);

export const Tenant = TenantSlug;
