const { Client } = require('f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/node_modules/pg');

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || '34.236.107.120',
    port: Number(process.env.DB_PORT) || 5433,
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('--- 1. Latest Attendance Sessions ---');
  const sessRes = await client.query(`
    SELECT sess.id, sess.session_date, sess.topic_covered, sess.subject_id, sess.batch_id, sess.created_at,
           sub.code AS sub_code, sub.name AS sub_name
    FROM "${schema}".attendance_sessions sess
    LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
    ORDER BY sess.created_at DESC
    LIMIT 5
  `);
  console.log(sessRes.rows);

  if (sessRes.rows.length > 0) {
    const latestId = sessRes.rows[0].id;
    console.log('\n--- 2. Record counts for latest session ' + latestId + ' ---');
    const recCountRes = await client.query(`
      SELECT status, count(*) as count
      FROM "${schema}".attendance_records
      WHERE session_id::text = $1
      GROUP BY status
    `, [latestId]);
    console.log(recCountRes.rows);
  }

  console.log('\n--- 3. Testing student-attendance query with course_cd=1, batch_cd=18, fdt=2026-07-02, tdt=2026-08-21 ---');
  const q1Students = await client.query(`
    SELECT s.id, s.name AS stud_name, s.registration_no AS stud_reg_no, s.rollno AS stud_roll_no,
           s.course_cd, s.batch_cd, s.batch_id
    FROM "${schema}".students s
    WHERE (s.course_cd::text = '1' OR '1' IS NULL)
      AND (
        '18'::text IS NULL
        OR s.batch_cd::text = '18'
        OR s.batch_id::text = '18'
        OR (s.batch_cd::text = '2025' AND '18'::text IN ('18', '2', '2025'))
      )
    ORDER BY s.rollno ASC, s.name ASC
  `);
  console.log('Found students for course_cd=1, batch_cd=18:', q1Students.rows.length);

  const q1Sessions = await client.query(`
    SELECT sess.id AS session_id, sess.subject_id, sess.session_date, sess.timetable_slot_id, sess.topic_covered,
           COALESCE(sub.code, '85717') AS sub_cd,
           COALESCE(sub.name, sess.topic_covered, 'Scheduled Lecture') AS sub_name
    FROM "${schema}".attendance_sessions sess
    LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
    WHERE sess.is_cancelled = false
      AND sess.session_date::date >= '2026-07-02'::date
      AND sess.session_date::date <= '2026-08-21'::date
  `);
  console.log('Found sessions between 2026-07-02 and 2026-08-21:', q1Sessions.rows.length);

  console.log('\n--- 4. Testing student-attendance query with fdt=2026-09-01, tdt=2026-09-30 ---');
  const q2Sessions = await client.query(`
    SELECT sess.id AS session_id, sess.subject_id, sess.session_date, sess.timetable_slot_id, sess.topic_covered,
           COALESCE(sub.code, '85717') AS sub_cd,
           COALESCE(sub.name, sess.topic_covered, 'Scheduled Lecture') AS sub_name
    FROM "${schema}".attendance_sessions sess
    LEFT JOIN "${schema}".subjects sub ON sub.id::text = sess.subject_id::text
    WHERE sess.is_cancelled = false
      AND sess.session_date::date >= '2026-09-01'::date
      AND sess.session_date::date <= '2026-09-30'::date
  `);
  console.log('Found sessions between 2026-09-01 and 2026-09-30:', q2Sessions.rows.length, q2Sessions.rows);

  await client.end();
}

main().catch(console.error);
