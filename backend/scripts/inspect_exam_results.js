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

  const examCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'examination_papers'
  `, [schema]);
  console.log('examination_papers columns:', examCols.rows.map(c => `${c.column_name} (${c.data_type})`));

  const papers = await pool.query(`SELECT * FROM "${schema}".examination_papers LIMIT 5`);
  console.log('examination_papers sample:', papers.rows);

  const results = await pool.query(`
    SELECT sr.*, s.name as student_name, s.rollno 
    FROM "${schema}".student_results sr 
    LEFT JOIN "${schema}".students s ON s.id = sr.student_id
  `);
  console.log('student_results rows:', results.rows);

  await pool.end();
}

run().catch(console.error);
