const { Client } = require('pg');

async function cleanAndSyncCet() {
  console.log('===============================================================');
  console.log('🧹 CLEANING & SYNCHRONIZING ENGINEERING TENANT (SRMS CET)');
  console.log('===============================================================\n');

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  const engSchemas = ['tenant_srms-cet-bareilly', 'tenant_srms-cet'];

  for (const schema of engSchemas) {
    console.log(`\n▶ Processing schema: ${schema}...`);

    // Ensure unique constraints exist
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_users_email ON "${schema}".users (email)`).catch(() => {});
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_dept_code ON "${schema}".departments (code)`).catch(() => {});
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_subj_code ON "${schema}".subjects (code)`).catch(() => {});
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_${schema.replace(/[^a-zA-Z0-9]/g, '_')}_fac_empid ON "${schema}".faculty (emp_id)`).catch(() => {});

    // 0. Clean foreign keys to medical data
    await client.query(`
      UPDATE "${schema}".timetable_slots SET subject_id = NULL 
      WHERE subject_id IN (
        SELECT id FROM "${schema}".subjects 
        WHERE UPPER(code) IN ('PHY101', 'ANA101', 'BIC101', 'PHY_IA1_2026', 'ANA_VIVA_2026')
           OR LOWER(name) LIKE '%physiology%' 
           OR LOWER(name) LIKE '%anatomy%'
      );
    `).catch(() => {});

    await client.query(`
      UPDATE "${schema}".timetable_slots SET department_id = NULL 
      WHERE department_id IN (
        SELECT id FROM "${schema}".departments 
        WHERE UPPER(code) IN ('PHY', 'ANA', 'ANAT', 'PY', 'BIOC', 'PHAR', 'PATH', 'MICR', 'PSM', 'FMT', 'PMR')
           OR LOWER(name) LIKE '%physiology%' 
           OR LOWER(name) LIKE '%anatomy%'
      );
    `).catch(() => {});

    await client.query(`
      DELETE FROM "${schema}".timetable_slots 
      WHERE UPPER(course_cd) = 'MBBS' OR LOWER(subject_name) LIKE '%physiology%' OR LOWER(subject_name) LIKE '%anatomy%';
    `).catch(() => {});

    await client.query(`
      DELETE FROM "${schema}".faculty_subjects 
      WHERE faculty_id IN (SELECT id FROM "${schema}".faculty WHERE emp_id IN ('EMP1001', 'EMP1002', 'DR/07/026'))
         OR subject_id IN (SELECT id FROM "${schema}".subjects WHERE LOWER(name) LIKE '%physiology%' OR LOWER(name) LIKE '%anatomy%');
    `).catch(() => {});

    await client.query(`
      DELETE FROM "${schema}".attendance_records 
      WHERE student_id IN (SELECT id FROM "${schema}".students WHERE UPPER(course_cd) = 'MBBS');
    `).catch(() => {});

    await client.query(`
      DELETE FROM "${schema}".attendance_sessions 
      WHERE faculty_id IN (SELECT id FROM "${schema}".faculty WHERE emp_id IN ('EMP1001', 'EMP1002', 'DR/07/026'))
         OR subject_id IN (SELECT id FROM "${schema}".subjects WHERE LOWER(name) LIKE '%physiology%' OR LOWER(name) LIKE '%anatomy%');
    `).catch(() => {});

    // 1. Delete MBBS students from engineering schema
    const deletedStudents = await client.query(`
      DELETE FROM "${schema}".students 
      WHERE UPPER(course_cd) = 'MBBS' OR registration_no IN ('2023MBBS045', 'MBBS2023045', '20260008')
      RETURNING id, name, registration_no, course_cd;
    `);
    console.log(`  - Removed ${deletedStudents.rowCount} medical students.`);

    // 2. Delete medical faculty from engineering schema
    const deletedFac = await client.query(`
      DELETE FROM "${schema}".faculty 
      WHERE emp_id IN ('EMP1001', 'EMP1002', 'DR/07/026') 
         OR LOWER(specialization) LIKE '%physiology%' 
         OR LOWER(specialization) LIKE '%anatomy%' 
         OR LOWER(specialization) LIKE '%medical%'
      RETURNING id, name, emp_id;
    `);
    console.log(`  - Removed ${deletedFac.rowCount} medical faculty.`);

    // 3. Delete medical subjects from engineering schema
    const deletedSubj = await client.query(`
      DELETE FROM "${schema}".subjects 
      WHERE UPPER(code) IN ('PHY101', 'ANA101', 'BIC101', 'PHY_IA1_2026', 'ANA_VIVA_2026')
         OR LOWER(name) LIKE '%physiology%' 
         OR LOWER(name) LIKE '%anatomy%'
      RETURNING id, name, code;
    `);
    console.log(`  - Removed ${deletedSubj.rowCount} medical subjects.`);

    // 4. Delete medical departments from engineering schema
    const deletedDepts = await client.query(`
      DELETE FROM "${schema}".departments 
      WHERE UPPER(code) IN ('PHY', 'ANA', 'ANAT', 'PY', 'BIOC', 'PHAR', 'PATH', 'MICR', 'PSM', 'FMT', 'PMR')
         OR LOWER(name) LIKE '%physiology%' 
         OR LOWER(name) LIKE '%anatomy%'
         OR LOWER(name) LIKE '%biochemistry%'
         OR LOWER(name) LIKE '%pharmacology%'
         OR LOWER(name) LIKE '%pathology%'
         OR LOWER(name) LIKE '%microbiology%'
      RETURNING id, name, code;
    `);
    console.log(`  - Removed ${deletedDepts.rowCount} medical departments.`);

    // 5. Ensure authentic engineering departments exist
    const engDepts = [
      { code: 'CSE', name: 'Computer Science and Engineering', type: 'Engineering' },
      { code: 'IT', name: 'Information Technology', type: 'Engineering' },
      { code: 'ECE', name: 'Electronics and Communication Engineering', type: 'Engineering' },
      { code: 'EE', name: 'Electrical Engineering', type: 'Engineering' },
      { code: 'ME', name: 'Mechanical Engineering', type: 'Engineering' },
      { code: 'BCA', name: 'Bachelor of Computer Applications Dept', type: 'Computer Applications' },
      { code: 'MCA', name: 'Master of Computer Applications Dept', type: 'Computer Applications' },
      { code: 'MBA', name: 'Faculty of Management Studies', type: 'Management' },
      { code: 'PHARM', name: 'Faculty of Pharmacy', type: 'Pharmacy' },
    ];

    for (const d of engDepts) {
      const existing = await client.query(`SELECT id FROM "${schema}".departments WHERE code = $1 LIMIT 1`, [d.code]);
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO "${schema}".departments (code, name, type, is_active)
          VALUES ($1, $2, $3, true);
        `, [d.code, d.name, d.type]);
      } else {
        await client.query(`
          UPDATE "${schema}".departments SET name = $1, type = $2 WHERE id = $3;
        `, [d.name, d.type, existing.rows[0].id]);
      }
    }
    console.log(`  - Ensured ${engDepts.length} authentic engineering departments.`);

    // 6. Ensure authentic engineering faculty exist
    const defaultPassHash = '$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX.'; // Password@123 / admin@123
    const engFaculty = [
      {
        email: 'prabhakar.gupta@srms.ac.in',
        name: 'Dr. Prabhakar Gupta',
        emp_id: 'CET-FAC-001',
        designation: 'Professor & Dean Academics',
        dept_code: 'CSE',
        specialization: 'Computer Networks & Distributed Systems',
        photo_url: '/avatars/dr_sanjay_singh.png',
      },
      {
        email: 'anuj.kumar@srms.ac.in',
        name: 'Dr. Anuj Kumar',
        emp_id: 'CET-FAC-002',
        designation: 'Professor & HOD',
        dept_code: 'CSE',
        specialization: 'Artificial Intelligence & Machine Learning',
        photo_url: '/avatars/dr_sarah_sharma.png',
      },
      {
        email: 'sovan.mohanty@srms.ac.in',
        name: 'Dr. Sovan Mohanty',
        emp_id: 'CET-FAC-003',
        designation: 'Associate Professor',
        dept_code: 'ECE',
        specialization: 'VLSI Design & Signal Processing',
        photo_url: '/avatars/dr_sanjay_singh.png',
      },
      {
        email: 'shailesh.saxena@srms.ac.in',
        name: 'Er. Shailesh Saxena',
        emp_id: 'CET-FAC-004',
        designation: 'Assistant Professor',
        dept_code: 'BCA',
        specialization: 'Database Systems & Web Technologies',
        photo_url: '/avatars/dr_sarah_sharma.png',
      },
      {
        email: 'shorab.ahmad@srms.ac.in',
        name: 'Dr. Shorab Ahmad',
        emp_id: '202516224',
        designation: 'Assistant Professor',
        dept_code: 'BCA',
        specialization: 'Web Technologies, Python & Database Systems',
        photo_url: '/avatars/dr_sanjay_singh.png',
      },
    ];

    for (const f of engFaculty) {
      let uRes = await client.query(`SELECT id FROM "${schema}".users WHERE LOWER(email) = $1`, [f.email.toLowerCase()]);
      let uId = uRes.rows[0]?.id;

      if (!uId) {
        const createRes = await client.query(`
          INSERT INTO "${schema}".users (email, password_hash, role, onboarding_completed, must_change_password)
          VALUES ($1, $2, 'FACULTY', true, false)
          RETURNING id;
        `, [f.email.toLowerCase(), defaultPassHash]);
        uId = createRes.rows[0]?.id;
      }

      const deptRes = await client.query(`SELECT id FROM "${schema}".departments WHERE code = $1 LIMIT 1`, [f.dept_code]);
      const deptId = deptRes.rows[0]?.id || null;

      if (uId) {
        const exFac = await client.query(`SELECT id FROM "${schema}".faculty WHERE emp_id = $1 LIMIT 1`, [f.emp_id]);
        if (exFac.rows.length === 0) {
          await client.query(`
            INSERT INTO "${schema}".faculty (user_id, emp_id, name, designation, specialization, department_id, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [uId, f.emp_id, f.name, f.designation, f.specialization, deptId, f.photo_url]);
        } else {
          await client.query(`
            UPDATE "${schema}".faculty SET 
              user_id = $1, name = $2, designation = $3, specialization = $4, department_id = $5, photo_url = $6
            WHERE id = $7;
          `, [uId, f.name, f.designation, f.specialization, deptId, f.photo_url, exFac.rows[0].id]);
        }
      }
    }
    console.log(`  - Ensured authentic engineering faculty.`);

    // 7. Ensure authentic engineering subjects
    const engSubjects = [
      { code: 'KCS-301', name: 'Data Structures & Algorithms', credits: 4, type: 'THEORY', dept_code: 'CSE' },
      { code: 'KCS-302', name: 'Computer Organization & Architecture', credits: 4, type: 'THEORY', dept_code: 'CSE' },
      { code: 'KCS-303', name: 'Discrete Mathematics', credits: 4, type: 'THEORY', dept_code: 'CSE' },
      { code: 'KCS-351', name: 'Data Structures Lab', credits: 2, type: 'PRACTICAL', dept_code: 'CSE' },
      { code: 'BCA-301', name: 'Database Management Systems', credits: 4, type: 'THEORY', dept_code: 'BCA' },
      { code: 'BCA-302', name: 'Object Oriented Programming with Java', credits: 4, type: 'THEORY', dept_code: 'BCA' },
      { code: 'BCA-351', name: 'DBMS & SQL Lab', credits: 2, type: 'PRACTICAL', dept_code: 'BCA' },
    ];

    for (const s of engSubjects) {
      const deptRes = await client.query(`SELECT id FROM "${schema}".departments WHERE code = $1 LIMIT 1`, [s.dept_code]);
      const deptId = deptRes.rows[0]?.id || null;

      const exSubj = await client.query(`SELECT id FROM "${schema}".subjects WHERE code = $1 LIMIT 1`, [s.code]);
      if (exSubj.rows.length === 0) {
        await client.query(`
          INSERT INTO "${schema}".subjects (code, name, credits, type, department_id, is_active)
          VALUES ($1, $2, $3, $4, $5, true);
        `, [s.code, s.name, s.credits, s.type, deptId]);
      } else {
        await client.query(`
          UPDATE "${schema}".subjects SET name = $1, credits = $2, type = $3, department_id = $4 WHERE id = $5;
        `, [s.name, s.credits, s.type, deptId, exSubj.rows[0].id]);
      }
    }
    console.log(`  - Ensured authentic engineering subjects.`);
  }

  await client.end();
  console.log('\n===============================================================');
  console.log('✅ ALL ENGINEERING TENANTS CLEANED AND SYNCHRONIZED!');
  console.log('===============================================================');
}

cleanAndSyncCet().catch(console.error);
