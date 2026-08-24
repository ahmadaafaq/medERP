const { Client } = require('pg');
const bcrypt = require('bcrypt');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function run() {
  await c.connect();

  const hash = await bcrypt.hash('admin@123', 10);

  // Check if admin user exists
  const existing = await c.query('SELECT id, email, role FROM "tenant_srms-cet-bareilly".users WHERE email = $1', ['admin']);

  if (existing.rows.length === 0) {
    await c.query(
      `INSERT INTO "tenant_srms-cet-bareilly".users (
        id, email, password_hash, role, is_active, must_change_password, created_at, updated_at
      ) VALUES (gen_random_uuid(), 'admin', $1, 'ADMIN', true, false, NOW(), NOW())`,
      [hash]
    );
    console.log('CREATED USER admin with role ADMIN and password admin@123');
  } else {
    await c.query(
      `UPDATE "tenant_srms-cet-bareilly".users SET password_hash = $1, is_active = true, role = 'ADMIN', updated_at = NOW() WHERE email = 'admin'`,
      [hash]
    );
    console.log('UPDATED USER admin to password admin@123');
  }

  // Also check if admin@srms.ac.in exists
  const existingEmail = await c.query('SELECT id, email, role FROM "tenant_srms-cet-bareilly".users WHERE email = $1', ['admin@srms.ac.in']);
  if (existingEmail.rows.length === 0) {
    await c.query(
      `INSERT INTO "tenant_srms-cet-bareilly".users (
        id, email, password_hash, role, is_active, must_change_password, created_at, updated_at
      ) VALUES (gen_random_uuid(), 'admin@srms.ac.in', $1, 'ADMIN', true, false, NOW(), NOW())`,
      [hash]
    );
    console.log('CREATED USER admin@srms.ac.in with role ADMIN and password admin@123');
  } else {
    await c.query(
      `UPDATE "tenant_srms-cet-bareilly".users SET password_hash = $1, is_active = true, role = 'ADMIN', updated_at = NOW() WHERE email = 'admin@srms.ac.in'`,
      [hash]
    );
    console.log('UPDATED USER admin@srms.ac.in to password admin@123');
  }

  const check = await c.query('SELECT id, email, role, is_active FROM "tenant_srms-cet-bareilly".users WHERE email IN (\'admin\', \'admin@srms.ac.in\')');
  console.log('VERIFIED ADMIN ACCOUNTS:', check.rows);

  await c.end();
}

run().catch(console.error);
