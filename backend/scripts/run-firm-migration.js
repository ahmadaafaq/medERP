/**
 * Firm Migration & Menu Registry Seeder
 * Connects to PostgreSQL, executes migrate-firms.sql, and seeds menu_registry from menu-manifest.json.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrationAndSeed() {
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.join(rootDir, '.env');

  // Read DB config from .env or defaults
  let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'unicampus_erp',
  };

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key === 'DATABASE_HOST' || key === 'DB_HOST') dbConfig.host = val;
      if (key === 'DATABASE_PORT' || key === 'DB_PORT') dbConfig.port = parseInt(val, 10);
      if (key === 'DATABASE_USER' || key === 'DB_USER' || key === 'DATABASE_USERNAME') dbConfig.user = val;
      if (key === 'DATABASE_PASSWORD' || key === 'DB_PASSWORD' || key === 'DATABASE_PASS') dbConfig.password = val;
      if (key === 'DATABASE_NAME' || key === 'DB_NAME') dbConfig.database = val;
    });
  }

  console.log(`Connecting to Postgres DB '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}...`);
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');

    // 1. Run SQL Migration
    const sqlPath = path.join(__dirname, 'migrate-firms.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      console.log('Executing migrate-firms.sql...');
      await client.query(sql);
      console.log('✓ DDL migration applied successfully');
    }

    // 2. Seed Menu Registry from menu-manifest.json
    const manifestPath = path.join(rootDir, '..', 'menu-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const items = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`Seeding ${items.length} menu items into public.menu_registry...`);

      for (const item of items) {
        await client.query(
          `INSERT INTO public.menu_registry (role, menu_key, menu_label, route_path, parent_menu_key, sort_order, applicable_firm_mode)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (role, menu_key)
           DO UPDATE SET
             menu_label = EXCLUDED.menu_label,
             route_path = EXCLUDED.route_path,
             parent_menu_key = EXCLUDED.parent_menu_key,
             sort_order = EXCLUDED.sort_order,
             applicable_firm_mode = EXCLUDED.applicable_firm_mode,
             updated_at = NOW()`,
          [
            item.role,
            item.menu_key,
            item.menu_label,
            item.route_path,
            item.parent_menu_key || null,
            item.sort_order || 0,
            item.applicable_firm_mode || 'BOTH',
          ],
        );
      }
      console.log('✓ menu_registry seeded successfully');
    }

    console.log('==================================================');
    console.log('All Firm Registration & Licensing migrations complete!');
    console.log('==================================================');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigrationAndSeed();
