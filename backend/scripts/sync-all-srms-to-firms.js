const { Client } = require('pg');

async function syncAllSrmsToFirms() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  // 1. Fetch all tenants from public.tenants
  const tenants = await client.query('SELECT * FROM public.tenants ORDER BY name ASC');
  console.log(`Found ${tenants.rows.length} tenants in public.tenants`);

  for (const t of tenants.rows) {
    const slug = t.slug.toLowerCase().trim();
    const mode = slug.includes('ims') || slug.includes('nursing') || slug.includes('iahs') || slug.includes('med') ? 'MED' : 'NONMED';
    const isSrms = slug.startsWith('srms');
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year active license

    await client.query(`
      INSERT INTO public.firms (
        id, title, slug, tenant_name, domain, level_type, theme_color, firm_mode,
        status, trial_days, trial_started_at, trial_ends_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $2, $4, 'ENTERPRISE', $5, $6,
        'ACTIVE', 365, NOW(), $7, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        tenant_name = EXCLUDED.tenant_name,
        domain = COALESCE(EXCLUDED.domain, public.firms.domain),
        theme_color = COALESCE(EXCLUDED.theme_color, public.firms.theme_color),
        firm_mode = EXCLUDED.firm_mode,
        updated_at = NOW()
    `, [
      t.id,
      t.name,
      slug,
      t.domain || `${slug}.mederp.app`,
      t.primary_color || '#5B4BFF',
      mode,
      trialEndsAt,
    ]);

    console.log(`✓ Added/Synced Firm: ${t.name} (slug: ${slug}, mode: ${mode})`);
  }

  const allFirms = await client.query('SELECT id, title, slug, firm_mode, status FROM public.firms ORDER BY title ASC');
  console.log(`\n--- ALL ${allFirms.rows.length} REGISTERED SAAS FIRMS IN OWNER PORTAL ---`);
  console.table(allFirms.rows);

  await client.end();
}

syncAllSrmsToFirms().catch(err => {
  console.error(err);
  process.exit(1);
});
