/**
 * Diagnose: Priya absent on 3-Aug, Preeti absent on 6-Aug in Physiology
 * Check raw DB records to find the truth
 */
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'unicampus_erp',
  user: 'postgres',
  password: 'postgres',
});

const SCHEMA = 'tenant_srms-ims';

async function run() {
  await client.connect();
  await client.query(`SET search_path TO "${SCHEMA}"`);

  // Step 1: Find Physiology subject ID
  const subjectRes = await client.query(`
    SELECT id, subject_code, subject_name
    FROM subjects
    WHERE subject_code = 'PY' OR UPPER(subject_name) LIKE '%PHYSIOLOGY%'
    LIMIT 5
  `);
  console.log('\n=== PHYSIOLOGY SUBJECT ===');
  console.table(subjectRes.rows);
  const physioId = subjectRes.rows[0]?.id;

  // Step 2: Find Priya and Preeti student IDs
  const studRes = await client.query(`
    SELECT id, roll_number, name
    FROM students
    WHERE name ILIKE '%priya%' OR name ILIKE '%preeti%'
    ORDER BY name
  `);
  console.log('\n=== TARGET STUDENTS ===');
  console.table(studRes.rows);

  const priyaId = studRes.rows.find(r => r.name.toLowerCase().includes('priya'))?.id;
  const preetiId = studRes.rows.find(r => r.name.toLowerCase().includes('preeti'))?.id;

  // Step 3: ALL Physiology attendance sessions that exist
  const sessRes = await client.query(`
    SELECT id, session_date::date as session_date, subject_id, lecture_type, 
           faculty_id, batch_id
    FROM attendance_sessions
    WHERE subject_id = $1
    ORDER BY session_date
  `, [physioId]);
  console.log('\n=== ALL PHYSIOLOGY SESSIONS IN DB ===');
  console.table(sessRes.rows);

  // Step 4: Raw attendance records for PRIYA in Physiology
  if (priyaId) {
    const priyaRes = await client.query(`
      SELECT 
        ar.id as record_id,
        s.session_date::date as session_date,
        s.lecture_type,
        ar.status,
        ar.student_id
      FROM attendance_records ar
      JOIN attendance_sessions s ON s.id = ar.session_id
      WHERE ar.student_id = $1
        AND s.subject_id = $2
      ORDER BY s.session_date
    `, [priyaId, physioId]);
    console.log('\n=== PRIYA M NAIR - PHYSIOLOGY RAW RECORDS ===');
    console.table(priyaRes.rows);

    const priyaPresent = priyaRes.rows.filter(r => r.status === 'present').length;
    const priyaAbsent = priyaRes.rows.filter(r => r.status === 'absent').length;
    console.log(`Priya: Present=${priyaPresent}, Absent=${priyaAbsent}, Total Records=${priyaRes.rows.length}`);
  }

  // Step 5: Raw attendance records for PREETI in Physiology
  if (preetiId) {
    const preetiRes = await client.query(`
      SELECT 
        ar.id as record_id,
        s.session_date::date as session_date,
        s.lecture_type,
        ar.status,
        ar.student_id
      FROM attendance_records ar
      JOIN attendance_sessions s ON s.id = ar.session_id
      WHERE ar.student_id = $1
        AND s.subject_id = $2
      ORDER BY s.session_date
    `, [preetiId, physioId]);
    console.log('\n=== PREETI AGARWAL - PHYSIOLOGY RAW RECORDS ===');
    console.table(preetiRes.rows);

    const preetiPresent = preetiRes.rows.filter(r => r.status === 'present').length;
    const preetiAbsent = preetiRes.rows.filter(r => r.status === 'absent').length;
    console.log(`Preeti: Present=${preetiPresent}, Absent=${preetiAbsent}, Total Records=${preetiRes.rows.length}`);
  }

  // Step 6: Check per date, are there DUPLICATE sessions (same date, same subject)?
  const dupRes = await client.query(`
    SELECT 
      session_date::date as date,
      subject_id,
      COUNT(*) as session_count,
      array_agg(id::text) as session_ids,
      array_agg(lecture_type) as lecture_types
    FROM attendance_sessions
    WHERE subject_id = $1
    GROUP BY session_date::date, subject_id
    HAVING COUNT(*) > 1
    ORDER BY session_date::date
  `, [physioId]);
  console.log('\n=== DUPLICATE SESSIONS ON SAME DATE (Physiology) ===');
  if (dupRes.rows.length === 0) {
    console.log('No duplicates found — 1 session per date');
  } else {
    console.table(dupRes.rows);
  }

  // Step 7: What does the REPORT QUERY actually compute for Priya?
  // Use same logic as attendance.service.ts getAttendanceReport
  const reportCheck = await client.query(`
    SELECT 
      st.roll_number,
      st.name,
      COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN s.session_date::date END) as present_days,
      COUNT(DISTINCT s.session_date::date) as total_session_days,
      ROUND(100.0 * COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN s.session_date::date END) 
        / NULLIF(COUNT(DISTINCT s.session_date::date), 0), 2) as pct
    FROM students st
    JOIN attendance_records ar ON ar.student_id = st.id
    JOIN attendance_sessions s ON s.id = ar.session_id
    WHERE s.subject_id = $1
      AND st.id IN ($2, $3)
    GROUP BY st.id, st.roll_number, st.name
    ORDER BY st.roll_number
  `, [physioId, priyaId, preetiId]);
  console.log('\n=== REPORT QUERY RESULT for Priya + Preeti (Physiology) ===');
  console.table(reportCheck.rows);

  await client.end();
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
