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
  const res = await client.query(`SELECT id, topic_id, student_id, attachment_url, attachment_name, submission_text FROM "${schema}".logbook_submissions;`);
  console.log('ALL rows in logbook_submissions:', res.rows);
  await client.end();
}
main();
