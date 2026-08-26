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
  const res = await pool.query(`
    SELECT * FROM "${schema}".timetable_slots WHERE day_of_week = 2
  `);
  console.log('TUESDAY SLOT IN DB:', JSON.stringify(res.rows, null, 2));

  const subRes = await pool.query(`
    SELECT id, code, name, type, course_cd, branch_cd FROM "${schema}".subjects WHERE name ILIKE '%Web%' OR code ILIKE '%88539%' OR code ILIKE '%885%'
  `);
  console.log('SUBJECTS IN DB:', JSON.stringify(subRes.rows, null, 2));

  await pool.end();
}

run().catch(console.error);
