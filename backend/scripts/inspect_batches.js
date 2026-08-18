const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp'
  });
  await client.connect();

  console.log('Connected to DB.');
  
  const tablesRes = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name LIKE '%batch%'
  `);
  console.log('Batch tables:', tablesRes.rows);

  const batches = await client.query(`
    SELECT * FROM "tenant_srms-cet-bareilly".batches
  `);
  console.log(`Total batches in CET: ${batches.rows.length}`);
  console.log('Columns:', Object.keys(batches.rows[0] || {}));
  console.log('Sample 10 rows:', batches.rows.slice(0, 10));

  const course13Batches = await client.query(`
    SELECT id, code, year, course_cd, batch_cd, colg_cd, name FROM "tenant_srms-cet-bareilly".batches WHERE course_cd = '13'
  `);
  console.log('Course 13 (BCA) batches in CET:', course13Batches.rows);

  const courseCounts = await client.query(`
    SELECT course_cd, count(*) FROM "tenant_srms-cet-bareilly".batches GROUP BY course_cd
  `);
  console.log('Course batch counts in CET:', courseCounts.rows);

  await client.end();
}

main().catch(console.error);
