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
  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = 'notifications'
  `, [schema]);
  console.log('NOTIFICATIONS COLS in ' + schema + ':', cols.rows);

  const noticesCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = 'campus_notices'
  `, [schema]);
  console.log('CAMPUS_NOTICES COLS in ' + schema + ':', noticesCols.rows);

  await client.end();
}

main().catch(console.error);
