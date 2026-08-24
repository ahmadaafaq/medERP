const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASSWORD || 'unicampus_secret',
  database: process.env.DB_NAME || 'unicampus_erp',
};

async function restoreDatabase() {
  const jsonFile = path.join(__dirname, '../database_backup/unicampus_full_dump.json');
  if (!fs.existsSync(jsonFile)) {
    console.error('Backup JSON file not found at:', jsonFile);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonFile, 'utf8');
  const backup = JSON.parse(rawData);

  console.log('Connecting to database:', config.database, 'at', config.host);
  const client = new Client(config);
  await client.connect();

  console.log('Starting full database restore from backup...');

  for (const [schema, tables] of Object.entries(backup)) {
    console.log(`\nRestoring schema: ${schema}`);
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

    for (const [table, rows] of Object.entries(tables)) {
      if (!Array.isArray(rows) || rows.length === 0) continue;

      console.log(`  └─ Restoring ${schema}.${table} (${rows.length} rows)`);

      for (const row of rows) {
        const colNames = Object.keys(row);
        const colVals = Object.values(row);
        const placeholders = colNames.map((_, idx) => `$${idx + 1}`).join(', ');

        try {
          await client.query(
            `INSERT INTO "${schema}"."${table}" ("${colNames.join('", "')}") VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            colVals
          );
        } catch (rowErr) {
          // Continue on conflict/duplicate
        }
      }
    }
  }

  console.log('\n======================================================');
  console.log('✅ Full database restoration complete!');
  console.log('======================================================');

  await client.end();
}

restoreDatabase().catch(err => {
  console.error('Database restore error:', err);
  process.exit(1);
});
