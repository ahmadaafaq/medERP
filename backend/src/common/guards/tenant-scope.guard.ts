import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole } from '../enums/role.enum';

/**
 * TenantScopeGuard
 * 
 * Enforces strict multi-tenant schema isolation at the framework level:
 * 1. For authenticated non-SuperAdmin users, locks tenantSlug to req.user.tenantSlug.
 * 2. Overrides any client-provided query param (?tenant=...) or header (x-tenant-slug)
 *    to prevent cross-tenant parameter tampering or leakage.
 * 3. Only SUPER_ADMIN (Platform Owner) is permitted cross-tenant access.
 */
@Injectable()
export class TenantScopeGuard implements CanActivate {
  private readonly logger = new Logger(TenantScopeGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // Unauthenticated / public routes handled by JwtAuthGuard or public handlers
      return true;
    }

    // Platform Owner / Super Admin has cross-tenant access
    if (user.role === UserRole.SUPER_ADMIN || user.isOwner) {
      return true;
    }

    let verifiedSlug = user.tenantSlug;
    if (verifiedSlug === 'srms-cet' || verifiedSlug === 'tenant_srms-cet') verifiedSlug = 'srms-cet-bareilly';
    if (verifiedSlug === 'srms-cetr' || verifiedSlug === 'tenant_srms-cetr') verifiedSlug = 'srms-cetr-bareilly';
    if (!verifiedSlug) {
      this.logger.warn(`User ${user.email} has no tenantSlug in verified JWT token.`);
      throw new ForbiddenException('Invalid tenant context in user session.');
    }

    // Check if client attempted to pass a different tenant in query or header
    const requestedQuerySlug = request.query?.tenant as string;
    const requestedHeaderSlug = (request.headers?.['x-tenant-slug'] || request.headers?.['x-tenant-id']) as string;

    if (requestedQuerySlug && requestedQuerySlug !== verifiedSlug) {
      this.logger.warn(
        `Cross-Tenant Tamper Prevented: User ${user.email} (tenant=${verifiedSlug}) attempted to query ?tenant=${requestedQuerySlug}. Enforcing verified tenant.`,
      );
    }

    if (requestedHeaderSlug && requestedHeaderSlug.replace(/^tenant_/, '').replace(/^tenant-/, '') !== verifiedSlug) {
      this.logger.warn(
        `Cross-Tenant Header Prevented: User ${user.email} (tenant=${verifiedSlug}) sent header x-tenant=${requestedHeaderSlug}. Enforcing verified tenant.`,
      );
    }

    // Hard-lock all request tenant identifiers to the verified JWT tenantSlug
    if (request.query) {
      request.query.tenant = verifiedSlug;
    }
    if (request.headers) {
      request.headers['x-tenant-slug'] = verifiedSlug;
      request.headers['x-tenant-id'] = `tenant_${verifiedSlug}`;
      request.headers['x-tenant'] = verifiedSlug;
    }
    request.tenantSlug = verifiedSlug;
    if (request.tenant) {
      request.tenant.slug = verifiedSlug;
    }

    return true;
  }
}
