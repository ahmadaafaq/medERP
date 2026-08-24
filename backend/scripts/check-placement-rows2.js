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

  const r1 = await c.query('SELECT * FROM "tenant_srms-cet-bareilly".placement_drives');
  console.log('placement_drives:', r1.rows);

  const r2 = await c.query('SELECT * FROM "tenant_srms-cet-bareilly".placement_applications');
  console.log('placement_applications:', r2.rows);

  await c.end();
}

checkData().catch(console.error);
