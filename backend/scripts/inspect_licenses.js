const { Client } = require('pg');

async function inspectLicenses() {
  const client = new Client({
    connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  await client.connect();
  console.log('Connected to DB');

  const lk = await client.query(`SELECT id, firm_id, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal FROM public.license_keys ORDER BY created_at DESC`);
  console.log('--- License Keys ---');
  console.table(lk.rows);

  const tx = await client.query(`SELECT id, firm_id, license_key_id, amount, payment_method, transaction_ref, status, paid_at FROM public.transactions ORDER BY created_at DESC`);
  console.log('--- Transactions ---');
  console.table(tx.rows);

  const firms = await client.query(`SELECT id, title, slug, status, trial_days, trial_started_at, trial_ends_at FROM public.firms`);
  console.log('--- Firms ---');
  console.table(firms.rows);

  await client.end();
}

inspectLicenses().catch(err => {
  console.error(err);
  process.exit(1);
});
