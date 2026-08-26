const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp'
  });
  await client.connect();
  const res = await client.query(`
    SELECT repo_id, title, student_name, student_reg_no, score, incubation_status, funding_amount 
    FROM "tenant_srms-cet-bareilly".repositories
    ORDER BY repo_id ASC
  `);
  console.log('Repositories count:', res.rows.length);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
