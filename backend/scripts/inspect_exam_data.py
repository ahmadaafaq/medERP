import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
conn.autocommit = True
cur = conn.cursor(cursor_factory=RealDictCursor)

for table in ['examination_papers', 'exam_papers', 'questions', 'units', 'topics', 'sub_topics', 'subject_offerings']:
    for schema in ['tenant_srms-cet-bareilly', 'tenant_srms-ims']:
        try:
            cur.execute(f'SELECT * FROM "{schema}".{table} LIMIT 10')
            rows = cur.fetchall()
            print(f'\n--- Schema {schema} Table {table} ({len(rows)} rows) ---')
            for r in rows:
                print(r)
        except Exception as e:
            pass

conn.close()
