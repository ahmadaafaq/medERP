-- Upgrade existing schemas to include professional_phase in courses table
DO $$
DECLARE
  t RECORD;
  schema_name TEXT;
BEGIN
  FOR t IN SELECT slug FROM public.tenants LOOP
    schema_name := 'tenant_' || t.slug;
    EXECUTE format('ALTER TABLE %I.courses ADD COLUMN IF NOT EXISTS professional_phase VARCHAR(100) DEFAULT ''1st Professional (Phase I)'';', schema_name);
    RAISE NOTICE 'Upgraded courses for schema: %', schema_name;
  END LOOP;
END $$;
