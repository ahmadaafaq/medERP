require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function main() {
  const schema = 'tenant_srms-cet-bareilly';
  const sql = `
    SELECT r.repo_id, r.student_name, r.student_reg_no, r.course_cd, r.branch_cd, r.batch_cd,
           COALESCE(crs.crs_name, r.course_cd, 'B.Tech.') AS course_name,
           COALESCE(dep.dep_name, r.branch_cd, 'Computer Science & Engineering') AS branch_name,
           COALESCE(bth.bth_name, r.batch_cd, 'Batch 2022-26') AS batch_name,
           r.status, r.score, r.grade,
           COALESCE(rev.faculty_name, r.mentor_assigned) AS faculty_name
    FROM "${schema}".repositories r
    LEFT JOIN LATERAL (
      SELECT s.photo_url, s.rollno, s.department_id
      FROM "${schema}".students s
      WHERE s.registration_no = r.student_reg_no OR s.rollno = r.student_reg_no
      LIMIT 1
    ) stu ON true
    LEFT JOIN LATERAL (
      SELECT c.name AS crs_name
      FROM "${schema}".courses c
      WHERE c.code = r.course_cd OR c.course_cd = r.course_cd OR c.id::text = r.course_cd
      LIMIT 1
    ) crs ON true
    LEFT JOIN LATERAL (
      SELECT d.name AS dep_name
      FROM "${schema}".departments d
      WHERE d.id::text = stu.department_id::text
         OR (d.course_cd = r.course_cd AND (d.code = r.branch_cd OR d.branch_cd = r.branch_cd))
         OR d.course_cd = r.course_cd
         OR d.id::text = r.branch_cd
         OR d.code = r.branch_cd
      ORDER BY 
        CASE 
          WHEN d.course_cd = r.course_cd AND (d.code = r.branch_cd OR d.branch_cd = r.branch_cd) THEN 0
          WHEN d.course_cd = r.course_cd AND d.id::text = stu.department_id::text THEN 1
          WHEN d.course_cd = r.course_cd THEN 2
          WHEN d.id::text = stu.department_id::text THEN 3
          ELSE 4
        END,
        d.id
      LIMIT 1
    ) dep ON true
    LEFT JOIN LATERAL (
      SELECT b.name AS bth_name
      FROM "${schema}".batches b
      WHERE b.code = r.batch_cd OR b.id::text = r.batch_cd OR b.batch_cd = r.batch_cd
      LIMIT 1
    ) bth ON true
    LEFT JOIN LATERAL (
      SELECT rw.faculty_name, rw.score, rw.grade
      FROM "${schema}".repository_reviews rw
      WHERE rw.repo_id = r.repo_id
      ORDER BY rw.reviewed_at DESC
      LIMIT 1
    ) rev ON true
    ORDER BY r.repo_id ASC
  `;
  const res = await pool.query(sql);
  console.table(res.rows);
  await pool.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
