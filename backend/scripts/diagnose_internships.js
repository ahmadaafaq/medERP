const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkCoursesBatches() {
  const schema = 'tenant_srms-cet-bareilly';
  const c = await pool.query(`SELECT id, code, name FROM "${schema}".courses LIMIT 5`);
  console.log('Courses:', c.rows);

  const b = await pool.query(`SELECT id, code, name FROM "${schema}".batches LIMIT 5`);
  console.log('Batches:', b.rows);

  await pool.end();
}

checkCoursesBatches().catch(console.error);
