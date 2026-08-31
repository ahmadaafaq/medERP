const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function inspect() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  
  const rawPapers = await client.query(`SELECT id, code, name, subject_id, batch_id, max_marks, type FROM "${schema}".examination_papers`);
  console.log(`=== Raw examination_papers count in ${schema}: ${rawPapers.rows.length} ===`);
  for (const rp of rawPapers.rows) {
    console.log(rp);
  }

  // Also check other schemas
  const schemas = ['tenant_srms-cet-unnao', 'tenant_srms-cetr-bareilly', 'tenant_srms-ims', 'tenant_srms-ibs-lucknow'];
  for (const s of schemas) {
    try {
      const p = await client.query(`SELECT id, code, name, subject_id, batch_id, max_marks, type FROM "${s}".examination_papers`);
      console.log(`=== Schema ${s} papers (${p.rows.length}) ===`);
      for (const rp of p.rows) {
        console.log(rp);
      }
    } catch(e) {}
  }

  await client.end();
}

inspect().catch(console.error);
