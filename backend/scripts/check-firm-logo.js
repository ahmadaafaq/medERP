const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp'
});

async function main() {
  await client.connect();
  const firms = await client.query(`SELECT id, title, slug, logo_url FROM public.firms`);
  console.log('ALL FIRMS:');
  for (const f of firms.rows) {
    console.log({
      id: f.id,
      title: f.title,
      slug: f.slug,
      has_logo: !!f.logo_url,
      logo_len: f.logo_url ? f.logo_url.length : 0,
      logo_start: f.logo_url ? f.logo_url.substring(0, 50) : null
    });
  }

  const tenants = await client.query(`SELECT id, name, slug, logo_url FROM public.tenants`);
  console.log('ALL TENANTS:');
  for (const t of tenants.rows) {
    console.log({
      id: t.id,
      name: t.name,
      slug: t.slug,
      has_logo: !!t.logo_url,
      logo_len: t.logo_url ? t.logo_url.length : 0,
      logo_start: t.logo_url ? t.logo_url.substring(0, 50) : null
    });
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
