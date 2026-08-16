import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

schema = 'tenant_srms-cet-bareilly'

aafreen_reg = '2025107990'
aafreen_roll = '2500141790001'
aafreen_photo = f"https://myportal.srms.ac.in/srmserp/Registration/StudentDocument/1/{aafreen_reg}/{aafreen_reg}.JPG"

cur.execute(f"""
    UPDATE "{schema}".students
    SET registration_no = %s,
        photo_url = %s,
        updated_at = NOW()
    WHERE rollno = %s OR name ILIKE %s
""", (aafreen_reg, aafreen_photo, aafreen_roll, '%Aafreen%'))

conn.commit()

cur.execute(f"""
    SELECT name, rollno, registration_no, photo_url
    FROM "{schema}".students
    WHERE rollno = %s OR registration_no = %s
""", (aafreen_roll, aafreen_reg))
print("Aafreen Khan record in DB:")
for r in cur.fetchall():
    print(r)

conn.close()
