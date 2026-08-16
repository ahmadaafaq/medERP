const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'unicampus_erp',
  user: 'unicampus',
  password: 'unicampus_secret',
});

async function main() {
  await client.connect();
  const s = 'tenant_srms-cet-bareilly';
  
  const rawFaculty = await client.query(`SELECT ctid, id, user_id, emp_id, name, email FROM "${s}".faculty`);
  console.log('Raw faculty rows in table:', rawFaculty.rows.length);
  rawFaculty.rows.forEach(r => console.log(r));

  await client.end();
}

main().catch(console.error);
