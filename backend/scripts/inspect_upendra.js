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
  const slotCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name = 'timetable_slots'
  `);
  console.log('timetable_slots columns:', slotCols.rows.map(r => r.column_name));

  const slots = await client.query(`
    SELECT id, day_of_week, start_time, end_time, course_cd, batch_cd, semester, section, faculty_id, description, room, subject_id, batch_id
    FROM "tenant_srms-cet-bareilly".timetable_slots 
    WHERE description ILIKE '%upendra%' OR faculty_id = '2d1daa77-8597-47f0-9af5-e90489cee9f1'
  `);
  console.log('Upendra slots in DB:', slots.rows);

  const studentCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name = 'students'
  `);
  console.log('students columns:', studentCols.rows.map(r => r.column_name));

  const bcaStudents = await client.query(`
    SELECT id, name, rollno, registration_no, course_cd 
    FROM "tenant_srms-cet-bareilly".students 
    WHERE course_cd = '13' 
    LIMIT 5
  `);
  console.log('BCA students sample:', bcaStudents.rows);

  const batchCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name = 'batches'
  `);
  console.log('batches columns:', batchCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  const batches = await client.query(`
    SELECT id, name, batch_cd, course_cd, year 
    FROM "tenant_srms-cet-bareilly".batches 
    LIMIT 10
  `);
  console.log('batches sample:', batches.rows);

  await client.end();
}

run().catch(console.error);
