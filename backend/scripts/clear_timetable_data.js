const { Client } = require('pg');
require('dotenv').config({ path: 'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/.env' });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  console.log(`Clearing timetable data for schema: "${schema}"...`);

  // Check tables in schema
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = $1 AND (table_name LIKE '%timetable%' OR table_name LIKE '%slot%')
  `, [schema]);

  console.log('Found matching tables:', tablesRes.rows.map(r => r.table_name));

  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    const deleteRes = await client.query(`DELETE FROM "${schema}"."${tableName}"`);
    console.log(`Deleted ${deleteRes.rowCount} rows from "${schema}"."${tableName}"`);
    const countRes = await client.query(`SELECT COUNT(*)::int as count FROM "${schema}"."${tableName}"`);
    console.log(`Remaining in "${schema}"."${tableName}": ${countRes.rows[0].count}`);
  }

  console.log('All timetable data for tenant_srms-cet-bareilly has been completely cleared.');
  await client.end();
}

run().catch(err => {
  console.error('Error clearing timetable data:', err);
  process.exit(1);
});
