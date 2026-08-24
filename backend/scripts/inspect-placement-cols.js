const { Client } = require('pg');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function inspect() {
  await c.connect();

  const cols1 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'tenant_rmribar' AND table_name = 'placement_drives'");
  console.log('tenant_rmribar.placement_drives columns:', cols1.rows);

  const cols2 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name = 'placement_drives'");
  console.log('tenant_srms-cet-bareilly.placement_drives columns:', cols2.rows);

  await c.end();
}

inspect().catch(console.error);
