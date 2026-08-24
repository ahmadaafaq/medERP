const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.super_admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT 'Platform Owner',
      role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const hash = await bcrypt.hash('nornx@med', 10);
  await client.query(`
    INSERT INTO public.super_admins (username, email, password_hash, name, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `, ['nornx', 'nornx@mederp.app', hash, 'NORNX Platform Owner', 'SUPER_ADMIN']);

  console.log('PUBLIC.SUPER_ADMINS SETUP COMPLETE!');
  const res = await client.query('SELECT id, username, email, name, role FROM public.super_admins');
  console.log('SUPER ADMINS IN DB:', res.rows);

  await client.end();
}

main().catch((err) => {
  console.error('SETUP ERROR:', err);
  process.exit(1);
});
