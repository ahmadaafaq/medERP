import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
conn.autocommit = True
cur = conn.cursor(cursor_factory=RealDictCursor)

for schema in ['tenant_srms-cet-bareilly', 'tenant_srms-ims', 'tenant_srms-cet']:
    try:
        cur.execute(f'SELECT * FROM "{schema}".subjects')
        rows = cur.fetchall()
        print(f'\n================ Schema {schema} Total subjects: {len(rows)} ================')
        for r in rows:
            print(f"[{r.get('code')}] {r.get('name')} | course_cd={r.get('course_cd')} | dept_id={r.get('department_id')}")
    except Exception as e:
        print(f'Error in {schema}:', e)

conn.close()
