const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkNotifCols() {
  const schema = 'tenant_srms-cet-bareilly';
  const notifCols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'notifications'`,
    [schema]
  );
  console.log('tenant_srms-cet-bareilly notifications columns:', notifCols.rows);
  await pool.end();
}

checkNotifCols().catch(console.error);
