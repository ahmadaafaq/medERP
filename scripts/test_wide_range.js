async function test() {
  const payload = {
    colg_cd: 1,
    course_cd: 1,
    branch_cd: 1,
    batch_cd: 18,
    sem_cd: 3,
    section_cd: 1,
    fdt: '2026-07-01',
    tdt: '2026-09-30',
  };

  const res = await fetch('http://localhost:3001/api/srms/student-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  console.log('Count:', json.count);
  console.log('Subject List:', json.subjectList);
  if (json.data && json.data.length > 0) {
    console.log('Student 0:', json.data[0]);
  }
}

test().catch(console.error);
