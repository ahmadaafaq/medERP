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
  const qb = await client.query('SELECT id, mode, question_text, topic, competency_code, subject_id, department_id FROM "tenant_srms-ims".question_bank WHERE is_active=true');
  console.log('TOTAL ACTIVE QUESTIONS IN DB:', qb.rows.length);
  qb.rows.forEach(r => console.log(' -> ID:', r.id, '| Mode:', r.mode, '| Topic:', r.topic, '| Comp:', r.competency_code, '| SubjID:', r.subject_id, '| Text:', r.question_text.slice(0, 40)));
  
  const topics = await client.query('SELECT id, code, name, subject_id FROM "tenant_srms-ims".topics');
  console.log('=== TOPICS IN DB ===');
  topics.rows.forEach(t => console.log(' -> ID:', t.id, '| Name:', t.name, '| SubjID:', t.subject_id));

  const comps = await client.query('SELECT id, code, description, topic_id, subject_id FROM "tenant_srms-ims".competencies');
  console.log('=== COMPETENCIES IN DB ===');
  comps.rows.forEach(c => console.log(' -> ID:', c.id, '| Code:', c.code, '| TopicID:', c.topic_id, '| SubjID:', c.subject_id));

  await client.end();
}
run().catch(e => console.error(e));
