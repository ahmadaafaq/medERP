import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute('SELECT * FROM "tenant_srms-cet-bareilly".subjects')
rows = cur.fetchall()
print('Subjects in CET Bareilly:')
for r in rows:
    print(r)

cur.execute('SELECT id, code, name, subject_id, subject_code FROM "tenant_srms-cet-bareilly".units')
print('\nUnits in CET Bareilly:')
for r in cur.fetchall():
    print(r)

cur.execute('SELECT id, code, name, subject_id, subject_code FROM "tenant_srms-cet-bareilly".topics')
print('\nTopics in CET Bareilly:')
for r in cur.fetchall():
    print(r)

cur.execute('SELECT * FROM "tenant_srms-cet-bareilly".questions LIMIT 10')
print('\nQuestions in CET Bareilly:')
for r in cur.fetchall():
    print({
        'id': r.get('id'),
        'subject_code': r.get('subject_code'),
        'subject_name': r.get('subject_name'),
        'unit_code': r.get('unit_code'),
        'topic': r.get('topic'),
        'text': r.get('question_text')[:50] if r.get('question_text') else ''
    })

conn.close()
