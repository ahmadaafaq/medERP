const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  console.log('=== CHECKING FACULTY ID, SUBJECT ID, BATCH ID FOR SANJAY & SHIPRA ===');
  const query = await client.query(`
    SELECT f.id as faculty_id, f.name as faculty_name, s.id as subject_id, s.name as subject_name, s.code as subject_code, s.department_id, b.id as batch_id, b.code as batch_code
    FROM "tenant_srms-ims".faculty f
    JOIN "tenant_srms-ims".subjects s ON s.department_id = f.department_id
    CROSS JOIN "tenant_srms-ims".batches b
    WHERE f.name LIKE '%Sanjay%' OR f.name LIKE '%Shipra%'
  `);
  console.table(query.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
