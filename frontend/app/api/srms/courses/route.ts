import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const COURSE_NAME_MAP: Record<string, string> = {
  '1': 'B.Tech (Bachelor of Technology)',
  '2': 'B.Pharm (Bachelor of Pharmacy)',
  '3': 'MBA (Master of Business Administration)',
  '4': 'MCA (Master of Computer Applications)',
  '5': 'M.Tech (Master of Technology)',
  '6': 'M.Pharm (Master of Pharmacy)',
  '7': 'BBA (Bachelor of Business Administration)',
  '8': 'B.Sc (Bachelor of Science)',
  '9': 'B.Com (Bachelor of Commerce)',
  '10': 'M.Sc (Master of Science)',
  '11': 'Diploma (Polytechnic)',
  '12': 'B.Sc Nursing',
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
  const cd = colgcd || '1';
  const tenant = tenantSlug || 'srms-cet-bareilly';

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/erpadmin/GetCourse
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

  // 2. Dynamic Fallback to PostgreSQL via NestJS backend
  try {
    const res = await fetch(`${BACKEND_API}/college-master/courses?tenant=${tenant}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => {
          const code = String(c.course_cd || c.code || c.id || '1');
          const rawName = (c.name || c.course_name || '').trim();
          const validName = (rawName && !/^course\s*\d+$/i.test(rawName) && rawName !== '-' && rawName !== 'null')
            ? rawName
            : (COURSE_NAME_MAP[code] || `Course ${code}`);
          return {
            colg_cd: c.colg_cd || cd,
            course_cd: code,
            code: code,
            course_name: validName,
            name: validName,
          };
        });
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/courses] PostgreSQL backend fallback error:', backendErr?.message);
  }

  // 3. Fallback to standard SRMS courses
  const defaultList = [
    { colg_cd: cd, course_cd: '1', code: '1', course_name: 'B.Tech (Bachelor of Technology)', name: 'B.Tech (Bachelor of Technology)' },
    { colg_cd: cd, course_cd: '2', code: '2', course_name: 'B.Pharm (Bachelor of Pharmacy)', name: 'B.Pharm (Bachelor of Pharmacy)' },
    { colg_cd: cd, course_cd: '3', code: '3', course_name: 'MBA (Master of Business Administration)', name: 'MBA (Master of Business Administration)' },
    { colg_cd: cd, course_cd: '4', code: '4', course_name: 'MCA (Master of Computer Applications)', name: 'MCA (Master of Computer Applications)' },
    { colg_cd: cd, course_cd: '5', code: '5', course_name: 'M.Tech (Master of Technology)', name: 'M.Tech (Master of Technology)' },
    { colg_cd: cd, course_cd: '6', code: '6', course_name: 'M.Pharm (Master of Pharmacy)', name: 'M.Pharm (Master of Pharmacy)' },
    { colg_cd: cd, course_cd: '7', code: '7', course_name: 'BBA (Bachelor of Business Administration)', name: 'BBA (Bachelor of Business Administration)' },
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
