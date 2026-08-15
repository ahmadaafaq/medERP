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
    WHERE table_schema = 'tenant_srms-cet-bareilly' AND table_name = 'subject_offerings'
  `);
  console.log('Columns of tenant_srms-cet-bareilly.subject_offerings:');
  console.table(cols);

  await ds.destroy();
}

main().catch(console.error);
