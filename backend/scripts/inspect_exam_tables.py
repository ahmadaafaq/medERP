import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'tenant_srms-cet-bareilly'
""")
tables = [r['table_name'] for r in cur.fetchall()]
print('Tables in tenant_srms-cet-bareilly:', tables)

# Let's check examination_papers and question tables
for t in ['examination_papers', 'exam_papers', 'examination_questions', 'question_bank', 'questions_master', 'assessment_questions']:
    if t in tables:
        cur.execute(f'SELECT * FROM "tenant_srms-cet-bareilly".{t} LIMIT 5')
        print(f'\n--- Table {t} ---')
        for r in cur.fetchall():
            print(r)

conn.close()
