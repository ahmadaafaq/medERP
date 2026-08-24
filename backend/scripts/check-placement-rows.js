const { Client } = require('pg');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function checkData() {
  await c.connect();

  const r1 = await c.query('SELECT count(*) FROM "tenant_srms-cet-bareilly".placement_drives');
  console.log('tenant_srms-cet-bareilly placement_drives count:', r1.rows[0]);

  const r2 = await c.query('SELECT count(*) FROM "tenant_srms-cet-bareilly".placement_applications');
  console.log('tenant_srms-cet-bareilly placement_applications count:', r2.rows[0]);

  await c.end();
}

checkData().catch(console.error);
