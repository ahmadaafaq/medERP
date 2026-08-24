const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkRepositoriesTable() {
  const schema = 'tenant_srms_cet_bareilly';
  console.log(`--- Checking ${schema}.repositories ---`);

  const repos = await pool.query(`SELECT * FROM "${schema}".repositories ORDER BY repo_id ASC`);
  console.log(`Found ${repos.rows.length} records in ${schema}.repositories:`);
  console.table(repos.rows.map(r => ({
    repo_id: r.repo_id,
    student_name: r.student_name,
    project_title: r.project_title,
    branch_name: r.branch_name,
    score: r.score,
    grade: r.grade,
    status: r.status,
    evaluated_by_name: r.evaluated_by_name,
    is_incubation_selected: r.is_incubation_selected,
    incubation_status: r.incubation_status
  })));

  const reviews = await pool.query(`SELECT * FROM "${schema}".repository_reviews ORDER BY review_id ASC`);
  console.log(`Found ${reviews.rows.length} reviews in ${schema}.repository_reviews:`);
  console.table(reviews.rows.map(rw => ({
    review_id: rw.review_id,
    repo_id: rw.repo_id,
    faculty_name: rw.faculty_name,
    score: rw.score,
    grade: rw.grade
  })));

  await pool.end();
}

checkRepositoriesTable().catch(console.error);
