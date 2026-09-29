import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BACKEND_API = (process.env.BACKEND_BASE_URL ? `${process.env.BACKEND_BASE_URL}/api/v1` : '') || (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : 'http://127.0.0.1:8081/api/v1');

const FALLBACK_SRMS_COLLEGES = [
  { colg_cd: '1', colg_name: 'SRMS CET,BAREILLY' },
  { colg_cd: '2', colg_name: 'SRMS CETR,BAREILLY' },
  { colg_cd: '3', colg_name: 'SRMS CET, UNNAO' },
  { colg_cd: '4', colg_name: 'SRMS COLLEGE OF LAW' },
  { colg_cd: '5', colg_name: 'SRMS IBS, LUCKNOW' },
  { colg_cd: '6', colg_name: 'SRMS IAHS,BAREILLY' },
  { colg_cd: '7', colg_name: 'SRMS TRUST, BAREILLY' },
  { colg_cd: '8', colg_name: 'SRMS NURSING SCHOOL' },
  { colg_cd: '9', colg_name: 'SRMS NURSING COLLEGE' },
  { colg_cd: '10', colg_name: 'SRMS RIDDHIMA,BAREILLY' },
  { colg_cd: '11', colg_name: 'SRMS IMS,BAREILLY' },
  { colg_cd: '12', colg_name: 'SRMS COLLEGE OF NURSING & PARAMEDICAL SCIENCES,UNNAO' },
  { colg_cd: '13', colg_name: 'SRMS QUIZ PANEL' },
  { colg_cd: '14', colg_name: 'SRMS CRICKET ACADEMY' },
];

function generateCollegeSlug(colgCd: string, colgName: string): string {
  if (colgCd === '11' || colgName.includes('IMS') || colgName.includes('Medical')) {
    return 'srms-ims';
  }
  const clean = colgName
    .toLowerCase()
    .replace(/[&,]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean || `srms-college-${colgCd}`;
}

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

function resolveTenantIdFromReq(req: NextRequest, bodyOrParamTenantId?: string): string {
  if (bodyOrParamTenantId && bodyOrParamTenantId.trim() && bodyOrParamTenantId !== 'undefined' && bodyOrParamTenantId !== 'null') {
    return bodyOrParamTenantId.trim();
  }
  const urlTenantId = req.nextUrl.searchParams.get('tenantId');
  if (urlTenantId && urlTenantId.trim() && urlTenantId !== 'undefined' && urlTenantId !== 'null') {
    return urlTenantId.trim();
  }
  const headerTenantId = req.headers.get('x-tenant-id');
  if (headerTenantId && headerTenantId.trim()) {
    return headerTenantId.trim();
  }
  const cookieTenantId = req.cookies.get('auth_tenant_id')?.value;
  if (cookieTenantId && cookieTenantId.trim()) {
    return cookieTenantId.trim();
  }
  return '';
}

function resolveTenantSlugBasic(slug: string): string {
  if (!slug) return '';
  const s = slug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (s === 'all' || s === '') return '';
  if (s === 'srms' || s === 'srms-cet' || s === 'cet' || s === '1') return 'srms-cet-bareilly';
  if (s === 'srms-ims' || s === 'ims' || s === '2') return 'srms-ims';
  if (s === 'srms-cetr' || s === 'srms-cetr-bareilly') return 'srms-cetr-bareilly';
  if (s === 'srms-ibs' || s === 'srms-ibs-lucknow') return 'srms-ibs-lucknow';
  if (s === 'srms-law' || s === 'srms-college-of-law') return 'srms-college-of-law';
  return s;
}

interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantCode: string;
  isSrms: boolean;
  isActive: boolean;
}

