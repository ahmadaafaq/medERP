import psycopg2
import urllib.request
import csv
import io
import json

def fetch_sheet1():
    sheet_id = '1ARaan06jKrkkmysnReBIPX-YUT_thaRyG1jKrcvnp6E'
    gid = '805861450'
    url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    return rows

def main():
    rows = fetch_sheet1()
    print(f"Total students in sheet: {len(rows)}")
    
    # Collect unique courses, branches, batches, categories, etc.
    courses = set()
    branches = set()
    batches = set()
    courses_branches = set()

    for r in rows:
        c = r.get('Course', '').strip()
        b = r.get('Branch', '').strip()
        bt = r.get('Batch', '').strip()
        courses.add(c)
        branches.add(b)
        batches.add(bt)
        courses_branches.add((c, b, bt))

    print("\n--- Unique Courses in Sheet 1 ---")
    for c in sorted(courses):
        print(f"  - '{c}'")

    print("\n--- Unique Branches in Sheet 1 ---")
    for b in sorted(branches):
        print(f"  - '{b}'")

    print("\n--- Unique Batches in Sheet 1 ---")
    for bt in sorted(batches):
        print(f"  - '{bt}'")

    print("\n--- (Course, Branch, Batch) Combinations ---")
    for cb in sorted(courses_branches):
        count = sum(1 for r in rows if (r.get('Course','').strip(), r.get('Branch','').strip(), r.get('Batch','').strip()) == cb)
        print(f"  - Course: '{cb[0]}' | Branch: '{cb[1]}' | Batch: '{cb[2]}' -> {count} students")

    # Connect to DB and inspect
    conn = psycopg2.connect(
        dbname='unicampus_erp',
        user='unicampus',
        password='unicampus_secret',
        host='localhost',
        port=5432
    )
    cur = conn.cursor()

    cur.execute("SELECT id, name, slug, code FROM public.tenants ORDER BY code::int")
    tenants = cur.fetchall()
    print("\n=== PUBLIC.TENANTS ===")
    for t in tenants:
        print(f"  Code: {t[3]} | Slug: {t[2]} | Name: {t[1]} | ID: {t[0]}")

    for schema in ['tenant_srms-cet-bareilly']:
        print(f"\n=== Existing Master Data in {schema} ===")
        for tbl in ['courses_master', 'branches_master', 'academic_sessions', 'batches', 'departments']:
            try:
                cur.execute(f'SELECT * FROM "{schema}".{tbl}')
                cols = [desc[0] for desc in cur.description]
                t_rows = cur.fetchall()
                print(f"\n-- {tbl} ({len(t_rows)} rows) --")
                for tr in t_rows[:15]:
                    row_dict = dict(zip(cols, tr))
                    print("   ", row_dict)
            except Exception as e:
                print(f"Error in {tbl}:", e)
                conn.rollback()

    conn.close()

if __name__ == '__main__':
    main()
