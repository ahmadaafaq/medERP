const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function updateOwnerPassword() {
  const hash = await bcrypt.hash('nornx@med', 10);
  await pool.query(`
    UPDATE public.super_admins
    SET password_hash = $1
    WHERE username = 'nornx' OR email = 'nornx@mederp.app'
  `, [hash]);
  console.log('✅ Updated super_admins password hash for nornx@med');
  await pool.end();
}

updateOwnerPassword();