async function resolveTenantContext(identifier: string): Promise<TenantContext | null> {
  const raw = (identifier || '').trim();
  if (!raw || raw === 'all') return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
  const resolvedSlug = resolveTenantSlugBasic(raw);

  let rows: any[] = [];
  if (isUuid) {
    rows = await queryDb<any>(
      `SELECT id, name, slug, code, domain, is_active FROM public.tenants WHERE id::text = $1 LIMIT 1`,
      [raw]
    ).catch(() => []);
  } else {
    rows = await queryDb<any>(
      `SELECT id, name, slug, code, domain, is_active FROM public.tenants
       WHERE LOWER(slug) = LOWER($1) OR LOWER(slug) = LOWER($2) OR LOWER(code) = LOWER($1)
       LIMIT 1`,
      [raw, resolvedSlug]
    ).catch(() => []);
  }

  if (rows.length === 0) {
    const firmRes = await queryDb<any>(
      `SELECT id, title AS name, slug, code, domain, (status = 'ACTIVE') AS is_active FROM public.firms
       WHERE id::text = $1 OR LOWER(slug) = LOWER($1) OR LOWER(slug) = LOWER($2) OR LOWER(code) = LOWER($1)
       LIMIT 1`,
      [raw, resolvedSlug]
    ).catch(() => []);
    rows = firmRes;
  }

  if (rows.length === 0) {
    // Dynamic non-SRMS tenant auto-registration (e.g. florida-college)
    const cleanSlug = raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '');
    const cleanName = cleanSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    rows = await queryDb<any>(
      `INSERT INTO public.tenants (name, slug, code, domain, plan, is_active, schema_provisioned)
       VALUES ($1, $2, $2, $3, 'enterprise', true, true)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, slug, code, domain, is_active`,
      [cleanName, cleanSlug, `${cleanSlug}.mederp.app`]
    ).catch(() => []);
  }

  if (rows.length === 0) return null;

  const row = rows[0];
  const nameLower = (row.name || '').toLowerCase();
  const slugLower = (row.slug || '').toLowerCase();
  const isSrms = nameLower.includes('srms') || slugLower.includes('srms') || nameLower.includes('shri ram murti');

  return {
    tenantId: row.id,
    tenantName: row.name,
    tenantSlug: row.slug,
    tenantCode: row.code || '',
    isSrms,
    isActive: row.is_active ?? true,
  };
}

async function ensureTenantCollegesTable(schema: string): Promise<void> {
  await queryDb(`CREATE SCHEMA IF NOT EXISTS "${schema}";`).catch(() => {});
  await queryDb(`
    CREATE TABLE IF NOT EXISTS "${schema}".colleges (
      id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id     UUID,
      code          VARCHAR(50),
      colg_cd       VARCHAR(50),
      name          VARCHAR(255) NOT NULL,
      slug          VARCHAR(100),
      domain        VARCHAR(255),
      plan          VARCHAR(50)  DEFAULT 'enterprise',
      primary_color VARCHAR(50)  DEFAULT '#5B4BFF',
      logo_url      TEXT,
      is_active     BOOLEAN      DEFAULT true,
      created_at    TIMESTAMPTZ  DEFAULT NOW(),
      updated_at    TIMESTAMPTZ  DEFAULT NOW()
    );
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS tenant_id UUID;
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS code VARCHAR(50);
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'enterprise';
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT '#5B4BFF';
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE "${schema}".colleges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `).catch(() => {});
}

