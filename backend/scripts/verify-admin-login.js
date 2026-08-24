const { Client } = require('pg');
const bcrypt = require('bcrypt');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

c.connect().then(async () => {
  // 1. Check all users in tenant_srms-cet-bareilly
  const users = await c.query('SELECT id, email, role, is_active, password_hash FROM "tenant_srms-cet-bareilly".users');
  console.log('USERS IN TENANT SRMS-CET-BAREILLY:');
  for (const u of users.rows) {
    const isMatchAdmin = await bcrypt.compare('admin@123', u.password_hash);
    const isMatchAdmin123 = await bcrypt.compare('admin', u.password_hash);
    console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Active: ${u.is_active} | Matches admin@123: ${isMatchAdmin} | Matches admin: ${isMatchAdmin123}`);
  }

  // 2. Check if admin user exists with email 'admin' or 'admin@srms.ac.in'
  const adminUser = users.rows.find((u) => u.email === 'admin' || u.role === 'ADMIN');
  if (!adminUser) {
    console.log('No admin user found! Creating admin / admin@123...');
    const hash = await bcrypt.hash('admin@123', 10);
    await c.query(
      `INSERT INTO "tenant_srms-cet-bareilly".users (
        id, email, password_hash, role, is_active, must_change_password, created_at, updated_at
      ) VALUES (gen_random_uuid(), 'admin', $1, 'ADMIN', true, false, NOW(), NOW())`,
      [hash]
    );
    console.log('Admin user created successfully!');
  } else {
    // Ensure password 'admin@123' works for username 'admin'
    const hash = await bcrypt.hash('admin@123', 10);
    await c.query(
      `UPDATE "tenant_srms-cet-bareilly".users SET password_hash = $1, is_active = true, updated_at = NOW() WHERE email = 'admin'`,
      [hash]
    );
    // Also if there is another admin account
    await c.query(
      `UPDATE "tenant_srms-cet-bareilly".users SET password_hash = $1, is_active = true, updated_at = NOW() WHERE role = 'ADMIN'`,
      [hash]
    );
    console.log('Updated admin passwords to admin@123 successfully!');
  }

  // 3. Verify firm status and license keys in public
  const firm = await c.query("SELECT id, title, slug, status FROM public.firms WHERE slug = 'srms-cet-bareilly'");
  console.log('FIRM IN PUBLIC.FIRMS:', firm.rows);

  const keys = await c.query("SELECT id, firm_id, key_prefix, status, expires_at FROM public.license_keys WHERE firm_id = $1", [firm.rows[0]?.id]);
  console.log('LICENSE KEYS:', keys.rows);

  await c.end();
}).catch(console.error);
