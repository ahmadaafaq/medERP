require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function test() {
  const schema = 'tenant_srms-cet-bareilly';
  const u = await pool.query(`SELECT id, email, role FROM "${schema}".users WHERE email ILIKE '%aafreen%' OR id = 'ab9afd97-f7e5-486b-8bec-d8d071d06c69'`);
  console.log('User:', u.rows);

  const s2 = await pool.query(`SELECT id, user_id, registration_no, rollno, name FROM "${schema}".students WHERE registration_no = '2025107990' OR name ILIKE '%aafreen%'`);
  console.log('Student by reg_no / name:', s2.rows);

  const allApps = await pool.query(`SELECT id, student_id, student_reg_no, student_name, status, program_id FROM "${schema}".internship_applications`);
  console.log('All Applications:', allApps.rows);

  await pool.end();
}

test().catch(console.error);
