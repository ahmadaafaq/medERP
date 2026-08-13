-- Direct SQL diagnostic for Priya and Preeti attendance in Physiology
-- Run this in psql: psql -U unicampus -d unicampus_erp -f diagnose.sql

SET search_path TO "tenant_srms-ims";

-- 1. Find Physiology subject
SELECT '=== PHYSIOLOGY SUBJECT ===' AS section;
SELECT id, name, code FROM subjects WHERE code = 'PY' OR UPPER(name) LIKE '%PHYSIOLOGY%' LIMIT 5;

-- 2. Find target students
SELECT '=== TARGET STUDENTS ===' AS section;
SELECT id, registration_no, rollno, name FROM students WHERE name ILIKE '%priya%' OR name ILIKE '%preeti%' ORDER BY name;

-- 3. All Physiology sessions
SELECT '=== ALL PHYSIOLOGY SESSIONS ===' AS section;
SELECT 
    s.id, 
    s.session_date::date AS date,
    to_char(s.session_date, 'Dy') AS day_name,
    EXTRACT(DOW FROM s.session_date) AS dow,
    s.session_type,
    s.is_cancelled,
    s.batch_id
FROM attendance_sessions s
WHERE s.subject_id = (SELECT id FROM subjects WHERE code='PY' LIMIT 1)
ORDER BY s.session_date;

-- 4. Raw records for Priya M Nair in Physiology
SELECT '=== PRIYA M NAIR - RAW PHYSIOLOGY RECORDS ===' AS section;
SELECT 
    s.session_date::date AS date,
    to_char(s.session_date, 'Dy') AS day,
    ar.status,
    s.is_cancelled,
    s.session_type
FROM attendance_records ar
JOIN attendance_sessions s ON s.id = ar.session_id
WHERE ar.student_id = (SELECT id FROM students WHERE name ILIKE '%priya%nair%' LIMIT 1)
  AND s.subject_id = (SELECT id FROM subjects WHERE code='PY' LIMIT 1)
ORDER BY s.session_date;

-- 5. Raw records for Preeti Agarwal in Physiology
SELECT '=== PREETI AGARWAL - RAW PHYSIOLOGY RECORDS ===' AS section;
SELECT 
    s.session_date::date AS date,
    to_char(s.session_date, 'Dy') AS day,
    ar.status,
    s.is_cancelled,
    s.session_type
FROM attendance_records ar
JOIN attendance_sessions s ON s.id = ar.session_id
WHERE ar.student_id = (SELECT id FROM students WHERE name ILIKE '%preeti%' LIMIT 1)
  AND s.subject_id = (SELECT id FROM subjects WHERE code='PY' LIMIT 1)
ORDER BY s.session_date;

-- 6. What the matrix query ACTUALLY calculates (using UPPERCASE status)
SELECT '=== MATRIX QUERY CALCULATION (Priya + Preeti, Physiology) ===' AS section;
SELECT 
    st.registration_no AS rollno,
    st.name,
    COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.session_date::date END)::int AS present_days,
    COUNT(DISTINCT CASE WHEN ar.status IN ('ABSENT') THEN s.session_date::date END)::int AS absent_days,
    COUNT(DISTINCT s.session_date::date)::int AS total_session_days,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.session_date::date END) 
          / NULLIF(COUNT(DISTINCT s.session_date::date), 0), 2) AS pct_from_records
FROM students st
JOIN attendance_records ar ON ar.student_id = st.id
JOIN attendance_sessions s ON s.id = ar.session_id
WHERE s.subject_id = (SELECT id FROM subjects WHERE code='PY' LIMIT 1)
  AND (st.name ILIKE '%priya%' OR st.name ILIKE '%preeti%')
  AND s.is_cancelled = false
GROUP BY st.id, st.registration_no, st.name
ORDER BY st.name;

-- 7. Check timetable slots for Physiology
SELECT '=== TIMETABLE SLOTS FOR PHYSIOLOGY ===' AS section;
SELECT ts.day_of_week, ts.start_time, ts.end_time, ts.id
FROM timetable_slots ts
WHERE ts.subject_id = (SELECT id FROM subjects WHERE code='PY' LIMIT 1)
ORDER BY ts.day_of_week;

-- 8. Does timetable filter affect sessions?
SELECT '=== SESSIONS AFTER TIMETABLE FILTER ===' AS section;
SELECT 
    s.session_date::date AS date,
    to_char(s.session_date, 'Dy') AS day,
    EXTRACT(DOW FROM s.session_date) AS dow,
    EXISTS (
        SELECT 1 FROM timetable_slots ts
        WHERE (ts.subject_id = s.subject_id OR ts.id = s.timetable_slot_id)
          AND ts.day_of_week = EXTRACT(DOW FROM s.session_date)
    ) AS passes_timetable_filter
FROM attendance_sessions s
WHERE s.subject_id = (SELECT id FROM subjects WHERE code='PY' LIMIT 1)
  AND s.is_cancelled = false
ORDER BY s.session_date;
