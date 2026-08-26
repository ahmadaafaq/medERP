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
  console.log('Cleaning unlinked duplicate timetable_slots without faculty_id...');
  
  const delRes = await client.query(`
    DELETE FROM "${schema}".timetable_slots 
    WHERE faculty_id IS NULL AND subject_id IS NULL
  `);
  console.log(`Deleted ${delRes.rowCount} empty duplicate slots.`);

  const r2 = await client.query(`SELECT id, day_of_week, start_time, end_time, room, topic, subject_name, subject_code FROM "${schema}".timetable_slots`);
  console.log('Remaining timetable_slots:', r2.rows);

  await client.end();
}

run().catch(console.error);
