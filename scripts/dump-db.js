const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function dumpDatabase() {
  const dumpFilePath = path.join(__dirname, 'unicampus_erp_latest.sql');
  console.log(`📦 Generating full PostgreSQL database dump to: ${dumpFilePath}...`);

  try {
    execSync(`docker exec unicampus_postgres pg_dump -U unicampus -d unicampus_erp --clean --if-exists > "${dumpFilePath}"`, { stdio: 'inherit' });
    const sizeMb = (fs.statSync(dumpFilePath).size / 1024 / 1024).toFixed(2);
    console.log(`✅ Database dump created successfully! Size: ${sizeMb} MB`);
  } catch (err) {
    console.error('❌ Failed to create database dump via Docker pg_dump:', err.message);
    process.exit(1);
  }
}

dumpDatabase();
