const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = '${schema}' AND table_name = 'students'
    ORDER BY ordinal_position
  `);
  console.log('Columns of students:');
  console.table(cols.rows);

  const sample = await client.query(`SELECT * FROM "${schema}".students LIMIT 2`);
  console.log('Sample student:', sample.rows[0]);

  await client.end();
}

run().catch(console.error);
