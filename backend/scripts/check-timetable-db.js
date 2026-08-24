const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp'
});

async function main() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = $1 AND table_name LIKE '%time%'
  `, [schema]);
  console.log('TIMETABLE TABLES in ' + schema + ':', tables.rows);

  for (const t of tables.rows) {
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
    `, [schema, t.table_name]);
    console.log(`COLUMNS in ${t.table_name}:`, cols.rows);
  }

  await client.end();
}

main().catch(console.error);