async function seedTenantColleges(schema: string, ctx: TenantContext): Promise<void> {
  if (ctx.isSrms) {
    for (const c of FALLBACK_SRMS_COLLEGES) {
      const cd = String(c.colg_cd).trim();
      const name = String(c.colg_name).trim();
      const slug = generateCollegeSlug(cd, name);
      const domain = slug === 'srms-ims' ? 'srms.mederp.app' : `${slug}.mederp.app`;

      const existing = await queryDb<any>(
        `SELECT id FROM "${schema}".colleges WHERE code = $1 OR colg_cd = $1 OR slug = $2 LIMIT 1`,
        [cd, slug]
      ).catch(() => []);

      if (existing.length === 0) {
        await queryDb(
          `INSERT INTO "${schema}".colleges (tenant_id, code, colg_cd, name, slug, domain, plan, primary_color, is_active)
           VALUES ($1, $2, $2, $3, $4, $5, 'enterprise', '#5B4BFF', true)`,
          [ctx.tenantId || null, cd, name, slug, domain]
        ).catch(() => {});
      }
    }
  } else {
    const cd = ctx.tenantCode || ctx.tenantSlug;
    const name = ctx.tenantName || 'Main Campus';
    const slug = ctx.tenantSlug;
    const domain = `${slug}.mederp.app`;

    const existing = await queryDb<any>(
      `SELECT id FROM "${schema}".colleges WHERE code = $1 OR colg_cd = $1 OR slug = $2 LIMIT 1`,
      [cd, slug]
    ).catch(() => []);

    if (existing.length === 0) {
      await queryDb(
        `INSERT INTO "${schema}".colleges (tenant_id, code, colg_cd, name, slug, domain, plan, primary_color, is_active)
         VALUES ($1, $2, $2, $3, $4, $5, 'enterprise', '#5B4BFF', true)`,
        [ctx.tenantId || null, cd, name, slug, domain]
      ).catch(() => {});
    }
  }
}

