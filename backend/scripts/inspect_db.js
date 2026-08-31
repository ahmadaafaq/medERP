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
  console.log('Connected to PostgreSQL successfully.');

  // 1. List all schemas
  const schemasRes = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%' OR schema_name = 'public'
    ORDER BY schema_name
  `);
  console.log('Schemas:', schemasRes.rows.map(r => r.schema_name));

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1
      ORDER BY table_name
    `, [schema]);

    console.log(`\n=== Schema: ${schema} (${tablesRes.rows.length} tables) ===`);
    for (const t of tablesRes.rows) {
      const tName = t.table_name;
      if (tName.includes('logbook') || tName.includes('student') || tName.includes('course') || tName.includes('department') || tName.includes('batch') || tName.includes('seminar') || tName.includes('tutorial') || tName.includes('project')) {
        try {
          const countRes = await client.query(`SELECT COUNT(*) FROM "${schema}"."${tName}"`);
          const count = parseInt(countRes.rows[0].count, 10);
          console.log(`  - ${tName}: ${count} rows`);
          if (count > 0 && (tName.includes('logbook') || tName.includes('seminar') || tName.includes('tutorial') || tName.includes('project') || tName === 'students')) {
            const sample = await client.query(`SELECT * FROM "${schema}"."${tName}" LIMIT 3`);
            console.log(`    Sample from ${tName}:`, JSON.stringify(sample.rows, null, 2));
          }
        } catch (err) {
          console.log(`  - ${tName}: error ${err.message}`);
        }
      }
    }
  }

  await client.end();
}

main().catch(console.error);
