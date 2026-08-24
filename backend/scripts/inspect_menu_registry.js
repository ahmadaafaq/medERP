const { Client } = require('pg');

async function inspectMenuRegistry() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  const res = await client.query(`SELECT role, menu_key, menu_label, route_path FROM public.menu_registry WHERE menu_key LIKE '%report%' OR menu_key LIKE '%mis%' ORDER BY role, sort_order`);
  console.log('--- Menu Registry (Reports) ---');
  console.table(res.rows);

  await client.end();
}

inspectMenuRegistry().catch(console.error);
