#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# MedERP → Remote Server Database Migration Script
# Target  : 34.236.107.120 (unicampus-db container, port 5433)
# DB User : unicampus
# DB Name : unicampus_db
# ════════════════════════════════════════════════════════════════════════════
set -euo pipefail

DUMP_FILE="./backend/database_backup/unicampus_full_dump.sql"
REMOTE_CONTAINER="unicampus-db"
REMOTE_DB_USER="unicampus"
REMOTE_DB_NAME="unicampus_erp"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  MedERP / Eng-ERP Database Migration to Remote Server"
echo "  Container : $REMOTE_CONTAINER"
echo "  DB User   : $REMOTE_DB_USER"
echo "  Target DB : $REMOTE_DB_NAME (Separate DB on existing Postgres)"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Step 1: Create the separate database if not exists ──────────────────────
echo "[1/4] Ensuring '$REMOTE_DB_NAME' database exists on PostgreSQL container..."
docker exec "$REMOTE_CONTAINER" psql -U "$REMOTE_DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$REMOTE_DB_NAME'" | grep -q 1 || \
docker exec "$REMOTE_CONTAINER" psql -U "$REMOTE_DB_USER" -d postgres -c "CREATE DATABASE $REMOTE_DB_NAME;"
echo "      ✓ Database '$REMOTE_DB_NAME' ready"

# ── Step 2: Enable required PostgreSQL extensions in unicampus_erp ──────────
echo "[2/4] Enabling required extensions (uuid-ossp, pg_trgm)..."
docker exec "$REMOTE_CONTAINER" psql -U "$REMOTE_DB_USER" -d "$REMOTE_DB_NAME" -c "
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
  CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
"
echo "      ✓ Extensions ready"

# ── Step 3: Run the init-db.sql first (creates base schema if not exists) ───
echo "[3/4] Applying schema init (init-db.sql)..."
docker exec -i "$REMOTE_CONTAINER" psql -U "$REMOTE_DB_USER" -d "$REMOTE_DB_NAME" < ./scripts/init-db.sql
echo "      ✓ Base schema applied"

# ── Step 4: Restore the full dump into unicampus_erp ────────────────────────
echo "[4/4] Restoring full database dump into '$REMOTE_DB_NAME'..."
echo "      File: $DUMP_FILE"
docker exec -i "$REMOTE_CONTAINER" psql -U "$REMOTE_DB_USER" -d "$REMOTE_DB_NAME" < "$DUMP_FILE" || {
  echo ""
  echo "⚠  Some statements may have failed (e.g. duplicate key on re-run)."
  echo "   Check output above. If only 'already exists' / 'duplicate key'"
  echo "   errors appear, the migration completed successfully."
}
echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✓ Migration complete! Verify with:"
echo "    docker exec $REMOTE_CONTAINER psql -U $REMOTE_DB_USER -d $REMOTE_DB_NAME -c '\dn'"
echo "    (Should show: public schema + tenant_* schemas)"
echo "════════════════════════════════════════════════════════"
echo ""
