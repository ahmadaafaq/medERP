const { Client } = require('pg');

async function fixFirmTrial() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();

  // Set SRMS CET Bareilly trial_ends_at to 2 days from now
  await client.query(`
    UPDATE public.firms
    SET trial_days = 2,
        trial_ends_at = NOW() + INTERVAL '2 days',
        updated_at = NOW()
    WHERE slug = 'srms-cet-bareilly'
  `);

  console.log('Updated SRMS CET Bareilly trial to 2 days');
  await client.end();
}

fixFirmTrial().catch(err => {
  console.error(err);
  process.exit(1);
});
