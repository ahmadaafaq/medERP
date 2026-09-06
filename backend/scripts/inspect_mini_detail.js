const { Client } = require('pg');
require('dotenv').config({ path: 'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function inspectRow() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const rows = await client.query(`
    SELECT * FROM "${schema}".logbook_mini_projects
  `);
  console.log('All columns of logbook_mini_projects:');
  console.log(rows.rows);

  // Check logbook_weekly_logs columns
  const wlCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = '${schema}' AND table_name = 'logbook_weekly_logs'
  `);
  console.log('\nlogbook_weekly_logs cols:', wlCols.rows.map(r => r.column_name));

  const wlRows = await client.query(`
    SELECT wl.*, st.name as student_name, st.rollno
    FROM "${schema}".logbook_weekly_logs wl
    LEFT JOIN "${schema}".students st ON st.id::text = wl.student_id::text
  `);
  console.log('\nlogbook_weekly_logs rows:', wlRows.rows);

  // Check repositories table
  const repos = await client.query(`
    SELECT r.id, r.student_reg_no, r.student_name, r.title, r.topic, r.category, r.status, r.score, r.grade
    FROM "${schema}".repositories r
    WHERE r.category ILIKE '%mini%' OR r.topic ILIKE '%mini%' OR r.title ILIKE '%HRMS%' OR r.title ILIKE '%E-Commerce%'
  `);
  console.log('\nRepositories matching mini project / HRMS / E-Commerce:', repos.rows);

  await client.end();
}

inspectRow().catch(console.error);
