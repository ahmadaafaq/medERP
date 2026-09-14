const { Client } = require('pg');
const c = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function main() {
  await c.connect();
  await c.query("UPDATE public.firms SET status = 'ACTIVE' WHERE slug = 'srms-ims'");
  await c.query("UPDATE public.tenants SET is_active = true WHERE slug = 'srms-ims'");
  console.log('srms-ims successfully activated in database.');
  await c.end();
}

main().catch(console.error);
