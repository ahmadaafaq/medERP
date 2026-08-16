import urllib.request
import csv
import io
import json

def fetch_sheet1():
    sheet_id = '1ARaan06jKrkkmysnReBIPX-YUT_thaRyG1jKrcvnp6E'
    gid = '805861450'
    url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
    reader = csv.DictReader(io.StringIO(content))
    return list(reader)

rows = fetch_sheet1()
print(f"Total rows in Sheet 1: {len(rows)}")

breakdown = {}
for r in rows:
    c = r.get('Course', '').strip()
    b = r.get('Branch', '').strip()
    bt = r.get('Batch', '').strip()
    key = (c, b, bt)
    breakdown[key] = breakdown.get(key, 0) + 1

print("\n=== STUDENT BREAKDOWN BY (COURSE, BRANCH, BATCH) ===")
for k, count in sorted(breakdown.items()):
    print(f"Course: '{k[0]}' | Branch: '{k[1]}' | Batch: '{k[2]}' -> {count} students")

# Show sample students for each course
print("\n=== SAMPLE ROW FOR EACH COURSE ===")
seen_courses = set()
for r in rows:
    c = r.get('Course', '').strip()
    if c not in seen_courses:
        seen_courses.add(c)
        print(f"\n--- Sample for Course: {c} ---")
        for k, v in r.items():
            if v:
                print(f"  {k}: {v}")
