const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectTablesDetailed() {
  const schema = 'tenant_srms-cet-bareilly';

  console.log('--- 1. REPOSITORIES ---');
  const repoCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'repositories'
  `, [schema]);
  console.log('repositories columns:', repoCols.rows.map(c => `${c.column_name} (${c.data_type})`));
  const repoRows = await pool.query(`SELECT * FROM "${schema}".repositories LIMIT 5`);
  console.log('repositories sample count:', repoRows.rows.length, repoRows.rows);

  console.log('\n--- 2. STUDENT RESULTS ---');
  const resCols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'student_results'
  `, [schema]);
  console.log('student_results columns:', resCols.rows.map(c => `${c.column_name} (${c.data_type})`));
  const resultRows = await pool.query(`SELECT * FROM "${schema}".student_results LIMIT 5`);
  console.log('student_results sample count:', resultRows.rows.length, resultRows.rows);

  console.log('\n--- 3. ATTENDANCE SESSIONS & RECORDS ---');
  const sessRows = await pool.query(`SELECT * FROM "${schema}".attendance_sessions LIMIT 5`);
  console.log('attendance_sessions count:', sessRows.rows.length, sessRows.rows);

  console.log('\n--- 4. STUDENTS SAMPLE ---');
  const stds = await pool.query(`
    SELECT id, name, roll_no, registration_no, course_cd, batch_cd, is_incubated, photo_url, attendance_percentage
    FROM "${schema}".students 
    LIMIT 5
  `);
  console.log('students sample:', stds.rows);

  await pool.end();
}

inspectTablesDetailed().catch(console.error);
