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
  const tables = ['logbook_submissions', 'logbook_topics', 'logbook_seminars', 'logbook_tutorials', 'logbook_evaluations'];
  for (const t of tables) {
    const res = await client.query(`SELECT * FROM "${schema}"."${t}" WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d' OR id::text = '0dc2f11a-0f0d-4a49-bd7a-394f35d3a800';`);
    if (res.rows.length > 0) {
      console.log(`Found in table ${t}:`, res.rows);
    }
  }
  await client.end();
}
main();
