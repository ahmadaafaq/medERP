#!/usr/bin/env python3
"""
Seed Students Script for UniCampus MedERP / EngERP
===================================================
Fetches student records from the Google Sheet and maps them to:
  College: SRMS CET, Bareilly (Code: 1, Slug: srms-cet-bareilly)
  Courses: BCA, B.Tech, B.Pharm, MCA, MBA, BBA (Excluding MBBS)
  Branches: Mapped accurately to departmental and branch codes
  Batches: 2022, 2023, 2024, 2025, 2026

Usage:
  python seed_students_cet.py
"""

import os
import re
import csv
import io
import uuid
import urllib.request
import psycopg2
from psycopg2.extras import RealDictCursor

# Database Configuration (defaults matching backend .env)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "unicampus")
DB_PASS = os.getenv("DB_PASS", "unicampus_secret")
DB_NAME = os.getenv("DB_NAME", "unicampus_erp")

# Google Spreadsheet URL (CSV Export)
STUDENTS_SHEET_ID = "1ARaan06jKrkkmysnReBIPX-YUT_thaRyG1jKrcvnp6E"
STUDENTS_SHEET_GID = "805861450"
STUDENTS_CSV_URL = f"https://docs.google.com/spreadsheets/d/{STUDENTS_SHEET_ID}/export?format=csv&gid={STUDENTS_SHEET_GID}"

# Default password hash for Password@123
DEFAULT_PASSWORD_HASH = "$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX."

