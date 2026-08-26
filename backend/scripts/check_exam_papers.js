const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp'
  });
  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  `);
  
  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      const p = await client.query(`SELECT id, code, name, is_active FROM "${s}".examination_papers`);
      console.log(`Schema ${s} has ${p.rows.length} examination papers:`, p.rows);
    } catch (e) {
      console.log(`Schema ${s} examination_papers error:`, e.message);
    }
  }

  await client.end();
}

main().catch(console.error);
