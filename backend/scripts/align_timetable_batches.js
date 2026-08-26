const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function alignBatches() {
  const schema = 'tenant_srms-cet-bareilly';
  console.log(`Aligning timetable_slots batch_id with correct course_cd + batch_cd in ${schema}...`);

  // Update timetable slots where batch_cd is numeric to match correct batch row in batches table
  const updateRes = await pool.query(`
    UPDATE "${schema}".timetable_slots ts
    SET batch_id = b.id
    FROM "${schema}".batches b
    WHERE ts.batch_cd = b.batch_cd
      AND (ts.course_cd = b.course_cd OR ts.course_cd IS NULL)
  `);

  console.log(`Updated ${updateRes.rowCount} slot(s) with precise matching batch_id.`);

  // Also verify today's schedule again
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

  console.log('\n--- VERIFIED TODAY (WEDNESDAY) SCHEDULE AFTER ALIGNMENT ---');
  todayRes.rows.forEach((r, idx) => {
    console.log(`[Slot #${idx + 1}]`);
    console.log(`  🕒 Time: ${r.start_time?.slice(0, 5)} - ${r.end_time?.slice(0, 5)}`);
    console.log(`  👨‍🏫 Faculty: ${r.faculty_name} (${r.faculty_empid})`);
    console.log(`  📚 Subject: [${r.subject_code}] ${r.subject_name}`);
    console.log(`  🎓 Batch: "${r.batch_name}" (Year: ${r.batch_year}, Numeric Code: ${r.batch_numeric_cd})`);
    console.log(`  📖 Topic: ${r.topic}`);
    console.log(`  🎯 Sub Topics: ${r.sub_topics}`);
  });

  await pool.end();
}

alignBatches().catch(e => {
  console.error(e);
  process.exit(1);
});
