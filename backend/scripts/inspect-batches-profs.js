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

  const batches = await ds.query(`SELECT id, code, batch_cd, name, year, course_cd FROM "tenant_srms-cet-bareilly".batches LIMIT 5`);
  console.log('Sample batches in tenant_srms-cet-bareilly:');
  console.table(batches);

  const profs = await ds.query(`SELECT id, name, phase_order, course_cd, branch_cd, academic_system, academic_year FROM "tenant_srms-cet-bareilly".professional_years LIMIT 10`);
  console.log('Sample professional_years in tenant_srms-cet-bareilly:');
  console.table(profs);

  const dtypes = await ds.query(`SELECT id, code, name FROM "tenant_srms-cet-bareilly".delivery_types LIMIT 10`);
  console.log('Sample delivery_types in tenant_srms-cet-bareilly:');
  console.table(dtypes);

  await ds.destroy();
}

main().catch(console.error);
