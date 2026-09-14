const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp',
});

async function check() {
  await client.connect();
  const u = await client.query('SELECT * FROM "tenant_rimt-bareilly".users WHERE id = $1', ['49db0511-c499-457c-8338-83a0f8cf623e']);
  const user = u.rows[0];
  console.log('User in DB:', {
    id: user.id,
    email: user.email,
    username: user.username,
    emp_id: user.emp_id,
    role: user.role,
    password_hash: user.password_hash
  });

  console.log('Match admin@123?', await bcrypt.compare('admin@123', user.password_hash));
  console.log('Match admin@123#?', await bcrypt.compare('admin@123#', user.password_hash));
  console.log('Match rajshree@123#?', await bcrypt.compare('rajshree@123#', user.password_hash));

  const allU = await client.query('SELECT id, email, username, emp_id, role, password_hash FROM "tenant_rimt-bareilly".users');
  console.log('All users in tenant_rimt-bareilly:', allU.rows);

  const f = await client.query('SELECT id, user_id, emp_id, name, designation, email FROM "tenant_rimt-bareilly".faculty WHERE emp_id = $1', ['DR/01/2026']);
  console.log('Faculty in DB:', f.rows);

  await client.end();
}
check().catch(console.error);
