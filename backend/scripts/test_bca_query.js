const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function testQueryWithBcaStudent() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // Test with BCA student
  const student = {
    id: 'd15c27b1-5ad0-49da-b71a-f5b100feb2f8',
    course_cd: '13',
    batch_cd: '2',
  };

  const sql = `
    SELECT t.id, t.title, t.course_id, t.batch_id, t.branch_id, t.semester_id,
           c.name as category_name
    FROM "${schema}".logbook_topics t
    LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
    WHERE t.is_active = true
      AND (t.course_id IS NULL OR t.course_id = 'all' OR t.course_id = '' OR t.course_id = $1)
      AND (t.batch_id IS NULL OR t.batch_id = 'all' OR t.batch_id = '' OR t.batch_id = $2)
    ORDER BY t.created_at DESC
  `;

  const res = await pool.query(sql, [student.course_cd, student.batch_cd]);
  console.log('Found topics for student:', res.rows);
  await pool.end();
}

testQueryWithBcaStudent();
