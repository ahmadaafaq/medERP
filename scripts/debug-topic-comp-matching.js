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
  const schema = 'tenant_srms-ims';

  console.log('=== TOPICS IN DB ===');
  const topics = await client.query(`SELECT id, code, name, subject_id FROM "${schema}".topics`);
  console.log(topics.rows);

  console.log('=== COMPETENCIES IN DB ===');
  const comps = await client.query(`SELECT id, code, description, topic_id, subject_id FROM "${schema}".competencies`);
  console.log(comps.rows);

  console.log('=== QUESTIONS IN QUESTION_BANK ===');
  const qb = await client.query(`SELECT id, mode, question_text, topic, competency_code, subject_id, department_id FROM "${schema}".question_bank WHERE is_active=true`);
  console.log(qb.rows);

  await client.end();
}

run().catch(e => console.error('PG ERROR:', e));
