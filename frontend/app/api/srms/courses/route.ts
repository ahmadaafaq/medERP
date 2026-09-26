import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const srmsCollegeSlugMap: Record<string, string> = {
  '1': 'srms-cet-bareilly',
  '2': 'srms-cetr-bareilly',
  '11': 'srms-cet-unnao',
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

async function handleGetCourse(colgcd?: string, tenantSlug?: string) {
  const cd = String(colgcd || '1').trim();

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    targetSlug = srmsCollegeSlugMap[cd] || 'srms-cet-bareilly';
  }
  if (targetSlug === 'srms-cet') targetSlug = 'srms-cet-bareilly';
  if (targetSlug === 'srms-cetr') targetSlug = 'srms-cetr-bareilly';
  const schema = `tenant_${targetSlug}`;

  // 1. Direct PostgreSQL query (Instant response, adheres to RestrictAPI.md Rule 2)
  try {
    const dbCourses = await queryDb<any>(
      `SELECT DISTINCT 
         COALESCE(c.course_cd, c.code)::text AS course_cd, 
         COALESCE(c.code, c.course_cd)::text AS code, 
         c.name AS course_name, 
         c.is_active 
       FROM "${schema}".courses c 
       ORDER BY (CASE WHEN COALESCE(c.course_cd, c.code) ~ '^[0-9]+$' THEN COALESCE(c.course_cd, c.code)::int ELSE 999 END) ASC`
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
    console.warn('[API /api/srms/courses] PostgreSQL direct query error:', dbErr?.message);
  }

  // 2. Live SRMS ERP API fallback: https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse
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

  // 3. Resilient static fallback
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
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
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    return handleGetCourse(colgcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/courses] Error in GET:', error);
    return NextResponse.json([]);
  }
}
