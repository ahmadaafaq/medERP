const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});
async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM "tenant_srms-cet-bareilly".logbook_submissions LIMIT 5;');
  console.log('Submissions in DB:', JSON.stringify(res.rows, null, 2));
  await client.end();
}
main();
