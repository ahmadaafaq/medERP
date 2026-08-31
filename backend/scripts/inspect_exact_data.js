const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();

  const schemas = [
    'tenant_srms-cet-bareilly',
    'tenant_srms-cet',
    'public',
  ];

  for (const s of schemas) {
    console.log(`\n=== Inspection for ${s} ===`);
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = $1
    `, [s]);
    console.log('All tables:', tables.rows.map(r => r.table_name).join(', '));

    for (const t of tables.rows) {
      if (t.table_name.startsWith('logbook_') || t.table_name === 'students' || t.table_name === 'courses' || t.table_name === 'faculty') {
        const rows = await client.query(`SELECT * FROM "${s}"."${t.table_name}" LIMIT 5`);
        console.log(`\nData from ${s}.${t.table_name} (${rows.rows.length} sample):`);
        console.log(JSON.stringify(rows.rows, null, 2));
      }
    }
  }

  await client.end();
}

main().catch(console.error);
