const { Client } = require('pg');

const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function run() {
  await client.connect();
  const slug = 'tenant_srms-cet-bareilly';
  await client.query(`SET search_path TO "${slug}", public`);

  const bRes = await client.query(`SELECT id, code, name, year, batch_cd, course_id, course_cd FROM batches LIMIT 15`);
  console.log('Batches:');
  console.log(bRes.rows);

  await client.end();
}

run().catch(console.error);
