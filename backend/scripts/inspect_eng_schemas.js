const { Client } = require('pg');

async function main() {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });
  await c.connect();

  for (const schema of ['tenant_srms-cet-bareilly', 'tenant_srms-cet']) {
    console.log(`\n=================== ${schema} ===================`);
    const tables = ['courses', 'departments', 'batches', 'subjects', 'faculty', 'students'];
    for (const t of tables) {
      try {
        const count = await c.query(`SELECT COUNT(*) FROM "${schema}".${t}`);
        const rows = await c.query(`SELECT * FROM "${schema}".${t} LIMIT 5`);
        console.log(`--- ${t} (Count: ${count.rows[0].count}) ---`);
        console.log(rows.rows);
      } catch (e) {
        console.log(`Error in ${t}:`, e.message);
      }
    }
  }

  await c.end();
}

main().catch(console.error);
