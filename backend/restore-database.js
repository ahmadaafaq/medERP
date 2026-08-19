/**
 * restore-database.js
 * Restores the complete database from backend/database_dump.sql using pg client
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function restore() {
  const dumpPath = path.join(__dirname, 'database_dump.sql');
  if (!fs.existsSync(dumpPath)) {
    console.error('database_dump.sql not found at:', dumpPath);
    process.exit(1);
  }

  console.log('Reading database_dump.sql...');
  const sql = fs.readFileSync(dumpPath, 'utf8');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'unicampus',
    password: process.env.DB_PASS || 'unicampus_secret',
    database: process.env.DB_NAME || 'unicampus_erp',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database successfully.');
    console.log('Restoring schema and all tenant data...');
    await client.query(sql);
    console.log('✅ Database restore completed successfully! All tables, CBME masters, tenants, and timetables are restored.');
  } catch (err) {
    console.error('Error executing database restore:', err.message);
  } finally {
    await client.end();
  }
}

restore();
