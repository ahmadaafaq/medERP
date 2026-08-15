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

  const tables = await ds.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'tenant_srms-cet-bareilly'
  `);
  console.table(tables.map(t => t.table_name));

  await ds.destroy();
}

main().catch(console.error);
