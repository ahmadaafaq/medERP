const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  const schema = 'tenant_srms-cet-bareilly';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All Days'];

  console.log(`\n======================================================`);
  console.log(`ALL TIMETABLE SLOTS IN DATABASE (${schema})`);
  console.log(`======================================================\n`);

  const slots = await pool.query(`
    SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
           ts.topic, ts.sub_topics, ts.competency_codes, ts.course_cd, ts.branch_cd, ts.batch_cd,
           f.name AS faculty_name, f.emp_id AS faculty_empid,
           s.name AS subject_name, s.code AS subject_code,
           b.name AS batch_name, b.year AS batch_year, b.batch_cd AS batch_numeric_cd
    FROM "${schema}".timetable_slots ts
    LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
    LEFT JOIN "${schema}".subjects s ON s.id = ts.subject_id
    LEFT JOIN "${schema}".batches b ON b.id = ts.batch_id
    ORDER BY ts.day_of_week, ts.start_time
  `);

  console.log(`Total slots: ${slots.rows.length}`);
  slots.rows.forEach(r => {
    console.log(`- Day ${r.day_of_week} (${days[r.day_of_week] || 'N/A'}): [${r.start_time?.slice(0,5)}-${r.end_time?.slice(0,5)}] ${r.subject_name} (${r.slot_type}) | Faculty: ${r.faculty_name} | Batch: ${r.batch_name}`);
  });

  console.log(`\n======================================================`);
  console.log(`ALL SRMS TIMETABLE EVENTS IN DATABASE (${schema})`);
  console.log(`======================================================\n`);

  const events = await pool.query(`
    SELECT id, title, start_time, end_time, start_str, end_str, day_of_week, empid, course_cd, branch_cd, batch_cd, sem_cd, txt_sec, description, sub_topics
    FROM "${schema}".srms_timetable_events
    ORDER BY day_of_week, start_time
  `);

  console.log(`Total SRMS events: ${events.rows.length}`);
  events.rows.forEach(e => {
    console.log(`- Event Day ${e.day_of_week} (${days[e.day_of_week] || 'N/A'}): [${e.start_str || e.start_time}] ${e.title} | EmpID: ${e.empid} | Course: ${e.course_cd} | Batch: ${e.batch_cd}`);
  });

  await pool.end();
}

run().catch(console.error);
