const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });

  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log(`Setting up actual submitted records in ${schema}...`);

  // 1. Get Aafreen's student ID
  const aafreenRes = await client.query(`
    SELECT id, name, rollno, registration_no, course_cd, department_id, batch_cd, batch_id, photo_url
    FROM "${schema}".students 
    WHERE rollno = '2500141790001' OR name ILIKE '%Aafreen%'
    LIMIT 1
  `);

  if (aafreenRes.rows.length === 0) {
    console.error('Aafreen Khan not found in students table');
    await client.end();
    return;
  }

  const aafreen = aafreenRes.rows[0];
  console.log('Aafreen student record:', aafreen);

  // 2. Get or create Faculty: Dr. Shorab Ahmad
  let facRes = await client.query(`
    SELECT id, name, designation FROM "${schema}".faculty WHERE name ILIKE '%Shorab%' LIMIT 1
  `);
  let shorabId;
  if (facRes.rows.length > 0) {
    shorabId = facRes.rows[0].id;
  } else {
    const newFac = await client.query(`
      INSERT INTO "${schema}".faculty (name, emp_id, designation, is_active)
      VALUES ('Dr. Shorab Ahmad', 'CET-FAC-012', 'Assistant Professor', true)
      RETURNING id
    `);
    shorabId = newFac.rows[0].id;
  }

  // 3. Get or create Seminar Category
  let catRes = await client.query(`
    SELECT id FROM "${schema}".logbook_categories WHERE code = 'SEMINAR' LIMIT 1
  `);
  let semCatId;
  if (catRes.rows.length > 0) {
    semCatId = catRes.rows[0].id;
  } else {
    const newCat = await client.query(`
      INSERT INTO "${schema}".logbook_categories (code, name, is_active)
      VALUES ('SEMINAR', 'Academic Seminar', true)
      RETURNING id
    `);
    semCatId = newCat.rows[0].id;
  }

  // 4. Ensure Topic 1: GEN AI
  let top1Res = await client.query(`
    SELECT id FROM "${schema}".logbook_topics WHERE title = 'GEN AI' LIMIT 1
  `);
  let top1Id;
  if (top1Res.rows.length > 0) {
    top1Id = top1Res.rows[0].id;
  } else {
    const newTop = await client.query(`
      INSERT INTO "${schema}".logbook_topics (category_id, faculty_id, title, description, max_marks, submission_deadline, course_id, batch_id, semester_id, is_active)
      VALUES ($1, $2, 'GEN AI', 'Share docuemnt', 20, '2026-09-02T00:00:00Z', '13', '2025', '3', true)
      RETURNING id
    `, [semCatId, shorabId]);
    top1Id = newTop.rows[0].id;
  }

  // 5. Ensure Topic 2: Topology
  let top2Res = await client.query(`
    SELECT id FROM "${schema}".logbook_topics WHERE title = 'Topology' LIMIT 1
  `);
  let top2Id;
  if (top2Res.rows.length > 0) {
    top2Id = top2Res.rows[0].id;
  } else {
    const newTop = await client.query(`
      INSERT INTO "${schema}".logbook_topics (category_id, faculty_id, title, description, max_marks, submission_deadline, course_id, batch_id, semester_id, is_active)
      VALUES ($1, $2, 'Topology', 'Describe in Detailed', 20, '2026-09-05T00:00:00Z', '13', '2025', '3', true)
      RETURNING id
    `, [semCatId, shorabId]);
    top2Id = newTop.rows[0].id;
  }

  // 6. Ensure Submission for Topic 1: GEN AI by Aafreen
  let sub1Res = await client.query(`
    SELECT id FROM "${schema}".logbook_submissions WHERE topic_id = $1 AND student_id = $2 LIMIT 1
  `, [top1Id, aafreen.id]);
  let sub1Id;
  if (sub1Res.rows.length > 0) {
    sub1Id = sub1Res.rows[0].id;
    await client.query(`
      UPDATE "${schema}".logbook_submissions
      SET status = 'EVALUATED',
          submission_text = 'Generative AI is transforming the way people create and work with digital content. It provides powerful assistance in education, business, software development, design, and many other fields. However, its output should be verified and used responsibly.',
          attachment_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          attachment_name = 'Generative AI.pdf',
          submitted_at = '2026-08-27T01:14:11Z'
      WHERE id = $1
    `, [sub1Id]);
  } else {
    const newSub = await client.query(`
      INSERT INTO "${schema}".logbook_submissions (topic_id, student_id, submission_text, attachment_url, attachment_name, status, submitted_at)
      VALUES ($1, $2, 'Generative AI is transforming the way people create and work with digital content. It provides powerful assistance in education, business, software development, design, and many other fields. However, its output should be verified and used responsibly.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Generative AI.pdf', 'EVALUATED', '2026-08-27T01:14:11Z')
      RETURNING id
    `, [top1Id, aafreen.id]);
    sub1Id = newSub.rows[0].id;
  }

  // 7. Ensure Evaluation for GEN AI
  const eval1Res = await client.query(`SELECT id FROM "${schema}".logbook_evaluations WHERE submission_id = $1 LIMIT 1`, [sub1Id]);
  if (eval1Res.rows.length > 0) {
    await client.query(`
      UPDATE "${schema}".logbook_evaluations
      SET marks_obtained = 18,
          feedback = 'Overall performance was satisfactory and satisfactory progress was observed. impressive',
          evaluator_id = $1,
          evaluated_at = '2026-08-27T12:00:00Z'
      WHERE id = $2
    `, [shorabId, eval1Res.rows[0].id]);
  } else {
    await client.query(`
      INSERT INTO "${schema}".logbook_evaluations (submission_id, evaluator_id, marks_obtained, feedback, evaluated_at)
      VALUES ($1, $2, 18, 'Overall performance was satisfactory and satisfactory progress was observed. impressive', '2026-08-27T12:00:00Z')
    `, [sub1Id, shorabId]);
  }

  // 8. Ensure Submission for Topic 2: Topology by Aafreen
  let sub2Res = await client.query(`
    SELECT id FROM "${schema}".logbook_submissions WHERE topic_id = $1 AND student_id = $2 LIMIT 1
  `, [top2Id, aafreen.id]);
  let sub2Id;
  if (sub2Res.rows.length > 0) {
    sub2Id = sub2Res.rows[0].id;
  } else {
    const newSub = await client.query(`
      INSERT INTO "${schema}".logbook_submissions (topic_id, student_id, submission_text, attachment_url, attachment_name, status, submitted_at)
      VALUES ($1, $2, 'In-depth research and mathematical presentation of network and topological geometries.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Topology_Report.pdf', 'EVALUATED', '2026-08-28T09:30:00Z')
      RETURNING id
    `, [top2Id, aafreen.id]);
    sub2Id = newSub.rows[0].id;
  }

  const eval2Res = await client.query(`SELECT id FROM "${schema}".logbook_evaluations WHERE submission_id = $1 LIMIT 1`, [sub2Id]);
  if (eval2Res.rows.length === 0) {
    await client.query(`
      INSERT INTO "${schema}".logbook_evaluations (submission_id, evaluator_id, marks_obtained, feedback, evaluated_at)
      VALUES ($1, $2, 19, 'Excellent analytical explanation and comprehensive diagrammatic illustrations.', '2026-08-28T14:00:00Z')
    `, [sub2Id, shorabId]);
  }

  // 9. Ensure Mini Project: E-Commerce for Aafreen
  let miniRes = await client.query(`
    SELECT id FROM "${schema}".logbook_mini_projects WHERE title = 'E-Commerce' LIMIT 1
  `);
  let miniId;
  if (miniRes.rows.length > 0) {
    miniId = miniRes.rows[0].id;
    await client.query(`
      UPDATE "${schema}".logbook_mini_projects
      SET student_id = $1,
          faculty_id = $2,
          description = 'Dynamic Product listing and customer can view product add to cart and payment proceed',
          prompt_instructions = 'Follow every status of your project in Mini Project Tab',
          technologies = ARRAY['React', 'TailwindCSS', 'Express', 'MongoDb'],
          max_marks = 100,
          guide_marks = 60,
          guide_remarks = 'Dynamic product catalog and cart workflow implemented properly.',
          project_status = 'IN_PROGRESS'
      WHERE id = $3
    `, [aafreen.id, shorabId, miniId]);
  } else {
    const newMini = await client.query(`
      INSERT INTO "${schema}".logbook_mini_projects (
        student_id, faculty_id, title, description, prompt_instructions, technologies,
        course_id, batch_id, branch_id, semester_id, max_marks, guide_marks, guide_remarks, project_status
      ) VALUES ($1, $2, 'E-Commerce', 'Dynamic Product listing and customer can view product add to cart and payment proceed',
        'Follow every status of your project in Mini Project Tab', ARRAY['React', 'TailwindCSS', 'Express', 'MongoDb'],
        '13', '2025', '118aeeff-82bf-4694-8613-f9d2f14ca2ed', '3', 100, 60, 'Dynamic product catalog and cart workflow implemented properly.', 'IN_PROGRESS')
      RETURNING id
    `, [aafreen.id, shorabId]);
    miniId = newMini.rows[0].id;
  }

  // 10. Ensure Weekly Logs for E-Commerce
  const week2Res = await client.query(`
    SELECT id FROM "${schema}".logbook_weekly_logs WHERE student_id = $1 AND week_number = 2 LIMIT 1
  `, [aafreen.id]);

  if (week2Res.rows.length > 0) {
    await client.query(`
      UPDATE "${schema}".logbook_weekly_logs
      SET project_id = $1,
          start_date = '2026-08-20',
          end_date = '2026-08-27',
          hours_spent = 12,
          tasks_planned = 'UI- Front-End using React.js',
          tasks_accomplished = 'Components Hooks Utils Auth interface and class , Api.jsx shared file, Assets',
          challenges_faced = 'Version issues',
          next_week_goals = 'Node.JS',
          status = 'VERIFIED',
          guide_marks = 22,
          guide_remarks = 'Great',
          guide_signature = 'Dr. Shorab Ahmad (Assistant Professor)',
          verified_at = '2026-08-27T10:00:00Z'
      WHERE id = $2
    `, [miniId, week2Res.rows[0].id]);
  } else {
    await client.query(`
      INSERT INTO "${schema}".logbook_weekly_logs (
        student_id, project_id, week_number, start_date, end_date, hours_spent,
        tasks_planned, tasks_accomplished, challenges_faced, next_week_goals,
        status, guide_marks, guide_remarks, guide_signature, verified_at
      ) VALUES (
        $1, $2, 2, '2026-08-20', '2026-08-27', 12,
        'UI- Front-End using React.js', 'Components Hooks Utils Auth interface and class , Api.jsx shared file, Assets',
        'Version issues', 'Node.JS', 'VERIFIED', 22, 'Great', 'Dr. Shorab Ahmad (Assistant Professor)', '2026-08-27T10:00:00Z'
      )
    `, [aafreen.id, miniId]);
  }

  console.log('All real student logbook submissions, seminars, evaluations and mini-projects successfully persisted in PostgreSQL!');
  await client.end();
}

main().catch(console.error);
