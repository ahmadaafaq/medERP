import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

schema = 'tenant_srms-cet-bareilly'
cur.execute(f"""
  SELECT id, name, rollno, registration_no, photo_url 
  FROM "{schema}".students 
  WHERE name ILIKE '%Aafreen%' OR rollno = '2500141790001' OR registration_no = '2025107990'
""")
for r in cur.fetchall():
    print(r)
conn.close()
