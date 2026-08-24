const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkStudentFacultyColumns() {
  const schema = 'tenant_srms-cet-bareilly';
  const studentCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'students'`,
    [schema]
  );
  console.log('Students columns:', studentCols.rows.map(r => r.column_name));

  const facultyCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'faculty'`,
    [schema]
  );
  console.log('Faculty columns:', facultyCols.rows.map(r => r.column_name));

  const sampleStudent = await pool.query(`SELECT id, name, registration_no, rollno, photo_url FROM "${schema}".students LIMIT 2`);
  console.log('Sample student:', sampleStudent.rows);

  await pool.end();
}

checkStudentFacultyColumns().catch(console.error);
