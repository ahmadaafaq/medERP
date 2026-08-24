const { Client } = require('pg');

async function enhanceTenantSchemaForSrmsCredentials() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'
  `);

  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      await client.query(`
        ALTER TABLE "${s}".users 
        ADD COLUMN IF NOT EXISTS emp_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS usr_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS devicecd BIGINT,
        ADD COLUMN IF NOT EXISTS loc_cd INT,
        ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      `);

      await client.query(`
        ALTER TABLE "${s}".faculty 
        ADD COLUMN IF NOT EXISTS usr_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS devicecd BIGINT,
        ADD COLUMN IF NOT EXISTS loc_cd INT;
      `);
      console.log(`Enhanced schema ${s}`);
    } catch (e) {
      // Table may not exist in some schemas, safe to ignore
    }
  }

  await client.end();
  console.log('Successfully enhanced schemas with usr_id, devicecd, loc_cd columns');
}

enhanceTenantSchemaForSrmsCredentials().catch(console.error);
