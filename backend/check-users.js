const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await c.connect();

  const res = await c.query(`SELECT id, email, role, department_id, name FROM "tenant_srms-ims".users`);
  console.log('USERS IN tenant_srms-ims:');
  console.table(res.rows);

  const f = await c.query(`SELECT id, user_id, department_id, name FROM "tenant_srms-ims".faculty`);
  console.log('\nFACULTY IN tenant_srms-ims:');
  console.table(f.rows);

  await c.end();
}
run().catch(e => console.error('ERROR:', e.message));
