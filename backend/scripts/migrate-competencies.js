const { Client } = require('pg');
require('dotenv').config();

async function migrateCompetencies() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await client.connect();
  console.log('Connected to PostgreSQL for Competency / Sub-Topic Master migration.');

  const tenantsRes = await client.query(`
    SELECT slug FROM public.tenants WHERE is_active = true
  `);
  const tenants = tenantsRes.rows;
  console.log(`Found ${tenants.length} active tenants.`);

  for (const tenant of tenants) {
    const schema = `tenant_${tenant.slug}`;
    try {
      console.log(`Migrating schema: ${schema}...`);

      // Ensure competencies table exists and has all cascading columns
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".competencies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(100) NOT NULL,
          name VARCHAR(255),
          description TEXT NOT NULL,
          domain VARCHAR(100) DEFAULT 'Knowledge',
          level VARCHAR(100) DEFAULT 'Knows How',
          bloom_level VARCHAR(100) DEFAULT 'KL-2 (Understand)',
          is_core BOOLEAN DEFAULT true,
          subject_id UUID,
          subject_code VARCHAR(50),
          unit_id UUID,
          unit_code VARCHAR(50),
          topic_id UUID,
          topic_code VARCHAR(100),
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          batch_year INT,
          linker_id UUID,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Add columns if table already existed without them
      await client.query(`
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(100) DEFAULT 'KL-2 (Understand)';
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS unit_id UUID;
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS unit_code VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS topic_code VARCHAR(100);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".competencies ADD COLUMN IF NOT EXISTS batch_year INT;
      `);

      console.log(`✓ Migrated ${schema}.competencies successfully.`);
    } catch (err) {
      console.error(`Error migrating schema ${schema}:`, err.message);
    }
  }

  await client.end();
  console.log('Competency Master migration completed successfully.');
}

migrateCompetencies().catch(console.error);
