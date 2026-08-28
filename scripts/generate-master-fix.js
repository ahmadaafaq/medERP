const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'dump_analysis.json'), 'utf8'));

let sql = '-- =========================================================================\n';
sql += '-- UNICAMPUS COMPLETE MASTER SCHEMA PROVISIONING & COLUMN REPAIR SCRIPT\n';
sql += '-- Ensures all schemas, enums, tables, columns and types exist prior to import\n';
sql += '-- =========================================================================\n\n';

sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n';
sql += 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n';
sql += 'CREATE EXTENSION IF NOT EXISTS "pg_trgm";\n\n';

sql += `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_mode_enum') THEN
    CREATE TYPE firm_mode_enum AS ENUM ('MED', 'NONMED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_status_enum') THEN
    CREATE TYPE firm_status_enum AS ENUM ('ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_level_type_enum') THEN
    CREATE TYPE firm_level_type_enum AS ENUM ('STANDARD', 'ENTERPRISE', 'CUSTOM');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_status_enum') THEN
    CREATE TYPE license_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum') THEN
    CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'menu_role_enum') THEN
    CREATE TYPE menu_role_enum AS ENUM ('SUPERADMIN', 'ADMIN', 'CLERK', 'FACULTY', 'WARDEN', 'STUDENT');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'applicable_firm_mode_enum') THEN
    CREATE TYPE applicable_firm_mode_enum AS ENUM ('MED', 'NONMED', 'BOTH');
  END IF;
END $$;\n\n`;

// 1. Create all schemas
const schemaSet = new Set();
for (const key of Object.keys(data)) {
  const [s] = key.split('.');
  schemaSet.add(s);
}

for (const s of schemaSet) {
  sql += `CREATE SCHEMA IF NOT EXISTS "${s}";\n`;
}
sql += '\n';

