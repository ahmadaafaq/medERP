const { Client } = require('pg');

async function seedDefaultPermissions() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const firms = await client.query('SELECT id, title, slug, firm_mode FROM public.firms');
  const menus = await client.query('SELECT role, menu_key, applicable_firm_mode FROM public.menu_registry');

  console.log(`Setting default permissions for ${firms.rows.length} firms against ${menus.rows.length} menus...`);

  for (const f of firms.rows) {
    const isMed = f.firm_mode === 'MED';

    for (const m of menus.rows) {
      if (m.applicable_firm_mode === 'MED' && !isMed) continue;
      if (m.applicable_firm_mode === 'NONMED' && isMed) continue;

      await client.query(`
        INSERT INTO public.firm_role_permissions (
          firm_id, role, menu_key, is_enabled, created_at, updated_at
        ) VALUES ($1, $2, $3, true, NOW(), NOW())
        ON CONFLICT (firm_id, role, menu_key) DO UPDATE SET is_enabled = true, updated_at = NOW()
      `, [f.id, m.role, m.menu_key]);
    }
  }

  const permCount = await client.query('SELECT count(*) as total FROM public.firm_role_permissions');
  console.log(`✓ Total enabled permissions across all firms: ${permCount.rows[0].total}`);

  await client.end();
}

seedDefaultPermissions().catch(err => {
  console.error(err);
  process.exit(1);
});
