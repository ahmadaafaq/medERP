const { Client } = require('pg');
const bcrypt = require('bcrypt');

const c = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp',
});

async function run() {
  await c.connect();

  const firms = await c.query('SELECT id, title, slug, status FROM public.firms');
  console.log('ALL FIRMS IN SYSTEM:', firms.rows);

  for (const firm of firms.rows) {
    const existingKeys = await c.query(
      "SELECT id, key_prefix, status, expires_at FROM public.license_keys WHERE firm_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()",
      [firm.id]
    );

    if (existingKeys.rows.length === 0) {
      console.log(`Generating active license key for ${firm.title} (${firm.slug})...`);
      const keyPrefix = `FIRM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const hash = await bcrypt.hash(`FIRM-KEY-${Date.now()}`, 10);
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const inserted = await c.query(
        `INSERT INTO public.license_keys (
          firm_id, key_hash, key_prefix, duration_days, amount, issued_at, expires_at, status, is_renewal, created_at, updated_at
        ) VALUES ($1, $2, $3, 365, 250000, NOW(), $4, 'ACTIVE', false, NOW(), NOW())
        RETURNING *`,
        [firm.id, hash, keyPrefix, expiresAt]
      );

      const txRef = `NRX-${firm.slug.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
      await c.query(
        `INSERT INTO public.transactions (
          firm_id, license_key_id, amount, currency, payment_method, transaction_ref, status, paid_at, created_at, updated_at
        ) VALUES ($1, $2, 250000, 'INR', 'NORNX Direct Billing / Bank Wire', $3, 'SUCCESS', NOW(), NOW(), NOW())`,
        [firm.id, inserted.rows[0].id, txRef]
      );

      // Ensure firm is ACTIVE
      await c.query(
        "UPDATE public.firms SET status = 'ACTIVE', trial_ends_at = $1, updated_at = NOW() WHERE id = $2",
        [expiresAt, firm.id]
      );

      console.log(`Issued active key ${keyPrefix} and receipt ${txRef} for ${firm.title}!`);
    } else {
      console.log(`Firm ${firm.title} already has active license key:`, existingKeys.rows[0].key_prefix);
    }
  }

  await c.end();
}

run().catch(console.error);
