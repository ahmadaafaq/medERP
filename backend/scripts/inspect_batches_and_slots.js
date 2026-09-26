const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const slotRes = await client.query(`SELECT * FROM "${schema}".timetable_slots WHERE day_of_week = 3 AND course_cd = '1'`);
  console.log('Slots for Wed course 1:', slotRes.rows);

  if (slotRes.rows[0]?.subject_id) {
    const sub = await client.query(`SELECT * FROM "${schema}".subjects WHERE id = $1`, [slotRes.rows[0].subject_id]);
    console.log('Linked Subject:', sub.rows[0]);
  }

  const allSubjects = await client.query(`SELECT id, code, name, sub_addinfo, type FROM "${schema}".subjects WHERE name ILIKE '%COA%' OR name ILIKE '%Computer Org%' OR code ILIKE '%COA%' OR sub_addinfo ILIKE '%COA%' OR sub_addinfo ILIKE '%KCS%'`);
  console.log('\nMatching COA Subjects:');
  console.table(allSubjects.rows);

  await client.end();
}

run().catch(console.error);
