const { Client } = require('../backend/node_modules/pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  console.log('=== DEPARTMENTS ===');
  const depts = await client.query('SELECT id, name, code FROM "tenant_srms-ims".departments');
  console.log(depts.rows);

  console.log('=== SUBJECTS ===');
  const subjs = await client.query('SELECT id, name, code, department_id FROM "tenant_srms-ims".subjects');
  console.log(subjs.rows);

  console.log('=== TOPICS ===');
  const topics = await client.query('SELECT id, code, name, subject_id FROM "tenant_srms-ims".topics');
  console.log(topics.rows);

  console.log('=== COMPETENCIES ===');
  const comps = await client.query('SELECT id, code, description, topic_id, subject_id FROM "tenant_srms-ims".competencies');
  console.log(comps.rows);

  console.log('=== QUESTION BANK ===');
  const qb = await client.query('SELECT id, mode, question_text, topic, competency_code FROM "tenant_srms-ims".question_bank');
  console.log(qb.rows);

  await client.end();
}
run().catch(e => console.error('PG ERROR:', e));
