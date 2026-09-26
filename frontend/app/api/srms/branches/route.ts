import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const srmsCollegeSlugMap: Record<string, string> = {
  '1': 'srms-cet-bareilly',
  '2': 'srms-cetr-bareilly',
  '11': 'srms-cet-unnao',
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

async function handleGetBranch(colgcd?: string, coursecd?: string, tenantSlug?: string) {
  const cd = String(colgcd || '1').trim();
  const crs = String(coursecd || '1').trim();

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    targetSlug = srmsCollegeSlugMap[cd] || 'srms-cet-bareilly';
  }
  if (targetSlug === 'srms-cet') targetSlug = 'srms-cet-bareilly';
  if (targetSlug === 'srms-cetr') targetSlug = 'srms-cetr-bareilly';
  const schema = `tenant_${targetSlug}`;

  // 1. Live SRMS ERP API: https://myportal.srms.ac.in/SRMSERP/erpadmin/GetBranch
  try {
    const data = await srmsPost('erpadmin/GetBranch', { colgcd: cd, coursecd: crs });
    if (Array.isArray(data) && data.length > 0) {
      // Filter by course_cd if provided
      const courseFiltered = data.filter((b: any) => {
        const bCourse = String(b.course_cd || b.coursecd || b.course_id || '').trim();
        return !bCourse || bCourse === String(crs);
      });
      const targetList = courseFiltered.length > 0 ? courseFiltered : data;

      // Deduplicate by unique branch_name + branch_cd
      const seen = new Set<string>();
      const deduplicated: any[] = [];
      for (const item of targetList) {
        const bCode = String(item.branch_cd || item.code || item.id || '1').trim();
        let bName = String(item.branch_name || item.name || '').trim();

        // If SRMS returns '-' or empty for single-department course (e.g. MBA, BCA, MCA), resolve to real department name
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
            branch_name: bName,
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

  // 2. Direct Fallback to PostgreSQL (per RestrictAPI.md Rule 2 & Rule 3)
  try {
    const dbBranches = await queryDb<any>(
      `SELECT DISTINCT 
         d.branch_cd::text AS branch_cd, 
         COALESCE(d.name, d.branch_name)::text AS branch_name, 
         d.course_cd::text AS course_cd, 
         COALESCE(d.colg_cd::text, $2::text) AS colg_cd
       FROM "${schema}".departments d
       WHERE (d.course_cd::text = $1::text OR d.code::text = $1::text)
         AND d.branch_cd IS NOT NULL
       ORDER BY d.branch_cd::text ASC`,
      [crs, cd]
    );

    if (Array.isArray(dbBranches) && dbBranches.length > 0) {
      const mapped = dbBranches.map((b) => ({
        colg_cd: b.colg_cd || cd,
        course_cd: b.course_cd || crs,
        branch_cd: String(b.branch_cd),
        branch_name: b.branch_name,
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn('[API /api/srms/branches] PostgreSQL direct query error:', dbErr?.message);
  }

  // 3. Fallback to resilient course-branch dictionary
  if (DEFAULT_COURSE_BRANCHES[crs]) {
    const fallbackList = DEFAULT_COURSE_BRANCHES[crs].map((b) => ({
      colg_cd: cd,
      course_cd: crs,
      branch_cd: b.branch_cd,
      branch_name: b.branch_name,
    }));
    return NextResponse.json(fallbackList);
  }

  return NextResponse.json([{
    colg_cd: cd,
    course_cd: crs,
    branch_cd: '1',
    branch_name: `Department ${crs}`,
  }]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();
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
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();
    return handleGetBranch(colgcd, coursecd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/branches] Error in GET:', error);
    return NextResponse.json([]);
  }
}
