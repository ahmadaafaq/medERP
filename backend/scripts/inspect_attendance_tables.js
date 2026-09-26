const { Client } = require('pg');

const c = new Client({
  host: '34.236.107.120',
  port: 5433,
  user: 'unicampus',
  password: 'unicampus_dev@qsd!3ous',
  database: 'unicampus_erp'
});

async function main() {
  await c.connect();
  const schema = 'tenant_srms-cet-bareilly';

  const res1 = await c.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = 'attendance_sessions'
    ORDER BY ordinal_position
  `, [schema]);

  console.log('--- ATTENDANCE_SESSIONS ---');
  res1.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (null: ${r.is_nullable})`));

  const res2 = await c.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = 'attendance_records'
    ORDER BY ordinal_position
  `, [schema]);

  console.log('\n--- ATTENDANCE_RECORDS ---');
  res2.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (null: ${r.is_nullable})`));

  await c.end();
}

main().catch(console.error);
