const { DataSource } = require('typeorm');
require('dotenv').config();

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  await ds.initialize();

  const tenants = await ds.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`);
  console.log('Found schemas:', tenants.map(t => t.schema_name));

  for (const t of tenants) {
    const s = t.schema_name;
    console.log(`\nEnsuring table "units" in ${s}...`);
    await ds.query(`
      CREATE TABLE IF NOT EXISTS "${s}".units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        description TEXT,
        subject_id UUID,
        subject_code VARCHAR(50),
        course_cd VARCHAR(50),
        course_name VARCHAR(255),
        branch_cd VARCHAR(50),
        batch_id UUID,
        batch_year INT,
        bloom_level VARCHAR(100) DEFAULT 'KL-2 (Understand)',
        unit_order INT DEFAULT 1,
        hours INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Ensure foreign keys if possible
    await ds.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'units_subject_id_fkey' AND table_schema = '${s}'
        ) THEN
          ALTER TABLE "${s}".units 
          ADD CONSTRAINT units_subject_id_fkey 
          FOREIGN KEY (subject_id) REFERENCES "${s}".subjects(id) ON DELETE SET NULL;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    console.log(`units table verified in ${s}`);
  }

  await ds.destroy();
}

main().catch(console.error);
