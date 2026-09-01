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
  const res = await client.query(`
    SELECT s.id, s.topic_id, s.student_id, s.attachment_name, s.attachment_url, t.title 
    FROM "${schema}".logbook_submissions s
    JOIN "${schema}".logbook_topics t ON t.id::text = s.topic_id::text;
  `);
  console.log('Joined submissions with topics:', res.rows);
  await client.end();
}
main();
