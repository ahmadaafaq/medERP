import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

schema = 'tenant_srms-cet-bareilly'

print("=== VERIFYING ROLLNO != REGISTRATION_NO IN BCA STUDENTS ===")
cur.execute(f"""
    SELECT name, rollno, registration_no, photo_url 
    FROM "{schema}".students 
    WHERE rollno LIKE '250014179%'
    ORDER BY rollno
    LIMIT 20
""")
for r in cur.fetchall():
    print(f"Name: {r['name'][:22]:<22} | Roll: {r['rollno']:<15} | RegNo: {r['registration_no']:<12} | Photo: {r['photo_url']}")

print("\n=== TOTAL COUNTS IN CET ===")
cur.execute(f"""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN photo_url IS NOT NULL THEN 1 END) as with_photo,
        COUNT(CASE WHEN rollno != registration_no THEN 1 END) as diff_roll_reg
    FROM "{schema}".students
""")
counts = cur.fetchone()
print(f"Total students in CET : {counts['total']}")
print(f"With Photo URL        : {counts['with_photo']}")
print(f"With distinct Roll/Reg: {counts['diff_roll_reg']}")

conn.close()
