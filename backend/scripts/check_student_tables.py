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

for tbl in ['students', 'student_admissions', 'student_academic_details', 'student_addresses', 'student_parents', 'student_fees', 'users']:
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = '{schema}' AND table_name = '{tbl}'
        ORDER BY ordinal_position
    """)
    print(f"\n=== Columns in {schema}.{tbl} ===")
    for r in cur.fetchall():
        print(f"  {r[0]} ({r[1]}, nullable={r[2]})")

conn.close()
