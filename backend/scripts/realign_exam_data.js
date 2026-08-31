const { Client } = require('pg');

async function realignExamData() {
  const client = new Client({
    host: '34.236.107.120',
    port: 5433,
    user: 'unicampus',
    password: 'unicampus_dev@qsd!3ous',
    database: 'unicampus_erp',
  });
  await client.connect();

  const schema = 'tenant_srms-cet-bareilly';
  console.log(`Realigning exam papers and student results in ${schema}...`);

  // 1. Get all subjects in the schema
  const subjsRes = await client.query(`SELECT id, code, name FROM "${schema}".subjects`);
  const subjects = subjsRes.rows;
  console.log('Available subjects in schema:', subjects.map(s => `${s.name} (${s.code || s.id})`));

  const findExactSubj = (namePattern, excludePattern = '') => {
    return subjects.find(s => {
      const n = s.name.toLowerCase();
      const matches = n.includes(namePattern.toLowerCase());
      const notExcluded = !excludePattern || !n.includes(excludePattern.toLowerCase());
      return matches && notExcluded;
    }) || subjects[0];
  };

  const wtSubj = findExactSubj('Web Technology', 'Lab');
  const wtLabSubj = findExactSubj('Web Technology Lab');
  const coSubj = findExactSubj('Computer Organization');
  const cppSubj = findExactSubj('Object Oriented Programming in C++', 'Lab');
  const osSubj = findExactSubj('Operating System', 'Lab');
  const taflSubj = findExactSubj('TAFL Theory');

  // 2. Clear out duplicate examination_papers
  await client.query(`DELETE FROM "${schema}".examination_papers;`);

  // 3. Create Demo Paper (where Afreen's prior demo evaluation belongs)
  const demoPaperId = 'c3d28e51-e5f8-45f8-8d85-d6d7a9d6e17f';
  await client.query(`
    INSERT INTO "${schema}".examination_papers (
      id, code, name, subject_id, max_marks, passing_marks, type, duration_minutes, sections, is_active, created_at, updated_at
    ) VALUES (
      $1, 'DEMO-PAPER-01', 'Demo Evaluation Paper (Sample Test)', NULL, 50.00, 20.00, 'THEORY_PRACTICAL', 60,
      $2::jsonb, true, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET code = EXCLUDED.code, name = EXCLUDED.name, subject_id = EXCLUDED.subject_id, max_marks = EXCLUDED.max_marks;
  `, [
    demoPaperId,
    JSON.stringify([
      {
        id: 'sec-1',
        type: 'MCQ',
        title: 'Section A: Multiple Choice Questions (MCQs)',
        questions: [
          { questionId: 'demo-q1', questionText: 'Python supports object-oriented programming?', mode: 'MCQ', marks: 5, competencyCode: 'DEMO1.1' }
        ],
        targetCount: 1,
        subtotalMarks: 5
      },
      {
        id: 'sec-2',
        type: 'DESC',
        title: 'Section B: Descriptive Questions',
        questions: [
          { questionId: 'demo-q2', questionText: 'Describe Python architecture and memory management.', mode: 'DESC', marks: 5, competencyCode: 'DEMO1.2' }
        ],
        targetCount: 1,
        subtotalMarks: 5
      },
      {
        id: 'sec-3',
        type: 'PRACTICAL',
        title: 'Section C: Practical Lab & Viva',
        questions: [],
        practicalComponents: [
          { id: 'p1', name: 'Lab Experiment Execution', marks: 20 },
          { id: 'p2', name: 'Viva Voce', marks: 10 },
          { id: 'p3', name: 'Record Book', marks: 5 },
          { id: 'p4', name: 'Continuous Assessment', marks: 5 }
        ],
        targetCount: 1,
        subtotalMarks: 40
      }
    ])
  ]);

  // Ensure Afreen's result points to the demo paper
  await client.query(`
    UPDATE "${schema}".student_results
    SET paper_id = $1::uuid
    WHERE student_id::text IN (SELECT id::text FROM "${schema}".students WHERE rollno = '2500141790001' OR name ILIKE '%AAFREEN%');
  `, [demoPaperId]);

  // 4. Create fresh, realistic, accurate designed examination papers for each subject
  const designedPapers = [
    // Web Technology - Unit Test (25 Marks, 30 Mins)
    {
      code: 'WT-UNIT-2026-1',
      name: 'Web Technology Unit Test I (2026)',
      subject_id: wtSubj.id,
      max_marks: 25.00,
      passing_marks: 10.00,
      type: 'THEORY',
      duration_minutes: 30,
      sections: [
        {
          id: 'sec-wt-u1',
          type: 'MCQ',
          title: 'Section A: Multiple Choice Questions (MCQs)',
          instructions: 'Answer all multiple choice questions. Each question carries 5 marks.',
          targetCount: 2,
          questions: [
            { questionId: 'wt-u-q1', questionText: 'Which HTML5 element is used for responsive navigation?', mode: 'MCQ', marks: 5, defaultMarks: 5, customMarks: 5, competency_code: 'WT1.1', competencyCode: 'WT1.1' },
            { questionId: 'wt-u-q2', questionText: 'What does CSS flex-direction: column do?', mode: 'MCQ', marks: 5, defaultMarks: 5, customMarks: 5, competency_code: 'WT1.2', competencyCode: 'WT1.2' },
          ]
        },
        {
          id: 'sec-wt-u2',
          type: 'DESC',
          title: 'Section B: Long Descriptive Questions',
          instructions: 'Answer descriptive question with code demonstration.',
          targetCount: 1,
          questions: [
            { questionId: 'wt-u-q3', questionText: 'Explain CSS Grid Layout vs Flexbox with a layout diagram and practical code snippet.', mode: 'DESC', marks: 15, defaultMarks: 15, customMarks: 15, competency_code: 'WT2.1', competencyCode: 'WT2.1' },
          ]
        }
      ]
    },
    // Web Technology - Sessional Exam (50 Marks, 60 Mins)
    {
      code: 'WT-SESS-2026-1',
      name: 'Web Technology Sessional Exam I (2026)',
      subject_id: wtSubj.id,
      max_marks: 50.00,
      passing_marks: 20.00,
      type: 'THEORY',
      duration_minutes: 60,
      sections: [
        {
          id: 'sec-wt-s1',
          type: 'MCQ',
          title: 'Section A: Objective Questions',
          instructions: 'Answer all multiple choice questions.',
          targetCount: 5,
          questions: [
            { questionId: 'wt-s-q1', questionText: 'Which HTTP method is idempotent?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'WT1.1', competencyCode: 'WT1.1' },
            { questionId: 'wt-s-q2', questionText: 'What is the purpose of the CSS Box Model?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'WT1.2', competencyCode: 'WT1.2' },
            { questionId: 'wt-s-q3', questionText: 'Explain JavaScript Event Bubbling vs Capturing.', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'WT1.3', competencyCode: 'WT1.3' },
            { questionId: 'wt-s-q4', questionText: 'What is the DOM tree structure in JavaScript?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'WT1.4', competencyCode: 'WT1.4' },
            { questionId: 'wt-s-q5', questionText: 'What is the purpose of Semantic HTML5 tags?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'WT1.5', competencyCode: 'WT1.5' },
          ]
        },
        {
          id: 'sec-wt-s2',
          type: 'DESC',
          title: 'Section B: Descriptive & Practical Implementation',
          instructions: 'Answer all descriptive questions with detailed implementation.',
          targetCount: 2,
          questions: [
            {
              questionId: 'wt-s-q6',
              questionText: 'Design a responsive web application navbar and form validation using Vanilla JS.',
              mode: 'DESC',
              marks: 20,
              defaultMarks: 20,
              customMarks: 20,
              competency_code: 'WT2.1',
              competencyCode: 'WT2.1',
              sub_questions: [
                { id: 'wt-sq1', label: 'a)', questionText: 'Write semantic HTML5 structure with form fields.', marks: 10 },
                { id: 'wt-sq2', label: 'b)', questionText: 'Implement client-side regex email and password validation.', marks: 10 }
              ]
            },
            {
              questionId: 'wt-s-q7',
              questionText: 'Explain Asynchronous JavaScript, Fetch API, and Promise chaining with error handling.',
              mode: 'DESC',
              marks: 20,
              defaultMarks: 20,
              customMarks: 20,
              competency_code: 'WT2.2',
              competencyCode: 'WT2.2'
            }
          ]
        }
      ]
    },
    // Web Technology Lab - Practical Exam (40 Marks, 120 Mins)
    {
      code: 'WT-LAB-2026-1',
      name: 'Web Technology Practical Lab Evaluation',
      subject_id: wtLabSubj.id,
      max_marks: 40.00,
      passing_marks: 16.00,
      type: 'PRACTICAL',
      duration_minutes: 120,
      sections: [
        {
          id: 'sec-lab-1',
          type: 'PRACTICAL',
          title: 'Section A: Practical Execution, Viva & Record Book',
          instructions: 'Laboratory practical performance, technical viva, and logbook evaluation.',
          targetCount: 1,
          practicalComponents: [
            { id: 'wt-p1', name: 'DOM Manipulation & Dynamic Table Generation', marks: 15 },
            { id: 'wt-p2', name: 'Form Validation & Asynchronous API Integration', marks: 10 },
            { id: 'wt-p3', name: 'Technical Viva Voce Examination', marks: 10 },
            { id: 'wt-p4', name: 'Lab Record Book & Continuous Evaluation', marks: 5 }
          ]
        }
      ]
    },
    // Computer Organization (50 Marks)
    {
      code: 'CO-SESS-2026-1',
      name: 'Computer Organization Sessional Exam I',
      subject_id: coSubj.id,
      max_marks: 50.00,
      passing_marks: 20.00,
      type: 'THEORY',
      duration_minutes: 60,
      sections: [
        {
          id: 'sec-co-1',
          type: 'MCQ',
          title: 'Section A: Architecture MCQs',
          instructions: 'Answer all multiple choice questions.',
          targetCount: 5,
          questions: [
            { questionId: 'co-q1', questionText: 'Which bus is bidirectional in 8085 microprocessor?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'CO1.1', competencyCode: 'CO1.1' },
            { questionId: 'co-q2', questionText: 'Explain the function of Program Counter (PC).', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'CO1.2', competencyCode: 'CO1.2' },
          ]
        },
        {
          id: 'sec-co-2',
          type: 'DESC',
          title: 'Section B: Arithmetic & Memory Architecture',
          instructions: 'Answer descriptive questions with block diagrams.',
          targetCount: 2,
          questions: [
            { questionId: 'co-q3', questionText: 'Explain Booth Multiplication algorithm with flowchart and step-by-step trace.', mode: 'DESC', marks: 23, defaultMarks: 23, customMarks: 23, competency_code: 'CO2.1', competencyCode: 'CO2.1' },
            { questionId: 'co-q4', questionText: 'Explain Cache Memory mapping techniques: Direct, Associative, and Set-Associative.', mode: 'DESC', marks: 23, defaultMarks: 23, customMarks: 23, competency_code: 'CO2.2', competencyCode: 'CO2.2' },
          ]
        }
      ]
    },
    // Object Oriented Programming in C++ (50 Marks)
    {
      code: 'OOP-CPP-2026-1',
      name: 'Object Oriented Programming in C++ Mid-Term',
      subject_id: cppSubj.id,
      max_marks: 50.00,
      passing_marks: 20.00,
      type: 'THEORY',
      duration_minutes: 60,
      sections: [
        {
          id: 'sec-cpp-1',
          type: 'MCQ',
          title: 'Section A: C++ OOP Fundamentals',
          instructions: 'Answer all multiple choice questions.',
          targetCount: 5,
          questions: [
            { questionId: 'cpp-q1', questionText: 'Which operator cannot be overloaded in C++?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'CPP1.1', competencyCode: 'CPP1.1' },
          ]
        },
        {
          id: 'sec-cpp-2',
          type: 'DESC',
          title: 'Section B: Polymorphism & Templates',
          instructions: 'Answer descriptive questions with C++ class definitions.',
          targetCount: 2,
          questions: [
            { questionId: 'cpp-q2', questionText: 'Explain virtual functions, abstract base classes, and pure virtual functions with code demonstration.', mode: 'DESC', marks: 24, defaultMarks: 24, customMarks: 24, competency_code: 'CPP2.1', competencyCode: 'CPP2.1' },
            { questionId: 'cpp-q3', questionText: 'Explain Exception Handling in C++ using try, catch, throw, and standard exceptions.', mode: 'DESC', marks: 24, defaultMarks: 24, customMarks: 24, competency_code: 'CPP2.2', competencyCode: 'CPP2.2' },
          ]
        }
      ]
    },
    // Operating System (50 Marks)
    {
      code: 'OS-SESS-2026-1',
      name: 'Operating System Unit Test II',
      subject_id: osSubj.id,
      max_marks: 50.00,
      passing_marks: 20.00,
      type: 'THEORY',
      duration_minutes: 60,
      sections: [
        {
          id: 'sec-os-1',
          type: 'MCQ',
          title: 'Section A: Process Management',
          instructions: 'Answer all MCQs.',
          targetCount: 5,
          questions: [
            { questionId: 'os-q1', questionText: 'Which CPU scheduling algorithm is non-preemptive?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'OS1.1', competencyCode: 'OS1.1' },
          ]
        },
        {
          id: 'sec-os-2',
          type: 'DESC',
          title: 'Section B: Deadlock & Memory Management',
          instructions: 'Answer descriptive questions with scheduling diagrams.',
          targetCount: 2,
          questions: [
            { questionId: 'os-q2', questionText: 'Explain Banker Algorithm for Deadlock Avoidance with safety algorithm demonstration.', mode: 'DESC', marks: 24, defaultMarks: 24, customMarks: 24, competency_code: 'OS2.1', competencyCode: 'OS2.1' },
            { questionId: 'os-q3', questionText: 'Explain Paging, Segmentation, and Virtual Memory page replacement algorithms (LRU vs FIFO).', mode: 'DESC', marks: 24, defaultMarks: 24, customMarks: 24, competency_code: 'OS2.2', competencyCode: 'OS2.2' },
          ]
        }
      ]
    },
    // TAFL Theory (50 Marks)
    {
      code: 'TAFL-SESS-2026-1',
      name: 'Theory of Automata & Formal Languages Sessional',
      subject_id: taflSubj.id,
      max_marks: 50.00,
      passing_marks: 20.00,
      type: 'THEORY',
      duration_minutes: 60,
      sections: [
        {
          id: 'sec-tafl-1',
          type: 'MCQ',
          title: 'Section A: Regular Languages',
          instructions: 'Answer all MCQs.',
          targetCount: 5,
          questions: [
            { questionId: 'tafl-q1', questionText: 'What is the closure property of regular languages under intersection?', mode: 'MCQ', marks: 2, defaultMarks: 2, customMarks: 2, competency_code: 'TAFL1.1', competencyCode: 'TAFL1.1' },
          ]
        },
        {
          id: 'sec-tafl-2',
          type: 'DESC',
          title: 'Section B: DFA / NFA & Chomsky Hierarchy',
          instructions: 'Answer descriptive question with transition state diagrams.',
          targetCount: 2,
          questions: [
            { questionId: 'tafl-q2', questionText: 'Convert given NFA with epsilon transitions to equivalent minimal DFA step by step.', mode: 'DESC', marks: 24, defaultMarks: 24, customMarks: 24, competency_code: 'TAFL2.1', competencyCode: 'TAFL2.1' },
            { questionId: 'tafl-q3', questionText: 'State and prove Pumping Lemma for Regular Languages with an illustrative example.', mode: 'DESC', marks: 24, defaultMarks: 24, customMarks: 24, competency_code: 'TAFL2.2', competencyCode: 'TAFL2.2' },
          ]
        }
      ]
    }
  ];

  for (const p of designedPapers) {
    await client.query(`
      INSERT INTO "${schema}".examination_papers (
        code, name, subject_id, max_marks, passing_marks, type, duration_minutes, sections, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, true, NOW(), NOW()
      );
    `, [
      p.code,
      p.name,
      p.subject_id,
      p.max_marks,
      p.passing_marks,
      p.type,
      p.duration_minutes,
      JSON.stringify(p.sections)
    ]);
  }

  // Print final state
  const finalPapers = await client.query(`
    SELECT p.code, p.name, p.max_marks, s.name as subject_name 
    FROM "${schema}".examination_papers p
    LEFT JOIN "${schema}".subjects s ON p.subject_id::text = s.id::text
    ORDER BY p.created_at;
  `);
  console.log('\nFinal realigned examination_papers:');
  console.table(finalPapers.rows);

  const finalResults = await client.query(`
    SELECT r.marks_obtained, st.name as student_name, p.code as paper_code, p.name as paper_name
    FROM "${schema}".student_results r
    LEFT JOIN "${schema}".students st ON r.student_id::text = st.id::text
    LEFT JOIN "${schema}".examination_papers p ON r.paper_id::text = p.id::text;
  `);
  console.log('\nFinal student_results linkage:');
  console.table(finalResults.rows);

  await client.end();
}

realignExamData().catch(console.error);
