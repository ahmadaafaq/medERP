const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  const res = await pool.query(`
    SELECT id, name, code, year, course_cd, batch_cd 
    FROM "tenant_srms-cet-bareilly".batches 
    WHERE course_cd IN ('1', '13', '4', '3', '2')
    ORDER BY course_cd, year DESC
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

run();
