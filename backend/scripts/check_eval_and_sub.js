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
  const evalRows = await client.query(`SELECT * FROM "${schema}".logbook_evaluations;`);
  console.log('Evaluations rows:', evalRows.rows);

  const subRows = await client.query(`SELECT * FROM "${schema}".logbook_submissions;`);
  console.log('Submissions rows:', subRows.rows);

  await client.end();
}
main();
