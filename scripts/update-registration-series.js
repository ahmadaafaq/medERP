async function seedCorrectRegistrationSeries() {
  const API_BASE = 'http://localhost:3001/api/v1';
  const tenant = 'srms-ims';

  console.log(`📡 Fetching all students from API (tenant: ${tenant})...`);

  try {
    const listRes = await fetch(`${API_BASE}/student-master?tenant=${tenant}`);
    const listData = await listRes.json();
    const students = listData.data || [];

    const namesToDelete = ['aarav', 'ananya', 'rohan', 'priya', 'kabir'];
    for (const s of students) {
      if (namesToDelete.some((n) => s.name.toLowerCase().includes(n))) {
        console.log(`🗑️ Deleting old student record: ${s.name} (${s.id})...`);
        await fetch(`${API_BASE}/student-master/${s.id}?tenant=${tenant}`, { method: 'DELETE' });
      }
    }

    // 1. Fetch Colleges
    const collegesRes = await fetch(`${API_BASE}/college-master/colleges`);
    const collegesData = await collegesRes.json();
    const collegesList = collegesData.data || [];
    const college = collegesList[0] || { id: '74f9f5ee-89c7-4250-88e4-5d912b5070cf', name: 'SRMS Institute of Medical Sciences' };

    // 2. Fetch Courses
    const coursesRes = await fetch(`${API_BASE}/college-master/courses?tenant=${tenant}`);
    const coursesData = await coursesRes.json();
    const coursesList = coursesData.data || [];
    const course = coursesList.find((c) => c.code === 'MBBS') || coursesList[0] || { id: '430a75dc-134d-4c75-9ec4-edf0bb818d5e', code: 'MBBS' };

    // 3. Fetch Batches
    const batchesRes = await fetch(`${API_BASE}/college-master/batches?tenant=${tenant}`);
    const batchesData = await batchesRes.json();
    const batchesList = batchesData.data || [];
    const batch = batchesList.find((b) => b.code === '2025' || b.year === 2025) || batchesList[0] || { id: 'a67ccceb-8002-4864-a518-84e3eadf0836', code: '2025' };

    // 4. Fetch Branches / Departments
    const branchesRes = await fetch(`${API_BASE}/college-master/branches?tenant=${tenant}`);
    const branchesData = await branchesRes.json();
    const branchesList = branchesData.data || [];
    const anatBranch = branchesList.find((b) => b.code === 'ANAT') || branchesList[0];
    const pathBranch = branchesList.find((b) => b.code === 'PATH') || branchesList[1] || branchesList[0];
    const biocBranch = branchesList.find((b) => b.code === 'BIOC') || branchesList[2] || branchesList[0];

    // 5 Intelligent Student Definitions with exact 20260004-20260008 Registration Series
    const studentsToInsert = [
      {
        collegeId: college.id,
        collegeName: college.name,
        courseId: course.id,
        courseCode: course.code || 'MBBS',
        professionalPhase: '1st Professional MBBS (Phase I)',
        batchId: batch.id,
        batchCode: batch.code || '2025',
        branchId: anatBranch?.id || '',
        residencyType: 'Hosteller',
        admissionType: 'Government Merit Quota (NEET-UG)',
        registrationNo: '20260004',
        rollNo: '20260004',
        admissionDate: '2025-07-01',
        firstName: 'Aarav',
        middleName: 'Kumar',
        lastName: 'Verma',
        gender: 'Male',
        dob: '2003-04-12',
        bloodGroup: 'O+',
        category: 'General',
        mobileNumber: '9876510001',
        emailAddress: 'aarav.verma2025@srms.ac.in',
        fatherName: 'Dr. Vijay Verma',
        fatherOccupation: 'Senior Physician',
        motherName: 'Anita Verma',
        motherOccupation: 'School Principal',
        permanentAddress1: '45 Civil Lines, Bareilly, Uttar Pradesh - 243001',
      },
      {
        collegeId: college.id,
        collegeName: college.name,
        courseId: course.id,
        courseCode: course.code || 'MBBS',
        professionalPhase: '1st Professional MBBS (Phase I)',
        batchId: batch.id,
        batchCode: batch.code || '2025',
        branchId: biocBranch?.id || '',
        residencyType: 'Day Scholar',
        admissionType: 'State Merit Quota',
        registrationNo: '20260005',
        rollNo: '20260005',
        admissionDate: '2025-07-01',
        firstName: 'Ananya',
        middleName: 'S',
        lastName: 'Iyer',
        gender: 'Female',
        dob: '2003-09-28',
        bloodGroup: 'A+',
        category: 'OBC',
        mobileNumber: '9876510002',
        emailAddress: 'ananya.iyer2025@srms.ac.in',
        fatherName: 'Ramesh Iyer',
        fatherOccupation: 'Senior Software Engineer',
        motherName: 'Meenakshi Iyer',
        motherOccupation: 'Bank Branch Manager',
        permanentAddress1: '12 Green Park Colony, Bareilly, Uttar Pradesh - 243005',
      },
      {
        collegeId: college.id,
        collegeName: college.name,
        courseId: course.id,
        courseCode: course.code || 'MBBS',
        professionalPhase: '1st Professional MBBS (Phase I)',
        batchId: batch.id,
        batchCode: batch.code || '2025',
        branchId: pathBranch?.id || '',
        residencyType: 'Day Scholar',
        admissionType: 'Management Quota',
        registrationNo: '20260006',
        rollNo: '20260006',
        admissionDate: '2025-07-01',
        firstName: 'Rohan',
        middleName: 'Singh',
        lastName: 'Kapoor',
        gender: 'Male',
        dob: '2002-11-15',
        bloodGroup: 'B+',
        category: 'General',
        mobileNumber: '9876510003',
        emailAddress: 'rohan.kapoor2025@srms.ac.in',
        fatherName: 'Sunil Kapoor',
        fatherOccupation: 'Industrialist',
        motherName: 'Priya Kapoor',
        motherOccupation: 'Interior Architect',
        permanentAddress1: '88 Model Town, Bareilly, Uttar Pradesh - 243003',
      },
      {
        collegeId: college.id,
        collegeName: college.name,
        courseId: course.id,
        courseCode: course.code || 'MBBS',
        professionalPhase: '1st Professional MBBS (Phase I)',
        batchId: batch.id,
        batchCode: batch.code || '2025',
        branchId: anatBranch?.id || '',
        residencyType: 'Hosteller',
        admissionType: 'All India Quota (AIQ)',
        registrationNo: '20260007',
        rollNo: '20260007',
        admissionDate: '2025-07-01',
        firstName: 'Priya',
        middleName: 'M',
        lastName: 'Nair',
        gender: 'Female',
        dob: '2003-01-08',
        bloodGroup: 'AB+',
        category: 'General',
        mobileNumber: '9876510004',
        emailAddress: 'priya.nair2025@srms.ac.in',
        fatherName: 'Col. Suresh Nair',
        fatherOccupation: 'Indian Army Officer',
        motherName: 'Geetha Nair',
        motherOccupation: 'Senior Educator',
        permanentAddress1: 'Cantonment Area, Lucknow, Uttar Pradesh - 226002',
      },
      {
        collegeId: college.id,
        collegeName: college.name,
        courseId: course.id,
        courseCode: course.code || 'MBBS',
        professionalPhase: '1st Professional MBBS (Phase I)',
        batchId: batch.id,
        batchCode: batch.code || '2025',
        branchId: biocBranch?.id || '',
        residencyType: 'Hosteller',
        admissionType: 'Government Merit Quota',
        registrationNo: '20260008',
        rollNo: '20260008',
        admissionDate: '2025-07-01',
        firstName: 'Kabir',
        middleName: 'Rao',
        lastName: 'Deshmukh',
        gender: 'Male',
        dob: '2002-07-22',
        bloodGroup: 'O-',
        category: 'SC',
        mobileNumber: '9876510005',
        emailAddress: 'kabir.deshmukh2025@srms.ac.in',
        fatherName: 'Eknath Deshmukh',
        fatherOccupation: 'Civil Servant (IAS)',
        motherName: 'Sunanda Deshmukh',
        motherOccupation: 'High Court Advocate',
        permanentAddress1: '15 Administrative Officers Colony, New Delhi - 110001',
      },
    ];

    console.log(`\n🚀 Re-inserting students with auto-increment Registration Series (20260004 - 20260008)...`);

    for (const studentPayload of studentsToInsert) {
      const res = await fetch(`${API_BASE}/student-master?tenant=${tenant}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentPayload),
      });

      if (res.ok) {
        console.log(` ✅ Inserted: ${studentPayload.firstName} ${studentPayload.lastName} -> RegNo: ${studentPayload.registrationNo}, Roll: ${studentPayload.rollNo}`);
      } else {
        const errText = await res.text();
        console.error(` ❌ Failed to insert ${studentPayload.firstName}:`, errText);
      }
    }

    // Verify next auto-increment registration number generated by API
    const nextRegRes = await fetch(`${API_BASE}/student-master/next-registration-no?tenant=${tenant}&sessionYear=2026`);
    const nextRegData = await nextRegRes.json();
    console.log(`\n✨ Next Auto-Increment Registration No in Series: ${nextRegData.registrationNo}`);
  } catch (err) {
    console.error('❌ Error updating registration series:', err);
  }
}

seedCorrectRegistrationSeries();
