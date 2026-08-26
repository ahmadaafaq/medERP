const { Client } = require('pg');
require('dotenv').config({ path: 'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  console.log('--- srms_timetable_events ---');
  const r1 = await client.query(`SELECT id, title, description, start_time, end_time, start_str, end_str, day_of_week, linkcd, empid, colg_cd, course_cd, branch_cd, batch_cd, sem_cd, camera_link FROM "${schema}".srms_timetable_events`);
  console.log(JSON.stringify(r1.rows, null, 2));

  console.log('--- timetable_slots ---');
  const r2 = await client.query(`SELECT * FROM "${schema}".timetable_slots`);
  console.log(JSON.stringify(r2.rows, null, 2));

  console.log('--- attendance_sessions ---');
  try {
    const r3 = await client.query(`SELECT id, start_time, end_time, topic, course_cd, semester, section FROM "${schema}".attendance_sessions`);
    console.log(JSON.stringify(r3.rows, null, 2));
  } catch (e) {
    console.log('No attendance_sessions:', e.message);
  }

  await client.end();
}

run().catch(console.error);
