import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { srmsPost } from '@/lib/srms-client';
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

// Course Max Semesters Mapping per RestrictAPI.md
function getMaxSemestersForCourse(colgcd: string, coursecd: string): number {
  const crs = String(coursecd || '').trim().toUpperCase();
  const colg = String(colgcd || '').trim();

  // In CET (colgcd=1):
  // 1: B.Tech (8), 2: B.Pharm (8), 3: MCA (4), 4: MBA (4), 5: M.Tech (4), 6: M.Pharm (4), 7: B.Tech LE (6), 11: BA.LL.B (10), 12: BBA (6), 13: BCA (6)
  // In CETR (colgcd=2):
  // 1: B.Tech (8), 2: BHMCT (8), 3: BCA (6), 4: BBA (6)
  if (colg === '2') {
    if (crs === '1') return 8; // B.Tech
    if (crs === '2') return 8; // BHMCT
    if (crs === '3') return 6; // BCA
    if (crs === '4') return 6; // BBA
  }

  if (crs === '1' || crs === '2' || crs === 'BTECH' || crs === 'BPHARM') return 8;
  if (crs === '3' || crs === '4' || crs === '5' || crs === '6' || crs === 'MBA' || crs === 'MCA' || crs === 'MTECH' || crs === 'MPHARM') return 4;
  if (crs === '11' || crs === 'BALLB') return 10;
  if (crs === '12' || crs === '13' || crs === 'BBA' || crs === 'BCA') return 6;
  if (crs === '7' || crs === '8' || crs === '9') return 6; // Lateral entry
  if (crs === '16' || crs === 'MBBS') return 9;

  return 8;
}

function getOrdinalName(n: number): string {
  const ords = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  return `${ords[n - 1] || `${n}th`} Semester`;
}

function generateDefaultSemesters(maxSem: number) {
  const list = [];
  for (let i = 1; i <= maxSem; i++) {
    list.push({
      id: String(i),
      code: String(i),
      sem_cd: i,
      name: `Semester ${i}`,
      SemName: getOrdinalName(i),
    });
  }
  return list;
}

async function handleGetSemesters(
  colgcd: string,
  coursecd: string,
  branchcd: string,
  batchcd: string,
  tenantSlug?: string
) {
  const cd = colgcd || '1';
  const crs = coursecd || '1';
  const br = branchcd || '1';
  const bat = batchcd || '18';

  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || srmsCollegeSlugMap[cd]) {
    targetSlug = srmsCollegeSlugMap[cd] || targetSlug || 'srms-cet-bareilly';
  }

  const maxAllowed = getMaxSemestersForCourse(cd, crs);

  // 1. Try Backend API: /attendance/portal/semesters
  try {
    const res = await fetch(
      `${getBackendApiUrl()}/attendance/portal/semesters?colgcd=${encodeURIComponent(cd)}&coursecd=${encodeURIComponent(crs)}&ddl_branch=${encodeURIComponent(br)}&ddl_batch=${encodeURIComponent(bat)}&tenant=${encodeURIComponent(targetSlug)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const seen = new Set<number>();
        const deduplicated = [];
        for (const item of list) {
          const num = Number(item.sem_cd || item.code || item.id);
          if (!isNaN(num) && num >= 1 && num <= maxAllowed && !seen.has(num)) {
            seen.add(num);
            deduplicated.push({
              id: String(num),
              code: String(num),
              sem_cd: num,
              name: `Semester ${num}`,
              SemName: item.SemName || getOrdinalName(num),
            });
          }
        }
        deduplicated.sort((a, b) => a.sem_cd - b.sem_cd);
        if (deduplicated.length > 0) {
          return NextResponse.json(deduplicated);
        }
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/semesters] Backend proxy error:', backendErr?.message);
  }

  // 2. Fallback to PostgreSQL professional_phases or direct generation
  try {
    const schema = `tenant_${targetSlug}`;
    const phases = await queryDb<any>(
      `SELECT phase_order AS sem_cd, name AS "SemName" 
       FROM "${schema}".professional_phases 
       ORDER BY phase_order ASC`
    ).catch(() => []);

    if (Array.isArray(phases) && phases.length > 0) {
      const seen = new Set<number>();
      const deduplicated = [];
      for (const p of phases) {
        const num = Number(p.sem_cd);
        if (!isNaN(num) && num >= 1 && num <= maxAllowed && !seen.has(num)) {
          seen.add(num);
          deduplicated.push({
            id: String(num),
            code: String(num),
            sem_cd: num,
            name: `Semester ${num}`,
            SemName: p.SemName || getOrdinalName(num),
          });
        }
      }
      deduplicated.sort((a, b) => a.sem_cd - b.sem_cd);
      if (deduplicated.length > 0) return NextResponse.json(deduplicated);
    }
  } catch (dbErr: any) {
    console.warn('[API /api/srms/semesters] PostgreSQL query error:', dbErr?.message);
  }

  // 3. Fallback: generate exact standard semesters for this course
  return NextResponse.json(generateDefaultSemesters(maxAllowed));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '1').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || '1').trim();
    const branchcd = String(searchParams.get('branchcd') || searchParams.get('branch_cd') || searchParams.get('ddl_branch') || '1').trim();
    const batchcd = String(searchParams.get('batchcd') || searchParams.get('batch_cd') || searchParams.get('ddl_batch') || '18').trim();
    const tenant = String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim();

    return handleGetSemesters(colgcd, coursecd, branchcd, batchcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/semesters] Error in GET:', error);
    return NextResponse.json(generateDefaultSemesters(8));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '1').trim();
    const coursecd = String(body.coursecd || body.course_cd || '1').trim();
    const branchcd = String(body.branchcd || body.branch_cd || body.ddl_branch || '1').trim();
    const batchcd = String(body.batchcd || body.batch_cd || body.ddl_batch || '18').trim();
    const tenant = String(body.tenant || body.tenantSlug || '').trim();

    return handleGetSemesters(colgcd, coursecd, branchcd, batchcd, tenant);
  } catch (error: any) {
    console.error('[API /api/srms/semesters] Error in POST:', error);
    return NextResponse.json(generateDefaultSemesters(8));
  }
}
