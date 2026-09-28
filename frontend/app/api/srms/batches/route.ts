import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BACKEND_API = (process.env.BACKEND_BASE_URL ? `${process.env.BACKEND_BASE_URL}/api/v1` : '') || (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : 'http://127.0.0.1:8081/api/v1');

const srmsCollegeSlugMap: Record<string, string> = {
  '1': 'srms-cet-bareilly',
  '2': 'srms-cetr-bareilly',
  '11': 'srms-cet-unnao',
};

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

async function handleGetBatch(colgcd?: string, coursecd?: string, tenantSlug?: string, branchcd?: string) {
  const cd = colgcd || '1';
  const crs = coursecd && coursecd !== 'all' ? coursecd : '';
  const br = branchcd && branchcd !== 'all' ? branchcd : '';

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    try {
      const tRows = await queryDb<any>(`SELECT slug FROM public.tenants WHERE code = $1 OR slug = $1 OR id::text = $1 LIMIT 1`, [cd]);
      if (tRows.length > 0 && tRows[0].slug) {
        targetSlug = tRows[0].slug;
      }
    } catch {}
    if (!targetSlug) {
      targetSlug = srmsCollegeSlugMap[cd] || 'srms-cet-bareilly';
    }
  }
  if (targetSlug === 'srms-cet') targetSlug = 'srms-cet-bareilly';
  if (targetSlug === 'srms-cetr') targetSlug = 'srms-cetr-bareilly';
  const schema = `tenant_${targetSlug}`;
  const isSrmsTenant = targetSlug.startsWith('srms');

  // 1. Direct PostgreSQL query to tenant's batches table FIRST
  try {
    const dbBatches = await queryDb<any>(
      `SELECT DISTINCT
         COALESCE(b.code, b.year::text)::text AS batch_cd,
         b.code::text AS batch_name,
         b.year AS year,
         COALESCE(b.course_cd, $1)::text AS course_cd,
         b.is_active,
         b.year AS sort_year
       FROM "${schema}".batches b
       WHERE ($1 = '' OR $1 = 'all' OR b.course_cd::text = $1::text)
       ORDER BY sort_year DESC`,
      [crs]
    );

    if (Array.isArray(dbBatches) && dbBatches.length > 0) {
      const mapped = dbBatches.map((b) => ({
        colg_cd: cd,
        course_cd: b.course_cd || crs,
        batch_cd: Number(b.batch_cd || b.year) || b.batch_cd,
        code: String(b.batch_cd || b.year),
        batch_name: String(b.batch_name || b.year),
        name: String(b.batch_name || b.year),
        year: Number(b.year) || 2025,
        active_flg: b.is_active ? '1' : '0',
        curr_bat_Cd: Number(b.batch_cd || b.year) || 1,
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/batches] PostgreSQL direct query error on ${schema}:`, dbErr?.message);
  }

  // 2. Dynamic Fallback to NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/batches?tenant=${encodeURIComponent(targetSlug)}${crs ? `&course_cd=${encodeURIComponent(crs)}` : ''}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((b: any) => ({
          colg_cd: b.colg_cd || cd,
          course_cd: b.course_cd || crs,
          batch_cd: Number(b.batch_cd || b.code || b.year) || (b.batch_cd || b.code),
          code: String(b.batch_cd || b.code || b.year),
          batch_name: String(b.name || b.year || b.code),
          name: String(b.name || b.year || b.code),
          active_flg: b.is_active ? '1' : '0',
          curr_bat_Cd: Number(b.curr_bat_cd || b.batch_cd || b.code || 1),
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/batches] PostgreSQL backend fallback error:', backendErr?.message);
  }

  // 3. Live SRMS ERP Registration API: ONLY for SRMS tenants!
  if (isSrmsTenant) {
    try {
      const data = await srmsPost('Registration/GetBatch', { colgcd: String(cd), coursecd: String(crs) });
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (regError: any) {
      console.warn('[API /api/srms/batches] SRMS Registration/GetBatch error:', regError?.message);
    }

    try {
      const postPayload: Record<string, string> = { colgcd: String(cd), coursecd: String(crs) };
      if (br) postPayload.branchcd = br;

      const data = await srmsPost('OnlineAttend/GetBatch', postPayload);
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/batches] SRMS live portal fetch error:', error?.message);
    }
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const branchcd = String(body.branchcd || body.branch_cd || '').trim();
    const tenant = resolveTenantFromReq(req, String(body.tenant || body.tenantSlug || '').trim());
    return handleGetBatch(colgcd, coursecd, tenant, branchcd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || searchParams.get('course') || '').trim();
    const branchcd = String(searchParams.get('branchcd') || searchParams.get('branch_cd') || '').trim();
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetBatch(colgcd, coursecd, tenant, branchcd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in GET:', error);
    return NextResponse.json([]);
  }
}

