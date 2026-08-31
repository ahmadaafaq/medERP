const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || '34.236.107.120',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'unicampus',
  password: process.env.DB_PASS || 'unicampus_dev@qsd!3ous',
  database: process.env.DB_NAME || 'unicampus_erp',
});

async function seedPapers() {
  await client.connect();
  const schema = 'tenant_srms-cet-bareilly';

  console.log('Seeding exam papers for subjects in', schema);

  // 1. Clean existing duplicates in examination_papers
  await client.query(`
    DELETE FROM "${schema}".examination_papers
    WHERE ctid NOT IN (
      SELECT min(ctid)
      FROM "${schema}".examination_papers
      GROUP BY id
    )
  `);

  // Add primary key if missing
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = '"${schema}".examination_papers'::regclass AND contype = 'p'
      ) THEN
        ALTER TABLE "${schema}".examination_papers ADD PRIMARY KEY (id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END $$;
  `);

  // Sample papers to add for key BCA & B.Tech subjects
  const samplePapers = [
    {
      code: 'WT-SESS-2026-1',
      name: 'Web Technology Sessional Exam I',
      subject_name_match: 'Web Technology',
      max_marks: 50,
      passing_marks: 20,
      type: 'THEORY',
      duration: 60,
      sections: [
        {
          id: 'sec-1',
          name: 'Section A - Objective & Short MCQs',
          type: 'MCQ',
          questions: [
            { questionId: 'wt-q1', questionText: 'Which HTTP method is idempotent?', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'WT1.1' },
            { questionId: 'wt-q2', questionText: 'What is the purpose of CSS Box Model?', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'WT1.2' },
            { questionId: 'wt-q3', questionText: 'Explain JavaScript Event Bubbling vs Capturing.', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'WT1.3' },
          ]
        },
        {
          id: 'sec-2',
          name: 'Section B - Descriptive & Code Implementation',
          type: 'DESC',
          questions: [
            {
              questionId: 'wt-q4',
              questionText: 'Design a responsive HTML5/CSS3 flexbox navbar with mobile toggle navigation.',
              mode: 'DESC',
              defaultMarks: 10,
              customMarks: 10,
              competencyCode: 'WT2.1',
              subQuestions: [
                { id: 'wt-sub1', label: 'a)', questionText: 'Write semantic HTML5 markup.', marks: 5 },
                { id: 'wt-sub2', label: 'b)', questionText: 'Write responsive media query CSS rules.', marks: 5 },
              ]
            },
            {
              questionId: 'wt-q5',
              questionText: 'Explain AJAX asynchronous communication with fetch API and Promises.',
              mode: 'DESC',
              defaultMarks: 10,
              customMarks: 10,
              competencyCode: 'WT2.2',
            }
          ]
        }
      ]
    },
    {
      code: 'WT-LAB-2026-1',
      name: 'Web Technology Practical Lab Evaluation',
      subject_name_match: 'Web Technology Lab',
      max_marks: 40,
      passing_marks: 16,
      type: 'PRACTICAL',
      duration: 120,
      sections: [
        {
          id: 'sec-lab-1',
          name: 'Section A - Practical Execution & Viva',
          type: 'PRACTICAL',
          practicalMarks: 40,
          practicalComponents: [
            { id: 'wt-p1', name: 'DOM Manipulation Lab Experiment', marks: 15 },
            { id: 'wt-p2', name: 'Form Validation & Error Handling', marks: 10 },
            { id: 'wt-p3', name: 'Technical Viva Voce', marks: 10 },
            { id: 'wt-p4', name: 'Lab Record & Code Quality', marks: 5 },
          ]
        }
      ]
    },
    {
      code: 'CO-SESS-2026-1',
      name: 'Computer Organization Sessional I',
      subject_name_match: 'Computer Organization',
      max_marks: 50,
      passing_marks: 20,
      type: 'THEORY',
      duration: 60,
      sections: [
        {
          id: 'sec-co-1',
          name: 'Section A - Basic Architecture',
          type: 'MCQ',
          questions: [
            { questionId: 'co-q1', questionText: 'Which bus is bidirectional in 8085 microprocessor?', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'CO1.1' },
            { questionId: 'co-q2', questionText: 'Explain the role of Program Counter (PC).', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'CO1.2' },
          ]
        },
        {
          id: 'sec-co-2',
          name: 'Section B - Memory & ALU Design',
          type: 'DESC',
          questions: [
            { questionId: 'co-q3', questionText: 'Draw and explain Booth Multiplication algorithm with flowchart.', mode: 'DESC', defaultMarks: 10, customMarks: 10, competencyCode: 'CO2.1' },
          ]
        }
      ]
    },
    {
      code: 'OOP-CPP-2026-1',
      name: 'Object Oriented Programming in C++ Mid-Term',
      subject_name_match: 'Object Oriented Programming in C++',
      max_marks: 50,
      passing_marks: 20,
      type: 'THEORY',
      duration: 60,
      sections: [
        {
          id: 'sec-cpp-1',
          name: 'Section A - OOP Principles',
          type: 'MCQ',
          questions: [
            { questionId: 'cpp-q1', questionText: 'Which operator cannot be overloaded in C++?', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'CPP1.1' },
          ]
        },
        {
          id: 'sec-cpp-2',
          name: 'Section B - Polymorphism & Templates',
          type: 'DESC',
          questions: [
            { questionId: 'cpp-q2', questionText: 'Explain virtual functions, abstract classes, and run-time polymorphism with code.', mode: 'DESC', defaultMarks: 10, customMarks: 10, competencyCode: 'CPP2.1' },
          ]
        }
      ]
    },
    {
      code: 'OS-SESS-2026-1',
      name: 'Operating System Unit Test II',
      subject_name_match: 'Operating System',
      max_marks: 50,
      passing_marks: 20,
      type: 'THEORY',
      duration: 60,
      sections: [
        {
          id: 'sec-os-1',
          name: 'Section A - Process Management',
          type: 'MCQ',
          questions: [
            { questionId: 'os-q1', questionText: 'Which scheduling algorithm is non-preemptive?', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'OS1.1' },
          ]
        },
        {
          id: 'sec-os-2',
          name: 'Section B - Deadlock & Memory Management',
          type: 'DESC',
          questions: [
            { questionId: 'os-q2', questionText: 'Explain Banker Algorithm for Deadlock Avoidance with safety algorithm demonstration.', mode: 'DESC', defaultMarks: 10, customMarks: 10, competencyCode: 'OS2.1' },
          ]
        }
      ]
    },
    {
      code: 'TAFL-SESS-2026-1',
      name: 'Theory of Automata & Formal Languages Sessional',
      subject_name_match: 'TAFL Theory',
      max_marks: 50,
      passing_marks: 20,
      type: 'THEORY',
      duration: 60,
      sections: [
        {
          id: 'sec-tafl-1',
          name: 'Section A - Regular Languages',
          type: 'MCQ',
          questions: [
            { questionId: 'tafl-q1', questionText: 'What is the closure property of regular languages under intersection?', mode: 'MCQ', defaultMarks: 2, customMarks: 2, competencyCode: 'TAFL1.1' },
          ]
        },
        {
          id: 'sec-tafl-2',
          name: 'Section B - DFA / NFA & Chomsky Hierarchy',
          type: 'DESC',
          questions: [
            { questionId: 'tafl-q2', questionText: 'Convert given NFA to equivalent minimal DFA step by step.', mode: 'DESC', defaultMarks: 10, customMarks: 10, competencyCode: 'TAFL2.1' },
          ]
        }
      ]
    }
  ];

  for (const p of samplePapers) {
    const subRes = await client.query(`
      SELECT id, code, name FROM "${schema}".subjects 
      WHERE LOWER(name) = LOWER($1) OR name ILIKE $2
      LIMIT 1
    `, [p.subject_name_match, `%${p.subject_name_match}%`]);

    const subjectId = subRes.rows[0]?.id || null;
    console.log(`Matched subject "${p.subject_name_match}" -> id: ${subjectId}`);

    await client.query(`
      INSERT INTO "${schema}".examination_papers (
        code, name, subject_id, max_marks, passing_marks, type, duration_minutes, sections, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, true, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE 
      SET code = EXCLUDED.code, name = EXCLUDED.name, subject_id = EXCLUDED.subject_id, max_marks = EXCLUDED.max_marks, sections = EXCLUDED.sections
    `, [p.code, p.name, subjectId, p.max_marks, p.passing_marks, p.type, p.duration, JSON.stringify(p.sections)]);
  }

  // Update existing paper WBTECHPYTHON2026-1 to link properly to Web Technology
  const wtSub = await client.query(`SELECT id FROM "${schema}".subjects WHERE name ILIKE '%Web Technology%' AND name NOT ILIKE '%Lab%' LIMIT 1`);
  if (wtSub.rows[0]) {
    await client.query(`
      UPDATE "${schema}".examination_papers 
      SET subject_id = $1, name = 'Unit Test First Sessional 2026 - Web Tech'
      WHERE code = 'WBTECHPYTHON2026-1'
    `, [wtSub.rows[0].id]);
    console.log('Updated WBTECHPYTHON2026-1 subject_id to', wtSub.rows[0].id);
  }

  const finalPapers = await client.query(`
    SELECT p.code, p.name, s.name as subject_name 
    FROM "${schema}".examination_papers p 
    LEFT JOIN "${schema}".subjects s ON p.subject_id::text = s.id::text
  `);
  console.log('Final examination_papers:', finalPapers.rows);

  await client.end();
}

seedPapers().catch(console.error);
