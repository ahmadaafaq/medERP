const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  try {
    const facs = await pool.query(`SELECT id, emp_id, name, department_id FROM "tenant_srms-cet-bareilly".faculty WHERE name ILIKE '%Vinay%'`);
    console.log('FACULTY VINAY:', JSON.stringify(facs.rows, null, 2));

    const allSlots = await pool.query(`SELECT id, day_of_week, start_time, end_time, course_cd, branch_cd, batch_cd, semester, section, topic, faculty_id, description FROM "tenant_srms-cet-bareilly".timetable_slots ORDER BY day_of_week, start_time`);
    console.log('ALL SLOTS (' + allSlots.rows.length + '):', JSON.stringify(allSlots.rows, null, 2));

    const events = await pool.query(`SELECT id, title, start_time, end_time, start_str, end_str, day_of_week, empid, course_cd, branch_cd, batch_cd, sem_cd, txt_sec, description FROM "tenant_srms-cet-bareilly".srms_timetable_events ORDER BY day_of_week, start_time`);
    console.log('ALL EVENTS (' + events.rows.length + '):', JSON.stringify(events.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await pool.end();
  }
}

run();
