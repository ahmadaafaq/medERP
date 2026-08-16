import psycopg2
from psycopg2.extras import RealDictCursor
from html.parser import HTMLParser

file_path = r"f:\AI_DOCKER\AAFAQ_SIR_PROJECTS\UNICAMPDIR\ERP\eng-erp\frontend\data\regno_list_BCA_files\sheet001.htm"

class ExcelHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_row = []
        self.current_cell = []
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag.lower() in ('td', 'th'):
            self.in_cell = True
            self.current_cell = []
        elif tag.lower() == 'tr':
            self.current_row = []

    def handle_endtag(self, tag):
        if tag.lower() in ('td', 'th'):
            self.in_cell = False
            self.current_row.append("".join(self.current_cell).strip().replace('\n', ' '))
        elif tag.lower() == 'tr':
            if any(self.current_row):
                self.rows.append(self.current_row)

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell.append(data)

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

parser = ExcelHTMLParser()
parser.feed(content)

sheet_students = []
header = None
for r in parser.rows:
    if 'REGIS.NO' in r or 'ROLLNO' in r:
        header = r
        continue
    if header and len(r) >= 5:
        reg_no = r[1].strip()
        roll_no = r[2].strip()
        name = r[4].strip()
        father = r[9].strip() if len(r) > 9 else ""
        gender = r[28].strip() if len(r) > 28 else ""
        course = r[29].strip() if len(r) > 29 else ""
        batch = r[31].strip() if len(r) > 31 else ""
        status = r[65].strip() if len(r) > 65 else ""
        if reg_no and roll_no:
            sheet_students.append({
                'reg_no': reg_no,
                'roll_no': roll_no,
                'name': name,
                'father': father,
                'gender': gender,
                'course': course,
                'batch': batch,
                'status': status
            })

print(f"Total students in BCA sheet: {len(sheet_students)}")
print("Sample 10 entries from BCA sheet:")
for s in sheet_students[:10]:
    print(f"  RegNo: {s['reg_no'].ljust(12)} | RollNo: {s['roll_no'].ljust(15)} | Name: {s['name'].ljust(25)} | Status: {s['status']}")

# Check DB students
conn = psycopg2.connect(dbname='unicampus_erp', user='unicampus', password='unicampus_secret', host='localhost', port=5432)
cur = conn.cursor(cursor_factory=RealDictCursor)

schema = 'tenant_srms-cet-bareilly'
cur.execute(f'SELECT id, name, rollno, registration_no, course_cd, photo_url FROM "{schema}".students')
db_students = cur.fetchall()
print(f"\nTotal students in DB for CET: {len(db_students)}")

matches_by_roll = 0
matches_by_name = 0
for db_s in db_students:
    roll = (db_s['rollno'] or '').strip()
    name = (db_s['name'] or '').strip().upper()
    found_by_roll = next((s for s in sheet_students if s['roll_no'] == roll), None)
    if found_by_roll:
        matches_by_roll += 1
    else:
        found_by_name = next((s for s in sheet_students if s['name'].upper() == name or name in s['name'].upper()), None)
        if found_by_name:
            matches_by_name += 1

print(f"Matched by Roll No: {matches_by_roll}")
print(f"Matched by Name: {matches_by_name}")

conn.close()