async function handleGetCollege(req: NextRequest, tenantParam?: string, forceSync = false) {
  const tenantRaw = resolveTenantFromReq(req, tenantParam);
  const tenantIdRaw = resolveTenantIdFromReq(req);
  const candidate = tenantIdRaw || tenantRaw;
  const isSuperAdminOrAll = !candidate || candidate === 'all';
  const shouldSync = forceSync || req.nextUrl.searchParams.get('sync') === 'true';
  const includeInactive = req.nextUrl.searchParams.get('include_inactive') === 'true' || req.nextUrl.searchParams.get('all') === 'true';
  const activeFilter = includeInactive ? '' : 'WHERE is_active = true';

  if (!isSuperAdminOrAll) {
    const ctx = await resolveTenantContext(candidate);
    if (ctx) {
      const schema = `tenant_${ctx.tenantSlug}`;
      await ensureTenantCollegesTable(schema);

      // If explicit sync requested and it is an SRMS tenant:
      if (shouldSync && ctx.isSrms) {
        try {
          const data = await srmsPost('Home/GetCollege', {});
          if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
              const cd = String(item.colg_cd).trim();
              const name = String(item.colg_name).trim();
              const slug = generateCollegeSlug(cd, name);
              const domain = slug === 'srms-ims' ? 'srms.mederp.app' : `${slug}.mederp.app`;

              const existingInTenant = await queryDb<any>(
                `SELECT id FROM "${schema}".colleges WHERE code = $1 OR colg_cd = $1 OR slug = $2 LIMIT 1`,
                [cd, slug]
              ).catch(() => []);

              if (existingInTenant.length > 0) {
                await queryDb(
                  `UPDATE "${schema}".colleges
                   SET name = $1, code = $2, colg_cd = $2, slug = $3, domain = COALESCE(domain, $4), updated_at = NOW()
                   WHERE id = $5`,
                  [name, cd, slug, domain, existingInTenant[0].id]
                ).catch(() => {});
              } else {
                await queryDb(
                  `INSERT INTO "${schema}".colleges (tenant_id, name, code, colg_cd, slug, domain, plan, primary_color, is_active)
                   VALUES ($1, $2, $3, $3, $4, $5, 'enterprise', '#5B4BFF', true)`,
                  [ctx.tenantId || null, name, cd, slug, domain]
                ).catch(() => {});
              }
            }
          }
        } catch (err: any) {
          console.warn('[API /api/srms/colleges] Direct sync error:', err?.message);
        }
      }

      // Check count in tenant's table
      const countRes = await queryDb<any>(`SELECT COUNT(*)::int as count FROM "${schema}".colleges`).catch(() => [{ count: 0 }]);
      const rowCount = Number(countRes[0]?.count || 0);
      if (rowCount === 0) {
        await seedTenantColleges(schema, ctx);
      }

      // Query strictly from this tenant's colleges table
      let tenantRows = await queryDb<any>(
        `SELECT id, code, colg_cd, name, slug, domain, plan, primary_color, logo_url, is_active
         FROM "${schema}".colleges
         ${activeFilter}
         ORDER BY (CASE WHEN code ~ '^[0-9]+$' THEN code::int ELSE 999 END) ASC, name ASC`
      ).catch(() => []);

      if (ctx.isSrms) {
        tenantRows = tenantRows.filter((r: any) => {
          const nameLower = (r.name || '').toLowerCase();
          const slugLower = (r.slug || '').toLowerCase();
          const cd = String(r.code || r.colg_cd || '').trim();
          return slugLower.includes('srms') || nameLower.includes('srms') || nameLower.includes('shri ram murti') || ['1','2','3','4','5','6','7','8','9','10','11','12','13','14'].includes(cd);
        });
      } else {
        // STRICT NON-SRMS ISOLATION:
        tenantRows = tenantRows.filter((r: any) => {
          const nameLower = (r.name || '').toLowerCase();
          const slugLower = (r.slug || '').toLowerCase();
          return !slugLower.includes('srms') && !nameLower.includes('srms') && !nameLower.includes('shri ram murti');
        });
      }

      const mapped = tenantRows.map((c: any) => ({
        colg_cd: String(c.colg_cd || c.code || ctx.tenantCode || ctx.tenantSlug),
        code: String(c.code || c.colg_cd || ctx.tenantCode || ctx.tenantSlug),
        id: String(c.id || c.code || ctx.tenantCode || ctx.tenantSlug),
        colg_name: c.name,
        name: c.name,
        slug: c.slug,
        domain: c.domain,
        plan: c.plan,
        primary_color: c.primary_color,
        logo_url: c.logo_url,
        is_active: c.is_active ?? true,
      }));

      return NextResponse.json(mapped);
    }
  }

  // Fallback for superadmin / public directory:
  const rows = await queryDb<any>(
    `SELECT DISTINCT ON (t.code) t.id, t.code, t.name, t.slug, t.domain, t.plan, t.primary_color, t.logo_url, t.is_active
     FROM public.tenants t
     ${activeFilter}
     ORDER BY t.code, (CASE WHEN t.code ~ '^[0-9]+$' THEN t.code::int ELSE 999 END) ASC, t.name ASC`
  ).catch(() => []);

  const mapped = (rows || []).map((c: any) => ({
    colg_cd: String(c.code || '1'),
    code: String(c.code || '1'),
    id: String(c.id || c.code || '1'),
    colg_name: c.name,
    name: c.name,
    slug: c.slug,
    logo_url: c.logo_url,
    is_active: c.is_active ?? true,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tenantRaw = resolveTenantFromReq(req, body.tenant || body.tenantSlug);
  const tenantIdRaw = resolveTenantIdFromReq(req, body.tenantId);
  const candidate = tenantIdRaw || tenantRaw;
  const action = String(body.action || '').toLowerCase().trim();

  if (candidate && (action === 'deactivate' || action === 'delete')) {
    const ctx = await resolveTenantContext(candidate);
    if (!ctx) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const schema = `tenant_${ctx.tenantSlug}`;
    await ensureTenantCollegesTable(schema);
    const targetId = String(body.id || body.code || body.slug || '').trim();
    if (!targetId) return NextResponse.json({ error: 'Missing target college id' }, { status: 400 });

    await queryDb(
      `UPDATE "${schema}".colleges SET is_active = false, updated_at = NOW() WHERE id::text = $1 OR code = $1 OR colg_cd = $1 OR slug = $1`,
      [targetId]
    );
    return NextResponse.json({ success: true, message: `College deactivated in ${schema}.colleges`, is_active: false });
  }

  if (candidate && (action === 'restore' || action === 'activate')) {
    const ctx = await resolveTenantContext(candidate);
    if (!ctx) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const schema = `tenant_${ctx.tenantSlug}`;
    await ensureTenantCollegesTable(schema);
    const targetId = String(body.id || body.code || body.slug || '').trim();
    if (!targetId) return NextResponse.json({ error: 'Missing target college id' }, { status: 400 });

    await queryDb(
      `UPDATE "${schema}".colleges SET is_active = true, updated_at = NOW() WHERE id::text = $1 OR code = $1 OR colg_cd = $1 OR slug = $1`,
      [targetId]
    );
    return NextResponse.json({ success: true, message: `College reactivated in ${schema}.colleges`, is_active: true });
  }

  if (candidate && (action === 'create' || (body.name && !body.action && !body.sync))) {
    const ctx = await resolveTenantContext(candidate);
    if (!ctx) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const schema = `tenant_${ctx.tenantSlug}`;
    await ensureTenantCollegesTable(schema);

    const name = String(body.name || '').trim();
    const code = String(body.code || body.colg_cd || '').trim() || null;
    let slug = String(body.slug || '').toLowerCase().trim();
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const domain = body.domain?.trim() || `${slug}.mederp.app`;
    const plan = body.plan || 'enterprise';
    const primaryColor = body.primaryColor || body.primary_color || '#5B4BFF';

    const inserted = await queryDb<any>(
      `INSERT INTO "${schema}".colleges (tenant_id, code, colg_cd, name, slug, domain, plan, primary_color, is_active)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [ctx.tenantId || null, code, name, slug, domain, plan, primaryColor]
    ).catch((err) => {
      console.error('[API /api/srms/colleges] insert error:', err);
      return [];
    });

    if (inserted.length > 0) {
      return NextResponse.json({ success: true, data: inserted[0] });
    }
    return NextResponse.json({ error: 'Failed to create college' }, { status: 400 });
  }

  if (candidate && action === 'update') {
    const ctx = await resolveTenantContext(candidate);
    if (!ctx) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    const schema = `tenant_${ctx.tenantSlug}`;
    await ensureTenantCollegesTable(schema);
    const targetId = String(body.id || body.code || body.slug || '').trim();

    await queryDb(
      `UPDATE "${schema}".colleges
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           colg_cd = COALESCE($2, colg_cd),
           domain = COALESCE($3, domain),
           plan = COALESCE($4, plan),
           primary_color = COALESCE($5, primary_color),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id::text = $7 OR code = $7 OR colg_cd = $7 OR slug = $7`,
      [body.name, body.code, body.domain, body.plan, body.primaryColor || body.primary_color, body.isActive ?? body.is_active, targetId]
    );
    return NextResponse.json({ success: true, message: `College updated in ${schema}.colleges` });
  }

  const tenant = String(body.tenant || body.tenantSlug || '').trim();
  const forceSync = Boolean(body.sync);
  return handleGetCollege(req, tenant, forceSync);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('id') || searchParams.get('code') || searchParams.get('slug');
  const tenantRaw = resolveTenantFromReq(req);
  const tenantIdRaw = resolveTenantIdFromReq(req);
  const candidate = tenantIdRaw || tenantRaw;

  if (!candidate || !targetId) {
    return NextResponse.json({ error: 'Missing tenant or college ID' }, { status: 400 });
  }

  const ctx = await resolveTenantContext(candidate);
  if (!ctx) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  const schema = `tenant_${ctx.tenantSlug}`;
  await ensureTenantCollegesTable(schema);

  await queryDb(
    `UPDATE "${schema}".colleges SET is_active = false, updated_at = NOW() WHERE id::text = $1 OR code = $1 OR colg_cd = $1 OR slug = $1`,
    [targetId]
  );
  return NextResponse.json({ success: true, message: `College deactivated in ${schema}.colleges`, is_active: false });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
  const forceSync = searchParams.get('sync') === 'true';
  return handleGetCollege(req, tenant, forceSync);
}
