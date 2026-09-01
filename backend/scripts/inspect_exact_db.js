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
  const schema = 'tenant_srms-cet-bareilly';
  const subs = await client.query(`SELECT * FROM "${schema}".logbook_submissions`);
  console.log('logbook_submissions rows:', JSON.stringify(subs.rows, null, 2));

  const topics = await client.query(`SELECT * FROM "${schema}".logbook_topics`);
  console.log('logbook_topics rows:', JSON.stringify(topics.rows, null, 2));

  await client.end();
}
main();
