import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface TenantContext {
  id: string;
  slug: string;
  schema: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // Strategy 1: Subdomain → srms.unicampus.app → slug = 'srms'
    const host = req.hostname || '';
    const parts = host.split('.');
    let slug: string | null = null;

    const isIP = /^[0-9.]+$/.test(host) || host.includes(':') || host === 'localhost';

    if (!isIP && parts.length >= 3) {
      // subdomain.domain.tld
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'api') {
        slug = subdomain;
      }
    }

    // Strategy 2: X-Tenant-Slug header (for API clients / mobile app)
    if (!slug) {
      slug = (req.headers['x-tenant-slug'] as string) || null;
    }

    // Strategy 3: URL prefix → /t/:slug/...  (dev convenience)
    if (!slug) {
      const match = req.path.match(/^\/t\/([a-z0-9-_]+)\//);
      if (match) slug = match[1];
    }

    // Check for query param fallback as well
    if (!slug && req.query.tenant) {
      slug = req.query.tenant as string;
    }

    // Super-admin routes or multi-tenant aggregated routes ('all') don't require a single tenant context
    if (!slug || slug === 'all' || slug === 'superadmin' || slug === 'public' || slug === 'owner') {
      next();
      return;
    }

    // Normalize slug to lowercase and resolve aliases
    slug = slug.toLowerCase();
    if (slug === 'srms') {
      slug = 'srms-ims';
    } else if (slug === 'srms-cet' || slug === 'srms_cet' || slug === 'cet' || slug === '1') {
      slug = 'srms-cet-bareilly';
    } else if (slug === 'srms-cetr' || slug === 'srms_cetr' || slug === 'cetr' || slug === '2') {
      slug = 'srms-cetr-bareilly';
    }

    // Look up tenant in the public schema by slug, code, or id
    let result = await this.dataSource.query(
      `SELECT id, slug, name, is_active FROM public.tenants
       WHERE LOWER(slug) = $1 OR LOWER(code) = $1 OR id::text = $1
       LIMIT 1`,
      [slug],
    );

    if (!result.length) {
      // Fallback: check in public.firms (registered SaaS tenants)
      const firmResult = await this.dataSource.query(
        `SELECT id, slug, title as name, (status != 'SUSPENDED') as is_active FROM public.firms
         WHERE LOWER(slug) = $1 OR id::text = $1
         LIMIT 1`,
        [slug],
      );

      if (firmResult.length > 0) {
        result = firmResult;
        // Auto-sync into public.tenants
        try {
          await this.dataSource.query(
            `INSERT INTO public.tenants (id, name, slug, code, is_active, schema_provisioned, created_at, updated_at)
             VALUES ($1, $2, $3, $3, true, true, NOW(), NOW())
             ON CONFLICT (slug) DO NOTHING`,
            [firmResult[0].id, firmResult[0].name, firmResult[0].slug],
          );
        } catch {}
      } else {
        throw new UnauthorizedException(`Tenant '${slug}' not found`);
      }
    }

    const tenant = result[0];
    if (!tenant.is_active) {
      throw new UnauthorizedException(`Tenant '${slug}' is suspended`);
    }

    // Strict Firm Status & License Expiry Check
    const firmStatusCheck = await this.dataSource.query(
      `SELECT id, title, status, trial_ends_at FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`,
      [slug],
    );

    if (firmStatusCheck.length > 0) {
      const f = firmStatusCheck[0];
      if (f.status === 'SUSPENDED') {
        throw new UnauthorizedException(`Access Denied: "${f.title}" is suspended by the platform owner.`);
      }

      const now = new Date();
      const activeKeys = await this.dataSource.query(
        `SELECT id, expires_at FROM public.license_keys 
         WHERE firm_id = $1 AND status = 'ACTIVE' AND expires_at > NOW() 
         ORDER BY expires_at DESC LIMIT 1`,
        [f.id],
      );

      const hasActiveLicense = activeKeys.length > 0;
      const isTrialActive = f.trial_ends_at && new Date(f.trial_ends_at) > now;

      if (f.status === 'EXPIRED' || (!hasActiveLicense && !isTrialActive)) {
        if (f.status !== 'EXPIRED') {
          await this.dataSource.query(
            `UPDATE public.firms SET status = 'EXPIRED', updated_at = NOW() WHERE id = $1`,
            [f.id],
          );
        }
        throw new UnauthorizedException(`Licence Key is expired Renewal Now (Institution "${f.title}" license has expired).`);
      }
    }

    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      schema: `tenant_${tenant.slug}`,
      name: tenant.name,
    };

    next();
  }
}
