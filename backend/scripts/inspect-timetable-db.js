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

  console.log('=== FACULTY LIST ===');
  const fac = await client.query(`SELECT id, name, emp_id, department_id FROM "tenant_srms-ims".faculty`);
  console.table(fac.rows);

  console.log('=== SUBJECTS LIST ===');
  const sub = await client.query(`SELECT id, name, code, department_id FROM "tenant_srms-ims".subjects`);
  console.table(sub.rows);

  console.log('=== ALL TIMETABLE SLOTS RAW ===');
  const slots = await client.query(`SELECT * FROM "tenant_srms-ims".timetable_slots`);
  console.table(slots.rows);

  console.log('=== ATTENDANCE SESSIONS RAW ===');
  const att = await client.query(`SELECT * FROM "tenant_srms-ims".attendance_sessions`);
  console.table(att.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
