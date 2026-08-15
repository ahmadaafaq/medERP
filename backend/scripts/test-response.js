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

  const slug = 'srms-cet-bareilly';

  const rows = await ds.query(`
    SELECT so.*, 
           s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
           p.name AS prof_name, p.phase_order, p.academic_year,
           dt.name AS dtype_name, dt.code AS dtype_code
    FROM "tenant_${slug}".subject_offerings so
    LEFT JOIN "tenant_${slug}".subjects s ON so.subject_id = s.id
    LEFT JOIN "tenant_${slug}".professional_phases p ON so.prof_id = p.id
    LEFT JOIN "tenant_${slug}".delivery_types dt ON so.dtype_id = dt.id
    LIMIT 1
  `);

  console.log('Sample offering data returned:');
  console.log(JSON.stringify(rows[0], null, 2));

  await ds.destroy();
}

main().catch(console.error);
