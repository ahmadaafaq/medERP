const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  const schema = 'tenant_srms-cet-bareilly';

  console.log('=== FACULTY RECORD ===');
  const fac = await client.query(`SELECT * FROM "${schema}".faculty WHERE name ILIKE '%shorab%'`);
  console.table(fac.rows);

  console.log('\n=== TIMETABLE SLOTS RAW ===');
  const slots = await client.query(`SELECT * FROM "${schema}".timetable_slots WHERE faculty_id = $1`, [fac.rows[0].id]);
  console.table(slots.rows);

  console.log('\n=== SUBJECTS ===');
  const subjects = await client.query(`SELECT * FROM "${schema}".subjects`);
  console.table(subjects.rows);

  console.log('\n=== BATCHES ===');
  const batches = await client.query(`SELECT * FROM "${schema}".batches`);
  console.table(batches.rows);

  console.log('\n=== DEPARTMENTS ===');
  const depts = await client.query(`SELECT * FROM "${schema}".departments`);
  console.table(depts.rows);

  console.log('\n=== COURSES ===');
  try {
    const courses = await client.query(`SELECT * FROM "${schema}".courses`);
    console.table(courses.rows);
  } catch(e) {}

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
