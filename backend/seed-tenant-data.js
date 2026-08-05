const { Client } = require('pg');

async function seedData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/unicampus_erp',
  });

  try {
    await client.connect();
    console.log('🌱 Connected to PostgreSQL. Seeding data for tenant_srms-ims...');

    // Ensure public.tenants has 'srms-ims'
    await client.query(`
      INSERT INTO public.tenants (name, slug, domain, plan, primary_color, schema_provisioned)
      VALUES ('SRMS Medical College', 'srms-ims', 'srms.mederp.app', 'enterprise', '#6366F1', true)
      ON CONFLICT (slug) DO UPDATE SET schema_provisioned = true;
    `);

    // Create schema tenant_srms-ims
    await client.query(`CREATE SCHEMA IF NOT EXISTS "tenant_srms-ims"`);
    await client.query(`SET search_path TO "tenant_srms-ims"`);

    // 1. Departments
    const deptRes = await client.query(`
      INSERT INTO departments (name, code, type)
      VALUES 
        ('Pathology Department', 'PATH', 'UG'),
        ('Pediatrics Department', 'PED', 'UG'),
        ('General Surgery Department', 'SURG', 'UG'),
        ('General Medicine Department', 'MED', 'UG')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, code;
    `);
    const pathDeptId = deptRes.rows.find((r) => r.code === 'PATH')?.id;
    const pedDeptId = deptRes.rows.find((r) => r.code === 'PED')?.id;

    // 2. Batches
    const batchRes = await client.query(`
      INSERT INTO batches (code, year, course_cd, department_id)
      VALUES ('2023-MBBS', 2023, 'MBBS', $1)
      RETURNING id;
    `, [pathDeptId]);
    const batchId = batchRes.rows[0]?.id;

    // 3. Users & Faculty
    const facUserRes = await client.query(`
      INSERT INTO users (email, password_hash, role, onboarding_completed, onboarding_step)
      VALUES ('sarah.sharma@srms.edu', '$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX.', 'FACULTY', true, 5)
      ON CONFLICT (email) DO UPDATE SET onboarding_completed = true
      RETURNING id;
    `);
    const facUserId = facUserRes.rows[0]?.id;

    if (facUserId && pathDeptId) {
      await client.query(`
        INSERT INTO faculty (user_id, emp_id, name, department_id, designation, specialization)
        VALUES ($1, 'EMP1001', 'Dr. Sarah Sharma', $2, 'Associate Professor', 'Pathology & Hematology')
        ON CONFLICT (emp_id) DO NOTHING;
      `, [facUserId, pathDeptId]);
    }

    // 4. Users & Students
    const studUserRes = await client.query(`
      INSERT INTO users (email, password_hash, role, onboarding_completed, onboarding_step)
      VALUES ('rahul.verma@srms.edu', '$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX.', 'STUDENT', true, 5)
      ON CONFLICT (email) DO UPDATE SET onboarding_completed = true
      RETURNING id;
    `);
    const studUserId = studUserRes.rows[0]?.id;

    if (studUserId && pathDeptId && batchId) {
      await client.query(`
        INSERT INTO students (user_id, rollno, name, batch_cd, course_cd, department_id, batch_id, admission_year, phone)
        VALUES ($1, 'MBBS2023045', 'Rahul Verma', '2023-MBBS', 'MBBS', $2, $3, 2023, '+91-9876543210')
        ON CONFLICT (rollno) DO NOTHING;
      `, [studUserId, pathDeptId, batchId]);
    }

    // 5. Subjects
    const subjRes = await client.query(`
      INSERT INTO subjects (code, name, department_id, batch_id, credits, type)
      VALUES ('PATH301', 'Systemic Pathology & Microbiology', $1, $2, 4, 'THEORY')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [pathDeptId, batchId]);
    const subjectId = subjRes.rows[0]?.id;

    // 6. Logbook Activity Types & Entries
    if (subjectId) {
      const actRes = await client.query(`
        INSERT INTO logbook_activity_types (code, name, subject_id, category, max_required, activity_type)
        VALUES ('ACT_PATH_01', 'Pathology Clinical Case Presentation', $1, 'Clinical Ward Rounds', 10, 'UG')
        RETURNING id;
      `, [subjectId]);
      const actId = actRes.rows[0]?.id;

      const studentRes = await client.query(`SELECT id FROM students WHERE rollno = 'MBBS2023045'`);
      const studentId = studentRes.rows[0]?.id;

      if (studentId && actId) {
        await client.query(`
          INSERT INTO logbook_entries (student_id, activity_type_id, entry_date, description, month_number, year)
          VALUES ($1, $2, CURRENT_DATE - INTERVAL '2 days', 'Presented hematology smear analysis case in clinical ward round.', 7, 2026);
        `, [studentId, actId]);
      }
    }

    // 7. Library Books & E-Books
    try {
      await client.query(`
        INSERT INTO library_books (title, author, isbn, category, publisher, copies_total, copies_available, is_ebook, ebook_url)
        VALUES 
          ('Robbins & Cotran Pathologic Basis of Disease', 'Vinay Kumar, Abul K. Abbas', '978-0323531139', 'Pathology', 'Elsevier', 15, 12, true, 'srms/ebooks/robbins-pathology.pdf'),
          ('Harrison Principles of Internal Medicine', 'Dennis L. Kasper', '978-1259644030', 'Internal Medicine', 'McGraw Hill', 20, 18, true, 'srms/ebooks/harrison-medicine.pdf')
        ON CONFLICT (isbn) DO NOTHING;
      `);
    } catch (err) {
      console.warn('⚠️ Skipped library books seeding:', err.message);
    }

    // 8. Fee Structure & Payment Record
    try {
      if (batchId) {
        const feeRes = await client.query(`
          INSERT INTO fees_structure (course_cd, batch_id, fee_type, amount, due_date)
          VALUES ('MBBS', $1, 'Annual Tuition & Lab Fee (Semester 6)', 150000.00, '2026-08-31')
          RETURNING id;
        `, [batchId]);
        const feeStructId = feeRes.rows[0]?.id;

        const studentRes = await client.query(`SELECT id FROM students WHERE rollno = 'MBBS2023045'`);
        const studentId = studentRes.rows[0]?.id;

        if (studentId && feeStructId) {
          await client.query(`
            INSERT INTO student_fee_records (student_id, fee_structure_id, amount_paid, payment_date, payment_mode, receipt_no)
            VALUES ($1, $2, 150000.00, CURRENT_DATE, 'ONLINE', 'REC-2026-009182')
            ON CONFLICT (receipt_no) DO NOTHING;
          `, [studentId, feeStructId]);
        }
      }
    } catch (err) {
      console.warn('⚠️ Skipped fee records seeding:', err.message);
    }

    console.log('✅ Seed completed successfully for tenant_srms-ims!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seedData();
