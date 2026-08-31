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

  const counts = await client.query(`
    SELECT 
      st.course_cd,
      COALESCE(c.name, st.course_cd) as course_name,
      COUNT(DISTINCT st.id) as student_count
    FROM "tenant_srms-cet-bareilly".students st
    LEFT JOIN "tenant_srms-cet-bareilly".courses c ON (c.course_cd = st.course_cd OR c.id::text = st.course_cd OR c.code = st.course_cd)
    GROUP BY st.course_cd, c.name
    ORDER BY student_count DESC
  `);

  console.log('Students by course:', counts.rows);

  const batches = await client.query(`
    SELECT DISTINCT batch_cd, COUNT(*) FROM "tenant_srms-cet-bareilly".students GROUP BY batch_cd
  `);
  console.log('Students by batch:', batches.rows);

  await client.end();
}

main().catch(console.error);
