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
  console.log('=== EXAMINATION_PAPERS COLUMNS ===');
  const cols = await client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_schema=\'tenant_srms-ims\' AND table_name=\'examination_papers\'');
  console.log(cols.rows);

  console.log('=== EXISTING PAPERS ===');
  const papers = await client.query('SELECT * FROM "tenant_srms-ims".examination_papers');
  console.log(papers.rows);

  await client.end();
}
run().catch(e => console.error('PG ERROR:', e));
