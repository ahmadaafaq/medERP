const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'unicampus_erp',
  user: 'unicampus',
  password: 'unicampus_secret',
});

async function main() {
  await client.connect();
  const s = 'tenant_srms-cet-bareilly';

  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = 'students'
    ORDER BY ordinal_position
  `, [s]);
  console.log(`Columns in "${s}".students:`);
  cols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

  const sample = await client.query(`SELECT * FROM "${s}".students LIMIT 5`);
  console.log('\nSample 5 student rows:');
  sample.rows.forEach(r => console.log(JSON.stringify(r)));

  // Check count by course/batch
  const courseCount = await client.query(`
    SELECT course_code, course_id, batch_code, batch_id, COUNT(*) 
    FROM "${s}".students 
    GROUP BY course_code, course_id, batch_code, batch_id
  `);
  console.log('\nStudent counts by Course & Batch:');
  courseCount.rows.forEach(r => console.log(r));

  await client.end();
}

main().catch(console.error);
