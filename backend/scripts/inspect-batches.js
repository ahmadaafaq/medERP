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
  console.log('Connected to PostgreSQL DB ✅');

  const rows = await ds.query('SELECT id, code, name, year, batch_cd, course_cd, course_name, colg_cd, curr_bat_cd, is_active FROM "tenant_srms-cet-bareilly".batches ORDER BY course_cd, year');
  console.log('Batches in tenant_srms-cet-bareilly count:', rows.length);
  console.table(rows);

  await ds.destroy();
}

main().catch(console.error);
