import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';
import { getBackendApiUrl } from '@/lib/backend-config';

export const dynamic = 'force-dynamic';

const srmsCollegeSlugMap: Record<string, string> = {
  '1': 'srms-cet-bareilly',
  '2': 'srms-cetr-bareilly',
  '3': 'srms-cet-unnao',
  '4': 'srms-college-of-law',
  '5': 'srms-ibs-lucknow',
  '6': 'srms-iahs-bareilly',
  '7': 'srms-trust-bareilly',
  '8': 'srms-nursing-school',
  '9': 'srms-nursing-college',
  '10': 'srms-riddhima-bareilly',
  '11': 'srms-ims',
  '12': 'srms-college-of-nursing-paramedical-sciences-unnao',
  '13': 'srms-quiz-panel',
  '14': 'srms-cricket-academy',
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
  
  // Scoped to SRMS only if targetSlug is missing or is just a numeric college code:
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    if (cd && srmsCollegeSlugMap[cd]) {
      targetSlug = srmsCollegeSlugMap[cd];
    } else if (cd) {
      try {
        const tRows = await queryDb<any>(
          `SELECT slug FROM public.tenants WHERE code = $1 OR slug = $1 OR id::text = $1 LIMIT 1`,
          [cd]
        );
        if (tRows.length > 0 && tRows[0].slug) {
          targetSlug = tRows[0].slug;
        }
      } catch {}
    }
  }

  if (targetSlug === 'srms-cet') targetSlug = 'srms-cet-bareilly';
  if (targetSlug === 'srms-cetr') targetSlug = 'srms-cetr-bareilly';
  if (!targetSlug) {
    targetSlug = 'srms-cet-bareilly';
  }

  const schema = `tenant_${targetSlug}`;
  const isSrmsTenant = targetSlug.includes('srms');

  // 1. Direct PostgreSQL query to tenant's batches table FIRST (feeded batches only)
  try {
    const queryParams: any[] = [];
    let sql = `
      SELECT DISTINCT
        b.id::text AS id,
        COALESCE(b.batch_cd, b.code, b.year::text)::text AS batch_cd,
        COALESCE(b.name, 'Batch ' || b.year::text, b.year::text)::text AS batch_name,
        COALESCE(b.name, 'Batch ' || b.year::text, b.year::text)::text AS name,
        b.code::text AS code,
        b.year::text AS year,
        COALESCE(b.course_cd, '')::text AS course_cd,
        b.is_active,
        b.year AS sort_year
      FROM "${schema}".batches b
      LEFT JOIN "${schema}".courses c ON c.course_cd::text = b.course_cd::text OR c.code::text = b.course_cd::text
      WHERE 1=1
    `;

    if (crs && crs !== 'all') {
      queryParams.push(crs);
      sql += ` AND (b.course_cd::text = $${queryParams.length}::text OR c.code::text = $${queryParams.length}::text OR c.course_cd::text = $${queryParams.length}::text)`;
    }

    if (br && br !== 'all') {
      queryParams.push(br);
      const brIdx = queryParams.length;
      sql += ` AND (
        b.department_id IS NULL
        OR b.department_id::text = ''
        OR b.department_id::text = $${brIdx}::text
        OR b.department_id::text IN (
          SELECT d.id::text FROM "${schema}".departments d
          WHERE d.code::text = $${brIdx}::text OR d.branch_cd::text = $${brIdx}::text OR d.id::text = $${brIdx}::text
        )
        OR b.id::text IN (
          SELECT DISTINCT ts.batch_id::text FROM "${schema}".timetable_slots ts
          WHERE ts.batch_id IS NOT NULL
            AND (${crs ? `$1::text = '' OR ` : ''}ts.course_cd::text = $1::text)
            AND (ts.branch_cd::text = $${brIdx}::text OR ts.branch_cd::text IN (
              SELECT d2.branch_cd::text FROM "${schema}".departments d2
              WHERE d2.id::text = $${brIdx}::text OR d2.code::text = $${brIdx}::text
            ))
        )
      )`;
    }

    sql += ` ORDER BY sort_year DESC, b.code ASC`;

    const dbBatches = await queryDb<any>(sql, queryParams);

    if (Array.isArray(dbBatches) && dbBatches.length > 0) {
      const mapped = dbBatches.map((b) => ({
        id: b.id || String(b.batch_cd || b.code || b.year),
        colg_cd: cd,
        course_cd: b.course_cd || crs,
        batch_cd: b.batch_cd || b.code || b.year,
        code: String(b.code || b.batch_cd || b.year),
        batch_name: String(b.batch_name || b.name || (b.year ? `Batch ${b.year}` : b.code)),
        name: String(b.name || b.batch_name || (b.year ? `Batch ${b.year}` : b.code)),
        year: Number(b.year) || (Number(String(b.batch_name || '').replace(/[^0-9]/g, '')) || 2026),
        active_flg: b.is_active ? '1' : '0',
        curr_bat_Cd: Number(b.batch_cd || b.code || 1) || 1,
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/batches] PostgreSQL direct query error on ${schema}:`, dbErr?.message);
  }

  // 2. Dynamic Fallback to NestJS backend
  try {
    let url = `${getBackendApiUrl()}/college-master/batches?tenant=${encodeURIComponent(targetSlug)}`;
    if (crs) url += `&course_cd=${encodeURIComponent(crs)}`;
    if (br) url += `&branch_cd=${encodeURIComponent(br)}`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((b: any) => ({
          id: b.id || String(b.batch_cd || b.code || b.year),
          colg_cd: b.colg_cd || cd,
          course_cd: b.course_cd || crs,
          batch_cd: b.batch_cd || b.code || b.year,
          code: String(b.code || b.batch_cd || b.year),
          batch_name: String(b.name || b.batch_name || (b.year ? `Batch ${b.year}` : b.code)),
          name: String(b.name || b.batch_name || (b.year ? `Batch ${b.year}` : b.code)),
          year: Number(b.year) || (Number(String(b.name || '').replace(/[^0-9]/g, '')) || 2026),
          active_flg: b.is_active ? '1' : '0',
          curr_bat_Cd: Number(b.curr_bat_cd || b.batch_cd || b.code || 1) || 1,
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
      const postPayload: Record<string, string> = { colgcd: String(cd), coursecd: String(crs) };
      if (br) postPayload.branchcd = br;

      const data = await srmsPost('Registration/GetBatch', postPayload);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((b: any) => {
          const bCd = String(b.batch_cd || b.code || b.batch_name || '1');
          const bNm = String(b.batch_name || b.name || b.year || bCd);
          return {
            ...b,
            id: bCd,
            code: bCd,
            batch_cd: Number(bCd) || bCd,
            batch_name: bNm,
            name: bNm,
            year: Number(b.year || bNm) || 2025,
            colg_cd: cd,
            course_cd: crs,
          };
        });
        mapped.sort((a, b) => (Number(b.year) || Number(b.batch_cd) || 0) - (Number(a.year) || Number(a.batch_cd) || 0));
        return NextResponse.json(mapped);
      }
    } catch (regError: any) {
      console.warn('[API /api/srms/batches] SRMS Registration/GetBatch error:', regError?.message);
    }

    try {
      const postPayload: Record<string, string> = { colgcd: String(cd), coursecd: String(crs) };
      if (br) postPayload.branchcd = br;

      const data = await srmsPost('OnlineAttend/GetBatch', postPayload);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((b: any) => {
          const bCd = String(b.batch_cd || b.code || b.batch_name || '1');
          const bNm = String(b.batch_name || b.name || b.year || bCd);
          return {
            ...b,
            id: bCd,
            code: bCd,
            batch_cd: Number(bCd) || bCd,
            batch_name: bNm,
            name: bNm,
            year: Number(b.year || bNm) || 2025,
            colg_cd: cd,
            course_cd: crs,
          };
        });
        mapped.sort((a, b) => (Number(b.year) || Number(b.batch_cd) || 0) - (Number(a.year) || Number(a.batch_cd) || 0));
        return NextResponse.json(mapped);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/batches] SRMS live portal fetch error:', error?.message);
    }
  }

  // Feeded batches only: return empty array if no feeded batches exist in DB for this branch
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const branchcd = String(body.branchcd || body.branch_cd || body.department_id || body.departmentId || '').trim();
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
    const branchcd = String(searchParams.get('branchcd') || searchParams.get('branch_cd') || searchParams.get('department_id') || searchParams.get('departmentId') || '').trim();
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetBatch(colgcd, coursecd, tenant, branchcd);
  } catch (error: any) {
    console.error('[API /api/srms/batches] Error in GET:', error);
    return NextResponse.json([]);
  }
}

