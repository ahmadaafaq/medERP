const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  try {
    await client.connect();
    console.log('Connected to unicampus_erp database.');

    // 1. Check duplicate transactions
    const countRes = await client.query(`
      SELECT transaction_ref, firm_id, COUNT(*) as count 
      FROM public.transactions 
      GROUP BY transaction_ref, firm_id 
      HAVING COUNT(*) > 1
    `);
    console.log('Duplicate transactions found:', countRes.rows);

    // 2. Remove duplicate transactions keeping only the latest one per (firm_id, transaction_ref)
    const deleteTxRes = await client.query(`
      DELETE FROM public.transactions
      WHERE id NOT IN (
        SELECT DISTINCT ON (firm_id, transaction_ref) id
        FROM public.transactions
        ORDER BY firm_id, transaction_ref, created_at DESC
      );
    `);
    console.log(`Deleted ${deleteTxRes.rowCount} duplicate transaction rows.`);

    // 3. Check and clean duplicate license keys
    const deleteLkRes = await client.query(`
      DELETE FROM public.license_keys
      WHERE id NOT IN (
        SELECT DISTINCT ON (firm_id, key_prefix) id
        FROM public.license_keys
        ORDER BY firm_id, key_prefix, created_at DESC
      );
    `);
    console.log(`Deleted ${deleteLkRes.rowCount} duplicate license_keys rows.`);

    // 4. Add unique constraints so duplicates can never happen again
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_transactions_firm_ref'
        ) THEN
          ALTER TABLE public.transactions ADD CONSTRAINT uq_transactions_firm_ref UNIQUE (firm_id, transaction_ref);
        END IF;
      END $$;
    `);
    console.log('Added UNIQUE constraint uq_transactions_firm_ref.');

    const remainingRes = await client.query(`SELECT COUNT(*) FROM public.transactions`);
    console.log(`Remaining valid transactions: ${remainingRes.rows[0].count}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
