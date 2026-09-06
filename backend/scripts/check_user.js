const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
  ssl: false
});

async function main() {
  await client.connect();

  // Check recent logins / updated users
  const recent = await client.query(`
    SELECT id, email, role, emp_id, last_login_at, updated_at
    FROM "tenant_srms-cet-bareilly".users
    ORDER BY COALESCE(last_login_at, updated_at, created_at) DESC NULLS LAST
    LIMIT 10
  `);
  console.log('RECENT USERS:', recent.rows);

  // Check if there are duplicate emails or shared IDs
  const shared = await client.query(`
    SELECT email, COUNT(*)
    FROM "tenant_srms-cet-bareilly".users
    GROUP BY email
    HAVING COUNT(*) > 1
  `);
  console.log('SHARED EMAILS:', shared.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
