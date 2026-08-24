const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkCols() {
  const schema = 'tenant_srms-cet-bareilly';
  
  const c = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'courses'`, [schema]);
  console.log('Courses columns:', c.rows.map(r => r.column_name));

  const d = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'departments'`, [schema]);
  console.log('Departments columns:', d.rows.map(r => r.column_name));

  const b = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'batches'`, [schema]);
  console.log('Batches columns:', b.rows.map(r => r.column_name));

  const firms = await pool.query(`SELECT id, code, name FROM public.firms`);
  console.log('Public firms:', firms.rows);

  const sampleRepos = await pool.query(`SELECT repo_id, title, student_name, student_reg_no, colg_cd, course_cd, branch_cd, batch_cd, score, grade, status, is_placement_eligible, tech_stack, screenshots FROM "${schema}".repositories`);
  console.log('Total repos:', sampleRepos.rows.length);
  console.log('Sample repo:', sampleRepos.rows[0]);

  await pool.end();
}

checkCols().catch(console.error);
