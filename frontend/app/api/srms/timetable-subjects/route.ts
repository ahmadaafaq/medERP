export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { srmsPost, isSrmsTenant } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

async function handleSubjectsFetch(params: {
  course: string;
  branch: number;
  batch: number;
  semester: number;
  section: number;
  colgcd: number;
  slug: string;
}) {
  const { course, branch, batch, semester, section, colgcd, slug } = params;

  if (slug && !isSrmsTenant(slug)) {
    // Non-SRMS tenant: Load directly from PostgreSQL Subject Linker (faculty_subjects + subjects + faculty)
    const schema = `tenant_${slug}`;
    let dbSubs = await queryDb(
      `SELECT 
        COALESCE(s.code, fs.subject_id) AS id,
        COALESCE(s.code, fs.subject_id) AS code,
        COALESCE(s.code, fs.subject_id) AS sub_cd,
        COALESCE(s.code, fs.subject_id) AS linkcd,
        COALESCE(s.name, fs.subject_id) AS name,
        CASE 
          WHEN COALESCE(f.name, u.name) IS NOT NULL THEN COALESCE(s.name, fs.subject_id) || ' (' || COALESCE(f.name, u.name) || ')'
          ELSE COALESCE(s.name, fs.subject_id)
        END AS sub_name,
        COALESCE(f.name, u.name, '') AS "EmpName",
        COALESCE(f.name, u.name, '') AS faculty_name,
        COALESCE(f.emp_id, u.emp_id, fs.faculty_id, '') AS empid,
        COALESCE(f.emp_id, u.emp_id, fs.faculty_id, '') AS faculty_code,
        COALESCE(f.id, u.id, fs.faculty_id, '') AS faculty_id,
        'N' AS electivests,
        COALESCE(fs.course_cd, s.course_cd) AS course_cd,
        COALESCE(fs.branch_cd, s.branch_cd) AS branch_cd,
        COALESCE(fs.batch_cd, s.batch_cd) AS batch_cd,
        COALESCE(fs.sem_cd, s.sem_cd) AS sem_cd,
        COALESCE(fs.section, '1') AS section
      FROM "${schema}".faculty_subjects fs
      JOIN "${schema}".subjects s ON (s.id::text = fs.subject_id::text OR s.code::text = fs.subject_id::text)
      LEFT JOIN "${schema}".faculty f ON (f.id::text = fs.faculty_id::text OR f.emp_id::text = fs.faculty_id::text)
      LEFT JOIN "${schema}".users u ON (u.emp_id::text = f.emp_id::text OR u.id::text = fs.faculty_id::text OR u.emp_id::text = fs.faculty_id::text)
      WHERE fs.is_active = true
        AND (
          $1 = '' OR $1 = '0' OR $1 = 'all' OR
          fs.course_cd = $1 OR s.course_cd = $1 OR s.course_id::text = $1 OR fs.course_cd IS NULL
        )
      UNION ALL
      SELECT 
        s.code AS id,
        s.code,
        s.code AS sub_cd,
        s.code AS linkcd,
        s.name,
        s.name AS sub_name,
        '' AS "EmpName",
        '' AS faculty_name,
        '' AS empid,
        '' AS faculty_code,
        '' AS faculty_id,
        'N' AS electivests,
        s.course_cd,
        s.branch_cd,
        s.batch_cd,
        s.sem_cd,
        '1' AS section
      FROM "${schema}".subjects s
      WHERE s.is_active IS NOT FALSE
        AND ($1 = '' OR $1 = '0' OR $1 = 'all' OR s.course_cd = $1 OR s.course_id::text = $1)
        AND NOT EXISTS (
          SELECT 1 FROM "${schema}".faculty_subjects fs2
          WHERE (fs2.subject_id::text = s.id::text OR fs2.subject_id::text = s.code::text)
            AND fs2.is_active = true
        )
      ORDER BY name ASC`,
      [course]
    ).catch(() => []);

    if (!dbSubs || dbSubs.length === 0) {
      // Fallback to subjects table directly if faculty_subjects returned empty or does not exist
      dbSubs = await queryDb(
        `SELECT id, code, name AS sub_name, name, code AS sub_cd, code AS linkcd, 'N' AS electivests
         FROM "${schema}".subjects
         WHERE (course_cd = $1 OR course_id::text = $1 OR $1 = '13' OR $1 = '0' OR $1 = 'all')
         ORDER BY name ASC`,
        [course]
      ).catch(() => []);
    }

    return NextResponse.json({
      success: true,
      data: dbSubs,
    });
  }

  const payload = {
    course: course,
    branch: branch,
    batch: batch,
    semester: semester,
    section: section,
    colgcd: colgcd,
  };

  const targetUrl = 'https://myportal.srms.ac.in/timetable/services/EmployeeInfo.asmx/Loadsubject';
  const data = await srmsPost(targetUrl, payload);

  // If ASMX returns { d: "[...]" } or { d: [...] }
  let parsedData = data;
  if (data && data.d) {
    try {
      parsedData = typeof data.d === 'string' ? JSON.parse(data.d) : data.d;
    } catch {
      parsedData = data.d;
    }
  }

  return NextResponse.json({
    success: true,
    data: Array.isArray(parsedData) ? parsedData : [],
    raw: data,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const course = String(body.course || body.course_cd || '13').trim();
    const branch = Number(body.branch || body.branch_cd || 1);
    const batch = Number(body.batch || body.batch_cd || 2);
    const semester = Number(body.semester || body.sem_cd || 3);
    const section = Number(body.section || body.sec_cd || 1);
    const colgcd = Number(body.colgcd || body.colg_cd || 1);

    const tenantParam = req.nextUrl?.searchParams?.get('tenant') || body.tenant || '';
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    const slug = (tenantParam || tenantHeader).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();

    return await handleSubjectsFetch({ course, branch, batch, semester, section, colgcd, slug });
  } catch (error: any) {
    console.error('[API /api/srms/timetable-subjects POST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message,
      data: [],
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course = String(searchParams.get('course') || searchParams.get('course_cd') || '13').trim();
    const branch = Number(searchParams.get('branch') || searchParams.get('branch_cd') || 1);
    const batch = Number(searchParams.get('batch') || searchParams.get('batch_cd') || 2);
    const semester = Number(searchParams.get('semester') || searchParams.get('sem_cd') || 3);
    const section = Number(searchParams.get('section') || searchParams.get('sec_cd') || 1);
    const colgcd = Number(searchParams.get('colgcd') || searchParams.get('colg_cd') || 1);

    const tenantParam = searchParams.get('tenant') || searchParams.get('tenantSlug') || '';
    const tenantHeader = req.headers.get('x-tenant-id') || req.headers.get('x-tenant') || req.headers.get('x-tenant-slug') || '';
    const slug = (tenantParam || tenantHeader).replace(/^tenant_/, '').replace(/^tenant-/, '').trim();

    return await handleSubjectsFetch({ course, branch, batch, semester, section, colgcd, slug });
  } catch (error: any) {
    console.error('[API /api/srms/timetable-subjects GET] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message,
      data: [],
    }, { status: 500 });
  }
}
