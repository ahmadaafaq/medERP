const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function main() {
  await ds.initialize();
  const slug = 'tenant_srms-cet-bareilly';
  
  // Test distinct students for BCA / Course 13 / Batch 2 or 18
  const res = await ds.query(`
    SELECT DISTINCT ON (s.id) 
           s.id, s.name, s.rollno, s.registration_no, s.course_cd, s.batch_cd,
           COALESCE(sa.college_name, 'SRMS CET,BAREILLY') as college_name,
           COALESCE(sa.course_code, s.course_cd, 'BCA') as course_name,
           COALESCE(sa.batch_code, s.batch_cd, '2025') as batch_name
    FROM "${slug}".students s
    LEFT JOIN "${slug}".student_admissions sa ON sa.student_id = s.id
    WHERE (s.course_cd = '13' OR sa.course_code = 'BCA' OR '1'='1')
    ORDER BY s.id, s.rollno ASC
    LIMIT 30
  `);
  console.log('Found students count:', res.length);
  console.log('First 5:', res.slice(0, 5));
  await ds.destroy();
}

main().catch(console.error);
