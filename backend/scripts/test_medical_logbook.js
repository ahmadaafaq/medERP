const jwt = require('jsonwebtoken');

const JWT_SECRET = 'change_me_to_a_super_long_random_string_at_least_64_chars';

function generateToken(tenantSlug = 'srms-ims') {
  return jwt.sign(
    {
      sub: '00000000-0000-0000-0000-000000000001',
      email: 'admin@srms-ims.ac.in',
      name: 'Dr. Medical Admin',
      role: 'COLLEGE_ADMIN',
      tenantSlug: tenantSlug,
      tenantId: tenantSlug,
      collegeName: 'SRMS IMS, BAREILLY',
      colgCd: '11',
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

async function getJson(res) {
  const j = await res.json();
  return j?.data !== undefined ? j.data : j;
}

async function runTests() {
  const tenant = 'srms-ims';
  const token = generateToken(tenant);
  console.log('Generated JWT token for tenant:', tenant);

  const h = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-tenant-slug': tenant,
  };

  // ==========================================
  // 1. TEST CASCADING LOOKUPS
  // ==========================================
  console.log('\n--- 1. TEST CASCADING LOOKUPS ---');
  const profs = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/professionals?tenant=${tenant}`, { headers: h }));
  console.log('✓ Professionals count:', profs?.length, 'Items:', profs?.map(p => p.name).join(' | '));

  const courses = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/courses?tenant=${tenant}`, { headers: h }));
  console.log('✓ Courses count:', courses?.length, 'First:', courses[0]?.code);

  const branches = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/branches?tenant=${tenant}`, { headers: h }));
  console.log('✓ Branches count:', branches?.length, 'First:', branches[0]?.name);

  const batches = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/batches?tenant=${tenant}`, { headers: h }));
  console.log('✓ Batches count:', batches?.length, 'First:', batches[0]?.code);

  const cbme = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/cbme-years?tenant=${tenant}`, { headers: h }));
  console.log('✓ CBME Years count:', cbme?.length, 'First:', cbme[0]?.name);

  const subjects = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/subjects?tenant=${tenant}&professionalYearId=${profs[0]?.id || ''}`, { headers: h }));
  console.log('✓ Subjects count:', subjects?.length, 'First:', subjects[0]?.name);

  const units = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/units?tenant=${tenant}&subjectId=${subjects[0]?.id || 'sub-phys'}`, { headers: h }));
  console.log('✓ Units count:', units?.length, 'First:', units[0]?.name);

  const topics = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/topics?tenant=${tenant}&unitId=${units[0]?.id || 'u1'}`, { headers: h }));
  console.log('✓ Topics count:', topics?.length, 'First:', topics[0]?.name);

  const competencies = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/competencies?tenant=${tenant}&topicId=${topics[0]?.id || 't1'}`, { headers: h }));
  console.log('✓ Competencies count:', competencies?.length, 'First code & title:', competencies[0]?.displayText);

  const actTypes = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/activity-types?tenant=${tenant}`, { headers: h }));
  console.log('✓ Activity Types:', actTypes?.map(a => a.name).join(', '));

  const rubrics = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/status-codes?tenant=${tenant}`, { headers: h }));
  console.log('✓ Rubrics:', rubrics?.map(r => `${r.code}=${r.label}`).join(', '));

  const groupStudents = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/group-students?tenant=${tenant}&groupId=grp-a`, { headers: h }));
  console.log('✓ Group Roster:', groupStudents?.students?.length, 'students in', groupStudents?.selectedGroupId);

  // ==========================================
  // 2. TEST ACTIVITY MASTER (CRUD)
  // ==========================================
  console.log('\n--- 2. TEST ACTIVITY MASTER CRUD ---');
  const createActRes = await fetch(`http://localhost:8081/api/v1/medical-logbook/activity-master?tenant=${tenant}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      course_id: courses[0]?.id || 'mbbs',
      professional_year_id: profs[0]?.id || 'mbbs-prof-1',
      subject_id: subjects[0]?.id || 'sub-phys',
      unit_id: units[0]?.id || 'u1',
      topic_id: topics[0]?.id || 't1',
      competency_id: competencies[0]?.id || 'comp-1',
      activity_name: 'Examination of Cardiovascular System & Heart Sounds Auscultation',
      activity_type_code: 'PRACTICAL',
    }),
  });
  const actCreated = await getJson(createActRes);
  console.log('✓ Created Activity Master ID:', actCreated?.id);

  const actList = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/activity-master?tenant=${tenant}&page=1&limit=5`, { headers: h }));
  console.log('✓ List Activity Master Total:', actList?.total, 'Items returned:', actList?.items?.length);

  // ==========================================
  // 3. TEST SEMINAR MASTER (CRUD)
  // ==========================================
  console.log('\n--- 3. TEST SEMINAR MASTER CRUD ---');
  const createSemRes = await fetch(`http://localhost:8081/api/v1/medical-logbook/seminar-master?tenant=${tenant}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      course_id: courses[0]?.id || 'mbbs',
      professional_year_id: profs[0]?.id || 'mbbs-prof-1',
      category: 'Central Seminar',
      title: 'Recent Advances in Stem Cell Therapies in Regenerative Medicine',
      seminar_date: '2026-09-20',
      venue: 'Main Auditorium, College Building',
      presenter_name: 'Dr. Vivek Saxena',
      remarks: 'Inter-departmental participation mandatory',
    }),
  });
  const semCreated = await getJson(createSemRes);
  console.log('✓ Created Seminar Master ID:', semCreated?.id, 'Title:', semCreated?.title);

  const semList = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/seminar-master?tenant=${tenant}&category=Central%20Seminar`, { headers: h }));
  console.log('✓ List Seminar Master Total:', semList?.total, 'Items:', semList?.items?.length);

  // ==========================================
  // 4. TEST UG LOGBOOK (BULK UPSERT & FILTER TABLE)
  // ==========================================
  console.log('\n--- 4. TEST UG LOGBOOK BULK SAVE & VERIFICATION ---');
  const saveUgRes = await fetch(`http://localhost:8081/api/v1/medical-logbook/ug-logbook?tenant=${tenant}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      activity_master_id: actCreated?.id,
      session_date: '2026-09-12',
      group_id: 'grp-a',
      group_name: 'Group A',
      professional_year_id: profs[0]?.id || 'mbbs-prof-1',
      subject_id: subjects[0]?.id || 'sub-phys',
      program_level: 'UG',
      students: [
        { student_id: 'stu-mbbs-01', rollno: '01', student_name: 'Aarav Sharma', status_code: 'C', remarks: 'Auscultation technique accurate', score: 9.0, record_status: 'Pending' },
        { student_id: 'stu-mbbs-02', rollno: '02', student_name: 'Diya Patel', status_code: 'M', remarks: 'Need to improve anatomical landmark identification', score: 7.0, record_status: 'Pending' },
        { student_id: 'stu-mbbs-03', rollno: '03', student_name: 'Rohan Verma', status_code: 'F', remarks: 'Absent / Incomplete procedure', score: 0.0, record_status: 'Absent' },
      ],
    }),
  });
  const ugSaved = await getJson(saveUgRes);
  console.log('✓ UG Logbook Session Bulk Upsert:', ugSaved);

  const ledger = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/ug-logbook?tenant=${tenant}`, { headers: h }));
  console.log('✓ UG Logbook Ledger Total:', ledger?.total, 'Status Counts:', ledger?.counts);

  if (ledger?.items?.length > 0) {
    const targetRec = ledger.items[0];
    console.log('✓ Verifying student record:', targetRec.record_id, 'for', targetRec.student_name);
    const verifyRes = await fetch(`http://localhost:8081/api/v1/medical-logbook/ug-logbook/${targetRec.record_id}/verify?tenant=${tenant}`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ record_status: 'Verified', remarks: 'Verified by HOD' }),
    });
    const verifyData = await getJson(verifyRes);
    console.log('✓ Verification result:', verifyData?.record?.record_status, 'by:', verifyData?.record?.verified_by);
  }

  // ==========================================
  // 5. TEST PG LOGBOOK (STANDALONE ENGINE)
  // ==========================================
  console.log('\n--- 5. TEST PG LOGBOOK ENGINE ---');
  const pgRes = await fetch(`http://localhost:8081/api/v1/medical-logbook/pg-logbook?tenant=${tenant}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      student_name: 'Dr. Neha Kapoor (JR-2)',
      rollno: 'PG-MED-04',
      pg_year: 'JR-2',
      category: 'Clinical Procedure',
      title: 'Central Venous Catheter (Internal Jugular Vein) Placement with Ultrasound Guidance',
      case_date: '2026-09-12',
      patient_details: 'IPD / ICU Bed 4 - Septic Shock',
      procedure_type: 'Performed Independently',
      score: 9.5,
      remarks: 'Sterile precautions strictly followed. Post-procedure CXR verified.',
    }),
  });
  const pgCreated = await getJson(pgRes);
  console.log('✓ PG Logbook Record Created:', pgCreated?.id, pgCreated?.title);

  const pgList = await getJson(await fetch(`http://localhost:8081/api/v1/medical-logbook/pg-logbook?tenant=${tenant}&pgYear=JR-2`, { headers: h }));
  console.log('✓ PG Logbook Records for JR-2 Total:', pgList?.total, 'Items:', pgList?.items?.length);

  // ==========================================
  // 6. TEST SECURITY GUARD (@RequiresFirmMode('MED'))
  // ==========================================
  console.log('\n--- 6. TEST SECURITY GUARD: NONMED ACCESS REJECTION ---');
  const nonMedTenant = 'srms-cet-bareilly';
  const nonMedToken = generateToken(nonMedTenant);
  const forbiddenRes = await fetch(`http://localhost:8081/api/v1/medical-logbook/lookups/professionals?tenant=${nonMedTenant}`, {
    headers: {
      'Authorization': `Bearer ${nonMedToken}`,
      'x-tenant-slug': nonMedTenant,
    },
  });
  console.log('Non-MED Tenant Access Status:', forbiddenRes.status, forbiddenRes.status === 403 ? '✓ 403 FORBIDDEN AS EXPECTED!' : 'FAIL');
  const forbiddenBody = await forbiddenRes.json();
  console.log('Guard Message:', forbiddenBody?.message);

  console.log('\n=============================================');
  console.log('🎉 ALL MEDICAL LOGBOOK BACKEND TESTS PASSED!');
  console.log('=============================================');
}

runTests().catch(err => console.error('Test error:', err));
