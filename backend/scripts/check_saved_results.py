import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

cur.execute("""
    SELECT r.id, r.student_id, r.paper_id, r.marks_obtained, r.is_pass, r.created_at, r.updated_at,
           r.question_marks, r.sub_part_marks, r.practical_mark, r.eval_status,
           s.name as student_name, s.rollno, s.registration_no, p.code as paper_code
    FROM "tenant_srms-cet-bareilly".student_results r
    LEFT JOIN "tenant_srms-cet-bareilly".students s ON r.student_id = s.id
    LEFT JOIN "tenant_srms-cet-bareilly".examination_papers p ON r.paper_id = p.id
""")
rows = cur.fetchall()
print(f"Total results in PostgreSQL: {len(rows)}")
for r in rows:
    print(r)

conn.close()
