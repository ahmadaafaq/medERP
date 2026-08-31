const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();

  const students = await client.query(`
    SELECT 
      st.id,
      st.name,
      st.rollno,
      st.registration_no,
      st.course_cd,
      st.branch_id,
      st.batch_cd,
      st.batch_id,
      st.photo_url,
      c.name as course_name,
      d.name as branch_name,
      b.name as batch_name,
      b.year as batch_year
    FROM "tenant_srms-cet-bareilly".students st
    LEFT JOIN "tenant_srms-cet-bareilly".courses c ON (c.course_cd = st.course_cd OR c.id::text = st.course_cd OR c.code = st.course_cd)
    LEFT JOIN "tenant_srms-cet-bareilly".departments d ON (d.id::text = st.branch_id::text OR d.branch_cd = st.branch_id OR d.code = st.branch_id)
    LEFT JOIN "tenant_srms-cet-bareilly".batches b ON (b.id::text = st.batch_id::text OR b.batch_cd = st.batch_cd OR b.code = st.batch_cd)
    LIMIT 25
  `);

  console.log('Total students sample:', students.rows.length);
  console.log(JSON.stringify(students.rows, null, 2));

  await client.end();
}

main().catch(console.error);
