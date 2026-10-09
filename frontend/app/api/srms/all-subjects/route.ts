import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';
import { getBackendApiUrl } from '@/lib/backend-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

async function handleGetAllSubjectDetail(
  colgcd?: string,
  coursecd?: string,
  branchcd?: string,
  batchcd?: string,
  semcd?: string,
  tenantSlug?: string,
  seccd?: string,
) {
  let targetSlug = (tenantSlug || '').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!targetSlug || targetSlug === '1' || targetSlug === '2' || targetSlug === '11') {
    if (colgcd === '2' || targetSlug === '2') targetSlug = 'srms-cetr-bareilly';
    else if (colgcd === '11' || targetSlug === '11') targetSlug = 'srms-ims';
    else targetSlug = 'srms-cet-bareilly';
  }
  const isSrmsTenant = targetSlug.includes('srms');
  const schema = `tenant_${targetSlug}`;

  // Sanitize colgcd to clean numeric code for SRMS portal
  let cleanColgCd = '1';
  const rawCd = String(colgcd || '').trim();
  if (rawCd && /^\d+$/.test(rawCd)) {
    cleanColgCd = rawCd;
  } else if (targetSlug.includes('cetr')) {
    cleanColgCd = '2';
  } else if (targetSlug.includes('ims')) {
    cleanColgCd = '11';
  } else if (targetSlug.includes('unnao')) {
    cleanColgCd = '3';
  } else if (targetSlug.includes('law')) {
    cleanColgCd = '4';
  } else if (targetSlug.includes('ibs')) {
    cleanColgCd = '5';
  } else if (targetSlug.includes('iahs')) {
    cleanColgCd = '6';
  } else if (targetSlug.includes('nursing-school')) {
    cleanColgCd = '8';
  } else if (targetSlug.includes('nursing')) {
    cleanColgCd = '9';
  } else {
    cleanColgCd = '1';
  }

  // Sanitize coursecd
  let cleanCourseCd = '1';
  const rawCrs = String(coursecd || '').trim();
  const crsDigits = rawCrs.match(/\d+/);
  if (crsDigits && !rawCrs.includes('-')) {
    cleanCourseCd = crsDigits[0];
  }

  // Sanitize branchcd
  let cleanBranchCd = '1';
  const rawBr = String(branchcd || '').trim();
  const brDigits = rawBr.match(/\d+/);
  if (brDigits && !rawBr.includes('-')) {
    cleanBranchCd = brDigits[0];
  }

  // Sanitize batchcd (Batch 2024 is code 17 for CET B.Tech)
  let cleanBatchCd = '17';
  const rawBat = String(batchcd || '').trim();
  if (rawBat === '2024') {
    cleanBatchCd = '17';
  } else {
    const batDigits = rawBat.match(/\d+/);
    if (batDigits && !rawBat.includes('-')) {
      cleanBatchCd = batDigits[0];
    }
  }

  // Sanitize semcd
  let cleanSemCd = '5';
  const rawSem = String(semcd || '').trim();
  const semDigits = rawSem.match(/\d+/);
  if (semDigits) {
    cleanSemCd = semDigits[0];
  }

  // Sanitize seccd
  let cleanSecCd = '1';
  const rawSec = String(seccd || '').trim();
  const secDigits = rawSec.match(/\d+/);
  if (secDigits) {
    cleanSecCd = secDigits[0];
  }

  // 1. Live SRMS ERP API: ONLY for SRMS tenants!
  if (isSrmsTenant) {
    try {
      const payload = {
        colgcd: cleanColgCd,
        coursecd: cleanCourseCd,
        branchcd: cleanBranchCd,
        batchcd: cleanBatchCd,
        semcd: cleanSemCd,
      };
      const data = await srmsPost('AdminAttendance/GetAllSubjectDetail', payload);
      if (Array.isArray(data) && data.length > 0) {
        return NextResponse.json(data);
      }
    } catch (error: any) {
      console.warn('[API /api/srms/all-subjects] SRMS live portal fetch error:', error?.message);
    }
  }

  // 2. For Non-SRMS Tenants: Query Subject Linker (faculty_subjects) and Master subjects
  try {
    const linkedRows = await queryDb<any>(
      `SELECT DISTINCT ON (s.id)
         s.id,
         COALESCE(s.code, s.subject_code, s.id::text)::text AS sub_cd,
         s.name AS sub_name,
         CASE 
           WHEN f.name IS NOT NULL THEN s.name || ' (' || COALESCE(s.code, '') || ' - Linked: ' || f.name || ')'
           ELSE s.name || ' (' || COALESCE(s.code, '') || ')'
         END AS mst_sub_name,
         COALESCE(s.code, s.subject_code, s.id::text)::text AS sub_addinfo,
         COALESCE(s.type, 'THEORY') AS type,
         s.course_cd,
         s.branch_cd,
         s.department_id,
         s.semester,
         s.sem_cd,
         s.is_active,
         f.name AS faculty_name
       FROM "${schema}".subjects s
       LEFT JOIN "${schema}".faculty_subjects fs ON fs.subject_id::text = s.id::text AND fs.is_active = true
       LEFT JOIN "${schema}".faculty f ON f.id::text = fs.faculty_id::text
       WHERE ($1 = '' OR s.course_cd::text = $1::text OR s.course_id::text = $1::text)
         AND ($2 = '' OR s.branch_cd::text = $2::text OR s.department_id::text = $2::text)
         AND ($3 = '' OR s.semester::text = $3::text OR s.semester::text = ('Semester ' || $3) OR s.semester::text = ('Sem ' || $3) OR s.sem_cd::text = $3::text)
       ORDER BY s.id, fs.created_at DESC`,
      [cleanCourseCd, cleanBranchCd, cleanSemCd]
    ).catch(() => []);

    if (Array.isArray(linkedRows) && linkedRows.length > 0) {
      const mapped = linkedRows.map((s: any) => ({
        colg_cd: Number(cleanColgCd) || 1,
        sub_cd: String(s.sub_cd || s.id),
        sub_name: s.sub_name,
        mst_sub_name: s.mst_sub_name || `${s.sub_name} ${s.type || 'THEORY'}`,
        sub_addinfo: s.sub_addinfo || s.sub_cd,
        course_cd: Number(cleanCourseCd) || 1,
        branch_cd: Number(cleanBranchCd) || 1,
        batch_cd: Number(cleanBatchCd) || 17,
        sem_cd: Number(cleanSemCd) || 5,
        elective_flg: 0,
        active_flg: s.is_active ? 1 : 0,
        Sub_flg: 1,
        course_name: s.course_name || '',
        batch_name: cleanBatchCd || '',
        branch_name: s.department_name || '',
        semester_name: String(cleanSemCd || s.semester || ''),
        ElectiveSts: 'N',
        ActiveSts: s.is_active ? 'Y' : 'N',
        SubTyp: s.type || 'THEORY',
        faculty_name: s.faculty_name,
      }));
      return NextResponse.json(mapped);
    }

    // Direct fallback to tenant's subjects table with strict semester filtering
    const dbSubjects = await queryDb<any>(
      `SELECT DISTINCT
         s.id,
         COALESCE(s.code, s.subject_code, s.id::text)::text AS sub_cd,
         s.name AS sub_name,
         COALESCE(s.type, 'THEORY') AS type,
         s.course_cd,
         s.branch_cd,
         s.department_id,
         s.semester,
         s.sem_cd,
         s.is_active
       FROM "${schema}".subjects s
       WHERE ($1 = '' OR s.course_cd::text = $1::text OR s.course_id::text = $1::text)
         AND ($2 = '' OR s.branch_cd::text = $2::text OR s.department_id::text = $2::text)
         AND ($3 = '' OR s.semester::text = $3::text OR s.semester::text = ('Semester ' || $3) OR s.semester::text = ('Sem ' || $3) OR s.sem_cd::text = $3::text)
       ORDER BY sub_name ASC`,
      [cleanCourseCd, cleanBranchCd, cleanSemCd]
    ).catch(() => []);

    if (Array.isArray(dbSubjects) && dbSubjects.length > 0) {
      const mapped = dbSubjects.map((s: any) => ({
        colg_cd: Number(cleanColgCd) || 1,
        sub_cd: String(s.sub_cd || s.id),
        sub_name: s.sub_name,
        mst_sub_name: `${s.sub_name} ${s.type || 'THEORY'}`,
        sub_addinfo: s.sub_cd,
        course_cd: Number(cleanCourseCd) || 1,
        branch_cd: Number(cleanBranchCd) || 1,
        batch_cd: Number(cleanBatchCd) || 17,
        sem_cd: Number(cleanSemCd) || 5,
        elective_flg: 0,
        active_flg: s.is_active ? 1 : 0,
        Sub_flg: 1,
        course_name: s.course_name || '',
        batch_name: cleanBatchCd || '',
        branch_name: s.department_name || '',
        semester_name: String(cleanSemCd || s.semester || ''),
        ElectiveSts: 'N',
        ActiveSts: s.is_active ? 'Y' : 'N',
        SubTyp: s.type || 'THEORY',
      }));
      return NextResponse.json(mapped);
    }
  } catch (dbErr: any) {
    console.warn(`[API /api/srms/all-subjects] PostgreSQL query error on ${schema}:`, dbErr?.message);
  }

  // 3. Dynamic Fallback to PostgreSQL via NestJS backend (filtered strictly by semester)
  try {
    const res = await fetch(`${getBackendApiUrl()}/admin-master/subjects?tenant=${encodeURIComponent(targetSlug)}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      if (Array.isArray(list) && list.length > 0) {
        const filtered = list.filter((s: any) => {
          const courseOk = !cleanCourseCd || String(s.course_cd) === String(cleanCourseCd) || String(s.course_id) === String(cleanCourseCd);
          const branchOk = !cleanBranchCd || String(s.branch_cd) === String(cleanBranchCd) || String(s.department_id) === String(cleanBranchCd);
          const semOk = !cleanSemCd || String(s.sem_cd) === String(cleanSemCd) || String(s.semester || '').includes(String(cleanSemCd));
          return courseOk && branchOk && semOk;
        });

        const mapped = filtered.map((s: any) => ({
          colg_cd: Number(cleanColgCd) || 1,
          sub_cd: String(s.code || s.id),
          sub_name: s.name,
          mst_sub_name: `${s.name} ${s.type || 'THEORY'}`,
          sub_addinfo: s.code,
          course_cd: Number(cleanCourseCd) || 1,
          branch_cd: Number(cleanBranchCd) || 1,
          batch_cd: Number(cleanBatchCd) || 17,
          sem_cd: Number(cleanSemCd) || 5,
          elective_flg: 0,
          active_flg: s.is_active ? 1 : 0,
          Sub_flg: 1,
          course_name: s.course_name || '',
          batch_name: cleanBatchCd || '',
          branch_name: s.department_name || '-',
          semester_name: String(cleanSemCd),
          ElectiveSts: 'N',
          ActiveSts: s.is_active ? 'Y' : 'N',
          SubTyp: s.type || 'THEORY',
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (backendErr: any) {
    console.warn('[API /api/srms/all-subjects] PostgreSQL backend fallback error:', backendErr?.message);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const colgcd = String(body.colgcd || body.colg_cd || '').trim();
    const coursecd = String(body.coursecd || body.course_cd || '').trim();
    const branchcd = String(body.branchcd || body.branch_cd || '').trim();
    const batchcd = String(body.batchcd || body.batch_cd || '').trim();
    const semcd = String(body.semcd || body.sem_cd || '').trim();
    const seccd = String(body.seccd || body.sec_cd || body.section || '').trim();
    const tenant = resolveTenantFromReq(req, String(body.tenant || body.tenantSlug || '').trim());
    return handleGetAllSubjectDetail(colgcd, coursecd, branchcd, batchcd, semcd, tenant, seccd);
  } catch (error: any) {
    console.error('[API /api/srms/all-subjects] Error in POST:', error);
    return NextResponse.json([]);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const colgcd = String(searchParams.get('colgcd') || searchParams.get('colg_cd') || '').trim();
    const coursecd = String(searchParams.get('coursecd') || searchParams.get('course_cd') || '').trim();
    const branchcd = String(searchParams.get('branchcd') || searchParams.get('branch_cd') || '').trim();
    const batchcd = String(searchParams.get('batchcd') || searchParams.get('batch_cd') || '').trim();
    const semcd = String(searchParams.get('semcd') || searchParams.get('sem_cd') || '').trim();
    const seccd = String(searchParams.get('seccd') || searchParams.get('sec_cd') || searchParams.get('section') || '').trim();
    const tenant = resolveTenantFromReq(req, String(searchParams.get('tenant') || searchParams.get('tenantSlug') || '').trim());
    return handleGetAllSubjectDetail(colgcd, coursecd, branchcd, batchcd, semcd, tenant, seccd);
  } catch (error: any) {
    console.error('[API /api/srms/all-subjects] Error in GET:', error);
    return NextResponse.json([]);
  }
}

