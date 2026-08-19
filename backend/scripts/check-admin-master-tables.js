const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await client.connect();
  const schemas = ['tenant_srms-ims', 'tenant_rajshreemri'];

  for (const s of schemas) {
    console.log(`\n=== Schema: ${s} ===`);
    const tables = [
      'professional_linkers',
      'departments',
      'subjects',
      'topics',
      'competencies',
      'delivery_types',
      'subject_offerings',
      'professionals',
    ];

    for (const t of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM "${s}".${t}`);
        console.log(`  Table "${t}": ${res.rows[0].count} rows`);
      } catch (err) {
        console.log(`  Table "${t}" ERROR: ${err.message}`);
      }
    }
  }

  await client.end();
}

run().catch(console.error);
