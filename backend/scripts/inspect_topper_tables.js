const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectDbTables() {
  const schema = 'tenant_srms-cet-bareilly';

  console.log('--- 1. TABLES IN TENANT SCHEMA ---');
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name
  `, [schema]);
  console.log(tables.rows.map(t => t.table_name));

  console.log('\n--- 2. STUDENT COUNT ---');
  const stdCount = await pool.query(`SELECT count(*) FROM "${schema}".students`);
  console.log('Total students:', stdCount.rows[0].count);

  console.log('\n--- 3. ATTENDANCE RECORDS ---');
  try {
    const attCount = await pool.query(`SELECT count(*) FROM "${schema}".attendance_records`);
    console.log('attendance_records count:', attCount.rows[0].count);
    const sampleAtt = await pool.query(`SELECT * FROM "${schema}".attendance_records LIMIT 3`);
    console.log('Sample attendance_records:', sampleAtt.rows);
  } catch (e) {
    console.log('attendance_records error:', e.message);
  }

  console.log('\n--- 4. REPOSITORY / PROJECTS ---');
  try {
    const repos = await pool.query(`SELECT count(*) FROM "${schema}".student_repositories`);
    console.log('student_repositories count:', repos.rows[0].count);
    const sampleRepo = await pool.query(`SELECT * FROM "${schema}".student_repositories LIMIT 3`);
    console.log('Sample repositories:', sampleRepo.rows);
  } catch (e) {
    console.log('repositories error:', e.message);
  }

  console.log('\n--- 5. ASSESSMENTS / THEORY MARKS ---');
  try {
    const assess = await pool.query(`SELECT count(*) FROM "${schema}".assessment_results`);
    console.log('assessment_results count:', assess.rows[0].count);
  } catch (e) {
    console.log('assessment_results error:', e.message);
  }

  try {
    const examMarks = await pool.query(`SELECT count(*) FROM "${schema}".student_assessment_results`);
    console.log('student_assessment_results count:', examMarks.rows[0].count);
  } catch (e) {
    console.log('student_assessment_results error:', e.message);
  }

  try {
    const evalRes = await pool.query(`SELECT count(*) FROM "${schema}".repository_evaluations`);
    console.log('repository_evaluations count:', evalRes.rows[0].count);
  } catch (e) {
    console.log('repository_evaluations error:', e.message);
  }

  try {
    const chatAct = await pool.query(`SELECT count(*) FROM "${schema}".chat_messages`);
    console.log('chat_messages count:', chatAct.rows[0].count);
  } catch (e) {
    console.log('chat_messages error:', e.message);
  }

  await pool.end();
}

inspectDbTables().catch(console.error);
