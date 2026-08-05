SET search_path TO "tenant_srms-ims", public;

SELECT 'SESSIONS in tenant_srms-ims:' as label;
SELECT id, name, start_date, end_date, is_current, created_at FROM academic_sessions ORDER BY created_at DESC;

SELECT 'COURSES in tenant_srms-ims:' as label;
SELECT id, code, name FROM courses ORDER BY created_at DESC;

SELECT 'BATCHES in tenant_srms-ims:' as label;
SELECT id, code, year, course_cd FROM batches ORDER BY created_at DESC;

SELECT 'DEPARTMENTS in tenant_srms-ims:' as label;
SELECT id, code, name, type FROM departments ORDER BY created_at DESC;
