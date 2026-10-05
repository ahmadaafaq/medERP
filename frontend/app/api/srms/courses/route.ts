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

const COURSE_NAME_MAP: Record<string, string> = {
  '1': 'B.Tech (Bachelor of Technology)',
  '2': 'B.Pharm (Bachelor of Pharmacy)',
  '3': 'MCA (Master of Computer Applications)',
  '4': 'MBA (Master of Business Administration)',
  '5': 'M.Tech (Master of Technology)',
  '6': 'M.Pharm (Master of Pharmacy)',
  '7': 'B.Tech (Lateral Entry)',
  '8': 'B.Pharma (Lateral Entry)',
  '9': 'MCA (Lateral Entry)',
  '10': 'M.Sc (Master of Science)',
  '11': 'BA.LL.B',
  '12': 'BBA (Bachelor of Business Administration)',
  '13': 'BCA (Bachelor of Computer Applications)',
  '14': 'MCA (Master of Computer Applications)',
  '15': 'MBA (Master of Business Administration)',
  '16': 'MBBS (Bachelor of Medicine, Bachelor of Surgery)',
  'MBBS': 'MBBS (Bachelor of Medicine, Bachelor of Surgery)',
  'BCA': 'BCA (Bachelor of Computer Applications)',
  'BTECH': 'B.Tech (Bachelor of Technology)',
  'MCA': 'MCA (Master of Computer Applications)',
  'MBA': 'MBA (Master of Business Administration)',
  'BBA': 'BBA (Bachelor of Business Administration)',
  'BPHARM': 'B.Pharm (Bachelor of Pharmacy)',
  'MPHARM': 'M.Pharm (Master of Pharmacy)',
  'MTECH': 'M.Tech (Master of Technology)',
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

async function handleGetCourse(colgcd?: string, tenantSlug?: string) {
  const cd = String(colgcd || '1').trim();

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  
  // Scoped to SRMS only if targetSlug is missing or is just a numeric college code:
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

  // 1. Direct PostgreSQL query to tenant's schema
  try {
    const dbCourses = await queryDb<any>(
      `SELECT DISTINCT 
         COALESCE(c.course_cd, c.code, c.id::text)::text AS course_cd, 
         COALESCE(c.code, c.course_cd, c.id::text)::text AS code, 
         c.name AS course_name, 
         c.is_active,
         (CASE WHEN COALESCE(c.course_cd, c.code) ~ '^[0-9]+$' THEN COALESCE(c.course_cd, c.code)::int ELSE 999 END) AS sort_order
       FROM "${schema}".courses c 
       ORDER BY sort_order ASC, c.name ASC`
    );

    if (Array.isArray(dbCourses) && dbCourses.length > 0) {
      const mapped = dbCourses.map((c) => {
        const code = String(c.course_cd || c.code || '1');
        const validName = c.course_name || COURSE_NAME_MAP[code] || `Course ${code}`;
        return {
          colg_cd: cd,
          course_cd: code,
          code: code,
          course_name: validName,
          name: validName,
          is_active: c.is_active,
        };
      });
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/courses] PostgreSQL direct query error on ${schema}:`, dbErr?.message);
  }

  // 2. Dynamic Fallback to NestJS backend
  try {
    const res = await fetch(`${getBackendApiUrl()}/college-master/courses?tenant=${encodeURIComponent(targetSlug)}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => {
          const code = String(c.course_cd || c.code || c.id || '1');
          const validName = c.name || c.course_name || COURSE_NAME_MAP[code] || `Course ${code}`;
          return {
            colg_cd: cd,
            course_cd: code,
            code: code,
            course_name: validName,
            name: validName,
            is_active: c.is_active,
          };
        });
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/courses] Backend query fallback error:', backendErr?.message);
  }

  // 3. Live SRMS ERP API fallback: ONLY for SRMS tenants!
  if (isSrmsTenant) {
    try {
      const data = await srmsPost('erpadmin/GetCourse', { colgcd: cd, colg_cd: cd });
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((c: any) => {
          const code = String(c.course_cd || c.crs_cd || c.code || c.id || '1');
          const rawName = (c.course_name || c.crs_name || c.name || c.crsdesc || c.coursename || '').trim();
          const validName = (rawName && !/^course\s*\d+$/i.test(rawName) && rawName !== '-' && rawName !== 'null')
            ? rawName
            : (COURSE_NAME_MAP[code] || `Course ${code}`);
          return {
            ...c,
            colg_cd: c.colg_cd || cd,
            course_cd: code,
            code: code,
            course_name: validName,
            name: validName,
          };
        });
        return NextResponse.json(mapped);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/courses] SRMS live portal fetch error:', error?.message);
    }

    // SRMS static fallback only
    const defaultList = [
      { colg_cd: cd, course_cd: '1', code: '1', course_name: 'B.Tech (Bachelor of Technology)', name: 'B.Tech (Bachelor of Technology)' },
      { colg_cd: cd, course_cd: '2', code: '2', course_name: 'B.Pharm (Bachelor of Pharmacy)', name: 'B.Pharm (Bachelor of Pharmacy)' },
      { colg_cd: cd, course_cd: '3', code: '3', course_name: 'MCA (Master of Computer Applications)', name: 'MCA (Master of Computer Applications)' },
      { colg_cd: cd, course_cd: '4', code: '4', course_name: 'MBA (Master of Business Administration)', name: 'MBA (Master of Business Administration)' },
      { colg_cd: cd, course_cd: '5', code: '5', course_name: 'M.Tech (Master of Technology)', name: 'M.Tech (Master of Technology)' },
      { colg_cd: cd, course_cd: '6', code: '6', course_name: 'M.Pharm (Master of Pharmacy)', name: 'M.Pharm (Master of Pharmacy)' },
      { colg_cd: cd, course_cd: '7', code: '7', course_name: 'B.Tech (Lateral Entry)', name: 'B.Tech (Lateral Entry)' },
      { colg_cd: cd, course_cd: '12', code: '12', course_name: 'BBA (Bachelor of Business Administration)', name: 'BBA (Bachelor of Business Administration)' },
      { colg_cd: cd, course_cd: '13', code: '13', course_name: 'BCA (Bachelor of Computer Applications)', name: 'BCA (Bachelor of Computer Applications)' },
    ];
    return NextResponse.json(defaultList);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const tenant = resolveTenantFromReq(req, String(body.tenant || body.tenantSlug || '').trim());
    return handleGetCourse(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetCourse(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in GET:', error);
    return NextResponse.json([]);
  }
}

