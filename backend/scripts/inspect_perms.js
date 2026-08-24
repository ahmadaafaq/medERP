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
  const firms = await client.query("SELECT id, title, slug, firm_mode FROM public.firms WHERE slug ILIKE '%cet%' OR slug ILIKE '%trust%'");
  console.log('FIRMS MATCHED:', firms.rows);

  for (const f of firms.rows) {
    const p = await client.query('SELECT role, count(id) as count, array_agg(menu_key) as keys FROM public.firm_role_permissions WHERE firm_id = $1 GROUP BY role', [f.id]);
    console.log(`\n=== FIRM: ${f.title} (slug: ${f.slug}, id: ${f.id}) ===`);
    for (const row of p.rows) {
      console.log(`  Role: ${row.role} (count: ${row.count}):`, row.keys);
    }
  }
  await client.end();
}

main().catch(console.error);
