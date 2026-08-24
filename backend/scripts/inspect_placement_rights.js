const { Client } = require('pg');

async function inspectPlacementRights() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  const menuRows = await client.query(`
    SELECT * FROM public.menu_registry 
    WHERE menu_key ILIKE '%placement%' OR route_path ILIKE '%placement%'
    ORDER BY role, sort_order
  `);
  console.log('--- MENU REGISTRY PLACEMENT ENTRIES ---');
  console.table(menuRows.rows);

  const permRows = await client.query(`
    SELECT rp.firm_id, f.title, rp.role, rp.menu_key, rp.is_enabled 
    FROM public.firm_role_permissions rp
    JOIN public.firms f ON f.id = rp.firm_id
    WHERE rp.menu_key ILIKE '%placement%'
  `);
  console.log('--- ROLE PERMISSIONS PLACEMENT ENTRIES ---');
  console.table(permRows.rows);

  // Check all permissions for firm
  const allAdminPerms = await client.query(`
    SELECT rp.menu_key, rp.is_enabled
    FROM public.firm_role_permissions rp
    JOIN public.firms f ON f.id = rp.firm_id
    WHERE rp.role = 'ADMIN' AND f.slug = 'srms-cet-bareilly'
  `);
  console.log('--- ALL ADMIN PERMS FOR SRMS-CET-BAREILLY ---');
  console.log(allAdminPerms.rows.map(r => r.menu_key));

  await client.end();
}

inspectPlacementRights().catch(console.error);
