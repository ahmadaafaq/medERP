const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  const subCols = await client.query('SELECT * FROM "tenant_srms-cet-bareilly".subjects LIMIT 1');
  console.log('SUBJECTS COLS:', Object.keys(subCols.rows[0] || {}));
  console.log('SUBJECTS SAMPLE:', subCols.rows[0]);

  const pCols = await client.query('SELECT id, name, code, subject_id FROM "tenant_srms-cet-bareilly".examination_papers WHERE code = \'CO-SESS-2026-1\'');
  console.log('CO PAPER:', pCols.rows[0]);

  if (pCols.rows[0]?.subject_id) {
    const s = await client.query('SELECT * FROM "tenant_srms-cet-bareilly".subjects WHERE id::text = $1', [pCols.rows[0].subject_id]);
    console.log('SUBJECT DETAILS:', s.rows[0]);
  }
  await client.end();
}

run().catch(console.error);
