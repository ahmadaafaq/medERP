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
  console.log('--- 1. CHECK PUBLIC.FIRMS ---');
  const firms = await client.query("SELECT * FROM public.firms WHERE slug = 'rimt-bareilly'");
  console.log('Firms for rimt-bareilly:', firms.rows);

  console.log('\n--- 2. CHECK PUBLIC.TENANTS ---');
  const tenants = await client.query("SELECT * FROM public.tenants WHERE slug = 'rimt-bareilly'");
  console.log('Tenants for rimt-bareilly:', tenants.rows);

  console.log('\n--- 3. CHECK PUBLIC.LICENSE_KEYS ---');
  if (firms.rows.length > 0) {
    const keys = await client.query("SELECT * FROM public.license_keys WHERE firm_id = $1", [firms.rows[0].id]);
    console.log('License keys for firm:', keys.rows);
  }

  console.log('\n--- 4. CHECK TENANT_RIMT-BAREILLY.USERS ---');
  const users = await client.query('SELECT * FROM "tenant_rimt-bareilly".users WHERE email = $1', ['admin@rajshree.ac.in']);
  console.log('User admin@rajshree.ac.in:', users.rows);

  if (users.rows.length > 0) {
    const u = users.rows[0];
    const match = await bcrypt.compare('rajshree@123#', u.password_hash);
    console.log('Password match test (rajshree@123#):', match);
  }

  console.log('\n--- 5. CHECK ALL USERS IN TENANT_RIMT-BAREILLY ---');
  const allUsers = await client.query('SELECT id, email, username, role, is_active FROM "tenant_rimt-bareilly".users');
  console.table(allUsers.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error in inspect_rimt_login:', err);
  process.exit(1);
});
