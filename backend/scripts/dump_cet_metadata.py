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

print("=== ALL COURSES IN CET ===")
cur.execute(f'SELECT * FROM "{schema}".courses')
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

conn.close()
