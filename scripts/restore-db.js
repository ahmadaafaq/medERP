const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('../backend/node_modules/pg');

async function restoreDatabase() {
  const dumpFilePath = path.join(__dirname, 'unicampus_erp_latest.sql');
  if (!fs.existsSync(dumpFilePath)) {
    console.error(`❌ Dump file not found at: ${dumpFilePath}`);
    process.exit(1);
  }

  console.log(`📦 Found database dump file: ${dumpFilePath} (${(fs.statSync(dumpFilePath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Try Docker method first if container is running
  try {
    console.log('🔄 Attempting restore via Docker container "unicampus_postgres"...');
    execSync(`docker exec -i unicampus_postgres psql -U unicampus -d unicampus_erp < "${dumpFilePath}"`, { stdio: 'inherit' });
    console.log('✅ Database successfully restored from unicampus_erp_latest.sql via Docker!');
    return;
  } catch (dockerErr) {
    console.log('ℹ️ Docker exec not available or failed. Falling back to direct PostgreSQL node client connection...');
  }

  // Fallback to direct pg connection
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    console.log('🌱 Connected to PostgreSQL at localhost:5432. Executing SQL dump...');
    const sql = fs.readFileSync(dumpFilePath, 'utf8');
    await client.query(sql);
    console.log('✅ Database successfully restored from unicampus_erp_latest.sql via direct SQL execution!');
  } catch (err) {
    console.error('❌ Failed to restore database:', err.message);
  } finally {
    await client.end();
  }
}

restoreDatabase();
