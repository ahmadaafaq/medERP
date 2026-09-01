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
  const res = await client.query(`SELECT id, title, slide_deck_url, slide_deck_name FROM "${schema}".logbook_seminars;`);
  console.log('ALL rows in logbook_seminars:', res.rows);
  await client.end();
}
main();
