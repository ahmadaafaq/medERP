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

    // Super-admin routes don't require a tenant
    if (!slug) {
      next();
      return;
    }

    // Normalize slug to lowercase and resolve 'srms' to 'srms-ims'
    slug = slug.toLowerCase();
    if (slug === 'srms') {
      slug = 'srms-ims';
    }

    // Look up tenant in the public schema
    const result = await this.dataSource.query(
      `SELECT id, slug, name, is_active FROM public.tenants WHERE slug = $1 LIMIT 1`,
      [slug.toLowerCase()],
    );

    if (!result.length) {
      throw new UnauthorizedException(`Tenant '${slug}' not found`);
    }

    const tenant = result[0];
    if (!tenant.is_active) {
      throw new UnauthorizedException(`Tenant '${slug}' is suspended`);
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
