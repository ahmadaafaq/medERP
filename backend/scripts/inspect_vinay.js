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

  const userTables = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users'`);
  console.log('Tables named users:', userTables.rows);

  for (const row of userTables.rows) {
    try {
      const u = await client.query(`SELECT * FROM "${row.table_schema}".users WHERE email ILIKE '%vinay%' OR name ILIKE '%vinay%' OR username ILIKE '%vinay%' OR id::text ILIKE '%202616658%' LIMIT 5`);
      console.log(`Users in ${row.table_schema}:`, u.rows);
    } catch (e) {
      console.log(`Error querying ${row.table_schema}.users:`, e.message);
    }
  }

  const facultyTables = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'faculty'`);
  for (const row of facultyTables.rows) {
    try {
      const f = await client.query(`SELECT * FROM "${row.table_schema}".faculty WHERE email ILIKE '%vinay%' OR name ILIKE '%vinay%' OR emp_id ILIKE '%202616658%' LIMIT 5`);
      console.log(`Faculty in ${row.table_schema}:`, f.rows);
    } catch (e) {
      console.log(`Error querying ${row.table_schema}.faculty:`, e.message);
    }
  }

  const staffTables = await client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'staff'`);
  for (const row of staffTables.rows) {
    try {
      const s = await client.query(`SELECT * FROM "${row.table_schema}".staff WHERE email ILIKE '%vinay%' OR name ILIKE '%vinay%' OR code ILIKE '%202616658%' OR emp_id ILIKE '%202616658%' LIMIT 5`);
      console.log(`Staff in ${row.table_schema}:`, s.rows);
    } catch (e) {
      console.log(`Error querying ${row.table_schema}.staff:`, e.message);
    }
  }

  await client.end();
}

main().catch(console.error);
