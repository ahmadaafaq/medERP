const { Client } = require('pg');
require('dotenv').config();

async function migrateTopics() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await client.connect();
  console.log('Connected to PostgreSQL for Topic Master unit migration.');

  const tenantsRes = await client.query(`
    SELECT slug FROM public.tenants WHERE is_active = true
  `);
  const tenants = tenantsRes.rows;
  console.log(`Found ${tenants.length} active tenants.`);

  for (const tenant of tenants) {
    const schema = `tenant_${tenant.slug}`;
    try {
      console.log(`Migrating schema: ${schema}...`);

      // Ensure topics table exists and has all unit & cascading metadata columns
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(100) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          subject_id UUID,
          subject_code VARCHAR(50),
          unit_id UUID,
          unit_code VARCHAR(50),
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          batch_year INT,
          bloom_level VARCHAR(100),
          linker_id UUID,
          hours INT DEFAULT 1,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Add columns if table already existed without them
      await client.query(`
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS unit_id UUID;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS unit_code VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS batch_year INT;
        ALTER TABLE "${schema}".topics ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(100);
      `);

      console.log(`✓ Migrated ${schema}.topics successfully.`);
    } catch (err) {
      console.error(`Error migrating schema ${schema}:`, err.message);
    }
  }

  await client.end();
  console.log('Topic Master migration completed successfully.');
}

migrateTopics().catch(console.error);
