-- =========================================================================
-- UNICAMPUS COMPLETE MASTER SCHEMA PROVISIONING & COLUMN REPAIR SCRIPT
-- Ensures all schemas, enums, tables, columns and types exist prior to import
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
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
END $$;

CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "tenant_aiims-delhi";
CREATE SCHEMA IF NOT EXISTS "tenant_aiims-jodhpur";
CREATE SCHEMA IF NOT EXISTS "tenant_apex-tech";
CREATE SCHEMA IF NOT EXISTS "tenant_kmc-manipal";
CREATE SCHEMA IF NOT EXISTS "tenant_rajshreemri";
CREATE SCHEMA IF NOT EXISTS "tenant_rmch-bareilly";
CREATE SCHEMA IF NOT EXISTS "tenant_rmribar";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-cet";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-cet-bareilly";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-cet-unnao";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-cetr-bareilly";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-college-of-law";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-cricket-academy";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-iahs-bareilly";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-ibs-lucknow";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-ims";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-nursing-college";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-nursing-school";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-quiz-panel";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-riddhima-bareilly";
CREATE SCHEMA IF NOT EXISTS "tenant_srms-trust-bareilly";
CREATE SCHEMA IF NOT EXISTS "tenant_unicamp-med";
CREATE SCHEMA IF NOT EXISTS "tenant_vamp";

DROP TABLE IF EXISTS "public"."firm_role_permissions" CASCADE;
CREATE TABLE "public"."firm_role_permissions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "firm_id" TEXT,
  "role" TEXT,
  "menu_key" TEXT,
  "is_enabled" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "public"."firms" CASCADE;
CREATE TABLE "public"."firms" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(255),
  "slug" VARCHAR(255),
  "tenant_name" VARCHAR(255),
  "domain" VARCHAR(255),
  "logo_url" TEXT,
  "cover_url" TEXT,
  "banner_url" TEXT,
  "level_type" firm_level_type_enum DEFAULT 'STANDARD',
  "theme_color" VARCHAR(255),
  "firm_mode" firm_mode_enum DEFAULT 'MED',
  "status" firm_status_enum DEFAULT 'ACTIVE',
  "trial_days" INTEGER DEFAULT 14,
  "trial_started_at" TIMESTAMPTZ,
  "trial_ends_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "theme_config" JSONB,
  "favicon_url" TEXT,
  "updated_by" VARCHAR(255),
  "timetable_module_type" VARCHAR(255)
);

DROP TABLE IF EXISTS "public"."license_keys" CASCADE;
CREATE TABLE "public"."license_keys" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id" UUID,
  "key_hash" VARCHAR(255),
  "key_prefix" VARCHAR(255),
  "duration_days" INTEGER DEFAULT 365,
  "amount" NUMERIC(10,2) DEFAULT 0.00,
  "issued_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "status" VARCHAR(50) DEFAULT 'ACTIVE',
  "is_renewal" BOOLEAN DEFAULT FALSE,
  "renewed_from_key_id" UUID,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "public"."menu_registry" CASCADE;
