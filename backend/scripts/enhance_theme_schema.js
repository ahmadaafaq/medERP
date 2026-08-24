const { Client } = require('pg');

async function enhanceFirmsThemeSchema() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  await client.query(`
    ALTER TABLE public.firms 
    ADD COLUMN IF NOT EXISTS favicon_url TEXT,
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) DEFAULT 'OWNER';
  `);

  console.log('Successfully enhanced public.firms with favicon_url and updated_by');
  await client.end();
}

enhanceFirmsThemeSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
