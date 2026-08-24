const { Client } = require('pg');

async function verify() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });
  await client.connect();

  const userRes = await client.query(
    'SELECT id, email, role, emp_id, usr_id, devicecd, loc_cd, department FROM "tenant_srms-cet-bareilly".users WHERE usr_id = $1',
    ['SUJ9'],
  );
  console.log('PG USER RECORD:', userRes.rows[0]);

  const facRes = await client.query(
    'SELECT id, emp_id, name, usr_id, devicecd, loc_cd, phone, designation FROM "tenant_srms-cet-bareilly".faculty WHERE usr_id = $1',
    ['SUJ9'],
  );
  console.log('PG FACULTY RECORD:', facRes.rows[0]);

  await client.end();
}

verify().catch(console.error);