CREATE TABLE "public"."menu_registry" (
  "id" TEXT,
  "role" TEXT,
  "menu_key" TEXT,
  "menu_label" TEXT,
  "route_path" TEXT,
  "parent_menu_key" TEXT,
  "sort_order" INTEGER,
  "applicable_firm_mode" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "public"."subscription_plans" CASCADE;
CREATE TABLE "public"."subscription_plans" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "max_students" INTEGER,
  "max_faculty" INTEGER,
  "features" JSONB,
  "price_monthly" NUMERIC,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "public"."super_admins" CASCADE;
CREATE TABLE "public"."super_admins" (
  "id" UUID DEFAULT gen_random_uuid(),
  "username" TEXT,
  "email" TEXT,
  "password_hash" TEXT,
  "name" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "public"."tenant_theme_drafts" CASCADE;
CREATE TABLE "public"."tenant_theme_drafts" (
  "tenant_id" TEXT,
  "tenant_slug" TEXT,
  "draft_config" JSONB,
  "updated_by" TEXT,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "public"."tenant_theme_history" CASCADE;
CREATE TABLE "public"."tenant_theme_history" (
  "id" TEXT,
  "tenant_id" TEXT,
  "tenant_slug" TEXT,
  "version" INTEGER,
  "theme_config" JSONB,
  "published_by" TEXT,
  "published_at" TIMESTAMPTZ,
  "notes" TEXT
);

DROP TABLE IF EXISTS "public"."tenants" CASCADE;
CREATE TABLE "public"."tenants" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "slug" TEXT,
  "domain" TEXT,
  "plan" TEXT,
  "logo_url" TEXT,
  "primary_color" TEXT,
  "smtp_host" TEXT,
  "smtp_port" TEXT,
  "smtp_user" TEXT,
  "smtp_pass_encrypted" TEXT,
  "is_active" BOOLEAN,
  "schema_provisioned" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "code" TEXT,
  "timetable_module_type" TEXT
);

DROP TABLE IF EXISTS "public"."transactions" CASCADE;
CREATE TABLE "public"."transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firm_id" UUID,
  "license_key_id" UUID,
  "amount" NUMERIC(10,2) DEFAULT 0.00,
  "currency" VARCHAR(255),
  "payment_method" VARCHAR(255),
  "transaction_ref" VARCHAR(255),
  "status" VARCHAR(255),
  "paid_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "duration_days" INTEGER DEFAULT 365,
  "expires_at" TIMESTAMPTZ,
  "is_renewal" BOOLEAN DEFAULT FALSE
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."academic_sessions" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."batches" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."competencies" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."delivery_types" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."departments" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."faculty" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."leave_types" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."notifications" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."students" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."subjects" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."timetable_slots" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-delhi"."users" CASCADE;
CREATE TABLE "tenant_aiims-delhi"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."academic_sessions" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."batches" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."competencies" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."delivery_types" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."departments" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."faculty" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."leave_types" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."notifications" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."students" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."subjects" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."timetable_slots" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_aiims-jodhpur"."users" CASCADE;
CREATE TABLE "tenant_aiims-jodhpur"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_apex-tech"."delivery_types" CASCADE;
CREATE TABLE "tenant_apex-tech"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_apex-tech"."faculty" CASCADE;
CREATE TABLE "tenant_apex-tech"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "date_of_joining" TEXT,
  "date_of_birth" TEXT,
  "date_of_leaving" TEXT,
  "blood_group" TEXT,
  "caste" TEXT,
  "pan_no" TEXT,
  "aadhaar_no" TEXT,
  "uan" TEXT,
  "bank_ac_no" TEXT,
  "current_basic" TEXT,
  "device_cd" TEXT,
  "salgrade" TEXT,
  "father_name" TEXT,
  "spouse_name" TEXT,
  "address" TEXT,
  "perm_addr" TEXT,
  "city" TEXT,
  "state" TEXT,
  "perm_city" TEXT,
  "perm_state" TEXT,
  "homephone" TEXT,
  "permanent_tel_no" TEXT,
  "highest_education" TEXT,
  "category" TEXT,
  "payroll_category" TEXT,
  "employment_status" TEXT,
  "email" TEXT,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_apex-tech"."leave_types" CASCADE;
CREATE TABLE "tenant_apex-tech"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_apex-tech"."notifications" CASCADE;
CREATE TABLE "tenant_apex-tech"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_apex-tech"."repositories" CASCADE;
CREATE TABLE "tenant_apex-tech"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_apex-tech"."repository_reviews" CASCADE;
CREATE TABLE "tenant_apex-tech"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_apex-tech"."users" CASCADE;
CREATE TABLE "tenant_apex-tech"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."academic_sessions" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."batches" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."competencies" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."delivery_types" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."departments" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."faculty" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."leave_types" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."notifications" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."students" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."subjects" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."timetable_slots" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_kmc-manipal"."users" CASCADE;
CREATE TABLE "tenant_kmc-manipal"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."academic_sessions" CASCADE;
CREATE TABLE "tenant_rajshreemri"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."batches" CASCADE;
CREATE TABLE "tenant_rajshreemri"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."courses" CASCADE;
CREATE TABLE "tenant_rajshreemri"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."delivery_types" CASCADE;
CREATE TABLE "tenant_rajshreemri"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."departments" CASCADE;
CREATE TABLE "tenant_rajshreemri"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."faculty" CASCADE;
CREATE TABLE "tenant_rajshreemri"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."groups_master" CASCADE;
CREATE TABLE "tenant_rajshreemri"."groups_master" (
  "id" TEXT,
  "code" TEXT,
  "name" TEXT,
  "college_id" TEXT,
  "course_id" TEXT,
  "batch_id" TEXT,
  "department_id" TEXT,
  "capacity" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."leave_types" CASCADE;
CREATE TABLE "tenant_rajshreemri"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."notice_attachments" CASCADE;
CREATE TABLE "tenant_rajshreemri"."notice_attachments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_url" TEXT,
  "file_size_kb" INTEGER,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."notice_group_templates" CASCADE;
CREATE TABLE "tenant_rajshreemri"."notice_group_templates" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "description" TEXT,
  "target_rules" TEXT,
  "created_by" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."notice_recipients" CASCADE;
CREATE TABLE "tenant_rajshreemri"."notice_recipients" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "user_id" TEXT,
  "is_read" BOOLEAN,
  "read_at" TIMESTAMPTZ,
  "acknowledged" TEXT,
  "acknowledged_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."notice_targets" CASCADE;
CREATE TABLE "tenant_rajshreemri"."notice_targets" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "target_type" TEXT,
  "target_value" TEXT,
  "target_label" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."notices" CASCADE;
CREATE TABLE "tenant_rajshreemri"."notices" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "priority" TEXT,
  "category" TEXT,
  "created_by" TEXT,
  "creator_name" TEXT,
  "creator_role" TEXT,
  "status" TEXT,
  "scheduled_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "requires_acknowledgement" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."notifications" CASCADE;
CREATE TABLE "tenant_rajshreemri"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."professional_linkers" CASCADE;
CREATE TABLE "tenant_rajshreemri"."professional_linkers" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "course_cd" TEXT,
  "professional_phase" TEXT,
  "academic_session" TEXT,
  "description" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."professional_phases" CASCADE;
CREATE TABLE "tenant_rajshreemri"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."residency_categories" CASCADE;
CREATE TABLE "tenant_rajshreemri"."residency_categories" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_id" TEXT,
  "course_code" TEXT,
  "residency_type" TEXT,
  "category_name" TEXT,
  "block_wing" TEXT,
  "total_capacity" INTEGER,
  "allocated_count" INTEGER,
  "monthly_fee" NUMERIC,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_academic_details" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_academic_details" (
  "student_id" TEXT,
  "class_10_board" TEXT,
  "class_10_percentage" TEXT,
  "class_12_board" TEXT,
  "class_12_physics" TEXT,
  "class_12_chemistry" TEXT,
  "class_12_biology" TEXT,
  "class_12_english" TEXT,
  "class_12_percentage" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_addresses" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_addresses" (
  "student_id" TEXT,
  "permanent_address_1" TEXT,
  "permanent_address_2" TEXT,
  "permanent_city" TEXT,
  "permanent_district" TEXT,
  "permanent_state" TEXT,
  "permanent_pincode" TEXT,
  "same_as_permanent" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_admissions" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_admissions" (
  "student_id" TEXT,
  "college_id" TEXT,
  "college_name" TEXT,
  "course_id" TEXT,
  "course_code" TEXT,
  "professional_id" TEXT,
  "professional_phase" TEXT,
  "session_id" TEXT,
  "academic_session" TEXT,
  "batch_id" TEXT,
  "batch_code" TEXT,
  "branch_id" TEXT,
  "residency_type" TEXT,
  "admission_type" TEXT,
  "admission_date" TIMESTAMPTZ,
  "status" TEXT,
  "group_id" TEXT,
  "group_code" TEXT,
  "group_name" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_bank_accounts" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_bank_accounts" (
  "student_id" TEXT,
  "bank_name" TEXT,
  "account_number" TEXT,
  "ifsc_code" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_documents" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_documents" (
  "student_id" TEXT,
  "passport_photo_url" TEXT,
  "student_signature_url" TEXT,
  "parent_signature_url" TEXT,
  "aadhaar_card_url" TEXT,
  "class_10_marksheet_url" TEXT,
  "class_12_marksheet_url" TEXT,
  "neet_score_card_url" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_emergency_contacts" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_emergency_contacts" (
  "student_id" TEXT,
  "contact_name" TEXT,
  "relationship" TEXT,
  "phone" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_fees" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_fees" (
  "student_id" TEXT,
  "paid_fees" NUMERIC,
  "pending_fees" NUMERIC,
  "total_fees" NUMERIC
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_hostel" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_hostel" (
  "student_id" TEXT,
  "hostel_required" BOOLEAN,
  "hostel_name" TEXT,
  "room_number" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_library" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_library" (
  "student_id" TEXT,
  "library_card_no" TEXT,
  "rfid_tag" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_medical" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_medical" (
  "student_id" TEXT,
  "medical_history" TEXT,
  "vaccination_status" TEXT,
  "fitness_certificate_url" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_neet_details" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_neet_details" (
  "student_id" TEXT,
  "neet_roll_no" TEXT,
  "neet_score" TEXT,
  "neet_percentile" TEXT,
  "neet_air_rank" TEXT,
  "neet_category_rank" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_parents" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_parents" (
  "student_id" TEXT,
  "father_name" TEXT,
  "father_occupation" TEXT,
  "father_mobile" TEXT,
  "mother_name" TEXT,
  "mother_occupation" TEXT,
  "mother_mobile" TEXT,
  "annual_income" NUMERIC
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."student_transport" CASCADE;
CREATE TABLE "tenant_rajshreemri"."student_transport" (
  "student_id" TEXT,
  "bus_required" BOOLEAN,
  "transport_route" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."students" CASCADE;
CREATE TABLE "tenant_rajshreemri"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."subject_offerings" CASCADE;
CREATE TABLE "tenant_rajshreemri"."subject_offerings" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "prof_id" TEXT,
  "dtype_id" TEXT,
  "batch_year" TEXT,
  "hours_allotted" INTEGER,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."subjects" CASCADE;
CREATE TABLE "tenant_rajshreemri"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_active" BOOLEAN,
  "is_longitudinal" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_rajshreemri"."users" CASCADE;
CREATE TABLE "tenant_rajshreemri"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."delivery_types" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."faculty" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "date_of_joining" TEXT,
  "date_of_birth" TEXT,
  "date_of_leaving" TEXT,
  "blood_group" TEXT,
  "caste" TEXT,
  "pan_no" TEXT,
  "aadhaar_no" TEXT,
  "uan" TEXT,
  "bank_ac_no" TEXT,
  "current_basic" TEXT,
  "device_cd" TEXT,
  "salgrade" TEXT,
  "father_name" TEXT,
  "spouse_name" TEXT,
  "address" TEXT,
  "perm_addr" TEXT,
  "city" TEXT,
  "state" TEXT,
  "perm_city" TEXT,
  "perm_state" TEXT,
  "homephone" TEXT,
  "permanent_tel_no" TEXT,
  "highest_education" TEXT,
  "category" TEXT,
  "payroll_category" TEXT,
  "employment_status" TEXT,
  "email" TEXT,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."leave_types" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."notifications" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."repositories" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."repository_reviews" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rmch-bareilly"."users" CASCADE;
CREATE TABLE "tenant_rmch-bareilly"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_rmribar"."delivery_types" CASCADE;
CREATE TABLE "tenant_rmribar"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_rmribar"."leave_types" CASCADE;
CREATE TABLE "tenant_rmribar"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_rmribar"."notifications" CASCADE;
CREATE TABLE "tenant_rmribar"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_rmribar"."repositories" CASCADE;
CREATE TABLE "tenant_rmribar"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rmribar"."repository_reviews" CASCADE;
CREATE TABLE "tenant_rmribar"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_rmribar"."users" CASCADE;
CREATE TABLE "tenant_rmribar"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "username" TEXT,
  "password_hash" TEXT,
  "name" TEXT,
  "phone" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "must_change_password" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."academic_sessions" CASCADE;
CREATE TABLE "tenant_srms-cet"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."batches" CASCADE;
CREATE TABLE "tenant_srms-cet"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cet"."competencies" CASCADE;
CREATE TABLE "tenant_srms-cet"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet"."courses" CASCADE;
CREATE TABLE "tenant_srms-cet"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-cet"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cet"."departments" CASCADE;
CREATE TABLE "tenant_srms-cet"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet"."faculty" CASCADE;
CREATE TABLE "tenant_srms-cet"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-cet"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."notifications" CASCADE;
CREATE TABLE "tenant_srms-cet"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."repositories" CASCADE;
CREATE TABLE "tenant_srms-cet"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "screenshots" JSONB,
  "status" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "is_placement_eligible" BOOLEAN,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-cet"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "remarks" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet"."subjects" CASCADE;
CREATE TABLE "tenant_srms-cet"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cet"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-cet"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet"."users" CASCADE;
CREATE TABLE "tenant_srms-cet"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."academic_sessions" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."batches" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN,
  "batch_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT,
  "curr_bat_cd" TEXT,
  "name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."certificates" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."certificates" (
  "id" UUID DEFAULT gen_random_uuid(),
  "application_id" TEXT,
  "certificate_no" TEXT,
  "internship_name" TEXT,
  "applicant_name" TEXT,
  "course" TEXT,
  "batch" TEXT,
  "issued_date" TIMESTAMPTZ,
  "approved_by" TEXT,
  "pdf_url" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."chat_attachments" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."chat_attachments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "message_id" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_url" TEXT,
  "file_size_kb" INTEGER,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."chat_group_members" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."chat_group_members" (
  "id" UUID DEFAULT gen_random_uuid(),
  "chat_group_id" TEXT,
  "user_id" TEXT,
  "role" TEXT,
  "name" TEXT,
  "avatar_url" TEXT,
  "joined_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."chat_groups" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."chat_groups" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "batch_id" TEXT,
  "department_id" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ,
  "batch_year" TEXT,
  "batch_code" TEXT,
  "department_name" TEXT,
  "college_id" TEXT,
  "description" TEXT,
  "is_active" BOOLEAN,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."chat_messages" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."chat_messages" (
  "id" UUID DEFAULT gen_random_uuid(),
  "group_id" TEXT,
  "sender_id" TEXT,
  "content" TEXT,
  "file_url" TEXT,
  "file_type" TEXT,
  "sent_at" TIMESTAMPTZ,
  "is_deleted" BOOLEAN,
  "chat_group_id" TEXT,
  "sender_name" TEXT,
  "sender_role" TEXT,
  "sender_avatar" TEXT,
  "body" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."chat_read_state" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."chat_read_state" (
  "id" TEXT,
  "chat_group_id" TEXT,
  "user_id" TEXT,
  "last_read_message_id" TEXT,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."competencies" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "subject_code" TEXT,
  "unit_id" TEXT,
  "unit_code" TEXT,
  "topic_code" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "name" TEXT,
  "bloom_level" TEXT,
  "batch_year" TEXT,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."courses" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."departments" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."examination_papers" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."examination_papers" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "subject_id" TEXT,
  "batch_id" TEXT,
  "exam_date" TIMESTAMPTZ,
  "max_marks" NUMERIC,
  "passing_marks" NUMERIC,
  "type" TEXT,
  "duration_minutes" INTEGER,
  "sections" JSONB,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."faculty" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "date_of_joining" TEXT,
  "date_of_birth" TEXT,
  "date_of_leaving" TEXT,
  "blood_group" TEXT,
  "caste" TEXT,
  "pan_no" TEXT,
  "aadhaar_no" TEXT,
  "uan" TEXT,
  "bank_ac_no" TEXT,
  "current_basic" TEXT,
  "device_cd" TEXT,
  "salgrade" TEXT,
  "father_name" TEXT,
  "spouse_name" TEXT,
  "address" TEXT,
  "perm_addr" TEXT,
  "city" TEXT,
  "state" TEXT,
  "perm_city" TEXT,
  "perm_state" TEXT,
  "homephone" TEXT,
  "permanent_tel_no" TEXT,
  "highest_education" TEXT,
  "category" TEXT,
  "payroll_category" TEXT,
  "employment_status" TEXT,
  "email" TEXT,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."faculty_subjects" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."faculty_subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."internship_applications" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."internship_applications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "program_id" TEXT,
  "student_id" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "course_cd" TEXT,
  "batch_cd" TEXT,
  "applied_at" TIMESTAMPTZ,
  "status" TEXT,
  "locked" BOOLEAN,
  "payment_status" TEXT,
  "completed_at" TIMESTAMPTZ,
  "remarks" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."internship_programs" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."internship_programs" (
  "id" UUID DEFAULT gen_random_uuid(),
  "title" TEXT,
  "category" TEXT,
  "duration" TEXT,
  "fee_type" TEXT,
  "fee_amount" NUMERIC,
  "description" TEXT,
  "seats_available" INTEGER,
  "application_deadline" TEXT,
  "published_by" TEXT,
  "status" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."lessons" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."lessons" (
  "id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "subject_id" TEXT,
  "unit_id" TEXT,
  "topic_id" TEXT,
  "subtopic_id" TEXT,
  "empid" TEXT,
  "faculty_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_size" INTEGER,
  "file_path" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."notice_attachments" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."notice_attachments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_url" TEXT,
  "file_size_kb" INTEGER,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."notice_recipients" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."notice_recipients" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "user_id" TEXT,
  "is_read" BOOLEAN,
  "read_at" TIMESTAMPTZ,
  "acknowledged" TEXT,
  "acknowledged_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."notice_targets" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."notice_targets" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "target_type" TEXT,
  "target_value" TEXT,
  "target_label" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."notices" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."notices" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "priority" TEXT,
  "category" TEXT,
  "created_by" TEXT,
  "creator_name" TEXT,
  "creator_role" TEXT,
  "status" TEXT,
  "scheduled_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "requires_acknowledgement" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."notifications" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."placement_applications" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."placement_applications" (
  "application_id" SERIAL PRIMARY KEY,
  "drive_id" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "resume_link" TEXT,
  "cover_note" TEXT,
  "applied_at" TIMESTAMPTZ,
  "status" TEXT,
  "selected_company" TEXT,
  "selected_role" TEXT,
  "remarks" TEXT,
  "updated_at" TIMESTAMPTZ,
  "id" UUID DEFAULT gen_random_uuid(),
  "company_id" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "offer_package" TEXT,
  "offer_status" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."placement_drives" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."placement_drives" (
  "drive_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "company_name" TEXT,
  "role" TEXT,
  "package_ctc" TEXT,
  "description" TEXT,
  "eligibility_course_cd" TEXT,
  "eligibility_branch_cd" TEXT,
  "eligibility_batch_cd" TEXT,
  "min_score_required" TEXT,
  "drive_date" TIMESTAMPTZ,
  "deadline_date" TIMESTAMPTZ,
  "status" TEXT,
  "created_by_empid" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "id" UUID DEFAULT gen_random_uuid(),
  "package_min" NUMERIC,
  "package_max" NUMERIC,
  "eligible_branches" JSONB,
  "eligible_batches" JSONB,
  "logo_url" TEXT,
  "batch_title" TEXT,
  "source_file_name" TEXT,
  "extra_fields" JSONB
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."professional_linkers" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."professional_linkers" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "course_cd" TEXT,
  "professional_phase" TEXT,
  "academic_session" TEXT,
  "description" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "branch_id" TEXT,
  "branch_name" TEXT,
  "academic_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."repositories" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."srms_timetable_events" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."srms_timetable_events" (
  "id" UUID DEFAULT gen_random_uuid(),
  "title" TEXT,
  "description" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "start_str" TEXT,
  "end_str" TEXT,
  "day_of_week" TEXT,
  "linkcd" TEXT,
  "electiveflg" BOOLEAN,
  "txt_g" TEXT,
  "txt_sec" TEXT,
  "empid" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "camera_link" TEXT,
  "raw_payload" JSONB,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."student_academic_details" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."student_academic_details" (
  "student_id" TEXT,
  "class_10_board" TEXT,
  "class_10_percentage" TEXT,
  "class_12_board" TEXT,
  "class_12_physics" TEXT,
  "class_12_chemistry" TEXT,
  "class_12_biology" TEXT,
  "class_12_english" TEXT,
  "class_12_percentage" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."student_addresses" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."student_addresses" (
  "student_id" TEXT,
  "permanent_address_1" TEXT,
  "permanent_address_2" TEXT,
  "permanent_city" TEXT,
  "permanent_district" TEXT,
  "permanent_state" TEXT,
  "permanent_pincode" TEXT,
  "same_as_permanent" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."student_admissions" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."student_admissions" (
  "student_id" TEXT,
  "college_id" TEXT,
  "college_name" TEXT,
  "course_id" TEXT,
  "course_code" TEXT,
  "professional_id" TEXT,
  "professional_phase" TEXT,
  "session_id" TEXT,
  "academic_session" TEXT,
  "batch_id" TEXT,
  "batch_code" TEXT,
  "branch_id" TEXT,
  "residency_type" TEXT,
  "admission_type" TEXT,
  "admission_date" TIMESTAMPTZ,
  "status" TEXT,
  "group_id" TEXT,
  "group_code" TEXT,
  "group_name" TEXT,
  "branch_code" TEXT,
  "branch_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."student_fees" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."student_fees" (
  "student_id" TEXT,
  "paid_fees" NUMERIC,
  "pending_fees" NUMERIC,
  "total_fees" NUMERIC
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."student_results" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."student_results" (
  "id" UUID DEFAULT gen_random_uuid(),
  "student_id" TEXT,
  "paper_id" TEXT,
  "marks_obtained" NUMERIC,
  "is_pass" BOOLEAN,
  "attempt_number" INTEGER,
  "entered_by" TEXT,
  "created_at" TIMESTAMPTZ,
  "question_marks" JSONB,
  "sub_part_marks" JSONB,
  "practical_mark" NUMERIC,
  "eval_status" TEXT,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."students" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT,
  "github_url" TEXT,
  "github_followers" TEXT,
  "linkedin_url" TEXT,
  "linkedin_connections" TEXT,
  "bio" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."subject_offerings" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."subject_offerings" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "prof_id" TEXT,
  "dtype_id" TEXT,
  "batch_year" TEXT,
  "hours_allotted" INTEGER,
  "is_active" BOOLEAN,
  "subject_code" TEXT,
  "phase_order" INTEGER,
  "dtype_code" TEXT,
  "academic_year" TEXT,
  "semester" TEXT,
  "batch_id" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "is_elective" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."subjects" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."topics" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."topics" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "name" TEXT,
  "description" TEXT,
  "hours" INTEGER,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "subject_code" TEXT,
  "unit_id" TEXT,
  "unit_code" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_year" TEXT,
  "bloom_level" TEXT,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."units" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."units" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "description" TEXT,
  "subject_id" TEXT,
  "subject_code" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_id" TEXT,
  "batch_year" TEXT,
  "bloom_level" TEXT,
  "unit_order" INTEGER,
  "hours" INTEGER,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-bareilly"."users" CASCADE;
CREATE TABLE "tenant_srms-cet-bareilly"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."certificates" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."certificates" (
  "id" UUID DEFAULT gen_random_uuid(),
  "application_id" TEXT,
  "certificate_no" TEXT,
  "internship_name" TEXT,
  "applicant_name" TEXT,
  "course" TEXT,
  "batch" TEXT,
  "issued_date" TIMESTAMPTZ,
  "approved_by" TEXT,
  "pdf_url" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."courses" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."departments" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."faculty" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."internship_applications" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."internship_applications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "program_id" TEXT,
  "student_id" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "course_cd" TEXT,
  "batch_cd" TEXT,
  "applied_at" TIMESTAMPTZ,
  "status" TEXT,
  "locked" BOOLEAN,
  "payment_status" TEXT,
  "completed_at" TIMESTAMPTZ,
  "remarks" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."internship_programs" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."internship_programs" (
  "id" UUID DEFAULT gen_random_uuid(),
  "title" TEXT,
  "category" TEXT,
  "duration" TEXT,
  "fee_type" TEXT,
  "fee_amount" NUMERIC,
  "description" TEXT,
  "seats_available" INTEGER,
  "application_deadline" TEXT,
  "published_by" TEXT,
  "status" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."notifications" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."placement_drives" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."placement_drives" (
  "drive_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "company_name" TEXT,
  "role" TEXT,
  "package_ctc" TEXT,
  "description" TEXT,
  "eligibility_course_cd" TEXT,
  "eligibility_branch_cd" TEXT,
  "eligibility_batch_cd" TEXT,
  "min_score_required" TEXT,
  "drive_date" TIMESTAMPTZ,
  "deadline_date" TIMESTAMPTZ,
  "status" TEXT,
  "created_by_empid" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "id" UUID DEFAULT gen_random_uuid(),
  "package_min" NUMERIC,
  "package_max" NUMERIC,
  "eligible_branches" JSONB,
  "eligible_batches" JSONB,
  "logo_url" TEXT,
  "batch_title" TEXT,
  "source_file_name" TEXT,
  "extra_fields" JSONB
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."repositories" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cet-unnao"."users" CASCADE;
CREATE TABLE "tenant_srms-cet-unnao"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."certificates" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."certificates" (
  "id" UUID DEFAULT gen_random_uuid(),
  "application_id" TEXT,
  "certificate_no" TEXT,
  "internship_name" TEXT,
  "applicant_name" TEXT,
  "course" TEXT,
  "batch" TEXT,
  "issued_date" TIMESTAMPTZ,
  "approved_by" TEXT,
  "pdf_url" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."chat_group_members" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."chat_group_members" (
  "id" UUID DEFAULT gen_random_uuid(),
  "chat_group_id" TEXT,
  "user_id" TEXT,
  "role" TEXT,
  "name" TEXT,
  "avatar_url" TEXT,
  "joined_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."chat_groups" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."chat_groups" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "batch_id" TEXT,
  "department_id" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ,
  "batch_year" TEXT,
  "batch_code" TEXT,
  "department_name" TEXT,
  "college_id" TEXT,
  "description" TEXT,
  "is_active" BOOLEAN,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."courses" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."departments" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."faculty" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "email" TEXT,
  "date_of_joining" TEXT,
  "date_of_birth" TEXT,
  "date_of_leaving" TEXT,
  "blood_group" TEXT,
  "caste" TEXT,
  "pan_no" TEXT,
  "aadhaar_no" TEXT,
  "uan" TEXT,
  "bank_ac_no" TEXT,
  "current_basic" TEXT,
  "device_cd" TEXT,
  "salgrade" TEXT,
  "father_name" TEXT,
  "spouse_name" TEXT,
  "address" TEXT,
  "perm_addr" TEXT,
  "city" TEXT,
  "state" TEXT,
  "perm_city" TEXT,
  "perm_state" TEXT,
  "homephone" TEXT,
  "permanent_tel_no" TEXT,
  "highest_education" TEXT,
  "category" TEXT,
  "payroll_category" TEXT,
  "employment_status" TEXT,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."internship_applications" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."internship_applications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "program_id" TEXT,
  "student_id" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "course_cd" TEXT,
  "batch_cd" TEXT,
  "applied_at" TIMESTAMPTZ,
  "status" TEXT,
  "locked" BOOLEAN,
  "payment_status" TEXT,
  "completed_at" TIMESTAMPTZ,
  "remarks" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."internship_programs" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."internship_programs" (
  "id" UUID DEFAULT gen_random_uuid(),
  "title" TEXT,
  "category" TEXT,
  "duration" TEXT,
  "fee_type" TEXT,
  "fee_amount" NUMERIC,
  "description" TEXT,
  "seats_available" INTEGER,
  "application_deadline" TEXT,
  "published_by" TEXT,
  "status" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."notice_recipients" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."notice_recipients" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "user_id" TEXT,
  "is_read" BOOLEAN,
  "read_at" TIMESTAMPTZ,
  "acknowledged" TEXT,
  "acknowledged_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."notice_targets" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."notice_targets" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "target_type" TEXT,
  "target_value" TEXT,
  "target_label" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."notices" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."notices" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "priority" TEXT,
  "category" TEXT,
  "created_by" TEXT,
  "creator_name" TEXT,
  "creator_role" TEXT,
  "status" TEXT,
  "scheduled_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "requires_acknowledgement" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."notifications" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."placement_drives" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."placement_drives" (
  "drive_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "company_name" TEXT,
  "role" TEXT,
  "package_ctc" TEXT,
  "description" TEXT,
  "eligibility_course_cd" TEXT,
  "eligibility_branch_cd" TEXT,
  "eligibility_batch_cd" TEXT,
  "min_score_required" TEXT,
  "drive_date" TIMESTAMPTZ,
  "deadline_date" TIMESTAMPTZ,
  "status" TEXT,
  "created_by_empid" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "id" UUID DEFAULT gen_random_uuid(),
  "package_min" NUMERIC,
  "package_max" NUMERIC,
  "eligible_branches" JSONB,
  "eligible_batches" JSONB,
  "logo_url" TEXT,
  "batch_title" TEXT,
  "source_file_name" TEXT,
  "extra_fields" JSONB
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."repositories" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cetr-bareilly"."users" CASCADE;
CREATE TABLE "tenant_srms-cetr-bareilly"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."courses" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."departments" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."faculty" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."notifications" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."repositories" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-law"."users" CASCADE;
CREATE TABLE "tenant_srms-college-of-law"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."batches" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."competencies" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."courses" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."departments" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."faculty" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."notifications" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."repositories" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."students" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."subjects" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."users" CASCADE;
CREATE TABLE "tenant_srms-college-of-nursing-paramedical-sciences-unnao"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."courses" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."departments" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."faculty" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."notifications" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."repositories" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-cricket-academy"."users" CASCADE;
CREATE TABLE "tenant_srms-cricket-academy"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."batches" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."competencies" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."courses" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."departments" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."faculty" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."notifications" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."repositories" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."students" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."subjects" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-iahs-bareilly"."users" CASCADE;
CREATE TABLE "tenant_srms-iahs-bareilly"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."certificates" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."certificates" (
  "id" UUID DEFAULT gen_random_uuid(),
  "application_id" TEXT,
  "certificate_no" TEXT,
  "internship_name" TEXT,
  "applicant_name" TEXT,
  "course" TEXT,
  "batch" TEXT,
  "issued_date" TIMESTAMPTZ,
  "approved_by" TEXT,
  "pdf_url" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."courses" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."departments" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."faculty" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."internship_applications" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."internship_applications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "program_id" TEXT,
  "student_id" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "course_cd" TEXT,
  "batch_cd" TEXT,
  "applied_at" TIMESTAMPTZ,
  "status" TEXT,
  "locked" BOOLEAN,
  "payment_status" TEXT,
  "completed_at" TIMESTAMPTZ,
  "remarks" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."internship_programs" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."internship_programs" (
  "id" UUID DEFAULT gen_random_uuid(),
  "title" TEXT,
  "category" TEXT,
  "duration" TEXT,
  "fee_type" TEXT,
  "fee_amount" NUMERIC,
  "description" TEXT,
  "seats_available" INTEGER,
  "application_deadline" TEXT,
  "published_by" TEXT,
  "status" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."notifications" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."placement_drives" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."placement_drives" (
  "drive_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "company_name" TEXT,
  "role" TEXT,
  "package_ctc" TEXT,
  "description" TEXT,
  "eligibility_course_cd" TEXT,
  "eligibility_branch_cd" TEXT,
  "eligibility_batch_cd" TEXT,
  "min_score_required" TEXT,
  "drive_date" TIMESTAMPTZ,
  "deadline_date" TIMESTAMPTZ,
  "status" TEXT,
  "created_by_empid" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "id" UUID DEFAULT gen_random_uuid(),
  "package_min" NUMERIC,
  "package_max" NUMERIC,
  "eligible_branches" JSONB,
  "eligible_batches" JSONB,
  "logo_url" TEXT,
  "batch_title" TEXT,
  "source_file_name" TEXT,
  "extra_fields" JSONB
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."repositories" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ibs-lucknow"."users" CASCADE;
CREATE TABLE "tenant_srms-ibs-lucknow"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."academic_sessions" CASCADE;
CREATE TABLE "tenant_srms-ims"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."batches" CASCADE;
CREATE TABLE "tenant_srms-ims"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-ims"."chat_group_members" CASCADE;
CREATE TABLE "tenant_srms-ims"."chat_group_members" (
  "id" UUID DEFAULT gen_random_uuid(),
  "chat_group_id" TEXT,
  "user_id" TEXT,
  "role" TEXT,
  "name" TEXT,
  "avatar_url" TEXT,
  "joined_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."chat_groups" CASCADE;
CREATE TABLE "tenant_srms-ims"."chat_groups" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "batch_id" TEXT,
  "department_id" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ,
  "batch_year" TEXT,
  "batch_code" TEXT,
  "department_name" TEXT,
  "college_id" TEXT,
  "description" TEXT,
  "is_active" BOOLEAN,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."competencies" CASCADE;
CREATE TABLE "tenant_srms-ims"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "subject_code" TEXT,
  "unit_id" TEXT,
  "unit_code" TEXT,
  "topic_code" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "name" TEXT,
  "bloom_level" TEXT,
  "batch_year" TEXT,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."courses" CASCADE;
CREATE TABLE "tenant_srms-ims"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-ims"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."departments" CASCADE;
CREATE TABLE "tenant_srms-ims"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."faculty" CASCADE;
CREATE TABLE "tenant_srms-ims"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."groups_master" CASCADE;
CREATE TABLE "tenant_srms-ims"."groups_master" (
  "id" TEXT,
  "code" TEXT,
  "name" TEXT,
  "college_id" TEXT,
  "course_id" TEXT,
  "batch_id" TEXT,
  "department_id" TEXT,
  "capacity" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-ims"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."notice_attachments" CASCADE;
CREATE TABLE "tenant_srms-ims"."notice_attachments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "file_name" TEXT,
  "file_type" TEXT,
  "file_url" TEXT,
  "file_size_kb" INTEGER,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."notice_group_templates" CASCADE;
CREATE TABLE "tenant_srms-ims"."notice_group_templates" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "description" TEXT,
  "target_rules" TEXT,
  "created_by" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."notice_recipients" CASCADE;
CREATE TABLE "tenant_srms-ims"."notice_recipients" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "user_id" TEXT,
  "is_read" BOOLEAN,
  "read_at" TIMESTAMPTZ,
  "acknowledged" TEXT,
  "acknowledged_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."notice_targets" CASCADE;
CREATE TABLE "tenant_srms-ims"."notice_targets" (
  "id" UUID DEFAULT gen_random_uuid(),
  "notice_id" TEXT,
  "target_type" TEXT,
  "target_value" TEXT,
  "target_label" TEXT,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."notices" CASCADE;
CREATE TABLE "tenant_srms-ims"."notices" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "priority" TEXT,
  "category" TEXT,
  "created_by" TEXT,
  "creator_name" TEXT,
  "creator_role" TEXT,
  "status" TEXT,
  "scheduled_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "requires_acknowledgement" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."notifications" CASCADE;
CREATE TABLE "tenant_srms-ims"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."professional_linkers" CASCADE;
CREATE TABLE "tenant_srms-ims"."professional_linkers" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "course_cd" TEXT,
  "professional_phase" TEXT,
  "academic_session" TEXT,
  "description" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-ims"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "branch_id" TEXT,
  "branch_name" TEXT,
  "academic_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."repositories" CASCADE;
CREATE TABLE "tenant_srms-ims"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-ims"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."residency_categories" CASCADE;
CREATE TABLE "tenant_srms-ims"."residency_categories" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_id" TEXT,
  "course_code" TEXT,
  "residency_type" TEXT,
  "category_name" TEXT,
  "block_wing" TEXT,
  "total_capacity" INTEGER,
  "allocated_count" INTEGER,
  "monthly_fee" NUMERIC,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-ims"."students" CASCADE;
CREATE TABLE "tenant_srms-ims"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT,
  "github_url" TEXT,
  "github_followers" TEXT,
  "linkedin_url" TEXT,
  "linkedin_connections" TEXT,
  "bio" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."subjects" CASCADE;
CREATE TABLE "tenant_srms-ims"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-ims"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-ims"."users" CASCADE;
CREATE TABLE "tenant_srms-ims"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."batches" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."competencies" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."courses" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."departments" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."faculty" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."notifications" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."repositories" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."students" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."subjects" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-college"."users" CASCADE;
CREATE TABLE "tenant_srms-nursing-college"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."batches" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."competencies" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."courses" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."departments" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."faculty" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."notifications" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."repositories" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."students" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."subjects" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-nursing-school"."users" CASCADE;
CREATE TABLE "tenant_srms-nursing-school"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."batches" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."courses" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."departments" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."faculty" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."notifications" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."professional_phases" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."repositories" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."students" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."subjects" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN,
  "course_cd" TEXT,
  "course_name" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "semester" TEXT,
  "sub_addinfo" TEXT,
  "mst_sub_name" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."timetable_slots" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-quiz-panel"."users" CASCADE;
CREATE TABLE "tenant_srms-quiz-panel"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."courses" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."departments" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."faculty" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."notifications" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."repositories" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-riddhima-bareilly"."users" CASCADE;
CREATE TABLE "tenant_srms-riddhima-bareilly"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."courses" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."courses" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "degree_level" TEXT,
  "duration_years" TEXT,
  "professional_phase" TEXT,
  "academic_system" TEXT,
  "course_cd" TEXT,
  "course_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."delivery_types" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."departments" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "branch_cd" TEXT,
  "course_cd" TEXT,
  "course_name" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."faculty" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."leave_types" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."notifications" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."repositories" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."repositories" (
  "repo_id" SERIAL PRIMARY KEY,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "sem_cd" TEXT,
  "student_reg_no" TEXT,
  "student_name" TEXT,
  "title" TEXT,
  "description" TEXT,
  "repo_link" TEXT,
  "tech_stack" JSONB,
  "status" TEXT,
  "is_placement_eligible" BOOLEAN,
  "score" NUMERIC,
  "grade" TEXT,
  "submitted_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "screenshots" JSONB,
  "incubation_status" TEXT,
  "incubation_notes" TEXT,
  "funding_amount" TEXT,
  "mentor_assigned" TEXT,
  "incubated_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."repository_reviews" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."repository_reviews" (
  "review_id" SERIAL PRIMARY KEY,
  "repo_id" INTEGER,
  "faculty_empid" TEXT,
  "faculty_name" TEXT,
  "remarks" TEXT,
  "score" NUMERIC,
  "grade" TEXT,
  "reviewed_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_srms-trust-bareilly"."users" CASCADE;
CREATE TABLE "tenant_srms-trust-bareilly"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."academic_sessions" CASCADE;
CREATE TABLE "tenant_unicamp-med"."academic_sessions" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_current" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "code" TEXT,
  "session_cd" TEXT,
  "colg_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."batches" CASCADE;
CREATE TABLE "tenant_unicamp-med"."batches" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "year" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."competencies" CASCADE;
CREATE TABLE "tenant_unicamp-med"."competencies" (
  "id" UUID DEFAULT gen_random_uuid(),
  "subject_id" TEXT,
  "topic_id" TEXT,
  "linker_id" TEXT,
  "code" TEXT,
  "description" TEXT,
  "domain" TEXT,
  "level" TEXT,
  "is_core" BOOLEAN,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."delivery_types" CASCADE;
CREATE TABLE "tenant_unicamp-med"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."departments" CASCADE;
CREATE TABLE "tenant_unicamp-med"."departments" (
  "id" UUID DEFAULT gen_random_uuid(),
  "name" TEXT,
  "code" TEXT,
  "type" TEXT,
  "hod_user_id" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."faculty" CASCADE;
CREATE TABLE "tenant_unicamp-med"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "subject_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."leave_types" CASCADE;
CREATE TABLE "tenant_unicamp-med"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."notifications" CASCADE;
CREATE TABLE "tenant_unicamp-med"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."students" CASCADE;
CREATE TABLE "tenant_unicamp-med"."students" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "rollno" TEXT,
  "registration_no" TEXT,
  "name" TEXT,
  "batch_cd" TEXT,
  "course_cd" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "admission_year" TEXT,
  "photo_url" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "blood_group" TEXT,
  "emergency_contact" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "group_id" TEXT,
  "branch_id" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."subjects" CASCADE;
CREATE TABLE "tenant_unicamp-med"."subjects" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "credits" TEXT,
  "type" TEXT,
  "is_longitudinal" BOOLEAN,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."timetable_slots" CASCADE;
CREATE TABLE "tenant_unicamp-med"."timetable_slots" (
  "id" UUID DEFAULT gen_random_uuid(),
  "faculty_id" TEXT,
  "subject_id" TEXT,
  "department_id" TEXT,
  "batch_id" TEXT,
  "day_of_week" TEXT,
  "start_time" TEXT,
  "end_time" TEXT,
  "room" TEXT,
  "slot_type" TEXT,
  "effective_from" TEXT,
  "effective_until" TEXT,
  "group_name" TEXT,
  "topic" TEXT,
  "competency_codes" TEXT,
  "unit_name" TEXT,
  "unit_id" TEXT,
  "sub_topics" TEXT,
  "colg_cd" TEXT,
  "course_cd" TEXT,
  "branch_cd" TEXT,
  "batch_cd" TEXT,
  "semester" TEXT,
  "section" TEXT,
  "description" TEXT
);

DROP TABLE IF EXISTS "tenant_unicamp-med"."users" CASCADE;
CREATE TABLE "tenant_unicamp-med"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

DROP TABLE IF EXISTS "tenant_vamp"."delivery_types" CASCADE;
CREATE TABLE "tenant_vamp"."delivery_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "is_active" BOOLEAN
);

DROP TABLE IF EXISTS "tenant_vamp"."faculty" CASCADE;
CREATE TABLE "tenant_vamp"."faculty" (
  "id" UUID DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "emp_id" TEXT,
  "name" TEXT,
  "department_id" TEXT,
  "designation" TEXT,
  "qualification" TEXT,
  "specialization" TEXT,
  "joining_date" TIMESTAMPTZ,
  "photo_url" TEXT,
  "phone" TEXT,
  "gender" TEXT,
  "experience" TEXT,
  "staff_type" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "subject_id" TEXT,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT
);

DROP TABLE IF EXISTS "tenant_vamp"."leave_types" CASCADE;
CREATE TABLE "tenant_vamp"."leave_types" (
  "id" UUID DEFAULT gen_random_uuid(),
  "code" TEXT,
  "name" TEXT,
  "max_days_per_year" TEXT
);

DROP TABLE IF EXISTS "tenant_vamp"."notifications" CASCADE;
CREATE TABLE "tenant_vamp"."notifications" (
  "id" UUID DEFAULT gen_random_uuid(),
  "recipient_id" TEXT,
  "title" TEXT,
  "body" TEXT,
  "type" TEXT,
  "is_read" BOOLEAN,
  "created_at" TIMESTAMPTZ,
  "message" TEXT,
  "category" TEXT
);

DROP TABLE IF EXISTS "tenant_vamp"."professional_phases" CASCADE;
CREATE TABLE "tenant_vamp"."professional_phases" (
  "id" UUID DEFAULT gen_random_uuid(),
  "college_id" TEXT,
  "course_cd" TEXT,
  "name" TEXT,
  "phase_order" INTEGER,
  "academic_system" TEXT,
  "is_active" BOOLEAN,
  "created_at" TIMESTAMPTZ
);

DROP TABLE IF EXISTS "tenant_vamp"."users" CASCADE;
CREATE TABLE "tenant_vamp"."users" (
  "id" UUID DEFAULT gen_random_uuid(),
  "email" TEXT,
  "password_hash" TEXT,
  "role" TEXT,
  "is_active" BOOLEAN,
  "onboarding_completed" TEXT,
  "onboarding_step" INTEGER,
  "must_change_password" BOOLEAN,
  "failed_login_count" INTEGER,
  "locked_until" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "password_reset_token" TEXT,
  "password_reset_expires" TEXT,
  "created_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ,
  "usr_id" TEXT,
  "devicecd" TEXT,
  "loc_cd" TEXT,
  "department" TEXT,
  "emp_id" TEXT
);

