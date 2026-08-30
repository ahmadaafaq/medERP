#!/usr/bin/env bash
# ==============================================================================
# MedERP - Live Database Import & Restore Script (Docker / Server)
# ==============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SQL_DUMP="${PROJECT_ROOT}/backend/database_backup/unicampus_full_dump.sql"

# Check if dump file exists
if [ ! -f "${SQL_DUMP}" ]; then
  echo "❌ Error: Dump file not found at: ${SQL_DUMP}"
  exit 1
fi

echo "=================================================================="
echo "🚀 MedERP Full Database Import & Restore"
echo "📁 Dump file: ${SQL_DUMP}"
echo "=================================================================="

# Detect PostgreSQL container
PG_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -n 1)
if [ -z "$PG_CONTAINER" ]; then
  PG_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
fi

DB_USER="${DB_USER:-unicampus}"
DB_NAME="${DB_NAME:-unicampus_erp}"
DB_HOST="${DB_HOST:-34.236.107.120}"
DB_PORT="${DB_PORT:-5433}"
DB_PASS="${DB_PASS:-unicampus_dev@qsd!3ous}"

if [ -n "$PG_CONTAINER" ]; then
  echo "📦 Found Docker Postgres Container: ${PG_CONTAINER}"
  echo "⏳ Importing dump directly into container..."
  docker exec -i "${PG_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${SQL_DUMP}"
  echo "✅ Database restored successfully in Docker container: ${PG_CONTAINER}!"
else
  echo "🌐 Docker postgres container not detected locally. Importing via remote psql client..."
  if command -v psql &> /dev/null; then
    PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SQL_DUMP}"
    echo "✅ Database restored successfully to ${DB_HOST}:${DB_PORT}/${DB_NAME}!"
  else
    echo "⚙️ psql not found locally. Running Node.js database restore engine..."
    cd "${PROJECT_ROOT}/backend" && node scripts/restore_full_database.js
    echo "✅ Database restored successfully via Node.js restore engine!"
  fi
fi

echo "=================================================================="
echo "🎉 Live ERP Database Import Finished!"
echo "=================================================================="
