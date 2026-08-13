const { Client } = require('../backend/node_modules/pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  console.log('=== FACULTY IN TENANT_SRMS-IMS ===');
  const fac1 = await client.query('SELECT id, user_id, emp_id, name, photo_url FROM "tenant_srms-ims".faculty');
  console.log(fac1.rows);

  console.log('=== FACULTY IN TENANT_RAJSHREEMRI ===');
  const fac2 = await client.query('SELECT id, user_id, emp_id, name, photo_url FROM "tenant_rajshreemri".faculty');
  console.log(fac2.rows);

  await client.end();
}
run().catch(e => console.error('PG ERROR:', e));
