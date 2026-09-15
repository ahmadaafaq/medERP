require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function check() {
  const schema = 'tenant_srms-cet-bareilly';
  
  const apps = await pool.query(`SELECT id, program_id, student_id, student_reg_no, student_name, status, payment_status, completed_at, external_cert_url, cert_source FROM "${schema}".internship_applications`);
  console.log('Applications:', apps.rows);

  const certs = await pool.query(`SELECT id, application_id, certificate_no, student_name, student_reg_no, applicant_name, internship_name, issued_date FROM "${schema}".certificates`);
  console.log('Certificates:', certs.rows);

  await pool.end();
}

check().catch(console.error);

