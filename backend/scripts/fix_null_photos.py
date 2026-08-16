import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

schema = 'tenant_srms-cet-bareilly'

cur.execute(f'SELECT id, name, rollno, registration_no, photo_url, course_cd FROM "{schema}".students WHERE photo_url IS NULL')
rows = cur.fetchall()
print("Students with NULL photo_url:")
for r in rows:
    print(r)

# If any non-MBBS has null photo_url, let's set it
for r in rows:
    if r['course_cd'] != 'MBBS':
        reg = r['registration_no'] or r['rollno']
        if reg:
            p_url = f"https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/1/{reg}/{reg}.JPG"
            cur.execute(f'UPDATE "{schema}".students SET photo_url = %s WHERE id = %s', (p_url, r['id']))

conn.commit()

cur.execute(f'SELECT COUNT(*) FROM "{schema}".students WHERE photo_url IS NOT NULL')
print(f"Total students with photo_url now: {cur.fetchone()['count']}")

conn.close()
