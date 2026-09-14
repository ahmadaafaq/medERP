const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  const hash = await bcrypt.hash('admin@123', 10);
  console.log('Generated hash for admin@123:', hash);

  const res = await client.query(
    `UPDATE "tenant_rimt-bareilly".users 
     SET password_hash = $1, emp_id = 'DR/01/2026', is_active = true, updated_at = NOW() 
     WHERE email = 'admin@rajshree.ac.in' OR id = '49db0511-c499-457c-8338-83a0f8cf623e'
     RETURNING id, email, username, emp_id, role, is_active`,
    [hash]
  );
  console.log('Updated user in tenant_rimt-bareilly.users:', res.rows[0]);

  // Verify match
  const updated = await client.query(`SELECT password_hash FROM "tenant_rimt-bareilly".users WHERE id = '49db0511-c499-457c-8338-83a0f8cf623e'`);
  const isMatch = await bcrypt.compare('admin@123', updated.rows[0].password_hash);
  console.log('Verification: does admin@123 match?', isMatch);

  await client.end();
}

main().catch(console.error);
