const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function seedLogbookData() {
  const schema = 'tenant_srms-cet-bareilly';
  console.log(`Seeding authentic Logbook activities in ${schema}...`);

  // 1. Fetch Categories
  const catRes = await pool.query(`SELECT id, code, name FROM "${schema}".logbook_categories`);
  const catMap = {};
  catRes.rows.forEach(r => { catMap[r.code] = r.id; });

  // 2. Fetch a Faculty ID
  const facRes = await pool.query(`SELECT id, name FROM "${schema}".faculty LIMIT 1`);
  const facultyId = facRes.rows[0]?.id || null;

  // 3. Fetch Students (e.g. BCA / B.Tech students)
  const stuRes = await pool.query(`SELECT id, name, rollno, registration_no, course_cd, batch_cd FROM "${schema}".students LIMIT 10`);
  const students = stuRes.rows;

  if (students.length === 0) {
    console.log('No students found to seed logbook.');
    await pool.end();
    return;
  }

  // 4. Create Activity Topics
  const topicDefs = [
    {
      catCode: 'SEMINAR',
      title: 'Cloud-Native Microservices Architecture & Containerization',
      description: 'Prepare a 15-minute seminar presentation analyzing Docker container orchestration, Kubernetes ingress controllers, and distributed microservice communication.',
      maxMarks: 100,
      courseId: '13',
      batchId: '2',
      semesterId: '3',
      deadlineOffsetDays: 7
    },
    {
      catCode: 'ASSIGNMENT',
      title: 'Relational Schema Normalization & Query Execution Plans',
      description: 'Submit detailed solution covering BCNF decomposition, indexing strategies (B-Tree vs Hash), and PostgreSQL EXPLAIN ANALYZE execution cost minimization.',
      maxMarks: 50,
      courseId: '13',
      batchId: '2',
      semesterId: '3',
      deadlineOffsetDays: 10
    },
    {
      catCode: 'PRACTICAL',
      title: 'Full-Stack RESTful API with JWT Authentication & TypeORM',
      description: 'Implement a multi-tenant backend service with NestJS, PostgreSQL schema-per-tenant isolation, and automated validation pipes. Submit code repo link and PDF report.',
      maxMarks: 100,
      courseId: '13',
      batchId: '2',
      semesterId: '3',
      deadlineOffsetDays: 14
    },
    {
      catCode: 'PROJECT_WORK',
      title: 'Campus ERP Smart Attendance & Real-Time Sync Subsystem',
      description: 'Design and document an automated biometric/portal attendance synchronization service with retry queues and transaction deduplication.',
      maxMarks: 100,
      courseId: '13',
      batchId: '2',
      semesterId: '3',
      deadlineOffsetDays: 21
    }
  ];

  for (const tDef of topicDefs) {
    const catId = catMap[tDef.catCode] || Object.values(catMap)[0];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + tDef.deadlineOffsetDays);

    const existing = await pool.query(`SELECT id FROM "${schema}".logbook_topics WHERE title = $1`, [tDef.title]);
    let topicId;
    if (existing.rows.length === 0) {
      const insRes = await pool.query(`
        INSERT INTO "${schema}".logbook_topics (
          category_id, faculty_id, title, description, submission_deadline,
          max_marks, course_id, batch_id, semester_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id;
      `, [catId, facultyId, tDef.title, tDef.description, deadline.toISOString(), tDef.maxMarks, tDef.courseId, tDef.batchId, tDef.semesterId]);
      topicId = insRes.rows[0].id;
      console.log(`+ Created topic: "${tDef.title}"`);
    } else {
      topicId = existing.rows[0].id;
    }

    // Create submissions & evaluations for top students
    for (let i = 0; i < Math.min(students.length, 5); i++) {
      const student = students[i];
      const subExisting = await pool.query(
        `SELECT id FROM "${schema}".logbook_submissions WHERE topic_id = $1 AND student_id = $2`,
        [topicId, student.id]
      );

      if (subExisting.rows.length === 0) {
        const marksAwarded = tDef.maxMarks === 50
          ? Math.round(42 + (5 - i) * 1.5)
          : Math.round(85 + (5 - i) * 2.5);

        const subIns = await pool.query(`
          INSERT INTO "${schema}".logbook_submissions (
            topic_id, student_id, file_name, file_size, explanation_text, status, submitted_at
          ) VALUES ($1, $2, $3, $4, $5, 'EVALUATED', NOW() - INTERVAL '2 days') RETURNING id;
        `, [
          topicId,
          student.id,
          `${student.name.replace(/\s+/g, '_')}_Report.pdf`,
          '2.4 MB',
          `Comprehensive study and implementation documentation prepared for ${tDef.title}. Verified all technical requirements and tested execution benchmarks.`
        ]);

        const submissionId = subIns.rows[0].id;

        // Insert Evaluation
        await pool.query(`
          INSERT INTO "${schema}".logbook_evaluations (
            submission_id, faculty_id, marks_obtained, remarks, evaluated_at
          ) VALUES ($1, $2, $3, $4, NOW());
        `, [
          submissionId,
          facultyId,
          marksAwarded,
          i === 0
            ? 'Outstanding technical depth, crisp presentation and complete architecture diagram.'
            : i === 1
            ? 'Very good problem-solving approach and clean documentation.'
            : 'Good effort, well documented with all necessary unit tests.'
        ]);

        console.log(`  -> Seeded evaluated submission for ${student.name}: ${marksAwarded}/${tDef.maxMarks}`);
      }
    }
  }

  console.log(`✅ Logbook authentic seed data completed!`);
  await pool.end();
}

seedLogbookData().catch(console.error);
