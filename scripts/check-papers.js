const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM "tenant_srms-ims".examination_papers');
    console.log('PAPERS COUNT IN DB:', res.rows.length);
    res.rows.forEach(r => {
      console.log(` -> ID: ${r.id} | Code: ${r.code} | Name: ${r.name} | SubjID: ${r.subject_id} | Approved: ${r.is_approved} | Mode: ${r.mode}`);
    });
  } catch (e) {
    console.error('PG Query error:', e.message);
  }
  await client.end();
}

run();
