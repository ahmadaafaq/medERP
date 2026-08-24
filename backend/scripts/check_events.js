const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function check() {
  const res = await pool.query('SELECT id, title, start_time, end_time, empid, colg_cd, course_cd, branch_cd, batch_cd FROM "tenant_srms-cet-bareilly".srms_timetable_events ORDER BY created_at DESC LIMIT 10');
  console.log('EVENT COUNT:', res.rows.length);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

check().catch(console.error);
