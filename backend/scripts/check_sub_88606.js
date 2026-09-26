const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: Number(process.env.DB_PORT) || 5433,
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const r = await client.query(`SELECT id, code, name, sub_addinfo FROM "${schema}".subjects WHERE code = '88606' OR name ILIKE '%COA%' OR sub_addinfo ILIKE '%COA%'`);
  console.log('Subject 88606:', r.rows);

  // If 88606 is not in subjects, check what subjects exist for B.Tech Sem 3
  const btechSubs = await client.query(`SELECT id, code, name, sub_addinfo, course_cd FROM "${schema}".subjects WHERE course_cd = '1'`);
  console.log('\nB.Tech subjects in DB:');
  console.table(btechSubs.rows);

  await client.end();
}

run().catch(console.error);
