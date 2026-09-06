const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "tenant_srms-cet-bareilly".logbook_evaluations LIMIT 2');
  console.log('EVALUATIONS COLUMNS:', Object.keys(res.rows[0] || {}));
  console.log('SAMPLE EVALUATION:', res.rows[0]);
  await client.end();
}

run().catch(console.error);
