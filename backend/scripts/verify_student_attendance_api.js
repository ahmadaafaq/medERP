async function testStudentAttendance() {
  console.log('--- 1. Testing BCA Student Attendance (Live SRMS Sync) ---');
  const bcaPayload = {
    colg_cd: 1,
    course_cd: 13,
    branch_cd: 1,
    batch_cd: 2,
    sem_cd: 3,
    section_cd: 1,
    fdt: '2026-07-02',
    tdt: '2026-08-21'
  };

  const bcaRes = await fetch('http://localhost:3001/api/srms/student-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bcaPayload)
  });

  const bcaData = await bcaRes.json();
  console.log('BCA Status:', bcaRes.status);
  console.log('BCA Success:', bcaData.success);
  console.log('BCA Total Students:', bcaData.count || bcaData.data?.length);
  console.log('BCA Subject Columns:', bcaData.subjectColumns);
  if (bcaData.data?.length > 0) {
    const s0 = bcaData.data[0];
    console.log('BCA Sample Student 0:');
    console.log('  Name:', s0.stud_name);
    console.log('  Roll No:', s0.stud_roll_no);
    console.log('  Reg No:', s0.stud_reg_no);
    console.log('  Course:', s0.course_name);
    console.log('  AttendanceType:', s0.AttendanceType);
    console.log('  TotalPresentPercentage:', s0.TotalPresentPercentage);
    console.log('  Subjects:', s0.subjects?.slice(0, 3));
  }

  console.log('\n--- 2. Testing B.Tech Student Attendance (Faculty Marked Session Reflection) ---');
  const btechPayload = {
    colg_cd: 1,
    course_cd: 1,
    branch_cd: 1,
    batch_cd: 18,
    sem_cd: 3,
    section_cd: 1,
    fdt: '2026-09-01',
    tdt: '2026-09-30'
  };

  const btechRes = await fetch('http://localhost:3001/api/srms/student-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(btechPayload)
  });

  const btechData = await btechRes.json();
  console.log('B.Tech Status:', btechRes.status);
  console.log('B.Tech Success:', btechData.success);
  console.log('B.Tech Total Students:', btechData.count || btechData.data?.length);
  console.log('B.Tech Subject Columns:', btechData.subjectColumns);
  if (btechData.data?.length > 0) {
    // Find one of the students we marked present/absent earlier:
    // studentId '4e49c2de-3a16-4455-8a65-0fc544325a2f' (Tanish Verma / 2025107752)
    const markedStudent = btechData.data.find(s => s.stud_reg_no === '2025107752' || s.stud_name?.toLowerCase().includes('tanish')) || btechData.data[0];
    console.log('B.Tech Marked Student:');
    console.log('  Name:', markedStudent.stud_name);
    console.log('  Roll No:', markedStudent.stud_roll_no);
    console.log('  Reg No:', markedStudent.stud_reg_no);
    console.log('  Course:', markedStudent.course_name);
    console.log('  AttendanceType:', markedStudent.AttendanceType);
    console.log('  TotalPresentPercentage:', markedStudent.TotalPresentPercentage);
    console.log('  Subjects:', markedStudent.subjects);
  }
}

testStudentAttendance().catch(console.error);
