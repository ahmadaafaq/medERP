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
  const q = `
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_type = 'BASE TABLE';
  `;
  const tables = await client.query(q);
  for (const t of tables.rows) {
    try {
      const res = await client.query(`SELECT * FROM "${t.table_schema}"."${t.table_name}" WHERE id::text LIKE '%a20cedb3%' OR title LIKE '%GEN AI%'`);
      if (res.rows.length > 0) {
        console.log(`Match in ${t.table_schema}.${t.table_name}:`, res.rows);
      }
    } catch (e) {}
  }
  await client.end();
}
main();
