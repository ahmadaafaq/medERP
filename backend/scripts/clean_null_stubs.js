const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function runClean() {
  const schema = 'tenant_srms-cet-bareilly';
  const cleanRes = await pool.query(`DELETE FROM "${schema}".timetable_slots WHERE faculty_id IS NULL AND subject_id IS NULL`);
  console.log(`Cleaned null stub slots: ${cleanRes.rowCount}`);

  const todayRes = await pool.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
           ts.topic, ts.sub_topics, ts.course_cd, ts.batch_cd,
           f.name AS faculty_name, f.emp_id AS faculty_empid,
           s.name AS subject_name, s.code AS subject_code,
           b.name AS batch_name, b.year AS batch_year, b.batch_cd AS batch_numeric_cd
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
    LEFT JOIN "${schema}".subjects s ON s.id = ts.subject_id
    LEFT JOIN "${schema}".batches b ON b.id = ts.batch_id
    WHERE ts.day_of_week = 3
    ORDER BY ts.start_time ASC
  `);

  console.log('\n==============================================');
  console.log('✅ FINAL SCHEDULE FOR TODAY (WEDNESDAY):');
  console.log('==============================================');
  todayRes.rows.forEach((r, idx) => {
    console.log(`Slot #${idx + 1}:`);
    console.log(`  Faculty: ${r.faculty_name} (Emp ID: ${r.faculty_empid})`);
    console.log(`  Time: ${r.start_time?.slice(0, 5)} - ${r.end_time?.slice(0, 5)} (${r.slot_type})`);
    console.log(`  Subject: [${r.subject_code}] ${r.subject_name}`);
    console.log(`  Batch: ${r.batch_name} (batch_cd: ${r.batch_numeric_cd}, year: ${r.batch_year})`);
    console.log(`  Room: ${r.room}`);
    console.log(`  Topic: ${r.topic}`);
    console.log(`  Sub Topics: ${r.sub_topics}`);
  });

  await pool.end();
}

runClean().catch(console.error);
