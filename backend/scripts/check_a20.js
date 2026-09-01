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
  const res1 = await client.query(`SELECT * FROM "${schema}".logbook_submissions WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d';`);
  console.log('logbook_submissions for a20cedb3:', res1.rows);

  const res2 = await client.query(`SELECT * FROM "${schema}".logbook_seminars WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d';`);
  console.log('logbook_seminars for a20cedb3:', res2.rows);

  const res3 = await client.query(`SELECT * FROM "${schema}".logbook_topics WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d';`);
  console.log('logbook_topics for a20cedb3:', res3.rows);

  await client.end();
}
main();
