const { Client } = require('pg');
const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('=== Examination Papers ===');
  const papers = await client.query(`SELECT * FROM "${schema}".examination_papers LIMIT 3`);
  console.log(papers.rows);

  console.log('\n=== Student Results ===');
  const res = await client.query(`
    SELECT sr.id, sr.student_id, st.name, st.rollno, st.registration_no, ep.name AS paper_name, ep.max_marks, sr.marks_obtained,
           ROUND((sr.marks_obtained::numeric / NULLIF(ep.max_marks::numeric, 0)) * 100, 1) AS theory_pct
    FROM "${schema}".student_results sr
    LEFT JOIN "${schema}".students st ON st.id::text = sr.student_id::text
    LEFT JOIN "${schema}".examination_papers ep ON ep.id::text = sr.paper_id::text
  `);
  console.log(res.rows);

  await client.end();
}
run();