function inferType(table, colName) {
  // Specific known special cases
  if (table === 'firms') {
    if (colName === 'id') return 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
    if (colName === 'level_type') return 'firm_level_type_enum DEFAULT \'STANDARD\'';
    if (colName === 'firm_mode') return 'firm_mode_enum DEFAULT \'MED\'';
    if (colName === 'status') return 'firm_status_enum DEFAULT \'ACTIVE\'';
    if (['logo_url', 'cover_url', 'banner_url', 'favicon_url'].includes(colName)) return 'TEXT';
    if (colName === 'theme_config') return 'JSONB';
    if (colName === 'trial_days') return 'INTEGER DEFAULT 14';
    if (colName.endsWith('_at')) return 'TIMESTAMPTZ';
    return 'VARCHAR(255)';
  }

  if (table === 'license_keys') {
    if (colName === 'id') return 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
    if (colName === 'firm_id') return 'UUID';
    if (colName === 'duration_days') return 'INTEGER DEFAULT 365';
    if (colName === 'amount') return 'NUMERIC(10,2) DEFAULT 0.00';
    if (colName.endsWith('_at')) return 'TIMESTAMPTZ';
    if (colName === 'status') return 'VARCHAR(50) DEFAULT \'ACTIVE\'';
    if (colName === 'is_renewal') return 'BOOLEAN DEFAULT FALSE';
    if (colName === 'renewed_from_key_id') return 'UUID';
    return 'VARCHAR(255)';
  }

  if (table === 'transactions') {
    if (colName === 'id') return 'UUID PRIMARY KEY DEFAULT gen_random_uuid()';
    if (colName === 'firm_id') return 'UUID';
    if (colName === 'license_key_id') return 'UUID';
    if (colName === 'amount') return 'NUMERIC(10,2) DEFAULT 0.00';
    if (colName.endsWith('_at')) return 'TIMESTAMPTZ';
    if (colName === 'duration_days') return 'INTEGER DEFAULT 365';
    if (colName === 'is_renewal') return 'BOOLEAN DEFAULT FALSE';
    return 'VARCHAR(255)';
  }

  // Tables with integer serial primary keys (not UUID)
  const intSerialPKs = {
    'repositories': 'repo_id',
    'repository_reviews': 'review_id',
    'placement_drives': 'drive_id',
    'placement_applications': 'application_id',
  };
  if (intSerialPKs[table] && colName === intSerialPKs[table]) {
    return 'SERIAL PRIMARY KEY';
  }
  // lessons.id is integer serial, not UUID
  if (table === 'lessons' && colName === 'id') {
    return 'SERIAL PRIMARY KEY';
  }
  // repo_id FK in repository_reviews should be INTEGER to match repositories.repo_id
  if (table === 'repository_reviews' && colName === 'repo_id') {
    return 'INTEGER';
  }

  if (colName === 'id' && (table.endsWith('s') || ['users', 'students', 'faculty', 'courses', 'batches'].includes(table))) {
    return 'UUID DEFAULT gen_random_uuid()';
  }

  if (colName === 'created_at' || colName === 'updated_at' || colName.endsWith('_at') || colName.endsWith('_date') || colName === 'deadline_date' || colName === 'drive_date' || colName === 'admission_date' || colName === 'issued_date' || colName === 'exam_date' || colName === 'paid_at') {
    return 'TIMESTAMPTZ';
  }
  if (colName.startsWith('is_') || colName.startsWith('has_') || colName === 'same_as_permanent' || colName === 'hostel_required' || colName === 'bus_required' || colName === 'is_pass' || colName === 'locked' || colName === 'requires_acknowledgement' || colName === 'schema_provisioned' || colName === 'must_change_password' || colName === 'electiveflg') {
    return 'BOOLEAN';
  }
  if (colName.endsWith('_config') || colName === 'features' || colName === 'sections' || colName === 'extra_fields' || colName === 'raw_payload' || colName === 'question_marks' || colName === 'sub_part_marks' || colName === 'draft_config' || colName === 'tech_stack' || colName === 'screenshots' || colName === 'eligible_branches' || colName === 'eligible_batches') {
    return 'JSONB';
  }
  if (colName.endsWith('_url') || colName.endsWith('_path') || colName.endsWith('_link') || colName === 'remarks' || colName === 'description' || colName === 'body' || colName === 'content' || colName === 'notes' || colName === 'medical_history' || colName === 'cover_note' || colName === 'password_hash') {
    return 'TEXT';
  }
  if (colName === 'amount' || colName === 'price_monthly' || colName === 'monthly_fee' || colName === 'fee_amount' || colName === 'package_min' || colName === 'package_max' || colName === 'paid_fees' || colName === 'pending_fees' || colName === 'total_fees' || colName === 'score' || colName === 'marks_obtained' || colName === 'max_marks' || colName === 'passing_marks' || colName === 'practical_mark' || colName === 'annual_income') {
    return 'NUMERIC';
  }
  if (colName === 'trial_days' || colName === 'duration_days' || colName === 'duration_minutes' || colName === 'sort_order' || colName === 'max_students' || colName === 'max_faculty' || colName === 'onboarding_step' || colName === 'failed_login_count' || colName === 'phase_order' || colName === 'total_capacity' || colName === 'allocated_count' || colName === 'hours_allotted' || colName === 'hours' || colName === 'unit_order' || colName === 'seats_available' || colName === 'file_size_kb' || colName === 'file_size' || colName === 'attempt_number' || colName === 'version') {
    return 'INTEGER';
  }
  return 'TEXT';
}

for (const key of Object.keys(data)) {
  const [s, t] = key.split('.');
  const cols = data[key];
  
  // Drop and recreate to guarantee correct column types.
  // Safe because the dump will repopulate all data.
  sql += `DROP TABLE IF EXISTS "${s}"."${t}" CASCADE;\n`;
  sql += `CREATE TABLE "${s}"."${t}" (\n`;
  sql += cols.map(c => `  "${c}" ${inferType(t, c)}`).join(',\n');
  sql += `\n);\n\n`;
}

fs.writeFileSync(path.join(__dirname, 'fix-public-schema.sql'), sql, 'utf8');
console.log('fix-public-schema.sql updated with ALL tables and columns.');
