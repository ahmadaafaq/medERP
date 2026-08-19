const { Client } = require('pg');
const client = new Client({ host: 'localhost', port: 5432, user: 'unicampus', password: 'unicampus_secret', database: 'unicampus_erp' });

async function check() {
  await client.connect();
  const schemasRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'");
  for (const row of schemasRes.rows) {
    const s = row.schema_name;
    try {
      const depts = await client.query(`SELECT id, code, name FROM "${s}".departments`);
      const facs = await client.query(`
        SELECT f.id, f.emp_id, f.name, f.designation, f.department_id, d.name as dept_name, u.email, u.role
        FROM "${s}".faculty f
        JOIN "${s}".users u ON u.id = f.user_id
        LEFT JOIN "${s}".departments d ON d.id = f.department_id
      `);
      if (facs.rows.length > 0 || depts.rows.length > 0) {
        console.log(`\n=== ${s} ===`);
        console.log(`Departments (${depts.rows.length}):`, depts.rows);
        console.log(`Faculty (${facs.rows.length}):`, facs.rows);
      }
    } catch (_) {}
  }
  await client.end();
}
check().catch(console.error);
