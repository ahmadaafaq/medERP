const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function checkNotificationTables() {
  const schema = 'tenant_srms-cet-bareilly';
  const tables = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema IN ($1, 'public') AND table_name ILIKE '%notif%' OR table_name ILIKE '%notice%'`,
    [schema]
  );
  console.log('Tables matching notif / notice:', tables.rows);

  const notifCols = await pool.query(
    `SELECT column_name, table_schema, table_name FROM information_schema.columns WHERE table_name = 'notifications'`
  );
  console.log('Notifications columns:', notifCols.rows);

  await pool.end();
}

checkNotificationTables().catch(console.error);
