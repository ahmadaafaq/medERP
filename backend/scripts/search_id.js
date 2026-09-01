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
  const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}';`);
  for (const row of tablesRes.rows) {
    try {
      const res = await client.query(`SELECT * FROM "${schema}"."${row.table_name}" WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d';`);
      if (res.rows.length > 0) {
        console.log(`Found in table ${row.table_name}:`, res.rows[0]);
      }
    } catch (e) {}
  }
  await client.end();
}
main();
