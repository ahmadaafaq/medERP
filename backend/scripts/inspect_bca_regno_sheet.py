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

print(f"Total rows: {len(parser.rows)}")
for i, r in enumerate(parser.rows[:10]):
    print(f"Row {i}: {r}")

# Find the header row
for i, r in enumerate(parser.rows):
    if any('Roll' in str(c) or 'Registration' in str(c) or 'REG' in str(c) for c in r):
        print(f"\nHeader Row {i}: {r}")
        if i + 1 < len(parser.rows):
            print(f"First Data Row {i+1}: {parser.rows[i+1]}")
        break
