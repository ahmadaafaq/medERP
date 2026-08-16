const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'unicampus_erp',
  user: 'unicampus',
  password: 'unicampus_secret',
});

async function main() {
  await client.connect();
  const slug = 'tenant_srms-cet-bareilly';

  console.log('=== student_results rows ===');
  const sr = await client.query(`SELECT id, student_id, paper_id, eval_status, marks_obtained FROM "${slug}".student_results`);
  console.table(sr.rows);

  console.log('=== examination_papers rows ===');
  const ep = await client.query(`SELECT id, code, name FROM "${slug}".examination_papers`);
  console.table(ep.rows);

  console.log('=== students rows ===');
  const s = await client.query(`SELECT id, name, roll_no FROM "${slug}".students WHERE id = $1`, [sr.rows[0]?.student_id]);
  console.table(s.rows);

  await client.end();
}

main().catch(console.error);
