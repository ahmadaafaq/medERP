const { Client } = require('../backend/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function seedPhysiologyData() {
  await client.connect();
  console.log('=== SEEDING PHYSIOLOGY TOPICS, COMPETENCIES & QUESTION BANK ===');

  const schema = 'tenant_srms-ims';

  // 1. Fetch Physiology Subject & Department IDs
  const deptRes = await client.query(`SELECT id FROM "${schema}".departments WHERE name ILIKE '%physio%' OR code IN ('PHY', 'PY') LIMIT 1`);
  const deptId = deptRes.rows[0]?.id || null;

  const subjRes = await client.query(`SELECT id FROM "${schema}".subjects WHERE name ILIKE '%physio%' OR code IN ('PHY', 'PY') LIMIT 1`);
  const subjId = subjRes.rows[0]?.id || null;

  console.log(`Resolved Department ID: ${deptId}, Subject ID: ${subjId}`);

  // 2. Insert / Map Topics
  const topicsData = [
    { code: 'PY1 (2024)', name: 'Topic 01: General Physiology (2024)', description: 'General Physiology, Cell Membrane Transport, Homeostasis' },
    { code: 'PY2 (2024)', name: 'Topic 02 : Haematology (2024)', description: 'Blood Composition, Erythropoiesis, Plasma Proteins, Hemostasis' },
    { code: 'PY3 (2024)', name: 'Topic 03 : Cardiovascular System (2024)', description: 'Cardiac Cycle, ECG, Cardiac Output, Blood Pressure' },
    { code: 'PY4 (2024)', name: 'Topic 04 : Respiration (2024)', description: 'Mechanics of Breathing, Gas Exchange, Lung Volumes' },
    { code: 'PY5 (2024)', name: 'Topic 05 : Renal Physiology (2024)', description: 'GFR, Tubular Function, Urine Concentration, Acid-Base Balance' },
    { code: 'PY6 (2024)', name: 'Topic 06 : Endocrine System (2024)', description: 'Pituitary, Thyroid, Adrenal, Pancreatic Hormones' },
    { code: 'PY7 (2024)', name: 'Topic 07 : Neurophysiology (2024)', description: 'Reflexes, Synaptic Transmission, Sensory & Motor Systems' },
  ];

  const topicIdMap = new Map();

  for (const t of topicsData) {
    const existing = await client.query(`SELECT id FROM "${schema}".topics WHERE name = $1 OR code = $2`, [t.name, t.code]);
    let tid;
    if (existing.rows.length > 0) {
      tid = existing.rows[0].id;
      await client.query(`UPDATE "${schema}".topics SET subject_id = $1, code = $2, description = $3 WHERE id = $4`, [subjId, t.code, t.description, tid]);
    } else {
      const ins = await client.query(
        `INSERT INTO "${schema}".topics (subject_id, code, name, description, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [subjId, t.code, t.name, t.description]
      );
      tid = ins.rows[0].id;
    }
    topicIdMap.set(t.name, tid);
  }
  console.log('Topics Mapped Successfully.');

  // 3. Insert / Map Competencies
  const competenciesData = [
    { topicName: 'Topic 01: General Physiology (2024)', code: 'PY1.1(2024)', description: 'Describe and demonstrate cell membrane transport mechanisms & homeostasis' },
    { topicName: 'Topic 02 : Haematology (2024)', code: 'PY2.1(2024)', description: 'Describe composition of blood, plasma proteins, erythropoiesis, & hemoglobin' },
    { topicName: 'Topic 03 : Cardiovascular System (2024)', code: 'PY3.1(2024)', description: 'Describe cardiac cycle, heart sounds, & blood pressure regulation' },
    { topicName: 'Topic 04 : Respiration (2024)', code: 'PY4.1(2024)', description: 'Describe respiratory mechanics, lung capacities, & oxygen transport' },
    { topicName: 'Topic 05 : Renal Physiology (2024)', code: 'PY5.1(2024)', description: 'Describe GFR, tubular reabsorption, & urine concentration' },
    { topicName: 'Topic 06 : Endocrine System (2024)', code: 'PY6.1(2024)', description: 'Describe endocrine hormone actions & feedback control' },
    { topicName: 'Topic 07 : Neurophysiology (2024)', code: 'PY7.1(2024)', description: 'Describe reflex arc, synaptic transmission, & motor pathways' },
  ];

  for (const c of competenciesData) {
    const tid = topicIdMap.get(c.topicName);
    const existing = await client.query(`SELECT id FROM "${schema}".competencies WHERE code = $1`, [c.code]);
    if (existing.rows.length > 0) {
      await client.query(`UPDATE "${schema}".competencies SET subject_id = $1, topic_id = $2, description = $3 WHERE code = $4`, [subjId, tid, c.description, c.code]);
    } else {
      await client.query(
        `INSERT INTO "${schema}".competencies (subject_id, topic_id, code, description, domain, level, is_core, is_active) VALUES ($1, $2, $3, $4, 'Knowledge', 'Shows How', true, true)`,
        [subjId, tid, c.code, c.description]
      );
    }
  }
  console.log('Competencies Mapped Successfully.');

  // 4. Clear dummy questions and Feed Authentic MCQs & Descriptive Questions
  await client.query(`DELETE FROM "${schema}".question_bank WHERE question_text LIKE 'ggggg%' OR question_text LIKE 'Hjjj%' OR question_text LIKE 'Hello%'`);

  const questionsToFeed = [
    // MCQs
    {
      mode: 'MCQ',
      topic: 'Topic 01: General Physiology (2024)',
      competency_code: 'PY1.1(2024)',
      question_text: 'Hemoglobin is primarily responsible for:',
      option_a: 'Blood clotting',
      option_b: 'Oxygen transport',
      option_c: 'Immune defense',
      option_d: 'Plasma osmotic pressure',
      correct_option: 'option_b',
      difficulty_level: 'Medium',
      max_marks: 2.0,
    },
    {
      mode: 'MCQ',
      topic: 'Topic 01: General Physiology (2024)',
      competency_code: 'PY1.1(2024)',
      question_text: 'The principal site of erythropoiesis in adults is:',
      option_a: 'Spleen',
      option_b: 'Red bone marrow',
      option_c: 'Liver',
      option_d: 'Lymph nodes',
      correct_option: 'option_b',
      difficulty_level: 'Easy',
      max_marks: 2.0,
    },
    {
      mode: 'MCQ',
      topic: 'Topic 01: General Physiology (2024)',
      competency_code: 'PY1.1(2024)',
      question_text: 'The hormone primarily responsible for stimulating erythropoiesis is:',
      option_a: 'Erythropoietin',
      option_b: 'Thrombopoietin',
      option_c: 'Aldosterone',
      option_d: 'Cortisol',
      correct_option: 'option_a',
      difficulty_level: 'Medium',
      max_marks: 2.0,
    },
    {
      mode: 'MCQ',
      topic: 'Topic 02 : Haematology (2024)',
      competency_code: 'PY2.1(2024)',
      question_text: 'Which plasma protein is mainly responsible for maintaining colloid osmotic pressure?',
      option_a: 'Globulin',
      option_b: 'Albumin',
      option_c: 'Fibrinogen',
      option_d: 'Prothrombin',
      correct_option: 'option_b',
      difficulty_level: 'Medium',
      max_marks: 2.0,
    },
    {
      mode: 'MCQ',
      topic: 'Topic 02 : Haematology (2024)',
      competency_code: 'PY2.1(2024)',
      question_text: 'The most abundant formed element in blood is:',
      option_a: 'Leukocytes',
      option_b: 'Erythrocytes',
      option_c: 'Thrombocytes',
      option_d: 'Monocytes',
      correct_option: 'option_b',
      difficulty_level: 'Easy',
      max_marks: 2.0,
    },

    // Descriptive (DESC)
    {
      mode: 'DESC',
      topic: 'Topic 01: General Physiology (2024)',
      competency_code: 'PY1.1(2024)',
      question_text: 'Describe the role of iron, vitamin B12 and folic acid in red blood cell production.',
      has_sub_questions: false,
      sub_questions: null,
      difficulty_level: 'Medium',
      max_marks: 4.0,
    },
    {
      mode: 'DESC',
      topic: 'Topic 02 : Haematology (2024)',
      competency_code: 'PY2.1(2024)',
      question_text: 'Write short notes on:',
      has_sub_questions: true,
      sub_questions: JSON.stringify([
        { id: '1', label: 'a)', questionText: 'Plasma', marks: 5 },
        { id: '2', label: 'b)', questionText: 'Serum', marks: 5 },
      ]),
      difficulty_level: 'Medium',
      max_marks: 10.0,
    },
    {
      mode: 'DESC',
      topic: 'Topic 02 : Haematology (2024)',
      competency_code: 'PY2.1(2024)',
      question_text: 'Define blood. Describe its composition with a neat diagram.',
      has_sub_questions: false,
      sub_questions: null,
      difficulty_level: 'Medium',
      max_marks: 3.0,
    },
  ];

  for (const q of questionsToFeed) {
    const existing = await client.query(
      `SELECT id FROM "${schema}".question_bank WHERE question_text = $1 AND mode = $2`,
      [q.question_text, q.mode]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO "${schema}".question_bank (
          department_id, subject_id, professional_phase, topic, mode,
          question_text, option_a, option_b, option_c, option_d, correct_option,
          difficulty_level, competency_code, has_sub_questions, sub_questions, max_marks
        ) VALUES ($1, $2, '1st Professional (Phase I)', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          deptId, subjId, q.topic, q.mode, q.question_text,
          q.option_a || null, q.option_b || null, q.option_c || null, q.option_d || null, q.correct_option || null,
          q.difficulty_level, q.competency_code, q.has_sub_questions || false, q.sub_questions || null, q.max_marks
        ]
      );
    }
  }

  console.log('MCQ and Descriptive Questions Fed Successfully to Question Bank!');
  await client.end();
}

seedPhysiologyData().catch(e => console.error('PG SEED ERROR:', e));
