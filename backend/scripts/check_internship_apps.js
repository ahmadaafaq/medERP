const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function check() {
  const schema = 'tenant_srms-cet-bareilly';
  
  const res = await pool.query(`SELECT id, registration_no, rollno, name, course_cd, batch_cd FROM "${schema}".students LIMIT 5`);
  console.log('Students:', res.rows);

  // Update any null applicant row with student details
  if (res.rows.length > 0) {
    const s = res.rows[0];
    const up = await pool.query(`
      UPDATE "${schema}".internship_applications
      SET student_id = $1, student_reg_no = $2, student_name = $3, course_cd = $4, batch_cd = $5
      WHERE student_name IS NULL OR student_reg_no IS NULL
      RETURNING *
    `, [s.id, s.registration_no || s.rollno, s.name, s.course_cd, s.batch_cd]);
    console.log('Updated null applications:', up.rows);
  }

  await pool.end();
}

check().catch(console.error);
