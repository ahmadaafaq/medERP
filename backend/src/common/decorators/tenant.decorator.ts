import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @TenantId() — extracts the current tenant ID from the request.
 * Populated by TenantMiddleware.
 *
 * Usage:
 *   async getStudents(@TenantId() tenantId: string) {}
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant?.id;
  },
);

/**
 * @TenantSlug() — extracts the tenant slug (used as schema prefix).
 */
export const TenantSlug = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant?.slug || 'srms';
  },
);

export const Tenant = TenantSlug;

