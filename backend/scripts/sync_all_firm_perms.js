const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function main() {
  await client.connect();
  console.log('Connected to DB. Syncing permissions for all registered firms...');

  const firms = await client.query('SELECT id, title, slug, firm_mode FROM public.firms');
  console.log(`Found ${firms.rows.length} firms.`);

  const menuItems = await client.query('SELECT role, menu_key, applicable_firm_mode FROM public.menu_registry');
  console.log(`Found ${menuItems.rows.length} master menu items in menu_registry.`);

  for (const firm of firms.rows) {
    let inserted = 0;
    const mode = (firm.firm_mode || 'NONMED').toUpperCase();

    for (const menu of menuItems.rows) {
      if (menu.applicable_firm_mode !== 'BOTH' && menu.applicable_firm_mode !== mode) {
        continue;
      }

      const res = await client.query(
        `INSERT INTO public.firm_role_permissions (firm_id, role, menu_key, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         ON CONFLICT (firm_id, role, menu_key) DO UPDATE SET is_enabled = true, updated_at = NOW()`,
        [firm.id, menu.role, menu.menu_key]
      );
      inserted++;
    }

    console.log(`✓ Synchronized ${inserted} role permissions for firm "${firm.title}" (${firm.slug})`);
  }

  await client.end();
  console.log('All firm permissions synced successfully!');
}

main().catch(console.error);
