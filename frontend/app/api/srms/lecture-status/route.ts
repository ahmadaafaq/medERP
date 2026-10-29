import { NextRequest, NextResponse } from 'next/server';
import { srmsPost } from '@/lib/srms-client';
import { queryDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ddl_sub = String(body.ddl_sub || '').trim();
    const ddl_batch = String(body.ddl_batch || '2');
    const colgcd = String(body.colgcd || '1');
    const coursecd = String(body.coursecd || '13');
    const ddl_branch = String(body.ddl_branch || '1');
    const sem_cd = String(body.sem_cd || '3');
    const section_cd = String(body.section_cd || '1');
    const uid = String(body.uid || '').trim();
    const tenantSlug =
      body.tenantSlug || body.tenant || request.headers.get('x-tenant-slug') || '';

    const targetSlug = (tenantSlug || 'team-university').toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    const isSrms = targetSlug.includes('srms');
    const schema = `tenant_${targetSlug}`;

    if (isSrms) {
      const payload = {
        ddl_sub,
        ddl_batch,
        colgcd,
        coursecd,
        ddl_branch,
        sem_cd,
        section_cd,
        uid,
      };

      const data = await srmsPost('student/GetEngSemSubwiseStatus', payload);
      const list = Array.isArray(data) ? data : [];

      return NextResponse.json({
        success: true,
        data: list,
        count: list.length,
      });
    }

    // Non-SRMS Tenants: Query PostgreSQL directly
    const dbRows = await queryDb(
      `SELECT sess.id,
              sess.session_date AS lecturedt,
              COALESCE(ts.start_time, '08:30') AS starttm,
              COALESCE(ts.end_time, '09:30') AS endtm,
              COALESCE(sub.code, sub.sub_addinfo, 'LEC') AS sub_cd,
              COALESCE(sub.name, sess.topic_covered, 'Subject') AS sub_name,
              sess.topic_covered,
              s.registration_no AS stud_reg_no,
              s.name AS stud_name,
              ar.status,
              (CASE WHEN ar.status = 'PRESENT' OR ar.status = 'LATE' THEN 'Y' ELSE 'N' END) AS "IsPresent"
       FROM "${schema}".attendance_sessions sess
       JOIN "${schema}".attendance_records ar ON ar.session_id::text = sess.id::text
       JOIN "${schema}".students s ON s.id::text = ar.student_id::text
       LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
       LEFT JOIN "${schema}".timetable_slots ts ON ts.id::text = sess.timetable_slot_id::text
       WHERE sess.is_cancelled = false
         AND (s.registration_no::text = $1::text OR s.rollno::text = $1::text OR s.id::text = $1::text)
         AND (
           $2::text = ''
           OR sub.code::text = $2::text
           OR sub.sub_addinfo::text = $2::text
           OR sess.subject_id::text = $2::text
           OR sub.name::text ILIKE '%' || $2::text || '%'
         )
       ORDER BY sess.session_date DESC`,
      [uid, ddl_sub]
    ).catch((err) => {
      console.warn('[Non-SRMS Lecture Status DB Error]', err);
      return [];
    });

    return NextResponse.json({
      success: true,
      data: dbRows || [],
      count: dbRows ? dbRows.length : 0,
      source: 'POSTGRESQL_DATABASE',
    });
  } catch (error: any) {
    console.error('[Lecture Status API Error]', error);
    return NextResponse.json(
      { success: false, data: [], message: error.message || 'Failed to fetch lecture status' },
      { status: 500 }
    );
  }
}
