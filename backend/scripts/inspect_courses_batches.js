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
  
  // 1. Group by course_cd, course_code
  const courses = await ds.query(`
    SELECT DISTINCT s.course_cd, sa.course_code, count(*)
    FROM "${slug}".students s
    LEFT JOIN "${slug}".student_admissions sa ON sa.student_id = s.id
    GROUP BY s.course_cd, sa.course_code
  `);
  console.log('Courses in DB:', courses);

  // 2. Group by batch_cd, batch_code for BCA
  const bcaBatches = await ds.query(`
    SELECT DISTINCT s.batch_cd, sa.batch_code, sa.batch_id, count(*)
    FROM "${slug}".students s
    LEFT JOIN "${slug}".student_admissions sa ON sa.student_id = s.id
    WHERE s.course_cd = '13' OR sa.course_code ILIKE '%BCA%'
    GROUP BY s.batch_cd, sa.batch_code, sa.batch_id
  `);
  console.log('BCA Batches in DB:', bcaBatches);

  // 3. List all BCA students for 2025 / Batch 2
  const bca2025 = await ds.query(`
    SELECT DISTINCT ON (s.id)
           s.id, s.name, s.rollno, s.registration_no, s.course_cd, s.batch_cd,
           sa.course_code, sa.batch_code, sa.college_name
    FROM "${slug}".students s
    LEFT JOIN "${slug}".student_admissions sa ON sa.student_id = s.id
    WHERE (s.course_cd = '13' OR sa.course_code ILIKE '%BCA%')
      AND (s.batch_cd = '2' OR s.batch_cd = '2025' OR sa.batch_code ILIKE '%2025%' OR sa.batch_code ILIKE '%B2025%')
    ORDER BY s.id, s.rollno ASC
  `);
  console.log('BCA 2025 count:', bca2025.length);
  console.log('BCA 2025 students:', bca2025);

  await ds.destroy();
}

main().catch(console.error);
