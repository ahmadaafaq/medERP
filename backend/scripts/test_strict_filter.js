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
  const coursecd = '13';
  const ddl_batch = '2';

  const rows = await ds.query(
    `SELECT DISTINCT ON (s.id)
            s.id, s.name, s.rollno, s.registration_no, s.course_cd, s.batch_cd,
            COALESCE(sa.college_name, 'SRMS CET, BAREILLY') AS college_name,
            COALESCE(sa.course_code, s.course_cd, 'BCA') AS course_name,
            COALESCE(sa.batch_code, s.batch_cd, '2025') AS batch_name
     FROM "${slug}".students s
     LEFT JOIN "${slug}".student_admissions sa ON sa.student_id = s.id
     WHERE (
       (s.course_cd = $1 OR sa.course_code = $1)
       OR ($1 = '13' AND (sa.course_code ILIKE '%BCA%' OR s.course_cd = '13'))
       OR ($1 = '1' AND (sa.course_code ILIKE '%B.Tech%' OR s.course_cd = '1'))
       OR ($1 = '2' AND (sa.course_code ILIKE '%MCA%' OR s.course_cd = '2'))
       OR ($1 = '4' AND (sa.course_code ILIKE '%MBA%' OR s.course_cd = '4'))
     )
     AND (
       s.batch_cd = $2 OR sa.batch_code = $2 OR sa.batch_id::text = $2
       OR ($2 = '2' AND (s.batch_cd = '2' OR sa.batch_code ILIKE '%2025%' OR sa.batch_code ILIKE '%B2025%' OR s.batch_cd = '2025'))
       OR ($2 = '18' AND (s.batch_cd = '18' OR sa.batch_code ILIKE '%2024%' OR sa.batch_code ILIKE '%B2024%'))
       OR ($2 = '17' AND (s.batch_cd = '17' OR sa.batch_code ILIKE '%2023%' OR sa.batch_code ILIKE '%B2023%'))
       OR $2 = 'all' OR $2 = ''
     )
     ORDER BY s.id, s.rollno ASC
     LIMIT 50`,
    [coursecd, ddl_batch]
  );

  console.log('Result count:', rows.length);
  const coursesSeen = [...new Set(rows.map(r => r.course_name))];
  const batchesSeen = [...new Set(rows.map(r => r.batch_name))];
  console.log('Courses in result (MUST ONLY BE BCA):', coursesSeen);
  console.log('Batches in result (MUST ONLY BE 2025 / B2025):', batchesSeen);
  console.log('First 5 rows:');
  console.table(rows.slice(0, 5).map(r => ({ roll: r.rollno, name: r.name, course: r.course_name, batch: r.batch_name })));

  await ds.destroy();
}

main().catch(console.error);
