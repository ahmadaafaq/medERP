const { Client } = require('pg');
const c = new Client({
  host: 'localhost', port: 5432,
  user: 'unicampus', password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  await c.connect();

  const q = await c.query(`SELECT id, mode, topic, competency_code, is_active, subject_id, LEFT(question_text,60) as q FROM "tenant_srms-ims".question_bank ORDER BY created_at DESC LIMIT 10`);
  console.log('QUESTIONS in tenant_srms-ims:', q.rows.length);
  q.rows.forEach(r => console.log(' ->', r.mode, '| comp:', r.competency_code, '| topic:', r.topic, '| active:', r.is_active, '| subj:', r.subject_id, '\n     Q:', r.q));

  const p = await c.query(`SELECT id, code, name, status, subject_id, is_active FROM "tenant_srms-ims".examination_papers ORDER BY created_at DESC LIMIT 5`);
  console.log('\nPAPERS in tenant_srms-ims:', p.rows.length);
  p.rows.forEach(r => console.log(' ->', r.code, '|', r.name, '| status:', r.status, '| is_active:', r.is_active, '| subj:', r.subject_id));

  const d = await c.query(`SELECT id, name, code FROM "tenant_srms-ims".departments ORDER BY name`);
  console.log('\nDEPARTMENTS:', d.rows.length);
  d.rows.forEach(r => console.log(' ->', r.id, '|', r.name, '|', r.code));

  const s = await c.query(`SELECT id, name, code, department_id FROM "tenant_srms-ims".subjects ORDER BY name`);
  console.log('\nSUBJECTS:', s.rows.length);
  s.rows.forEach(r => console.log(' ->', r.id, '|', r.name, '|', r.code, '| dept:', r.department_id));

  const tenants = await c.query(`SELECT id, slug, name FROM public.tenants ORDER BY slug`);
  console.log('\nTENANTS:', tenants.rows.length);
  tenants.rows.forEach(r => console.log(' ->', r.slug, '|', r.name, '| id:', r.id));

  await c.end();
}
run().catch(e => console.error('ERROR:', e.message));
