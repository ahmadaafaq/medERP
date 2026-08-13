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
  const updateRes = await client.query(
    'UPDATE "tenant_srms-ims".faculty SET photo_url = $1, updated_at = NOW() WHERE emp_id = $2 OR name LIKE $3 RETURNING id, emp_id, name, photo_url',
    ['/avatars/dr_sanjay_singh.png', 'DR/07/026', '%Sanjay%']
  );
  console.log('UPDATED FACULTY IN POSTGRESQL DB:', updateRes.rows);
  await client.end();
}
run().catch(e => console.error('PG ERROR:', e));
