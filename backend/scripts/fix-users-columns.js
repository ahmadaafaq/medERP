const { Client } = require('pg');

async function fixUserColumns() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const schemasRes = await client.query(`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
  `);

  for (const s of schemasRes.rows) {
    const schema = s.schema_name;
    try {
      await client.query(`
        ALTER TABLE "${schema}".users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
        ALTER TABLE "${schema}".users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;
        ALTER TABLE "${schema}".users ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0;
        ALTER TABLE "${schema}".users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(200);
        ALTER TABLE "${schema}".users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
      `);
      console.log(`✓ Fixed users columns in ${schema}`);
    } catch (e) {
      console.warn(`Note on ${schema}:`, e.message);
    }
  }

  await client.end();
  console.log('ALL TENANT USER TABLES SYNCHRONIZED!');
}

fixUserColumns().catch(err => {
  console.error(err);
  process.exit(1);
});
