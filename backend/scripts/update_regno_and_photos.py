#!/usr/bin/env python3
"""
Update Student Registration Numbers and Photo URLs
===================================================
1. Reads BCA student master records from `frontend/data/regno_list_BCA_files/sheet001.htm`.
2. Accurately updates/seeds all 70 BCA students with their correct Registration No (e.g. 2025107975)
   and Roll No (e.g. 2500141790002).
3. Applies photo_url format:
   `https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/{colg_cd}/{reg_no}/{reg_no}.JPG`
   to all non-MBBS students across the database.
4. Updates users, students, student_admissions, student_parents, student_addresses, student_academic_details.
"""

import os
import re
import psycopg2
from psycopg2.extras import RealDictCursor
from html.parser import HTMLParser

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "unicampus")
DB_PASS = os.getenv("DB_PASS", "unicampus_secret")
DB_NAME = os.getenv("DB_NAME", "unicampus_erp")

DEFAULT_PASSWORD_HASH = "$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX."

HTML_FILE_PATH = r"f:\AI_DOCKER\AAFAQ_SIR_PROJECTS\UNICAMPDIR\ERP\eng-erp\frontend\data\regno_list_BCA_files\sheet001.htm"

class ExcelHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_row = []
        self.current_cell = []
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag.lower() in ('td', 'th'):
            self.in_cell = True
            self.current_cell = []
        elif tag.lower() == 'tr':
            self.current_row = []

    def handle_endtag(self, tag):
        if tag.lower() in ('td', 'th'):
            self.in_cell = False
            self.current_row.append(" ".join("".join(self.current_cell).split()))
        elif tag.lower() == 'tr':
            if any(self.current_row):
                self.rows.append(self.current_row)

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell.append(data)

