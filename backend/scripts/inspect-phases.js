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

  const phases = await ds.query(`SELECT * FROM "tenant_srms-cet-bareilly".professional_phases LIMIT 10`);
  console.log('Sample professional_phases in tenant_srms-cet-bareilly:');
  console.table(phases);

  await ds.destroy();
}

main().catch(console.error);
