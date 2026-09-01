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
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'logbook_topics';
  `);
  console.log('logbook_topics columns:', cols.rows);
  const subCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'logbook_submissions';
  `);
  console.log('logbook_submissions columns:', subCols.rows);
  await client.end();
}
main();
