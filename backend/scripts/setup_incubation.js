const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function setupIncubation() {
  const schema = 'tenant_srms-cet-bareilly';
  
  // Add incubation columns
  await pool.query(`
    ALTER TABLE "${schema}".repositories 
    ADD COLUMN IF NOT EXISTS incubation_status VARCHAR(50) DEFAULT 'Under Review',
    ADD COLUMN IF NOT EXISTS incubation_notes TEXT,
    ADD COLUMN IF NOT EXISTS funding_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mentor_assigned VARCHAR(255),
    ADD COLUMN IF NOT EXISTS incubated_at TIMESTAMP;
  `);

  console.log('Added incubation columns to repositories table in', schema);

  // Check repositories and update/seed high-score incubation candidates
  const repos = await pool.query(`SELECT * FROM "${schema}".repositories`);
  console.log('Existing repos count:', repos.rows.length);

  // Ensure high quality sample projects with scores >= 70% and screenshots
  const sampleProjects = [
    {
      colg_cd: '1',
      course_cd: '1',
      branch_cd: '1',
      batch_cd: 'B2025-C1-1',
      sem_cd: '7',
      student_reg_no: '2500140100018',
      student_name: 'AAFREEN KHAN',
      title: 'AI Smart Hospital & Patient Triage System',
      description: 'An end-to-end intelligent patient triage and vital anomaly detection system leveraging CNNs and real-time WebSockets to prioritize critical care admissions in emergency wards.',
      repo_link: 'https://github.com/aafreen-khan/ai-patient-triage',
      tech_stack: ['Python', 'FastAPI', 'PyTorch', 'Next.js', 'PostgreSQL', 'WebSockets'],
      status: 'Reviewed',
      is_placement_eligible: true,
      score: 94,
      grade: 'A+',
      incubation_status: 'Selected',
      incubation_notes: 'Shortlisted for Institutional Incubation Grant & MedTech Venture Accelerator cohort.',
      funding_amount: 150000,
      mentor_assigned: 'Dr. R. K. Sharma (Head of Innovation)',
      screenshots: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      colg_cd: '1',
      course_cd: '1',
      branch_cd: '2',
      batch_cd: 'B2025-C1-1',
      sem_cd: '7',
      student_reg_no: '2500141790020',
      student_name: 'JATIN PRATAP SINGH',
      title: 'Decentralized Academic Credential & Skill Passport',
      description: 'Blockchain-anchored verifiable credentialing registry for university transcripts, internship diplomas, and micro-degrees with instant QR-code cryptographic proof verification.',
      repo_link: 'https://github.com/jatin-singh/academic-credential-ledger',
      tech_stack: ['Solidity', 'Ethereum', 'Node.js', 'React', 'IPFS', 'TailwindCSS'],
      status: 'Reviewed',
      is_placement_eligible: true,
      score: 89,
      grade: 'A',
      incubation_status: 'Funded',
      incubation_notes: 'Awarded ₹2,00,000 prototype funding from Startup India University Incubation Seed Fund.',
      funding_amount: 200000,
      mentor_assigned: 'Prof. Anjali Verma (Blockchain Lab)',
      screenshots: [
        'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      colg_cd: '1',
      course_cd: '2',
      branch_cd: '1',
      batch_cd: 'B2025-C1-1',
      sem_cd: '5',
      student_reg_no: '2500140500002',
      student_name: 'Aditya Sharma',
      title: 'PharmaTrack: Cold-Chain Drug Tracking & IoT Telemetry',
      description: 'IoT sensor network with real-time temperature/humidity telemetry and smart alerts to prevent degradation of temperature-sensitive vaccines and biological pharmaceuticals in transit.',
      repo_link: 'https://github.com/aditya-sharma/pharmatrack-iot',
      tech_stack: ['ESP32', 'MQTT', 'C++', 'Node.js', 'TimescaleDB', 'Grafana'],
      status: 'Reviewed',
      is_placement_eligible: true,
      score: 86,
      grade: 'A',
      incubation_status: 'Under Review',
      incubation_notes: 'Evaluating hardware BOM and clinical lab pilot deployment feasibility with regional hospitals.',
      funding_amount: 75000,
      mentor_assigned: 'Dr. Manish Saxena (Pharmacy Dept)',
      screenshots: [
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      colg_cd: '1',
      course_cd: '1',
      branch_cd: '1',
      batch_cd: 'B2024-C1-1',
      sem_cd: '8',
      student_reg_no: '2025107666',
      student_name: 'JASPREET SINGH',
      title: 'Autonomous Campus Delivery Rover with LiDAR SLAM',
      description: 'Autonomous indoor/outdoor campus courier bot utilizing ROS2, 2D LiDAR SLAM, and computer vision obstacle avoidance for intra-campus parcel and lab sample transport.',
      repo_link: 'https://github.com/jaspreet-singh/campus-delivery-rover',
      tech_stack: ['ROS 2', 'C++', 'Python', 'OpenCV', 'LiDAR', 'TensorRT'],
      status: 'Reviewed',
      is_placement_eligible: true,
      score: 96,
      grade: 'A+',
      incubation_status: 'Incubated',
      incubation_notes: 'Active campus pilot deployed. 3 delivery rovers operational between library and admin block.',
      funding_amount: 350000,
      mentor_assigned: 'Dr. V. K. Tandon (Robotics Lab)',
      screenshots: [
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      colg_cd: '1',
      course_cd: '3',
      branch_cd: '1',
      batch_cd: 'B2025-C1-1',
      sem_cd: '3',
      student_reg_no: '2025108224',
      student_name: 'PRIYA GUPTA',
      title: 'FinTech Micro-Lending & Credit Risk Underwriting Engine',
      description: 'Alternative credit scoring platform combining mobile money telemetry and XGBoost machine learning models to assess creditworthiness for unbanked micro-entrepreneurs.',
      repo_link: 'https://github.com/priyagupta/micro-credit-ai',
      tech_stack: ['Python', 'XGBoost', 'PostgreSQL', 'FastAPI', 'React', 'Chart.js'],
      status: 'Reviewed',
      is_placement_eligible: true,
      score: 82,
      grade: 'A',
      incubation_status: 'Selected',
      incubation_notes: 'Selected for Fintech Startup Demo Day with angel investor network.',
      funding_amount: 100000,
      mentor_assigned: 'Prof. Neha Agarwal (Management & Finance)',
      screenshots: [
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
      ]
    }
  ];

  for (const p of sampleProjects) {
    const existing = await pool.query(
      `SELECT repo_id FROM "${schema}".repositories WHERE title = $1`,
      [p.title]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO "${schema}".repositories (
          colg_cd, course_cd, branch_cd, batch_cd, sem_cd,
          student_reg_no, student_name, title, description, repo_link,
          tech_stack, status, is_placement_eligible, score, grade,
          incubation_status, incubation_notes, funding_amount, mentor_assigned, screenshots,
          submitted_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          NOW(), NOW()
        )`,
        [
          p.colg_cd, p.course_cd, p.branch_cd, p.batch_cd, p.sem_cd,
          p.student_reg_no, p.student_name, p.title, p.description, p.repo_link,
          p.tech_stack, p.status, p.is_placement_eligible, p.score, p.grade,
          p.incubation_status, p.incubation_notes, p.funding_amount, p.mentor_assigned, p.screenshots
        ]
      );
      console.log('Inserted sample incubation project:', p.title);
    } else {
      await pool.query(
        `UPDATE "${schema}".repositories 
         SET incubation_status = COALESCE(incubation_status, $1),
             incubation_notes = COALESCE(incubation_notes, $2),
             funding_amount = COALESCE(funding_amount, $3),
             mentor_assigned = COALESCE(mentor_assigned, $4),
             screenshots = COALESCE(screenshots, $5),
             score = GREATEST(score, $6)
         WHERE repo_id = $7`,
        [p.incubation_status, p.incubation_notes, p.funding_amount, p.mentor_assigned, p.screenshots, p.score, existing.rows[0].repo_id]
      );
      console.log('Updated existing project with incubation details:', p.title);
    }
  }

  console.log('Incubation database setup complete!');
  await pool.end();
}

setupIncubation().catch(console.error);
