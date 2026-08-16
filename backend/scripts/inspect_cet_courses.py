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

print("=== COURSES IN CET ===")
cur.execute(f'SELECT * FROM "{schema}".courses')
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

print("\n=== DEPARTMENTS / BRANCHES IN CET ===")
cur.execute(f'SELECT id, name, code, type, branch_cd, course_cd, course_name, colg_cd FROM "{schema}".departments')
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

print("\n=== BATCHES IN CET ===")
cur.execute(f'SELECT id, code, year, course_cd, batch_cd, course_name, name, colg_cd FROM "{schema}".batches')
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

print("\n=== ACADEMIC SESSIONS IN CET ===")
cur.execute(f'SELECT * FROM "{schema}".academic_sessions')
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

conn.close()
