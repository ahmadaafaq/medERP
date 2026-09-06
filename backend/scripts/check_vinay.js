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

  const fac = await client.query(`
    SELECT u.id, u.email, u.role, u.emp_id, f.id as fac_id, f.name, f.designation, f.photo_url
    FROM "tenant_srms-cet-bareilly".users u
    LEFT JOIN "tenant_srms-cet-bareilly".faculty f ON f.user_id::text = u.id::text OR f.emp_id = u.emp_id
    WHERE u.email ILIKE '%vinay%' OR u.emp_id = '202616658'
  `);
  console.log('VINAY FACULTY:', fac.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
