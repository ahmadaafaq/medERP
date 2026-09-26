const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function run() {
  await client.connect();
  const slug = 'tenant_srms-cet-bareilly';
  await client.query(`SET search_path TO "${slug}", public`);

  const bcaSlots = await client.query(`
    SELECT id, course_cd, branch_cd, batch_cd, semester, section, description, start_time, end_time, day_of_week 
    FROM timetable_slots 
    WHERE course_cd = '13'
  `);
  console.log('BCA timetable slots:', bcaSlots.rows);

  const btechSlots = await client.query(`
    SELECT id, course_cd, branch_cd, batch_cd, semester, section, description, start_time, end_time, day_of_week 
    FROM timetable_slots 
    WHERE course_cd = '1'
  `);
  console.log('BTech timetable slots:', btechSlots.rows);

  const allBatches = await client.query(`
    SELECT id, batch_cd, name, code, year, course_cd 
    FROM batches 
    WHERE course_cd IN ('1', '13') OR course_cd IS NULL
    ORDER BY course_cd, year DESC
  `);
  console.log('Batches for Course 1 & 13 in DB:', allBatches.rows);

  await client.end();
}

run().catch(console.error);
