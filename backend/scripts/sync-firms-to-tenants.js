const { Client } = require('pg');

async function sync() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const firms = await client.query('SELECT id, title, slug, domain, theme_color, level_type FROM public.firms');
  console.log(`Found ${firms.rows.length} firms in public.firms`);

  for (const f of firms.rows) {
    const cleanSlug = f.slug.toLowerCase().trim();
    await client.query(`
      INSERT INTO public.tenants (id, name, slug, code, domain, primary_color, plan, is_active, schema_provisioned, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        domain = COALESCE(EXCLUDED.domain, public.tenants.domain),
        primary_color = COALESCE(EXCLUDED.primary_color, public.tenants.primary_color),
        plan = COALESCE(EXCLUDED.plan, public.tenants.plan),
        is_active = true,
        updated_at = NOW()
    `, [
      f.id,
      f.title,
      cleanSlug,
      cleanSlug,
      f.domain || null,
      f.theme_color || '#5B4BFF',
      f.level_type || 'standard',
    ]);
    console.log(`Synced tenant: ${f.title} (${cleanSlug})`);
  }

  const allTenants = await client.query('SELECT id, name, slug, code, is_active FROM public.tenants ORDER BY name ASC');
  console.log('\n--- ALL CURRENT TENANTS IN PUBLIC.TENANTS ---');
  console.table(allTenants.rows);

  await client.end();
}

sync().catch((err) => {
  console.error('SYNC ERROR:', err);
  process.exit(1);
});
