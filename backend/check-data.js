const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await c.connect();

  // Check topics stored in admin-master schema
  const schemas = await c.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')");
  
  for (const row of schemas.rows) {
    const schema = row.schema_name;
    const hasTopic = await c.query(`SELECT COUNT(*) as cnt FROM pg_tables WHERE schemaname='${schema}' AND tablename='topics'`);
    if (parseInt(hasTopic.rows[0].cnt) > 0) {
      console.log(`\nTOPICS in ${schema}:`);
      const t = await c.query(`SELECT id, name, code, subject_id FROM "${schema}".topics ORDER BY name LIMIT 10`);
      t.rows.forEach(r => console.log(`  id=${r.id} | name="${r.name}" | code=${r.code} | subj=${r.subject_id}`));
    }
    const hasComp = await c.query(`SELECT COUNT(*) as cnt FROM pg_tables WHERE schemaname='${schema}' AND tablename='competencies'`);
    if (parseInt(hasComp.rows[0].cnt) > 0) {
      console.log(`\nCOMPETENCIES in ${schema}:`);
      const comp = await c.query(`SELECT id, code, name, topic_id FROM "${schema}".competencies ORDER BY code LIMIT 10`);
      comp.rows.forEach(r => console.log(`  id=${r.id} | code="${r.code}" | topic_id=${r.topic_id}`));
    }
  }

  // Check question_bank topic values
  console.log('\nQUESTION topic values in tenant_srms-ims:');
  const q = await c.query(`SELECT DISTINCT topic, competency_code, mode, subject_id, COUNT(*) as cnt FROM "tenant_srms-ims".question_bank WHERE is_active=true GROUP BY topic, competency_code, mode, subject_id ORDER BY topic`);
  q.rows.forEach(r => console.log(`  topic="${r.topic}" | comp="${r.competency_code}" | mode=${r.mode} | subj=${r.subject_id} | count=${r.cnt}`));

  // Check departments in srms-ims
  console.log('\nDEPARTMENTS in tenant_srms-ims:');
  const d = await c.query(`SELECT id, name, code FROM "tenant_srms-ims".departments ORDER BY name`);
  d.rows.forEach(r => console.log(`  id=${r.id} | name="${r.name}" | code=${r.code}`));

  // Check faculty in srms-ims
  console.log('\nFACULTY in tenant_srms-ims (first 5):');
  const f = await c.query(`SELECT id, name, department_id, emp_id FROM "tenant_srms-ims".faculty LIMIT 5`);
  f.rows.forEach(r => console.log(`  id=${r.id} | name="${r.name}" | dept_id=${r.department_id}`));

  await c.end();
}
run().catch(e => console.error('ERROR:', e.message));
