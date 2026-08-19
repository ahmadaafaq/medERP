const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function run() {
  await client.connect();

  // Check ALL tenant schemas
  const schemas = await client.query(`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant_%'
  `);
  console.log('All tenant schemas:', schemas.rows.map(r => r.schema_name));

  for (const { schema_name } of schemas.rows) {
    console.log(`\n=== Schema: ${schema_name} ===`);
    try {
      // Check notices with these names
      const res = await client.query(`
        SELECT id, title, creator_name, body
        FROM "${schema_name}".notices
        WHERE
          title ILIKE '%SUJAT%' OR title ILIKE '%KAMAL%'
          OR creator_name ILIKE '%SUJAT%' OR creator_name ILIKE '%KAMAL%'
          OR body ILIKE '%SUJAT%' OR body ILIKE '%KAMAL%'
      `);
      if (res.rows.length > 0) {
        console.log(`Found ${res.rows.length} matching notice(s):`);
        res.rows.forEach(r => {
          console.log(`  Title: ${r.title}`);
          console.log(`  Creator: ${r.creator_name}`);
          console.log(`  Body snippet: ${r.body?.substring(0,80)}...`);
          console.log('  ---');
        });

        // Fix them now
        await client.query(`
          UPDATE "${schema_name}".notices SET
            title = REGEXP_REPLACE(REGEXP_REPLACE(title, 'SUJAT KHAN', 'Admin', 'gi'), 'KAMAL DATT JOSHI', 'Admin', 'gi'),
            body  = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(body,  'SUJAT KHAN', 'Admin', 'gi'), 'KAMAL DATT JOSHI', 'Admin', 'gi'), 'Sujat Khan', 'Admin', 'gi'),
            creator_name = CASE
              WHEN creator_name ILIKE '%SUJAT%' OR creator_name ILIKE '%KAMAL%' THEN 'Admin'
              ELSE creator_name
            END
          WHERE
            title ILIKE '%SUJAT%' OR title ILIKE '%KAMAL%'
            OR creator_name ILIKE '%SUJAT%' OR creator_name ILIKE '%KAMAL%'
            OR body ILIKE '%SUJAT%' OR body ILIKE '%KAMAL%'
        `);
        console.log(`  ✅ Fixed all matching records in ${schema_name}`);
      } else {
        console.log('  No matching notices.');
      }

      // Also check faculty table
      const fac = await client.query(`
        SELECT id, name FROM "${schema_name}".faculty
        WHERE name ILIKE '%SUJAT%' OR name ILIKE '%KAMAL DATT%'
      `);
      if (fac.rows.length > 0) {
        console.log(`Found ${fac.rows.length} faculty:`);
        fac.rows.forEach(r => console.log(`  ${r.name}`));
        await client.query(`
          UPDATE "${schema_name}".faculty SET name = 'Admin'
          WHERE name ILIKE '%SUJAT%' OR name ILIKE '%KAMAL DATT%'
        `);
        console.log('  ✅ Fixed faculty names');
      }

      // Check users
      const usr = await client.query(`
        SELECT id, email FROM "${schema_name}".users
        WHERE email ILIKE '%sujat%' OR email ILIKE '%kamal%'
      `);
      if (usr.rows.length > 0) {
        console.log(`Found ${usr.rows.length} users:`, usr.rows.map(r => r.email));
      }

    } catch (e) {
      console.log(`  Skipped (no notices table): ${e.message.split('\n')[0]}`);
    }
  }

  // Final verification
  console.log('\n=== FINAL VERIFICATION ===');
  for (const { schema_name } of schemas.rows) {
    try {
      const check = await client.query(`
        SELECT COUNT(*) AS cnt FROM "${schema_name}".notices
        WHERE title ILIKE '%SUJAT%' OR title ILIKE '%KAMAL%'
           OR creator_name ILIKE '%SUJAT%' OR creator_name ILIKE '%KAMAL%'
           OR body ILIKE '%SUJAT%' OR body ILIKE '%KAMAL%'
      `);
      console.log(`${schema_name}: ${check.rows[0].cnt} remaining record(s) with old names`);
    } catch (_) {}
  }

  await client.end();
  console.log('\nDone!');
}

run().catch(err => { console.error(err.message); process.exit(1); });
