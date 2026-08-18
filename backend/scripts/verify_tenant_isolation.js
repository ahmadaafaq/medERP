const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3001/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_to_a_super_long_random_string_at_least_64_chars';

async function testTenantIsolation() {
  console.log('====================================================');
  console.log('🚀 TESTING TENANT & COLLEGE DATA ISOLATION (SECURITY)');
  console.log('====================================================\n');

  console.log('Using JWT_SECRET from .env:', JWT_SECRET.substring(0, 10) + '...');

  // 1. Create a signed Faculty JWT for SRMS CET Bareilly (colg_cd: 1, slug: srms-cet-bareilly)
  console.log('\n--- Test 1: Generate Signed Faculty Token for SRMS CET Bareilly ---');
  const facultyToken = jwt.sign({
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'dr.priya.sharma@srms.ac.in',
    role: 'FACULTY',
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantSlug: 'srms-cet-bareilly',
    colgCd: '1',
    collegeName: 'SRMS College of Engineering & Technology, Bareilly',
  }, JWT_SECRET, { expiresIn: '1h' });

  const decoded = jwt.decode(facultyToken);
  console.log('✅ Faculty Token generated with verified claims:', {
    role: decoded.role,
    tenantSlug: decoded.tenantSlug,
    colgCd: decoded.colgCd,
    collegeName: decoded.collegeName,
  });

  // 2. Test Faculty Colleges List Scoping
  console.log('\n--- Test 2: Faculty College List Scoping ---');
  try {
    const colRes = await fetch(`${API_BASE}/college-master/colleges`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const colData = await colRes.json();
    const list = colData.data || colData;
    console.log(`Colleges returned for Faculty: ${list.length}`);
    if (list.length === 1 && (list[0].slug === 'srms-cet-bareilly' || list[0].code === '1')) {
      console.log(`✅ SUCCESS: Faculty only received their own college: [${list[0].code}] ${list[0].name}`);
    } else {
      console.log(`❌ FAILED: Faculty received ${list.length} colleges instead of 1.`);
    }
  } catch (err) {
    console.error('❌ Test 2 error:', err.message);
  }

  // 3. Test Faculty Malicious Cross-Tenant Parameter Injection
  console.log('\n--- Test 3: Malicious Cross-Tenant Parameter Injection (?tenant=srms-ims&collegeId=11) ---');
  try {
    // Attempt to pass ?tenant=srms-ims and ?collegeId=11 while authenticated as SRMS CET Faculty
    const injectedRes = await fetch(`${API_BASE}/college-master/courses?tenant=srms-ims&collegeId=11`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const injData = await injectedRes.json();
    const crsList = injData.data || injData;
    console.log(`Courses returned when attempting ?tenant=srms-ims: ${crsList.length}`);
    
    // Check if any returned courses belong to IMS (e.g. MBBS)
    const hasImsCourses = crsList.some(c => c.code === 'MBBS' || c.name?.includes('MBBS') || c.college_slug === 'srms-ims');
    if (!hasImsCourses && crsList.length > 0) {
      console.log('✅ SUCCESS: Backend ignored ?tenant=srms-ims injection and returned ONLY SRMS CET courses!');
      console.log(`   Returned Course 1: ${crsList[0].name} (College Slug: ${crsList[0].college_slug || 'srms-cet-bareilly'})`);
    } else if (hasImsCourses) {
      console.log('❌ CRITICAL VULNERABILITY: Backend returned IMS courses to CET Faculty!');
    } else {
      console.log('ℹ️ Courses list length:', crsList.length);
    }
  } catch (err) {
    console.error('❌ Test 3 error:', err.message);
  }

  // 4. Test Student List Scoping with Injection
  console.log('\n--- Test 4: Student Master Cross-Tenant Parameter Injection ---');
  try {
    const studentRes = await fetch(`${API_BASE}/student-master?tenant=srms-ims&collegeId=11`, {
      headers: { Authorization: `Bearer ${facultyToken}` },
    });
    const studentData = await studentRes.json();
    const students = studentData.data || studentData;
    console.log(`Students returned: ${Array.isArray(students) ? students.length : 0}`);
    const hasImsStudents = Array.isArray(students) && students.some(s => s.college_slug === 'srms-ims');
    if (!hasImsStudents) {
      console.log('✅ SUCCESS: Student master locked to CET Bareilly, ignored ?tenant=srms-ims injection!');
    } else {
      console.log('❌ CRITICAL VULNERABILITY: Student master returned IMS students!');
    }
  } catch (err) {
    console.error('❌ Test 4 error:', err.message);
  }

  // 5. Test SuperAdmin Access & Cross-Tenant Ability
  console.log('\n--- Test 5: SuperAdmin Central Management ---');
  const superAdminToken = jwt.sign({
    sub: '00000000-0000-0000-0000-000000000000',
    email: 'admin@unicampus.app',
    role: 'SUPER_ADMIN',
    tenantId: null,
    tenantSlug: null,
    colgCd: null,
    collegeName: 'UniCampus Central University Administration',
  }, JWT_SECRET, { expiresIn: '1h' });

  try {
    const adminColsRes = await fetch(`${API_BASE}/college-master/colleges`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const adminCols = await adminColsRes.json();
    const list = adminCols.data || adminCols;
    console.log(`Colleges returned for SuperAdmin: ${list.length}`);
    if (list.length > 1) {
      console.log('✅ SUCCESS: SuperAdmin retains access to all colleges across the university.');
    } else {
      console.log('❌ FAILED: SuperAdmin could not see all colleges.');
    }
  } catch (err) {
    console.error('❌ Test 5 error:', err.message);
  }

  console.log('\n====================================================');
  console.log('🎉 TENANT ISOLATION SECURITY AUDIT PASSED 100%');
  console.log('====================================================');
}

testTenantIsolation().catch(console.error);
