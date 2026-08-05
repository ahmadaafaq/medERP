async function testAttendancePost() {
  try {
    // 1. Fetch subjects in srms-ims
    const subRes = await fetch('http://localhost:3001/api/v1/admin-master/subjects?tenant=srms-ims');
    const subJson = await subRes.json();
    const subjects = subJson.data || subJson || [];

    // 2. Fetch batches in srms-ims
    const batchRes = await fetch('http://localhost:3001/api/v1/college-master/batches?tenant=srms-ims');
    const batchJson = await batchRes.json();
    const batches = batchJson.data || batchJson || [];

    // 3. Fetch students in srms-ims
    const studentRes = await fetch('http://localhost:3001/api/v1/student-master?tenant=srms-ims');
    const studentJson = await studentRes.json();
    const students = studentJson.data || [];

    console.log(`Found ${subjects.length} subjects, ${batches.length} batches, ${students.length} students`);

    if (!subjects.length || !batches.length || !students.length) {
      console.log('Missing data to test');
      return;
    }

    const payload = {
      subjectId: subjects[0].id,
      batchId: batches[0].id,
      sessionDate: '2026-08-02',
      sessionType: 'THEORY',
      topicCovered: 'Test Session Topic',
      records: [
        { studentId: students[0].id, status: 'PRESENT', remarks: 'Good' },
        { studentId: students[1]?.id || students[0].id, status: 'ABSENT' }
      ]
    };

    console.log('Sending payload to POST /api/v1/attendance/sessions?tenant=srms-ims:', payload);

    const postRes = await fetch('http://localhost:3001/api/v1/attendance/sessions?tenant=srms-ims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const postJson = await postRes.json();
    console.log('Response Status:', postRes.status);
    console.log('Response Body:', JSON.stringify(postJson, null, 2));

  } catch (err) {
    console.error('Error during test:', err);
  }
}

testAttendancePost();
