async function seed5Students() {
  const API_BASE = 'http://localhost:3001/api/v1';
  const tenant = 'srms-ims';

  console.log(`📡 Fetching master data from NestJS API (tenant: ${tenant})...`);

  try {
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

    console.log(`✅ Loaded Master Data: College=${college.name}, Course=${course.code}, Batch=${batch.code}`);

    // 5 Intelligent Student Definitions (Male/Female mix, Hosteller/Day Scholar mix)
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
        registrationNo: 'SRMS2025001',
        rollNo: 'MB2025001',
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
        registrationNo: 'SRMS2025002',
        rollNo: 'MB2025002',
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
        registrationNo: 'SRMS2025003',
        rollNo: 'MB2025003',
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
        registrationNo: 'SRMS2025004',
        rollNo: 'MB2025004',
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
        registrationNo: 'SRMS2025005',
        rollNo: 'MB2025005',
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

    console.log(`\n🚀 Inserting 5 intelligent students into Student Master via API...`);

    for (const studentPayload of studentsToInsert) {
      const res = await fetch(`${API_BASE}/student-master?tenant=${tenant}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentPayload),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(` ✅ Inserted: ${studentPayload.firstName} ${studentPayload.lastName} (${studentPayload.gender}, ${studentPayload.residencyType}, Roll: ${studentPayload.rollNo})`);
      } else {
        const errText = await res.text();
        console.error(` ❌ Failed to insert ${studentPayload.firstName}:`, errText);
      }
    }

    console.log('\n🎉 Finished intelligent student insertion!');
  } catch (err) {
    console.error('❌ Error seeding students:', err);
  }
}

seed5Students();
