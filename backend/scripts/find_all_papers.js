const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function findPaper() {
  await client.connect();
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name = 'examination_papers'
  `);
  for (const r of res.rows) {
    const p = await client.query(`SELECT * FROM "${r.table_schema}".examination_papers`);
    console.log(`Schema ${r.table_schema} papers:`, p.rows);
  }
  await client.end();
}

findPaper().catch(console.error);
