const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function checkSubjects() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  
  const subjects = await client.query(`
    SELECT id, code, name, course_cd, semester, type 
    FROM "${schema}".subjects 
    ORDER BY course_cd, name
  `);
  console.log(`Subjects in ${schema} (${subjects.rows.length}):`);
  for (const s of subjects.rows) {
    console.log(`  [${s.code}] ${s.name} (id: ${s.id}, course: ${s.course_cd}, sem: ${s.semester}, type: ${s.type})`);
  }

  await client.end();
}

checkSubjects().catch(console.error);
