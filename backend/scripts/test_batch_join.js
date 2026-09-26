const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function run() {
  await client.connect();
  const slug = 'tenant_srms-cet-bareilly';
  await client.query(`SET search_path TO "${slug}", public`);

  const subjects = await client.query(`
    SELECT id, code, name, course_cd, branch_cd, semester 
    FROM subjects 
    WHERE name ILIKE '%web technology%' OR name ILIKE '%coa%' OR code ILIKE '%coa%' OR name ILIKE '%computer organization%'
  `);
  console.log('Matching subjects in DB:', subjects.rows);

  await client.end();
}

run().catch(console.error);
