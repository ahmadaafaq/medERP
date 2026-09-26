const { Client } = require('f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/node_modules/pg');

async function testFusion() {
  const client = new Client({
    host: process.env.DB_HOST || '34.236.107.120',
    port: Number(process.env.DB_PORT) || 5433,
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  const fdt = '2026-09-01';
  const tdt = '2026-09-30';
  const course_cd = '1';

  console.log('--- 1. Testing manualRows query with correct schema ---');
  const manualRows = await client.query(`
    SELECT sess.id AS session_id, sess.subject_id, sess.session_date,
           COALESCE(sub.code, '85717') AS sub_cd,
           COALESCE(sub.name, sess.topic_covered, 'Lecture') AS sub_name,
           ar.student_id, ar.status, s.registration_no, s.rollno
    FROM "${schema}".attendance_sessions sess
    JOIN "${schema}".attendance_records ar ON ar.session_id::text = sess.id::text
    JOIN "${schema}".students s ON s.id::text = ar.student_id::text
    LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
    WHERE sess.is_cancelled = false
      AND sess.session_date::date >= $1::date
      AND sess.session_date::date <= $2::date
      AND (s.course_cd::text = $3::text OR $3 IS NULL OR s.course_cd IS NULL)
  `, [fdt, tdt, course_cd]);

  console.log('Manual rows count:', manualRows.rows.length);
  if (manualRows.rows.length > 0) {
    console.log('Sample manual row:', manualRows.rows[0]);
    const distinctSubs = new Set(manualRows.rows.map(r => r.sub_name));
    console.log('Distinct subjects in manual attendance:', Array.from(distinctSubs));
    const distinctStudents = new Set(manualRows.rows.map(r => r.registration_no));
    console.log('Distinct students with manual records:', distinctStudents.size);
  }

  console.log('\n--- 2. Checking students with batch_cd=18 vs batch_cd=2025 in tenant_srms-cet-bareilly ---');
  const btechStudents = await client.query(`
    SELECT course_cd, batch_cd, count(*) 
    FROM "${schema}".students 
    WHERE course_cd = '1'
    GROUP BY course_cd, batch_cd
  `);
  console.log('B.Tech students by batch_cd:', btechStudents.rows);

  console.log('\n--- 3. Checking attendance_sessions and timetable_slots links ---');
  const sessSlots = await client.query(`
    SELECT sess.id, sess.topic_covered, sess.session_date, sess.timetable_slot_id,
           ts.course_cd, ts.branch_cd, ts.batch_id, ts.semester
    FROM "${schema}".attendance_sessions sess
    LEFT JOIN "${schema}".timetable_slots ts ON ts.id::text = sess.timetable_slot_id::text
    ORDER BY sess.created_at DESC LIMIT 5
  `);
  console.log('Latest sessions with timetable slot info:', sessSlots.rows);

  await client.end();
}

testFusion().catch(console.error);
