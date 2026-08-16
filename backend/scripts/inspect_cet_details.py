import psycopg2

conn = psycopg2.connect(
    dbname='unicampus_erp',
    user='unicampus',
    password='unicampus_secret',
    host='localhost',
    port=5432
)
cur = conn.cursor()
schema = 'tenant_srms-cet-bareilly'

print("=== 1. COURSES IN CET ===")
cur.execute(f'SELECT id, code, name, course_cd, course_type FROM "{schema}".courses ORDER BY course_cd::int')
for r in cur.fetchall():
    print(f"ID: {r[0]} | Code: '{r[1]}' | Name: '{r[2]}' | course_cd: '{r[3]}' | Type: '{r[4]}'")

print("\n=== 2. DEPARTMENTS / BRANCHES IN CET ===")
cur.execute(f'SELECT id, name, code, branch_cd, course_cd, course_name, colg_cd FROM "{schema}".departments ORDER BY course_cd, branch_cd')
for r in cur.fetchall():
    print(f"ID: {r[0]} | Name: '{r[1]}' | Code: '{r[2]}' | branch_cd: '{r[3]}' | course_cd: '{r[4]}' | course_name: '{r[5]}'")

print("\n=== 3. ACADEMIC SESSIONS ===")
cur.execute(f'SELECT * FROM "{schema}".academic_sessions')
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

print("\n=== 4. BATCHES (SAMPLE) ===")
cur.execute(f'SELECT id, code, year, course_cd, batch_cd, course_name, name, colg_cd FROM "{schema}".batches WHERE year >= 2024 ORDER BY course_cd, year')
for r in cur.fetchall():
    print(f"ID: {r[0]} | Code: '{r[1]}' | Year: {r[2]} | batch_cd: '{r[4]}' | course_cd: '{r[3]}' | course_name: '{r[5]}' | Name: '{r[6]}'")

conn.close()
