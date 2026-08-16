const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function restoreDatabase() {
  const dumpFilePath = path.join(__dirname, 'unicampus_erp_latest.sql');
  if (!fs.existsSync(dumpFilePath)) {
    console.error(`❌ Dump file not found at: ${dumpFilePath}`);
    process.exit(1);
  }

  const sizeMb = (fs.statSync(dumpFilePath).size / 1024 / 1024).toFixed(2);
  console.log(`📦 Found database dump file: ${dumpFilePath} (${sizeMb} MB)`);
  console.log('🔄 Restoring PostgreSQL database from unicampus_erp_latest.sql...');

  try {
    // 1. Copy dump file into postgres container
    execSync(`docker cp "${dumpFilePath}" unicampus_postgres:/tmp/restore.sql`, { stdio: 'pipe' });
    // 2. Execute with psql
    execSync(`docker exec unicampus_postgres psql -U unicampus -d unicampus_erp -f /tmp/restore.sql`, { stdio: 'pipe' });
    console.log('✅ PostgreSQL database restored successfully with all schemas, tables, and student records!');
  } catch (err) {
    console.error('❌ Failed to restore database:', err.message);
    process.exit(1);
  }
}

restoreDatabase();
