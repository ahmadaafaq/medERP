const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
    connectionTimeoutMillis: 10000,
  });

  await client.connect();

  const schemas = [
    'tenant_srms-cet-bareilly',
    'tenant_srms-cet',
    'tenant_srms-ims',
    'tenant_unicamp-med',
  ];

  for (const schema of schemas) {
    console.log(`\n================== SCHEMA: ${schema} ==================`);
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `, [schema]);

    console.log(`Tables count: ${tablesRes.rows.length}`);
    for (const t of tablesRes.rows) {
      const tName = t.table_name;
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${schema}"."${tName}"`);
        const count = parseInt(countRes.rows[0].count, 10);
        if (count > 0) {
          console.log(`  * ${tName}: ${count} rows`);
        }
      } catch (err) {
        // ignore
      }
    }
  }

  await client.end();
}

main().catch(console.error);
