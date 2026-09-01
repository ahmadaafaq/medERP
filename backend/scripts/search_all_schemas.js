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
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_type = 'BASE TABLE' AND table_schema LIKE 'tenant_%';
  `);
  for (const row of res.rows) {
    try {
      const check = await client.query(`SELECT * FROM "${row.table_schema}"."${row.table_name}" WHERE id::text = 'a20cedb3-7410-457e-ae8e-338c2b98af6d';`);
      if (check.rows.length > 0) {
        console.log(`FOUND in schema ${row.table_schema}, table ${row.table_name}:`, check.rows[0]);
      }
    } catch (e) {}
  }
  await client.end();
}
main();
