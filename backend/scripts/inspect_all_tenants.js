const { Client } = require('pg');

async function main() {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });
  await c.connect();

  for (const schema of ['tenant_srms-cet-bareilly', 'tenant_srms-cet', 'tenant_srms-ims']) {
    console.log('============================ ' + schema + ' ============================');
    try {
      const courses = await c.query(`SELECT code, name FROM "${schema}".courses LIMIT 10`);
      console.log('Courses:', courses.rows);
      const depts = await c.query(`SELECT code, name FROM "${schema}".departments LIMIT 10`);
      console.log('Depts:', depts.rows);
      const students = await c.query(`SELECT name, rollno, registration_no, course_cd FROM "${schema}".students LIMIT 5`);
      console.log('Students:', students.rows);
      const fac = await c.query(`SELECT name, emp_id, designation FROM "${schema}".faculty LIMIT 5`);
      console.log('Faculty:', fac.rows);
    } catch (e) {
      console.log('Error querying schema ' + schema + ':', e.message);
    }
  }

  await c.end();
}

main().catch(console.error);
