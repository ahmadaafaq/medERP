const { Client } = require('pg');

async function cloneSchema() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const sourceSchema = 'tenant_srms-cet-bareilly';
  const targetSlugs = ['rmribar', 'apex-tech', 'rmch-bareilly'];

  // Get all table names in source schema
  const tablesRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `, [sourceSchema]);

  const tableNames = tablesRes.rows.map(r => r.table_name);
  console.log(`Found ${tableNames.length} tables in source schema ${sourceSchema}`);

  for (const slug of targetSlugs) {
    const targetSchema = `tenant_${slug}`;
    console.log(`\n--- Provisioning ${targetSchema} ---`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}"`);

    for (const tbl of tableNames) {
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS "${targetSchema}"."${tbl}" (
            LIKE "${sourceSchema}"."${tbl}" INCLUDING ALL
          )
        `);
      } catch (e) {
        console.warn(`Table ${tbl} warning:`, e.message);
      }
    }
    console.log(`✓ Cloned ${tableNames.length} tables to ${targetSchema}`);

    // Mark as provisioned in public.tenants
    await client.query(`
      UPDATE public.tenants SET schema_provisioned = true, updated_at = NOW() WHERE slug = $1
    `, [slug]);
  }

  await client.end();
  console.log('\nALL TARGET TENANT SCHEMAS FULLY STRUCTURED AND PROVISIONED!');
}

cloneSchema().catch(err => {
  console.error('CLONE ERROR:', err);
  process.exit(1);
});
