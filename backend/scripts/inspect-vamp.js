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
  const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'tenant_vamp' AND table_name = 'placement_drives'");
  console.log('tenant_vamp.placement_drives:', cols.rows);
  await c.end();
}

inspect().catch(console.error);
