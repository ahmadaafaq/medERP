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

const DEFAULT_COURSE_BRANCHES: Record<string, { branch_cd: string; branch_name: string }[]> = {
  '1': [
    { branch_cd: '1', branch_name: '(CSE)' },
    { branch_cd: '2', branch_name: '(IT)' },
    { branch_cd: '3', branch_name: '(ME)' },
    { branch_cd: '4', branch_name: 'CSE(DATA SCIENCE)' },
    { branch_cd: '5', branch_name: '(ECE)' },
    { branch_cd: '6', branch_name: 'B.TECH.' },
    { branch_cd: '7', branch_name: '(EN)' },
    { branch_cd: '8', branch_name: 'CSE(AI & ML)' },
  ],
  '2': [
    { branch_cd: '1', branch_name: 'B.PHARM. Department' },
  ],
  '3': [
    { branch_cd: '1', branch_name: 'MCA Department' },
  ],
  '4': [
    { branch_cd: '1', branch_name: 'MBA Department' },
  ],
  '5': [
    { branch_cd: '1', branch_name: 'CAD/CAM' },
    { branch_cd: '2', branch_name: 'SOFTWARE ENGG' },
    { branch_cd: '3', branch_name: 'MICROWAVE ENGG' },
    { branch_cd: '4', branch_name: 'ELECTRIC DRIVES' },
    { branch_cd: '5', branch_name: 'COMPUTER SCIENCE & ENGINEERING' },
    { branch_cd: '6', branch_name: 'ELECTRONICS & COMMUNICATION ENGINEERING' },
    { branch_cd: '7', branch_name: 'ELECTRICAL ENGINEERING' },
  ],
  '6': [
    { branch_cd: '1', branch_name: 'PHARMACEUTICS' },
  ],
  '7': [
    { branch_cd: '1', branch_name: '(CS)' },
    { branch_cd: '2', branch_name: '(IT)' },
    { branch_cd: '3', branch_name: '(ME)' },
    { branch_cd: '4', branch_name: '(EE)' },
    { branch_cd: '5', branch_name: '(EC)' },
    { branch_cd: '6', branch_name: '(EL)' },
    { branch_cd: '7', branch_name: '(EN)' },
  ],
  '8': [
    { branch_cd: '1', branch_name: 'B.Pharma (Lateral Entry) Department' },
  ],
  '9': [
    { branch_cd: '1', branch_name: 'MCA (Lateral Entry) Department' },
  ],
  '11': [
    { branch_cd: '1', branch_name: 'BA.LL.B Department' },
  ],
  '12': [
    { branch_cd: '1', branch_name: 'BBA Department' },
  ],
  '13': [
    { branch_cd: '1', branch_name: 'BCA Department' },
  ],
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

async function handleGetBranch(colgcd?: string, coursecd?: string, tenantSlug?: string) {
  const cd = String(colgcd || '1').trim();
  const crs = String(coursecd || '').trim();

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    if (cd && srmsCollegeSlugMap[cd]) {
      targetSlug = srmsCollegeSlugMap[cd];
    } else if (cd) {
      try {
        const tRows = await queryDb<any>(`SELECT slug FROM public.tenants WHERE code = $1 OR slug = $1 OR id::text = $1 LIMIT 1`, [cd]);
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

  // 1. Direct PostgreSQL query to tenant's departments table filtered by course
  try {
    const dbBranches = await queryDb<any>(
      `SELECT DISTINCT 
         COALESCE(d.branch_cd, d.code)::text AS branch_cd, 
         d.name::text AS branch_name, 
         $2::text AS colg_cd,
         (CASE WHEN COALESCE(d.branch_cd, d.code) ~ '^[0-9]+$' THEN COALESCE(d.branch_cd, d.code)::int ELSE 999 END) AS sort_order
       FROM "${schema}".departments d
       WHERE ($1 = '' OR $1 = 'all' OR d.course_cd::text = $1::text)
       ORDER BY sort_order ASC, branch_name ASC`,
      [crs, cd]
    );

    if (Array.isArray(dbBranches) && dbBranches.length > 0) {
      const mapped = dbBranches.map((b) => ({
        colg_cd: b.colg_cd || cd,
        course_cd: b.course_cd || crs,
        branch_cd: String(b.branch_cd),
        code: String(b.branch_cd),
        branch_name: b.branch_name,
        name: b.branch_name,
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/branches] PostgreSQL direct query error on ${schema}:`, dbErr?.message);
  }

  // 2. Dynamic Fallback to NestJS backend
  try {
    const res = await fetch(`${getBackendApiUrl()}/college-master/branches?tenant=${encodeURIComponent(targetSlug)}${crs ? `&course_cd=${encodeURIComponent(crs)}` : ''}`, {
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
          branch_cd: String(b.branch_cd || b.code || b.id || '1'),
          code: String(b.branch_cd || b.code || b.id || '1'),
          branch_name: b.name || b.branch_name,
          name: b.name || b.branch_name,
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/branches] Backend query fallback error:', backendErr?.message);
  }

  // 3. Live SRMS ERP API: ONLY for SRMS tenants!
  if (isSrmsTenant) {
    try {
      const data = await srmsPost('erpadmin/GetBranch', { colgcd: cd, coursecd: crs });
      if (Array.isArray(data) && data.length > 0) {
        const courseFiltered = data.filter((b: any) => {
          const bCourse = String(b.course_cd || b.coursecd || b.course_id || '').trim();
          return !bCourse || bCourse === String(crs);
        });
        const targetList = courseFiltered.length > 0 ? courseFiltered : data;

        const seen = new Set<string>();
        const deduplicated: any[] = [];
        for (const item of targetList) {
          const bCode = String(item.branch_cd || item.code || item.id || '1').trim();
          let bName = String(item.branch_name || item.name || '').trim();

          if (!bName || bName === '-' || bName === 'null') {
            const knownName = DEFAULT_COURSE_BRANCHES[crs]?.[0]?.branch_name;
            bName = knownName || `${item.course_name || 'Department'}`.trim();
          }

          const key = `${bCode}:::${bName.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push({
              colg_cd: String(item.colg_cd || cd),
              course_cd: String(item.course_cd || crs),
              branch_cd: bCode,
              code: bCode,
              branch_name: bName,
              name: bName,
            });
          }
        }

        if (deduplicated.length > 0) {
          return NextResponse.json(deduplicated);
        }
      }
    } catch (error: any) {
      console.warn('[API /api/srms/branches] SRMS live portal fetch error:', error?.message);
    }

    if (DEFAULT_COURSE_BRANCHES[crs]) {
      const fallbackList = DEFAULT_COURSE_BRANCHES[crs].map((b) => ({
        colg_cd: cd,
        course_cd: crs,
        branch_cd: b.branch_cd,
        code: b.branch_cd,
        branch_name: b.branch_name,
        name: b.branch_name,
      }));
      return NextResponse.json(fallbackList);
    }
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const tenant = resolveTenantFromReq(req, String(body.tenant || body.tenantSlug || '').trim());
    return handleGetBranch(colgcd, coursecd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/branches] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || searchParams.get('course') || '').trim();
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetBranch(colgcd, coursecd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/branches] Error in GET:', error);
    return NextResponse.json([]);
  }
}