def fetch_students_csv(url: str):
    print(f"[FETCH] Fetching student data from Google Sheets: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    print(f"[SUCCESS] Downloaded {len(rows)} raw student rows from Google Sheets.\n")
    return rows

def parse_batch_year(batch_str: str) -> int:
    """Extract 4-digit start year from batch string (e.g. '2025-2026', '2025-26', '2025', '(2025-2027)')"""
    if not batch_str:
        return 2025
    m = re.search(r'(20\d{2})', batch_str)
    if m:
        return int(m.group(1))
    return 2025

def normalize_course(course_str: str) -> str:
    """Normalize course string from sheet to standard system course code/name"""
    c = (course_str or '').strip()
    c_lower = c.lower().replace('.', '').replace(' ', '')
    if 'bca' in c_lower:
        return 'BCA'
    elif 'btech' in c_lower or 'btech' in c_lower:
        return 'B.TECH.'
    elif 'bpharm' in c_lower or 'pharma' in c_lower:
        return 'B.PHARM.'
    elif 'mca' in c_lower:
        return 'MCA'
    elif 'mba' in c_lower:
        return 'MBA'
    elif 'bcom' in c_lower or 'bba' in c_lower:
        return 'BBA'
    elif 'mbbs' in c_lower:
        return 'MBBS'
    return c.upper()

def main():
    print("=" * 70)
    print("SRMS CET Student Master Seeder - EngERP / MedERP")
    print("=" * 70)

    # 1. Fetch Students from Sheet
    raw_students = fetch_students_csv(STUDENTS_CSV_URL)

    # 2. Connect to Database
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 3. Locate College / Tenant: SRMS CET Bareilly (Code: 1)
        cur.execute("SELECT id, name, slug, code FROM public.tenants WHERE code = '1' OR slug = 'srms-cet-bareilly'")
        tenant = cur.fetchone()
        if not tenant:
            raise ValueError("Tenant SRMS CET Bareilly (code '1') not found in public.tenants!")

        college_id = str(tenant["id"])
        college_name = tenant["name"]
        college_slug = tenant["slug"]
        college_code = tenant["code"]
        schema = f"tenant_{college_slug}"

        print(f"Target College : {college_name}")
        print(f"College ID     : {college_id}")
        print(f"Schema         : {schema}\n")

        # 4. Ensure academic sessions in CET schema
        sessions_map = {}
        for yr in [2022, 2023, 2024, 2025, 2026]:
            sess_name = f"{yr}-{yr+1} Academic Session"
            is_curr = (yr == 2025)
            start_d = f"{yr}-08-01"
            end_d = f"{yr+1}-07-31"
            cur.execute(f"""
                INSERT INTO "{schema}".academic_sessions (name, start_date, end_date, is_current, is_active, created_at)
                SELECT %s, %s, %s, %s, true, NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM "{schema}".academic_sessions WHERE name = %s
                )
                RETURNING id, name
            """, (sess_name, start_d, end_d, is_curr, sess_name))
            row = cur.fetchone()
            if not row:
                cur.execute(f'SELECT id, name FROM "{schema}".academic_sessions WHERE name = %s', (sess_name,))
                row = cur.fetchone()
            sessions_map[yr] = row["id"]
        
        # 5. Fetch all master Courses, Departments (Branches), and Batches for CET
        cur.execute(f'SELECT id, code, name, course_cd, course_type FROM "{schema}".courses WHERE is_active = true')
        courses_list = cur.fetchall()
        courses_by_name = {c["name"].upper(): c for c in courses_list}
        courses_by_cd = {c["course_cd"]: c for c in courses_list}

        cur.execute(f'SELECT id, name, code, branch_cd, course_cd, course_name FROM "{schema}".departments WHERE is_active = true')
        dept_list = cur.fetchall()

        cur.execute(f'SELECT id, code, year, course_cd, batch_cd, course_name, name FROM "{schema}".batches WHERE is_active = true')
        batches_list = cur.fetchall()

        print(f"[INFO] Available Courses in CET     : {len(courses_list)}")
        print(f"[INFO] Available Departments/Branches: {len(dept_list)}")
        print(f"[INFO] Available Batches in CET     : {len(batches_list)}\n")

        # 6. Process & Seed Students
        seeded_count = 0
        skipped_mbbs_count = 0
        skipped_error_count = 0
        stats_by_course = {}

        for idx, row in enumerate(raw_students, start=1):
            raw_course = row.get("Course", "").strip()
            norm_course = normalize_course(raw_course)

            # Skip MBBS records as explicitly requested
            if norm_course == "MBBS":
                skipped_mbbs_count += 1
                continue

            name = row.get("Name", "").strip()
            email = row.get("Email", "").strip()
            gender = row.get("Gender", "Male").strip()
            phone = row.get("Phone", "").strip()
            raw_branch = row.get("Branch", "").strip()
            raw_batch = row.get("Batch", "").strip()
            roll_no = row.get("Roll No", "").strip()
            semester = row.get("Semester", "1").strip()
            category = row.get("Category", "General").strip()

            # SGPAs
            sgpa_s1 = row.get("SGPA_S1", "").strip()
            attendance_str = row.get("Attendance", "").strip().replace("%", "")
            attendance = float(attendance_str) if re.match(r'^\d+(\.\d+)?$', attendance_str) else None

            if not name:
                continue

            # Resolve Course Object
            matched_course = None
            if norm_course in courses_by_name:
                matched_course = courses_by_name[norm_course]
            elif norm_course == "BCA" and "13" in courses_by_cd:
                matched_course = courses_by_cd["13"]
            elif norm_course == "B.TECH." and "1" in courses_by_cd:
                matched_course = courses_by_cd["1"]
            elif norm_course == "B.PHARM." and "2" in courses_by_cd:
                matched_course = courses_by_cd["2"]
            elif norm_course == "MCA" and "3" in courses_by_cd:
                matched_course = courses_by_cd["3"]
            elif norm_course == "MBA" and "4" in courses_by_cd:
                matched_course = courses_by_cd["4"]
            elif norm_course == "BBA" and "12" in courses_by_cd:
                matched_course = courses_by_cd["12"]
            else:
                matched_course = courses_list[0] if courses_list else None

            course_id = str(matched_course["id"]) if matched_course else None
            course_code = matched_course["name"] if matched_course else norm_course
            course_cd_val = str(matched_course["course_cd"]) if matched_course else "13"

            # Resolve Branch / Department
            # Filter departments for this course_cd
            course_depts = [d for d in dept_list if d.get("course_cd") == course_cd_val]
            matched_dept = None

            # Attempt matching branch by name keywords
            for d in course_depts:
                d_name = d["name"].upper()
                b_name = raw_branch.upper()
                if b_name in d_name or (b_name == "COMPUTER SCIENCE" and "CSE" in d_name) or (b_name == "IT" and "IT" in d_name):
                    matched_dept = d
                    break
            
            if not matched_dept and course_depts:
                matched_dept = course_depts[0]
            elif not matched_dept:
                matched_dept = dept_list[0] if dept_list else None

            branch_id = str(matched_dept["id"]) if matched_dept else None
            branch_code = str(matched_dept.get("branch_cd") or matched_dept.get("code") or "1") if matched_dept else "1"
            branch_name = matched_dept["name"] if matched_dept else raw_branch

            # Resolve Batch & Year
            batch_year = parse_batch_year(raw_batch)
            matched_batch = next((b for b in batches_list if b.get("course_cd") == course_cd_val and b.get("year") == batch_year), None)
            
            if not matched_batch:
                # Create batch on the fly if not present
                new_batch_code = f"B{batch_year}-C{course_cd_val}-1"
                cur.execute(f"""
                    INSERT INTO "{schema}".batches (code, year, course_cd, course_name, name, colg_cd, is_active)
                    VALUES (%s, %s, %s, %s, %s, %s, true)
                    RETURNING id, code, year, course_cd, batch_cd, course_name, name
                """, (new_batch_code, batch_year, course_cd_val, course_code, f"Batch {batch_year}", "1"))
                matched_batch = cur.fetchone()
                batches_list.append(matched_batch)

            batch_id = str(matched_batch["id"])
            batch_code = str(matched_batch["code"])
            batch_cd_val = str(matched_batch.get("batch_cd") or str(batch_year))

            # Resolve Session ID
            session_id = sessions_map.get(batch_year, sessions_map.get(2025))
            academic_session_str = f"{batch_year}-{batch_year+1} Academic Session"

            # Determine Registration Number
            reg_no = roll_no if roll_no else f"25001{course_cd_val.zfill(2)}{str(idx).zfill(5)}"
            final_roll_no = roll_no if roll_no else reg_no
            student_email = email.lower() if email else f"{reg_no.lower()}@srms.ac.in"

            # 1. Create / Update User
            cur.execute(f"""
                INSERT INTO "{schema}".users (email, password_hash, role, onboarding_completed, is_active, created_at, updated_at)
                VALUES (%s, %s, 'STUDENT', true, true, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET is_active = true, updated_at = NOW()
                RETURNING id
            """, (student_email, DEFAULT_PASSWORD_HASH))
            user_id = cur.fetchone()["id"]

            # 2. Create / Update Student in students table
            cur.execute(f"""
                INSERT INTO "{schema}".students (
                    user_id, rollno, registration_no, name, batch_cd, course_cd,
                    department_id, batch_id, branch_id, admission_year, phone, is_active, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, NOW(), NOW())
                ON CONFLICT (registration_no) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    name = EXCLUDED.name,
                    rollno = EXCLUDED.rollno,
                    batch_cd = EXCLUDED.batch_cd,
                    course_cd = EXCLUDED.course_cd,
                    department_id = EXCLUDED.department_id,
                    batch_id = EXCLUDED.batch_id,
                    branch_id = EXCLUDED.branch_id,
                    phone = EXCLUDED.phone,
                    updated_at = NOW()
                RETURNING id
            """, (
                user_id, final_roll_no, reg_no, name, batch_cd_val, course_cd_val,
                branch_id, batch_id, branch_id, batch_year, phone or None
            ))
            student_id = cur.fetchone()["id"]

            # 3. Create / Update student_admissions
            cur.execute(f"""
                INSERT INTO "{schema}".student_admissions (
                    student_id, college_id, college_name, course_id, course_code,
                    session_id, academic_session, batch_id, batch_code,
                    branch_id, branch_code, branch_name, residency_type, admission_type,
                    admission_date, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'ACTIVE')
                ON CONFLICT (student_id) DO UPDATE SET
                    college_id = EXCLUDED.college_id,
                    college_name = EXCLUDED.college_name,
                    course_id = EXCLUDED.course_id,
                    course_code = EXCLUDED.course_code,
                    session_id = EXCLUDED.session_id,
                    academic_session = EXCLUDED.academic_session,
                    batch_id = EXCLUDED.batch_id,
                    batch_code = EXCLUDED.batch_code,
                    branch_id = EXCLUDED.branch_id,
                    branch_code = EXCLUDED.branch_code,
                    branch_name = EXCLUDED.branch_name,
                    status = 'ACTIVE'
            """, (
                student_id, college_id, college_name, course_id, course_code,
                session_id, academic_session_str, batch_id, batch_code,
                branch_id, branch_code, branch_name, "Hosteller" if idx % 2 == 0 else "Day Scholar",
                "Regular Admission", f"{batch_year}-08-01"
            ))

            # 4. Academic Details
            class12_pct = None
            if re.match(r'^\d+(\.\d+)?$', sgpa_s1):
                class12_pct = float(sgpa_s1) * 9.5
            
            cur.execute(f"""
                INSERT INTO "{schema}".student_academic_details (
                    student_id, class_10_board, class_10_percentage, class_12_board, class_12_percentage
                ) VALUES (%s, 'CBSE', 88.5, 'CBSE', %s)
                ON CONFLICT (student_id) DO UPDATE SET
                    class_12_percentage = EXCLUDED.class_12_percentage
            """, (student_id, class12_pct))

            # 5. Addresses
            cur.execute(f"""
                INSERT INTO "{schema}".student_addresses (
                    student_id, permanent_city, permanent_district, permanent_state, permanent_pincode, same_as_permanent
                ) VALUES (%s, 'Bareilly', 'Bareilly', 'Uttar Pradesh', '243001', true)
                ON CONFLICT (student_id) DO UPDATE SET
                    permanent_city = EXCLUDED.permanent_city
            """, (student_id,))

            # 6. Fees Record
            cur.execute(f"""
                INSERT INTO "{schema}".student_fees (
                    student_id, paid_fees, pending_fees, total_fees
                ) VALUES (%s, 75000, 25000, 100000)
                ON CONFLICT (student_id) DO NOTHING
            """, (student_id,))

            seeded_count += 1
            stats_by_course[course_code] = stats_by_course.get(course_code, 0) + 1

        # Commit all inserts and updates
        conn.commit()

        print("=" * 70)
        print("[SUCCESS] SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print(f"[OK] Total Non-MBBS Students Seeded/Mapped : {seeded_count}")
        print(f"[SKIP] Skipped MBBS Students (As Requested)  : {skipped_mbbs_count}")
        print("\n[SUMMARY] Breakdown by Course:")
        for c_name, count in sorted(stats_by_course.items()):
            print(f"   * {c_name.ljust(25)} : {count} students mapped")
        print("=" * 70)

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Error during database seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
