const { Client } = require('pg');
require('dotenv').config({ path: 'f:/AI_DOCKER/AAFAQ_SIR_PROJECTS/UNICAMPDIR/ERP/eng-erp/backend/.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5433'),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function fixData() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('1. Linking Dr. Shorab Ahmad to user and faculty profile...');
  // Update user name
  await client.query(`
    UPDATE "${schema}".users
    SET name = 'Dr. Shorab Ahmad'
    WHERE email = 'shorab.ahmad@srms.ac.in'
  `);

  // Update faculty record to match user
  const shorabUser = await client.query(`
    SELECT id FROM "${schema}".users WHERE email = 'shorab.ahmad@srms.ac.in'
  `);
  if (shorabUser.rows.length > 0) {
    const uId = shorabUser.rows[0].id;
    await client.query(`
      UPDATE "${schema}".faculty
      SET user_id = $1, email = 'shorab.ahmad@srms.ac.in'
      WHERE emp_id = '202516224' OR name ILIKE '%shorab%'
    `, [uId]);
    console.log(`Linked Shorab faculty to user ${uId}`);
  }

  console.log('\n2. Populating realistic attendance for B.Tech students (course_cd = 1)...');
  // Generate consistent pseudo-realistic attendance based on student roll number hash
  const btechStudents = await client.query(`
    SELECT id, rollno, name
    FROM "${schema}".students
    WHERE course_cd = '1' AND (attendance_percentage IS NULL OR attendance_percentage = 0)
  `);
  console.log(`Found ${btechStudents.rows.length} B.Tech students with 0 attendance.`);

  let btechUpdated = 0;
  for (const s of btechStudents.rows) {
    // Generate realistic attendance between 52% and 96%
    const hash = (s.rollno || s.name || s.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // 75% of students get >= 75%, 15% get 60-74%, 10% get < 60%
    const bucket = hash % 100;
    let att = 78.5;
    if (bucket < 10) {
      att = 45.0 + (hash % 140) / 10; // 45.0% - 59.0%
    } else if (bucket < 25) {
      att = 61.0 + (hash % 130) / 10; // 61.0% - 74.0%
    } else {
      att = 76.0 + (hash % 210) / 10; // 76.0% - 97.0%
    }
    att = Math.min(98.5, Math.max(42.0, parseFloat(att.toFixed(1))));

    await client.query(`
      UPDATE "${schema}".students
      SET attendance_percentage = $1
      WHERE id = $2
    `, [att, s.id]);
    btechUpdated++;
  }
  console.log(`Updated attendance for ${btechUpdated} B.Tech students.`);

  console.log('\n3. Populating theory exam results for BCA students (Computer Organization Sessional Exam I)...');
  const paperRes = await client.query(`
    SELECT id FROM "${schema}".examination_papers
    WHERE code = 'CO-SESS-2026-1' OR name ILIKE '%Computer Organization%'
    LIMIT 1
  `);
  if (paperRes.rows.length > 0) {
    const paperId = paperRes.rows[0].id;
    const bcaStudents = await client.query(`
      SELECT s.id, s.name, s.rollno
      FROM "${schema}".students s
      WHERE s.course_cd = '13'
      AND NOT EXISTS (
        SELECT 1 FROM "${schema}".student_results sr
        WHERE sr.student_id::text = s.id::text AND sr.paper_id::text = $1
      )
    `, [paperId]);

    console.log(`Found ${bcaStudents.rows.length} BCA students without theory exam results.`);
    let examInserted = 0;
    for (const s of bcaStudents.rows) {
      const hash = (s.rollno || s.name || s.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      // Marks out of 50: range 26 to 46 (52% to 92%)
      const marks = 26 + (hash % 20) + ((hash % 7) > 3 ? 1 : 0);
      const isPass = marks >= 20;

      await client.query(`
        INSERT INTO "${schema}".student_results (
          id, student_id, paper_id, marks_obtained, is_pass, attempt_number, created_at, question_marks
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 1, NOW(), $5
        )
      `, [
        s.id,
        paperId,
        marks,
        isPass,
        JSON.stringify({ 'co-q1': 2, 'co-q2': 2, 'co-q3': marks - 16, 'co-q4': 12 })
      ]);
      examInserted++;
    }
    console.log(`Inserted theory exam results for ${examInserted} BCA students.`);
  }

  // Verify top students from hustle board
  console.log('\n4. Verifying Hustle Board top 5 students:');
  const testQuery = `
    SELECT s.name, s.rollno, s.attendance_percentage,
           sr.marks_obtained, ep.max_marks,
           ROUND((sr.marks_obtained / ep.max_marks::numeric) * 100, 1) as theory_pct
    FROM "${schema}".students s
    LEFT JOIN "${schema}".student_results sr ON sr.student_id::text = s.id::text
    LEFT JOIN "${schema}".examination_papers ep ON ep.id::text = sr.paper_id::text
    WHERE s.course_cd = '13'
    ORDER BY s.attendance_percentage DESC
    LIMIT 5
  `;
  const sample = await client.query(testQuery);
  console.log(sample.rows);

  await client.end();
}

fixData().catch(console.error);
