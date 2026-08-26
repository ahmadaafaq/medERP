const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectStudentsTable() {
  const schema = 'tenant_srms-cet-bareilly';
  const stdCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'students'
  `, [schema]);
  console.log('students columns:', stdCols.rows.map(c => `${c.column_name} (${c.data_type})`));

  const stdSample = await pool.query(`SELECT * FROM "${schema}".students LIMIT 2`);
  console.log('students sample row:', stdSample.rows[0]);

  const repos = await pool.query(`
    SELECT r.*, s.name as student_name, s.rollno FROM "${schema}".repositories r LEFT JOIN "${schema}".students s ON s.id = r.student_id
  `);
  console.log('\nAll repositories (' + repos.rows.length + '):', repos.rows);

  const results = await pool.query(`
    SELECT sr.*, s.name as student_name, s.rollno, ep.title as paper_title, ep.max_marks 
    FROM "${schema}".student_results sr 
    LEFT JOIN "${schema}".students s ON s.id = sr.student_id
    LEFT JOIN "${schema}".examination_papers ep ON ep.id = sr.paper_id
  `);
  console.log('\nAll student results (' + results.rows.length + '):', results.rows);

  await pool.end();
}

inspectStudentsTable().catch(console.error);
