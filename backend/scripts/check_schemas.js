const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function checkSchemas() {
  const res = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`);
  console.log('Available tenant schemas:', res.rows.map(r => r.schema_name));
  await pool.end();
}

checkSchemas().catch(console.error);
