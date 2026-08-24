const { Client } = require('pg');

async function setupThemeStudioTables() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  // Create tenant_theme_drafts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tenant_theme_drafts (
      tenant_id UUID PRIMARY KEY,
      tenant_slug VARCHAR(255) NOT NULL,
      draft_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by VARCHAR(255) DEFAULT 'OWNER',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Create tenant_theme_history table
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.tenant_theme_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      tenant_slug VARCHAR(255) NOT NULL,
      version INT NOT NULL,
      theme_config JSONB NOT NULL,
      published_by VARCHAR(255) DEFAULT 'OWNER',
      published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      notes TEXT
    );
  `);

  console.log('Successfully configured tenant_theme_drafts and tenant_theme_history tables.');
  await client.end();
}

setupThemeStudioTables().catch(err => {
  console.error(err);
  process.exit(1);
});
