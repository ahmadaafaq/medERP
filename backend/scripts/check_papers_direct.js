const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp'
  });
  await client.connect();
  const res = await client.query(`SELECT * FROM "tenant_srms-cet-bareilly".examination_papers`);
  console.log('Papers count:', res.rows.length);
  console.log(res.rows);
  await client.end();
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
