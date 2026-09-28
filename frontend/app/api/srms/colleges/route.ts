import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BACKEND_API = (process.env.BACKEND_BASE_URL ? `${process.env.BACKEND_BASE_URL}/api/v1` : '') || (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : 'http://127.0.0.1:8081/api/v1');

function resolveTenantFromReq(req: NextRequest, bodyOrParamTenant?: string): string {
  if (bodyOrParamTenant && bodyOrParamTenant.trim() && bodyOrParamTenant !== 'undefined' && bodyOrParamTenant !== 'null') {
    return bodyOrParamTenant.trim();
  }
  const urlTenant = req.nextUrl.searchParams.get('tenant') || req.nextUrl.searchParams.get('tenantSlug');
  if (urlTenant && urlTenant.trim() && urlTenant !== 'undefined' && urlTenant !== 'null') {
    return urlTenant.trim();
  }
  const headerTenant = req.headers.get('x-tenant-slug');
  if (headerTenant && headerTenant.trim()) {
    return headerTenant.trim();
  }
  const cookieTenant = req.cookies.get('auth_tenant')?.value || req.cookies.get('tenantSlug')?.value || req.cookies.get('selectedTenant')?.value;
  if (cookieTenant && cookieTenant.trim()) {
    return cookieTenant.trim();
  }
  return '';
}

async function handleGetCollege(req: NextRequest, tenantParam?: string) {
  const tenant = resolveTenantFromReq(req, tenantParam);
  const isSuperAdminOrAll = !tenant || tenant === 'all';

  // 1. Direct PostgreSQL query from public.tenants (Strict multi-tenant isolation)
  try {
    if (!isSuperAdminOrAll) {
      const slug = tenant.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
      const rows = await queryDb<any>(
        `SELECT id, code, name, slug, domain, plan, primary_color, logo_url, is_active
         FROM public.tenants
         WHERE (LOWER(slug) = LOWER($1) OR code = $1 OR id::text = $1) AND is_active = true
         LIMIT 1`,
        [slug]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        const mapped = rows.map((c: any) => ({
          colg_cd: String(c.code || '1'),
          code: String(c.code || '1'),
          id: String(c.id || c.code || '1'),
          colg_name: c.name,
          name: c.name,
          slug: c.slug,
          logo_url: c.logo_url,
        }));
        return NextResponse.json(mapped);
      }
    } else {
      const rows = await queryDb<any>(
        `SELECT DISTINCT ON (t.code) t.id, t.code, t.name, t.slug, t.domain, t.plan, t.primary_color, t.logo_url, t.is_active
         FROM public.tenants t
         WHERE t.is_active = true
         ORDER BY t.code, (CASE WHEN t.code ~ '^[0-9]+$' THEN t.code::int ELSE 999 END) ASC, t.name ASC`
      );
      if (Array.isArray(rows) && rows.length > 0) {
        const mapped = rows.map((c: any) => ({
          colg_cd: String(c.code || '1'),
          code: String(c.code || '1'),
          id: String(c.id || c.code || '1'),
          colg_name: c.name,
          name: c.name,
          slug: c.slug,
          logo_url: c.logo_url,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (dbErr: any) {
    console.warn('[API /api/srms/colleges] PostgreSQL query error:', dbErr?.message);
  }

  // 2. Dynamic Fallback to NestJS backend
  try {
    const url = !isSuperAdminOrAll ? `${BACKEND_API}/college-master/colleges?tenant=${encodeURIComponent(tenant)}` : `${BACKEND_API}/college-master/colleges`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => ({
          colg_cd: String(c.code || c.colg_cd || '1'),
          code: String(c.code || c.colg_cd || '1'),
          id: String(c.id || c.code || c.colg_cd || '1'),
          colg_name: c.name || c.colg_name,
          name: c.name || c.colg_name,
          slug: c.slug,
          logo_url: c.logo_url,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/colleges] PostgreSQL backend fallback error:', backendErr?.message);
  }

  // 3. Live SRMS ERP API fallback: ONLY for SRMS tenant or super admin
  const isSrmsTenant = !tenant || tenant.toLowerCase().startsWith('srms') || tenant === 'all';
  if (isSrmsTenant) {
    try {
      const data = await srmsPost('Home/GetCollege', {});
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/colleges] SRMS live portal fetch error:', error?.message);
    }
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tenant = String(body.tenant || body.tenantSlug || '').trim();
  return handleGetCollege(req, tenant);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
  return handleGetCollege(req, tenant);
}

