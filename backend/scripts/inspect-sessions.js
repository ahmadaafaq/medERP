const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();

  const schemas = ['tenant_srms-cet-bareilly', 'tenant_srms-ims', 'tenant_srms-cet', 'tenant_srms-cetr-bareilly'];
  for (const s of schemas) {
    console.log(`\n=== Schema: ${s} academic_sessions ===`);
    try {
      const res = await client.query(`SELECT * FROM "${s}".academic_sessions`);
      console.table(res.rows);
    } catch(e) {
      console.log('Error:', e.message);
    }
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
