async function checkPresentStudent() {
  const payload2 = {
    colg_cd: 1,
    course_cd: 1,
    branch_cd: 1,
    batch_cd: 18,
    sem_cd: 3,
    section_cd: 1,
    fdt: '2026-09-01',
    tdt: '2026-09-30',
  };

  const res2 = await fetch('http://localhost:3001/api/srms/student-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2),
  });
  const json2 = await res2.json();
  console.log('Total students:', json2.count);

  // Find students who have AttendanceType 'CCTV + MANUAL' and non-zero attendance in COA
  const presentStudents = (json2.data || []).filter((s) => s.COA && !s.COA.startsWith('0/'));
  console.log('Students with present count in COA:', presentStudents.length);
  if (presentStudents.length > 0) {
    console.log('Sample present student:', {
      name: presentStudents[0].stud_name,
      reg_no: presentStudents[0].stud_reg_no,
      roll_no: presentStudents[0].stud_roll_no,
      COA: presentStudents[0].COA,
      TotalPresentPercentage: presentStudents[0].TotalPresentPercentage,
      AttendanceType: presentStudents[0].AttendanceType,
    });
  } else {
    console.log('First 5 students in September:');
    (json2.data || []).slice(0, 5).forEach((s) => {
      console.log(s.stud_reg_no, s.stud_name, s.COA, s.AttendanceType);
    });
  }
}

checkPresentStudent().catch(console.error);
