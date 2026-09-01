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
  const res = await client.query('SELECT id, topic_id, student_id, attachment_name, attachment_url FROM "tenant_srms-cet-bareilly".logbook_submissions;');
  console.log('Submissions:', res.rows);
  await client.end();
}
main();
