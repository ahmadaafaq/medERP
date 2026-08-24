const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkReposInTenant() {
  const schema = 'tenant_srms-cet-bareilly';
  const res = await pool.query(
    `SELECT repo_id, title, student_name, student_reg_no, score, grade, incubation_status, status FROM "${schema}".repositories ORDER BY repo_id ASC`
  );
  console.log('Repositories in tenant_srms-cet-bareilly:');
  console.table(res.rows);

  await pool.end();
}

checkReposInTenant().catch(console.error);
