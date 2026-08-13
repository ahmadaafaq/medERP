const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await c.connect();

  const users = await c.query(`SELECT id, email, role, password, name, department_id FROM "tenant_srms-ims".users WHERE email = 'sanjay.singh@gmail.com' OR role = 'FACULTY'`);
  console.log('FACULTY USERS IN tenant_srms-ims:');
  console.table(users.rows);

  const admin = await c.query(`SELECT id, email, role, password, name FROM "tenant_srms-ims".users WHERE email = 'admin' OR role = 'COLLEGE_ADMIN'`);
  console.log('ADMIN USERS IN tenant_srms-ims:');
  console.table(admin.rows);

  await c.end();
}
run().catch(e => console.error('ERROR:', e.message));