def parse_bca_sheet(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    parser = ExcelHTMLParser()
    parser.feed(content)

    header = None
    records = []
    for r in parser.rows:
        if 'REGIS.NO' in r or 'ROLLNO' in r:
            header = r
            continue
        if header and len(r) >= 5:
            sr = r[0].strip()
            if sr.isdigit() or (len(r) > 1 and r[1].isdigit()):
                records.append({
                    'sr_no': r[0].strip(),
                    'reg_no': r[1].strip(),
                    'roll_no': r[2].strip(),
                    'device_code': r[3].strip() if len(r) > 3 else "",
                    'name': r[4].strip(),
                    'email': (r[43].strip() if len(r) > 43 and r[43].strip() else (r[44].strip() if len(r) > 44 and r[44].strip() else (r[5].strip() if len(r) > 5 and r[5].strip() else ""))),
                    'father_name': r[9].strip() if len(r) > 9 else "",
                    'father_mobile': r[10].strip() if len(r) > 10 else "",
                    'mother_name': r[27].strip() if len(r) > 27 else "",
                    'gender': r[28].strip() if len(r) > 28 else "MALE",
                    'course': r[29].strip() if len(r) > 29 else "BCA",
                    'batch': r[31].strip() if len(r) > 31 else "2025",
                    'residence_type': r[36].strip() if len(r) > 36 else "DAY SCHOLAR",
                    'address': r[38].strip() if len(r) > 38 else "",
                    'phone': (r[39].strip() if len(r) > 39 and r[39].strip() else (r[40].strip() if len(r) > 40 and r[40].strip() else (r[45].strip() if len(r) > 45 else ""))),
                    'city': r[48].strip() if len(r) > 48 else "Bareilly",
                    'state': r[46].strip() if len(r) > 46 else "Uttar Pradesh",
                    'pin': r[47].strip() if len(r) > 47 else "243001",
                    'category': r[49].strip() if len(r) > 49 else "GENERAL",
                    'dob': r[51].strip() if len(r) > 51 else "",
                    'status': r[65].strip() if len(r) > 65 else "ACTIVE"
                })
    return records

def normalize_name_for_match(name: str) -> str:
    return re.sub(r'[^a-zA-Z]', '', name.lower())

def main():
    print("=" * 70)
    print("Updating Registration Numbers & Photo URLs for Student Master")
    print("=" * 70)

    # 1. Parse BCA Sheet
    bca_records = parse_bca_sheet(HTML_FILE_PATH)
    print(f"[FETCH] Parsed {len(bca_records)} BCA records from {HTML_FILE_PATH}\n")

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
        colg_cd = "1"
        college_slug = "srms-cet-bareilly"
        schema = f"tenant_{college_slug}"

        cur.execute("SELECT id, name, slug, code FROM public.tenants WHERE code = '1' OR slug = 'srms-cet-bareilly'")
        tenant = cur.fetchone()
        if not tenant:
            raise ValueError("Tenant SRMS CET Bareilly not found in public.tenants!")

        college_id = str(tenant["id"])
        college_name = tenant["name"]

        # Fetch Course, Branch, Batch IDs for BCA
        cur.execute(f"SELECT id, code, name, course_cd FROM \"{schema}\".courses WHERE course_cd = '13' OR name = 'BCA'")
        bca_course = cur.fetchone()
        bca_course_id = str(bca_course["id"]) if bca_course else None

        cur.execute(f"SELECT id, code, name, branch_cd FROM \"{schema}\".departments WHERE course_cd = '13' OR name ILIKE '%BCA%'")
        bca_dept = cur.fetchone()
        bca_branch_id = str(bca_dept["id"]) if bca_dept else None
        bca_branch_code = str(bca_dept["code"] or "1") if bca_dept else "1"
        bca_branch_name = bca_dept["name"] if bca_dept else "BCA Department"

        cur.execute(f"SELECT id, code, year, course_cd FROM \"{schema}\".batches WHERE course_cd = '13' AND year = 2025")
        bca_batch_2025 = cur.fetchone()
        bca_batch_2025_id = str(bca_batch_2025["id"]) if bca_batch_2025 else None
        bca_batch_2025_code = str(bca_batch_2025["code"] or "B2025-C13-1") if bca_batch_2025 else "B2025-C13-1"

        cur.execute(f"SELECT id FROM \"{schema}\".academic_sessions WHERE name ILIKE '%2025-2026%' LIMIT 1")
        sess_row = cur.fetchone()
        session_id = str(sess_row["id"]) if sess_row else None

        print(f"[INFO] College: {college_name} ({college_id})")
        print(f"[INFO] BCA Course ID: {bca_course_id} | Branch ID: {bca_branch_id} | Batch 2025 ID: {bca_batch_2025_id}\n")

        # 3. Process each BCA record from the sheet
        updated_bca_count = 0
        inserted_bca_count = 0

        for r in bca_records:
            reg_no = r["reg_no"]
            roll_no = r["roll_no"]
            name = r["name"]
            raw_email = r["email"]
            gender = "Female" if "FEMALE" in r["gender"].upper() else "Male"
            residency = "Hosteller" if "HOSTEL" in r["residence_type"].upper() else "Day Scholar"
            phone = r["phone"]
            status = "ACTIVE" if "ACTIVE" in r["status"].upper() else ("WITHDRAWN" if "WITHDRAW" in r["status"].upper() else "PROPOSED")

            # Standard Photo URL according to the user specification
            photo_url = f"https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/{colg_cd}/{reg_no}/{reg_no}.JPG"

            student_email = raw_email.lower() if raw_email else f"{reg_no.lower()}@srms.ac.in"

            # Check if student exists in DB
            # 1. By roll_no
            # 2. By reg_no
            # 3. By normalized name and course BCA
            cur.execute(f"""
                SELECT id, user_id, registration_no, rollno, name
                FROM "{schema}".students
                WHERE rollno = %s OR registration_no = %s OR registration_no = %s
            """, (roll_no, reg_no, roll_no))
            existing = cur.fetchone()

            if not existing:
                # Try matching by name
                cur.execute(f"""
                    SELECT id, user_id, registration_no, rollno, name
                    FROM "{schema}".students
                    WHERE course_cd = '13' AND (
                        LOWER(TRIM(name)) = LOWER(%s) OR
                        REPLACE(LOWER(name), ' ', '') = REPLACE(LOWER(%s), ' ', '')
                    )
                """, (name, name))
                existing = cur.fetchone()

            if existing:
                student_id = existing["id"]
                user_id = existing["user_id"]

                # Update student
                cur.execute(f"""
                    UPDATE "{schema}".students
                    SET registration_no = %s,
                        rollno = %s,
                        name = %s,
                        photo_url = %s,
                        phone = %s,
                        batch_cd = '2',
                        course_cd = '13',
                        department_id = %s,
                        branch_id = %s,
                        batch_id = %s,
                        admission_year = 2025,
                        updated_at = NOW()
                    WHERE id = %s
                """, (reg_no, roll_no, name, photo_url, phone or None, bca_branch_id, bca_branch_id, bca_batch_2025_id, student_id))

                # Update admissions
                cur.execute(f"""
                    INSERT INTO "{schema}".student_admissions (
                        student_id, college_id, college_name, course_id, course_code,
                        session_id, academic_session, batch_id, batch_code,
                        branch_id, branch_code, branch_name, residency_type, admission_type,
                        admission_date, status
                    ) VALUES (%s, %s, %s, %s, 'BCA', %s, '2025-2026 Academic Session', %s, %s, %s, %s, %s, %s, 'Regular Admission', '2025-08-01', %s)
                    ON CONFLICT (student_id) DO UPDATE SET
                        college_id = EXCLUDED.college_id,
                        college_name = EXCLUDED.college_name,
                        course_id = EXCLUDED.course_id,
                        course_code = 'BCA',
                        batch_id = EXCLUDED.batch_id,
                        batch_code = EXCLUDED.batch_code,
                        branch_id = EXCLUDED.branch_id,
                        branch_code = EXCLUDED.branch_code,
                        branch_name = EXCLUDED.branch_name,
                        residency_type = EXCLUDED.residency_type,
                        status = EXCLUDED.status
                """, (
                    student_id, college_id, college_name, bca_course_id, session_id,
                    bca_batch_2025_id, bca_batch_2025_code, bca_branch_id, bca_branch_code,
                    bca_branch_name, residency, status
                ))

                # Update user email if provided
                if user_id and raw_email:
                    cur.execute(f"""
                        UPDATE "{schema}".users
                        SET email = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (student_email, user_id))

                updated_bca_count += 1
            else:
                # Insert new student
                cur.execute(f"""
                    INSERT INTO "{schema}".users (email, password_hash, role, onboarding_completed, is_active, created_at, updated_at)
                    VALUES (%s, %s, 'STUDENT', true, true, NOW(), NOW())
                    ON CONFLICT (email) DO UPDATE SET is_active = true, updated_at = NOW()
                    RETURNING id
                """, (student_email, DEFAULT_PASSWORD_HASH))
                user_id = cur.fetchone()["id"]

                cur.execute(f"""
                    INSERT INTO "{schema}".students (
                        user_id, rollno, registration_no, name, batch_cd, course_cd,
                        department_id, batch_id, branch_id, admission_year, photo_url, phone, is_active, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, '2', '13', %s, %s, %s, 2025, %s, %s, true, NOW(), NOW())
                    ON CONFLICT (registration_no) DO UPDATE SET
                        rollno = EXCLUDED.rollno,
                        name = EXCLUDED.name,
                        photo_url = EXCLUDED.photo_url,
                        updated_at = NOW()
                    RETURNING id
                """, (user_id, roll_no, reg_no, name, bca_branch_id, bca_batch_2025_id, bca_branch_id, photo_url, phone or None))
                student_id = cur.fetchone()["id"]

                cur.execute(f"""
                    INSERT INTO "{schema}".student_admissions (
                        student_id, college_id, college_name, course_id, course_code,
                        session_id, academic_session, batch_id, batch_code,
                        branch_id, branch_code, branch_name, residency_type, admission_type,
                        admission_date, status
                    ) VALUES (%s, %s, %s, %s, 'BCA', %s, '2025-2026 Academic Session', %s, %s, %s, %s, %s, %s, 'Regular Admission', '2025-08-01', %s)
                    ON CONFLICT (student_id) DO NOTHING
                """, (
                    student_id, college_id, college_name, bca_course_id, session_id,
                    bca_batch_2025_id, bca_batch_2025_code, bca_branch_id, bca_branch_code,
                    bca_branch_name, residency, status
                ))

                inserted_bca_count += 1

            # Update parent & address info
            if r["father_name"] or r["mother_name"]:
                cur.execute(f"""
                    INSERT INTO "{schema}".student_parents (
                        student_id, father_name, father_mobile, mother_name
                    ) VALUES (%s, %s, %s, %s)
                    ON CONFLICT (student_id) DO UPDATE SET
                        father_name = EXCLUDED.father_name,
                        father_mobile = EXCLUDED.father_mobile,
                        mother_name = EXCLUDED.mother_name
                """, (student_id, r["father_name"], r["father_mobile"] or None, r["mother_name"]))

            if r["city"] or r["state"]:
                cur.execute(f"""
                    INSERT INTO "{schema}".student_addresses (
                        student_id, permanent_address_1, permanent_city, permanent_state, permanent_pincode, same_as_permanent
                    ) VALUES (%s, %s, %s, %s, %s, true)
                    ON CONFLICT (student_id) DO UPDATE SET
                        permanent_address_1 = EXCLUDED.permanent_address_1,
                        permanent_city = EXCLUDED.permanent_city,
                        permanent_state = EXCLUDED.permanent_state,
                        permanent_pincode = EXCLUDED.permanent_pincode
                """, (student_id, r["address"], r["city"], r["state"], r["pin"]))

        print(f"[OK] BCA Students Updated from File: {updated_bca_count}")
        print(f"[OK] BCA Students Inserted from File: {inserted_bca_count}")

        # 4. Now, apply photo_url to ALL NON-MBBS students in the database
        print("\n[INFO] Applying Photo URLs to all other non-MBBS students in database...")
        cur.execute(f"""
            SELECT s.id, s.registration_no, s.rollno, s.name, s.course_cd, sa.course_code
            FROM "{schema}".students s
            LEFT JOIN "{schema}".student_admissions sa ON sa.student_id = s.id
            WHERE (sa.course_code IS NULL OR sa.course_code != 'MBBS') AND (s.course_cd IS NULL OR s.course_cd != 'MBBS')
        """)
        all_students = cur.fetchall()

        total_photo_urls_updated = 0
        for s in all_students:
            s_id = s["id"]
            reg = (s["registration_no"] or s["rollno"] or "").strip()
            if reg:
                img_url = f"https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/{colg_cd}/{reg}/{reg}.JPG"
                cur.execute(f"""
                    UPDATE "{schema}".students
                    SET photo_url = %s
                    WHERE id = %s
                """, (img_url, s_id))
                total_photo_urls_updated += 1

        conn.commit()

        print("=" * 70)
        print("[SUCCESS] REGISTRATION NUMBERS AND PHOTO URLS UPDATED SUCCESSFULLY!")
        print("=" * 70)
        print(f"[OK] Total BCA Records Processed   : {len(bca_records)}")
        print(f"[OK] Total Non-MBBS Photo URLs Set : {total_photo_urls_updated}")
        print("=" * 70)

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Seeding/Updating failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
