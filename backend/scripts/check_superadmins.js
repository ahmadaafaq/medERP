const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function checkSuperAdmins() {
  try {
    const res = await pool.query(`SELECT * FROM public.super_admins`);
    console.log('public.super_admins rows:', res.rows);
  } catch (e) {
    console.error('Error querying public.super_admins:', e.message);
  }
  await pool.end();
}

checkSuperAdmins();
