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
  console.log('=== PHYSIOLOGY SUBJECTS & DEPTS ===');
  const subjs = await client.query('SELECT * FROM "tenant_srms-ims".subjects');
  console.log(subjs.rows);

  console.log('=== PHYSIOLOGY TOPICS ===');
  const topics = await client.query('SELECT * FROM "tenant_srms-ims".topics');
  console.log(topics.rows);

  console.log('=== PHYSIOLOGY COMPETENCIES ===');
  const comps = await client.query('SELECT * FROM "tenant_srms-ims".competencies');
  console.log(comps.rows);

  await client.end();
}
run().catch(e => console.error('PG ERROR:', e));
