const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function run() {
  await c.connect();

  const cols = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='tenant_srms-ims' AND table_name='users'`);
  console.log('USERS COLUMNS:', cols.rows.map(r => r.column_name));

  const users = await c.query(`SELECT id, email, role, name FROM "tenant_srms-ims".users`);
  console.log('ALL USERS IN tenant_srms-ims:');
  console.table(users.rows);

  await c.end();
}
run().catch(e => console.error('ERROR:', e.message));
