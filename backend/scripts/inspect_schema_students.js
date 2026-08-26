const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function inspectSchema() {
  const schema = 'tenant_srms-cet-bareilly';
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = 'students'
  `, [schema]);
  console.log('Students table columns:', cols.rows.map(c => c.column_name));

  const sample = await pool.query(`SELECT id, user_id, name, rollno, course_cd, batch_cd, current_semester FROM "${schema}".students LIMIT 3`);
  console.log('Sample Students:', sample.rows);

  const topics = await pool.query(`SELECT * FROM "${schema}".logbook_topics`);
  console.log('Topics:', topics.rows);

  await pool.end();
}

inspectSchema();
