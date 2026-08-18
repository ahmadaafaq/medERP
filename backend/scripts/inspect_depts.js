const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { DataSource } = require('typeorm');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function run() {
  await ds.initialize();
  const depts = await ds.query(`SELECT id, code, name, branch_cd, course_cd, course_name FROM "tenant_srms-cet-bareilly".departments;`);
  console.log('Departments in CET:', depts);
  await ds.destroy();
}

run().catch(console.error);
