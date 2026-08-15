const { DataSource } = require('typeorm');
require('dotenv').config();

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await ds.initialize();

  const cols = await ds.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name = 'professional_linkers'
  `);
  console.log('Columns of tenant_srms-cet-bareilly.professional_linkers:');
  console.table(cols);

  // Check if professional_linkers exists in all schemas or if any constraint is failing
  const tenants = await ds.query(`SELECT slug FROM public.tenants WHERE is_active = true`);
  for (const t of tenants) {
    const s = `tenant_${t.slug}`;
    const exists = await ds.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = 'professional_linkers'
      )
    `, [s]);
    console.log(`Schema ${s} professional_linkers exists:`, exists[0].exists);
  }

  await ds.destroy();
}

main().catch(console.error);
