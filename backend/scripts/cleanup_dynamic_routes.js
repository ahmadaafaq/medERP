const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function cleanupDynamicRoutes() {
  console.log('--- Cleaning up parameterized routes from menu_registry & permissions ---');
  
  const res1 = await pool.query(`
    DELETE FROM public.firm_role_permissions 
    WHERE menu_key IN (SELECT menu_key FROM public.menu_registry WHERE route_path LIKE '%[%')
       OR menu_key LIKE '%[%'
  `);
  console.log(`Deleted ${res1.rowCount} invalid permissions.`);

  const res2 = await pool.query(`
    DELETE FROM public.menu_registry 
    WHERE route_path LIKE '%[%' OR menu_key LIKE '%[%'
  `);
  console.log(`Deleted ${res2.rowCount} invalid menu registry items.`);

  await pool.end();
}

cleanupDynamicRoutes().catch(console.error);
