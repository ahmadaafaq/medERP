const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function main() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';
  
  const courses = await client.query(`SELECT * FROM "${schema}".courses ORDER BY code`);
  console.log('Courses in DB:', JSON.stringify(courses.rows, null, 2));

  const batches = await client.query(`
    SELECT b.id, b.code, b.batch_cd, b.name, b.year, b.course_cd, b.colg_cd, b.curr_bat_cd, b.is_active,
           c.name as course_name
    FROM "${schema}".batches b
    LEFT JOIN "${schema}".courses c ON (c.code = b.course_cd OR c.id::text = b.course_cd)
    ORDER BY b.course_cd, b.year DESC
  `);
  console.log('Batches in DB:', JSON.stringify(batches.rows, null, 2));

  await client.end();
}

main().catch(console.error);
