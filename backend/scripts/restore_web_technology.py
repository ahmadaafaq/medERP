import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
conn.autocommit = True
cur = conn.cursor(cursor_factory=RealDictCursor)

print("Updating subject d3eb5821-3e7b-420b-9a0c-bbb1019b8da3 in tenant_srms-cet-bareilly...")
cur.execute("""
    UPDATE "tenant_srms-cet-bareilly".subjects
    SET name = 'Web Technology',
        code = '88534',
        course_cd = '13',
        course_name = 'BCA',
        branch_cd = '1',
        department_id = '8937c20c-91d9-47e3-b4b9-0884627d085b'
    WHERE id = 'd3eb5821-3e7b-420b-9a0c-bbb1019b8da3'
""")
print(f"Updated {cur.rowcount} row(s) in subjects.")

# Let's verify units, topics, and subject offerings
cur.execute("""
    UPDATE "tenant_srms-cet-bareilly".units
    SET subject_code = '88534'
    WHERE subject_id = 'd3eb5821-3e7b-420b-9a0c-bbb1019b8da3'
""")
print(f"Updated {cur.rowcount} row(s) in units.")

cur.execute("""
    UPDATE "tenant_srms-cet-bareilly".topics
    SET subject_code = '88534'
    WHERE subject_id = 'd3eb5821-3e7b-420b-9a0c-bbb1019b8da3'
""")
print(f"Updated {cur.rowcount} row(s) in topics.")

# Check all subjects in CET Bareilly
cur.execute('SELECT id, name, code, course_cd, course_name, department_id FROM "tenant_srms-cet-bareilly".subjects')
print("\nCurrent CET Bareilly Subjects:")
for r in cur.fetchall():
    print(r)

conn.close()
