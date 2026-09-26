const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  console.log(`================================================================`);
  console.log(`  POSTGRESQL TIMETABLE STORED DATA — Schema: ${schema}`);
  console.log(`================================================================\n`);

  // 1. Total slot count
  const countRes = await client.query(`SELECT count(*) AS total_slots FROM "${schema}".timetable_slots`);
  console.log(`📊 TOTAL TIMETABLE SLOTS STORED: ${countRes.rows[0].total_slots}\n`);

  // 2. Summary of courses, batches, subjects in timetable
  const summaryRes = await client.query(`
    SELECT 
      course_cd,
      COUNT(*) as slot_count,
      COUNT(DISTINCT batch_id) as batches,
      COUNT(DISTINCT subject_id) as subjects,
      COUNT(DISTINCT faculty_id) as faculties
    FROM "${schema}".timetable_slots
    GROUP BY course_cd
    ORDER BY slot_count DESC
  `);
  console.log(`📋 SLOTS PER COURSE:`);
  console.table(summaryRes.rows);

  // 3. Full SELECT query with joins (matching TimetableService)
  const fullQuery = `
    SELECT 
      ts.id,
      ts.day_of_week,
      ts.start_time,
      ts.end_time,
      ts.room,
      ts.slot_type,
      ts.course_cd,
      ts.branch_cd,
      ts.batch_cd,
      ts.semester,
      ts.section,
      COALESCE(s.code, '') AS subject_cd,
      COALESCE(s.sub_addinfo, '') AS subject_paper_code,
      COALESCE(s.name, ts.topic, '') AS subject_name,
      COALESCE(f.name, '') AS faculty_name,
      f.emp_id AS faculty_code,
      COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, ts.batch_cd, b.code) AS batch_name,
      COALESCE(ts.topic, s.name, '') AS topic,
      ts.sub_topics,
      (
        SELECT COUNT(*) 
        FROM "${schema}".attendance_sessions sess 
        WHERE sess.timetable_slot_id = ts.id AND sess.is_cancelled = false
      ) AS attendance_sessions_count
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".faculty f ON f.id::text = ts.faculty_id::text
    LEFT JOIN "${schema}".subjects s ON s.id::text = ts.subject_id::text
    LEFT JOIN "${schema}".batches b ON (CASE WHEN ts.batch_id IS NOT NULL THEN b.id::text = ts.batch_id::text ELSE (b.batch_cd = ts.batch_cd AND (b.course_cd = ts.course_cd OR ts.course_cd IS NULL)) END)
    ORDER BY ts.day_of_week ASC, ts.start_time ASC
  `;

  const slotsRes = await client.query(fullQuery);
  console.log(`\n📌 STORED TIMETABLE SLOTS (All ${slotsRes.rows.length} records):`);
  console.table(slotsRes.rows.map((r, i) => ({
    '#': i + 1,
    ID: r.id.substring(0, 8),
    Day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][r.day_of_week - 1] || r.day_of_week,
    Time: `${r.start_time?.substring(0, 5)} - ${r.end_time?.substring(0, 5)}`,
    SubjectCode: r.subject_cd || r.subject_paper_code,
    Subject: (r.subject_name || '').substring(0, 26),
    Faculty: (r.faculty_name || '').substring(0, 20),
    Batch: r.batch_name || r.batch_cd,
    Course: r.course_cd,
    Sem: r.semester,
    Sec: r.section,
    AttMarked: r.attendance_sessions_count > 0 ? 'YES' : 'NO'
  })));

  // 4. Stored attendance sessions linked to timetable
  console.log(`\n📌 STORED ATTENDANCE SESSIONS LINKED TO TIMETABLE SLOTS:`);
  const sessRes = await client.query(`
    SELECT 
      sess.id,
      sess.session_date,
      sess.session_type,
      sess.topic_covered,
      sess.timetable_slot_id,
      sub.code AS subject_cd,
      sub.name AS subject_name,
      (SELECT COUNT(*) FROM "${schema}".attendance_records rec WHERE rec.session_id = sess.id) AS student_records
    FROM "${schema}".attendance_sessions sess
    LEFT JOIN "${schema}".subjects sub ON sub.id = sess.subject_id
    WHERE sess.is_cancelled = false
    ORDER BY sess.created_at DESC
    LIMIT 5
  `);
  console.table(sessRes.rows.map(s => ({
    SessionID: s.id.substring(0, 8) + '...',
    Date: typeof s.session_date === 'string' ? s.session_date : new Date(s.session_date).toISOString().split('T')[0],
    Type: s.session_type,
    SubjectCode: s.subject_cd,
    Subject: (s.subject_name || '').substring(0, 20),
    Topic: (s.topic_covered || '').substring(0, 25),
    SlotLinked: s.timetable_slot_id ? 'YES' : 'NO',
    StudentsMarked: s.student_records
  })));

  await client.end();
}

run().catch(console.error);
