const { Client } = require('pg');

async function testFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    const schema = 'tenant_srms-ims';
    const batchId = 'a67ccceb-8002-4864-a518-84e3eadf0836'; // 2025-MBBS

    console.log(`=== TESTING TIMETABLE-BASED MATRIX DEDUPLICATION IN ${schema} ===`);

    // 1. Total Conducted Sessions per Subject (Deduplicated by Date & Validated against Timetable Day)
    const totRes = await client.query(`
      SELECT s.subject_id, sub.code as subject_code, sub.name as subject_name,
             COUNT(DISTINCT s.session_date::date)::int AS total_conducted
      FROM "${schema}".attendance_sessions s
      JOIN "${schema}".subjects sub ON sub.id = s.subject_id
      WHERE (s.batch_id::text = $1 OR s.batch_id IN (SELECT id FROM "${schema}".batches WHERE code ILIKE '2025%'))
        AND s.is_cancelled = false
        AND s.subject_id IS NOT NULL
        AND s.session_date::date <= CURRENT_DATE
        AND EXISTS (
          SELECT 1 FROM "${schema}".timetable_slots ts
          WHERE (ts.subject_id = s.subject_id OR ts.id = s.timetable_slot_id)
            AND ts.day_of_week = EXTRACT(DOW FROM s.session_date)
        )
      GROUP BY s.subject_id, sub.code, sub.name
    `, [batchId]);

    console.log('--- SUBJECT TOTAL CONDUCTED LECTURES ---');
    console.table(totRes.rows);

    // 2. Student Attendance Matrix per Subject
    const stRes = await client.query(`
      SELECT
         st.id AS student_id,
         COALESCE(st.registration_no, st.rollno, '—') AS rollno,
         COALESCE(st.name, 'Student') AS name,
         s.subject_id,
         sub.code AS subject_code,
         COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.session_date::date END)::int AS present_count
      FROM "${schema}".students st
      LEFT JOIN "${schema}".student_admissions sa ON sa.student_id = st.id
      LEFT JOIN "${schema}".attendance_sessions s ON (s.batch_id::text = $1 OR s.batch_id IN (SELECT id FROM "${schema}".batches WHERE code ILIKE '2025%'))
        AND s.is_cancelled = false
        AND s.subject_id IS NOT NULL
        AND s.session_date::date <= CURRENT_DATE
        AND EXISTS (
          SELECT 1 FROM "${schema}".timetable_slots ts
          WHERE (ts.subject_id = s.subject_id OR ts.id = s.timetable_slot_id)
            AND ts.day_of_week = EXTRACT(DOW FROM s.session_date)
        )
      LEFT JOIN "${schema}".attendance_records ar ON ar.session_id = s.id AND ar.student_id = st.id
      LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
      WHERE (st.batch_id::text = $1 OR sa.batch_id::text = $1)
      GROUP BY st.id, st.registration_no, st.rollno, st.name, s.subject_id, sub.code
      ORDER BY COALESCE(st.registration_no, st.rollno) ASC, st.name ASC
    `, [batchId]);

    console.log('--- STUDENT MATRIX BREAKDOWN ---');
    console.table(stRes.rows);

  } catch (err) {
    console.error('Error testing fix:', err);
  } finally {
    await client.end();
  }
}

testFix();
