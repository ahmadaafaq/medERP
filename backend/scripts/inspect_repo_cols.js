const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectRepoCols() {
  const schema = 'tenant_srms-cet-bareilly';
  const repoCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'repositories'
  `, [schema]);
  console.log('repositories columns:', repoCols.rows.map(c => `${c.column_name} (${c.data_type})`));

  const sample = await pool.query(`SELECT * FROM "${schema}".repositories LIMIT 3`);
  console.log('repositories sample:', sample.rows);

  const resSample = await pool.query(`
    SELECT * FROM "${schema}".student_results LIMIT 3
  `);
  console.log('student_results sample:', resSample.rows);

  await pool.end();
}

inspectRepoCols().catch(console.error);
