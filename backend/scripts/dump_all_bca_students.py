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
            self.current_row.append(" ".join("".join(self.current_cell).split()))
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

header = None
records = []
for r in parser.rows:
    if 'REGIS.NO' in r or 'ROLLNO' in r:
        header = r
        continue
    if header and len(r) >= 5:
        # Check if first cell is a number (SR.NO)
        sr = r[0].strip()
        if sr.isdigit() or (len(r) > 1 and r[1].isdigit()):
            records.append(r)

print(f"Total student records in BCA file: {len(records)}")
for i, r in enumerate(records):
    sr = r[0]
    reg = r[1]
    roll = r[2]
    name = r[4]
    father = r[9] if len(r) > 9 else ""
    gender = r[28] if len(r) > 28 else ""
    course = r[29] if len(r) > 29 else ""
    batch = r[31] if len(r) > 31 else ""
    residence = r[36] if len(r) > 36 else ""
    phone = r[39] if len(r) > 39 else ""
    email = r[43] if len(r) > 43 else ""
    status = r[65] if len(r) > 65 else ""
    print(f"#{str(i+1).zfill(2)}: RegNo: {reg.ljust(11)} | RollNo: {roll.ljust(15)} | Name: {name.ljust(25)} | Email: {email.ljust(30)} | Status: {status}")
