const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await c.connect();

  // Competency columns
  console.log('COMPETENCY COLUMNS:');
  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='tenant_srms-ims' AND table_name='competencies' ORDER BY ordinal_position`);
  cols.rows.forEach(r => console.log(' -', r.column_name));

  // All competencies
  const comp = await c.query(`SELECT * FROM "tenant_srms-ims".competencies LIMIT 10`);
  console.log('\nCOMPETENCIES (', comp.rows.length, '):');
  comp.rows.forEach(r => console.log(' ', JSON.stringify(r)));

  // Question bank topic vs admin-master topic names
  console.log('\nQUESTION topic values:');
  const q = await c.query(`SELECT DISTINCT topic, competency_code, mode, COUNT(*) as cnt FROM "tenant_srms-ims".question_bank WHERE is_active=true GROUP BY topic, competency_code, mode ORDER BY topic`);
  q.rows.forEach(r => console.log(`  topic="${r.topic}" | comp="${r.competency_code}" | mode=${r.mode} | cnt=${r.cnt}`));

  // admin_master topics (if exists in another schema)
  const schemas = await c.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')");
  for (const row of schemas.rows) {
    const schema = row.schema_name;
    const hasTopic = await c.query(`SELECT COUNT(*) as cnt FROM pg_tables WHERE schemaname='${schema}' AND tablename='topics'`);
    if (parseInt(hasTopic.rows[0].cnt) > 0 && schema !== 'tenant_srms-ims') {
      console.log(`\nTOPICS in ${schema} (admin-master?)`);
      const t = await c.query(`SELECT * FROM "${schema}".topics LIMIT 5`);
      t.rows.forEach(r => console.log('  ', JSON.stringify(r)));
    }
  }

  // Departments
  console.log('\nDEPARTMENTS in tenant_srms-ims:');
  const d = await c.query(`SELECT id, name, code FROM "tenant_srms-ims".departments ORDER BY name`);
  d.rows.forEach(r => console.log(`  ${r.id} | "${r.name}" | ${r.code}`));

  // Faculty dept linkage
  console.log('\nFACULTY DEPT LINKS:');
  const f = await c.query(`SELECT f.id, f.name, f.department_id, d.name as dept_name FROM "tenant_srms-ims".faculty f LEFT JOIN "tenant_srms-ims".departments d ON d.id=f.department_id LIMIT 5`);
  f.rows.forEach(r => console.log(`  "${r.name}" | dept="${r.dept_name}" | dept_id=${r.department_id}`));

  // Users
  console.log('\nUSERS in tenant_srms-ims (faculty role):');
  const u = await c.query(`SELECT id, email, role, name FROM "tenant_srms-ims".users WHERE role='FACULTY' LIMIT 3`);
  u.rows.forEach(r => console.log(`  email="${r.email}" | name="${r.name}" | id=${r.id}`));

  await c.end();
}
run().catch(e => console.error('ERROR:', e.message));
