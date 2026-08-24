const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function setupRepositoriesAndEvaluations() {
  console.log('--- Setting up Repositories and Faculty Reviews across Tenant Schemas ---');

  const schemas = [
    'tenant_srms-cet-bareilly',
    'tenant_srms-cetr-bareilly',
    'tenant_srms-ims',
    'tenant_srms-cet',
    'tenant_rmribar',
    'tenant_apex-tech',
    'tenant_rmch-bareilly',
    'tenant_srms-iahs-bareilly',
    'tenant_srms-ibs-lucknow',
    'tenant_srms-nursing-college',
    'tenant_srms-cet-unnao',
    'tenant_srms-college-of-law',
    'tenant_srms-college-of-nursing-paramedical-sciences-unnao',
    'tenant_srms-cricket-academy',
    'tenant_srms-nursing-school',
    'tenant_srms-quiz-panel',
    'tenant_srms-riddhima-bareilly',
    'tenant_srms-trust-bareilly'
  ];

  for (const s of schemas) {
    // Check if schema exists
    const schemaExists = await pool.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
      [s]
    );
    if (schemaExists.rows.length === 0) continue;

    console.log(`Setting up schema "${s}"...`);

    // 1. Create repositories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${s}".repositories (
        repo_id SERIAL PRIMARY KEY,
        colg_cd VARCHAR(20) DEFAULT '1',
        course_cd VARCHAR(50) DEFAULT '1',
        branch_cd VARCHAR(50) DEFAULT '1',
        batch_cd VARCHAR(50) DEFAULT '1',
        sem_cd VARCHAR(20) DEFAULT '1',
        student_reg_no VARCHAR(100) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        repo_link TEXT,
        tech_stack TEXT[],
        screenshots TEXT[],
        status VARCHAR(50) DEFAULT 'Pending Review',
        score NUMERIC(5,2),
        grade VARCHAR(10),
        is_placement_eligible BOOLEAN DEFAULT false,
        incubation_status VARCHAR(50) DEFAULT 'Under Review',
        incubation_notes TEXT,
        funding_amount NUMERIC DEFAULT 0,
        mentor_assigned VARCHAR(255),
        incubated_at TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE "${s}".repositories 
        ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(20) DEFAULT '1',
        ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50) DEFAULT '1',
        ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50) DEFAULT '1',
        ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50) DEFAULT '1',
        ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(20) DEFAULT '1',
        ADD COLUMN IF NOT EXISTS tech_stack TEXT[],
        ADD COLUMN IF NOT EXISTS screenshots TEXT[],
        ADD COLUMN IF NOT EXISTS score NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS grade VARCHAR(10),
        ADD COLUMN IF NOT EXISTS is_placement_eligible BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS incubation_status VARCHAR(50) DEFAULT 'Under Review',
        ADD COLUMN IF NOT EXISTS incubation_notes TEXT,
        ADD COLUMN IF NOT EXISTS funding_amount NUMERIC DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mentor_assigned VARCHAR(255),
        ADD COLUMN IF NOT EXISTS incubated_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    // 2. Create repository_reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${s}".repository_reviews (
        review_id SERIAL PRIMARY KEY,
        repo_id INTEGER NOT NULL REFERENCES "${s}".repositories(repo_id) ON DELETE CASCADE,
        faculty_empid VARCHAR(100),
        faculty_name VARCHAR(255) NOT NULL,
        score NUMERIC(5,2) NOT NULL,
        grade VARCHAR(10),
        remarks TEXT,
        reviewed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Check existing count
    const count = await pool.query(`SELECT count(*) FROM "${s}".repositories`);
    if (parseInt(count.rows[0].count, 10) === 0) {
      console.log(`Seeding 8 high-quality projects & faculty evaluations into "${s}".repositories...`);

      const sampleProjects = [
        {
          colg_cd: '1',
          course_cd: '1', // B.Tech
          branch_cd: '1', // CSE
          batch_cd: '1', // 2022-26
          sem_cd: '7',
          student_reg_no: '2025107990',
          student_name: 'AAFREEN KHAN',
          title: 'AI-Powered Diabetic Retinopathy Diagnostic Engine',
          description: 'A deep learning computer vision pipeline utilizing ResNet-50 and EfficientNet-B4 to classify high-resolution fundus images into 5 severity stages of diabetic retinopathy with 96.4% AUC accuracy.',
          repo_link: 'https://github.com/aafreen-khan/diabetic-retinopathy-ai',
          tech_stack: ['Python', 'PyTorch', 'FastAPI', 'Next.js', 'PostgreSQL', 'Docker'],
          screenshots: [
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 94.50,
          grade: 'A+',
          is_placement_eligible: true,
          incubation_status: 'Selected',
          incubation_notes: 'Exceptional clinical accuracy. Fast-tracked for SRMS Incubation Center seed grant.',
          funding_amount: 150000,
          mentor_assigned: 'Dr. Rajesh Sharma (Head of AI Research)',
          faculty_name: 'Dr. Rajesh Sharma',
          faculty_empid: 'FAC-CSE-001',
          faculty_remarks: 'Exceptional architectural rigor, clinical relevance, and complete REST API microservice integration. Recommended for patent filing & seed funding.'
        },
        {
          colg_cd: '1',
          course_cd: '1',
          branch_cd: '1',
          batch_cd: '1',
          sem_cd: '7',
          student_reg_no: '2025107666',
          student_name: 'JATIN PRATAP SINGH',
          title: 'Autonomous Smart Campus IoT Energy Optimization Grid',
          description: 'Distributed IoT sensors and edge computing nodes optimizing HVAC, solar array storage, and smart lighting across multi-tier campus blocks reducing peak energy drain by 28%.',
          repo_link: 'https://github.com/jatin-pratap/smart-campus-energy-grid',
          tech_stack: ['C++', 'MQTT', 'ESP32', 'Node.js', 'InfluxDB', 'Grafana', 'React'],
          screenshots: [
            'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 88.00,
          grade: 'A',
          is_placement_eligible: true,
          incubation_status: 'Selected',
          incubation_notes: 'Approved for pilot deployment across Engineering Block A & B.',
          funding_amount: 100000,
          mentor_assigned: 'Prof. Ashish Kumar',
          faculty_name: 'Prof. Ashish Kumar',
          faculty_empid: 'FAC-CSE-002',
          faculty_remarks: 'Working hardware prototype demonstrated live with sub-second telemetry sync. Excellent commercial potential.'
        },
        {
          colg_cd: '1',
          course_cd: '1',
          branch_cd: '2', // IT
          batch_cd: '1',
          sem_cd: '7',
          student_reg_no: '2025107888',
          student_name: 'PRIYA SHARMA',
          title: 'Blockchain-Backed MedERP Electronic Health Records Protocol',
          description: 'Zero-Knowledge Proof (ZKP) cryptographic protocol securing patient medical histories, clinical prescriptions, and cross-hospital consent workflows under HIPAA & NDHM compliance.',
          repo_link: 'https://github.com/priya-sharma/zk-ehr-blockchain',
          tech_stack: ['Solidity', 'Rust', 'Ethers.js', 'TypeScript', 'IPFS', 'Next.js'],
          screenshots: [
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 91.00,
          grade: 'A+',
          is_placement_eligible: true,
          incubation_status: 'Funded',
          incubation_notes: 'Awarded INR 2,00,000 research & development grant by Trust Incubation Board.',
          funding_amount: 200000,
          mentor_assigned: 'Dr. Ankur Rastogi',
          faculty_name: 'Dr. Ankur Rastogi',
          faculty_empid: 'FAC-IT-001',
          faculty_remarks: 'Impeccable smart contract security audit scores. Fully compliant with government digital health standards.'
        },
        {
          colg_cd: '1',
          course_cd: '1',
          branch_cd: '3', // EC
          batch_cd: '1',
          sem_cd: '7',
          student_reg_no: '2025107555',
          student_name: 'ROHAN VERMA',
          title: 'FPGA-Accelerated Real-Time Ultrasound Doppler Signal Processor',
          description: 'High-throughput hardware acceleration using Xilinx Zynq UltraScale+ FPGA for real-time blood velocity profile synthesis and cardiac vascular strain analysis.',
          repo_link: 'https://github.com/rohan-verma/fpga-ultrasound-dsp',
          tech_stack: ['Verilog', 'VHDL', 'Xilinx Vivado', 'C', 'Matlab', 'Python'],
          screenshots: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 85.50,
          grade: 'A',
          is_placement_eligible: true,
          incubation_status: 'Under Review',
          incubation_notes: 'Under committee technical evaluation for hardware lab fabrication.',
          funding_amount: 0,
          mentor_assigned: 'Prof. S. K. Singh',
          faculty_name: 'Prof. S. K. Singh',
          faculty_empid: 'FAC-EC-001',
          faculty_remarks: 'Rigorous digital signal processing pipeline tested against clinical audio Doppler benchmarks.'
        },
        {
          colg_cd: '1',
          course_cd: '2', // B.Pharm
          branch_cd: '4', // Pharm
          batch_cd: '1',
          sem_cd: '7',
          student_reg_no: '2025107444',
          student_name: 'ANANYA MISHRA',
          title: 'Molecular Docking & In-Silico Drug Repurposing for Oncology Targets',
          description: 'Virtual screening and molecular dynamics simulations of 4,000+ FDA-approved molecules against mutated KRAS-G12D oncogenic binding pockets.',
          repo_link: 'https://github.com/ananya-m/in-silico-oncology-docking',
          tech_stack: ['AutoDock Vina', 'GROMACS', 'PyMOL', 'BioPython', 'R', 'Jupyter'],
          screenshots: [
            'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 92.00,
          grade: 'A+',
          is_placement_eligible: true,
          incubation_status: 'Incubated',
          incubation_notes: 'Incubated under SRMS Center for Bio-Pharma Innovation.',
          funding_amount: 250000,
          mentor_assigned: 'Dr. Nitin Sharma (Dean, Pharmacy)',
          faculty_name: 'Dr. Nitin Sharma',
          faculty_empid: 'FAC-PHARM-001',
          faculty_remarks: 'Groundbreaking docking energy scores verified through 100ns molecular dynamics runs.'
        },
        {
          colg_cd: '1',
          course_cd: '1',
          branch_cd: '1',
          batch_cd: '2', // 2023-27
          sem_cd: '5',
          student_reg_no: '2025107333',
          student_name: 'VIKRAM CHOUDHARY',
          title: 'Decentralized Autonomous Drone Fleet for Agricultural Surveillance',
          description: 'Swarm intelligence algorithms coordinating autonomous multispectral crop health indices (NDVI) estimation and localized pesticide precision spraying.',
          repo_link: 'https://github.com/vikram-c/agro-drone-swarm',
          tech_stack: ['ROS2', 'Python', 'OpenCV', 'Gazebo', 'TensorRT', 'C++'],
          screenshots: [
            'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 82.00,
          grade: 'A',
          is_placement_eligible: true,
          incubation_status: 'Selected',
          incubation_notes: 'Selected for agri-tech demo in State Innovation Expo.',
          funding_amount: 80000,
          mentor_assigned: 'Dr. Rajesh Sharma',
          faculty_name: 'Dr. Rajesh Sharma',
          faculty_empid: 'FAC-CSE-001',
          faculty_remarks: 'Impressive obstacle avoidance and SLAM mapping in GPS-denied field trials.'
        },
        {
          colg_cd: '1',
          course_cd: '3', // MCA
          branch_cd: '1',
          batch_cd: '1',
          sem_cd: '3',
          student_reg_no: '2025107222',
          student_name: 'NEHA GUPTA',
          title: 'Automated Code Vulnerability & AST Static Analysis Framework',
          description: 'Abstract Syntax Tree (AST) analyzer scanning Next.js & NestJS codebases for SQL injections, SSRF vulnerabilities, and unvalidated tenant boundaries in real time.',
          repo_link: 'https://github.com/neha-gupta/ast-vulnerability-scanner',
          tech_stack: ['TypeScript', 'Node.js', 'Babel Parser', 'WebSockets', 'TailwindCSS'],
          screenshots: [
            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 79.50,
          grade: 'B+',
          is_placement_eligible: true,
          incubation_status: 'Under Review',
          incubation_notes: 'Review in progress for potential integration into ERP CI/CD pipeline.',
          funding_amount: 0,
          mentor_assigned: 'Prof. Ashish Kumar',
          faculty_name: 'Prof. Ashish Kumar',
          faculty_empid: 'FAC-CSE-002',
          faculty_remarks: 'Solid static analysis heuristics. Scans multi-tenant codebases with minimal false positives.'
        },
        {
          colg_cd: '1',
          course_cd: '4', // MBA
          branch_cd: '1',
          batch_cd: '1',
          sem_cd: '3',
          student_reg_no: '2025107111',
          student_name: 'AMAN TRIPATHI',
          title: 'Predictive Hospital Bed Occupancy & Supply Chain Optimization',
          description: 'Time-series ARIMA & LSTM forecasting models optimizing ICU bed allocations and surgical inventory turns for 500+ bed tertiary medical centers.',
          repo_link: 'https://github.com/aman-tripathi/hospital-supply-chain-analytics',
          tech_stack: ['Python', 'Pandas', 'Scikit-Learn', 'Streamlit', 'PostgreSQL', 'Plotly'],
          screenshots: [
            'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80'
          ],
          status: 'Reviewed',
          score: 76.00,
          grade: 'B+',
          is_placement_eligible: true,
          incubation_status: 'Under Review',
          incubation_notes: 'Under review for hospital administrative analytics integration.',
          funding_amount: 0,
          mentor_assigned: 'Dr. Ankur Rastogi',
          faculty_name: 'Dr. Ankur Rastogi',
          faculty_empid: 'FAC-IT-001',
          faculty_remarks: 'Well-structured business analytics and econometric forecasting pipeline.'
        }
      ];

      for (const p of sampleProjects) {
        const ins = await pool.query(`
          INSERT INTO "${s}".repositories (
            colg_cd, course_cd, branch_cd, batch_cd, sem_cd,
            student_reg_no, student_name, title, description, repo_link, tech_stack, screenshots,
            status, score, grade, is_placement_eligible, incubation_status, incubation_notes, funding_amount, mentor_assigned,
            submitted_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW() - INTERVAL '3 days', NOW())
          RETURNING repo_id;
        `, [
          p.colg_cd, p.course_cd, p.branch_cd, p.batch_cd, p.sem_cd,
          p.student_reg_no, p.student_name, p.title, p.description, p.repo_link, p.tech_stack, p.screenshots,
          p.status, p.score, p.grade, p.is_placement_eligible, p.incubation_status, p.incubation_notes, p.funding_amount, p.mentor_assigned
        ]);

        const repoId = ins.rows[0].repo_id;

        await pool.query(`
          INSERT INTO "${s}".repository_reviews (
            repo_id, faculty_empid, faculty_name, score, grade, remarks, reviewed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '1 day');
        `, [
          repoId, p.faculty_empid, p.faculty_name, p.score, p.grade, p.faculty_remarks
        ]);
      }
      console.log(`Successfully seeded ${sampleProjects.length} projects & reviews into "${s}"!`);
    } else {
      console.log(`Schema "${s}" already has ${count.rows[0].count} repositories.`);
    }
  }

  console.log('All tenant schemas initialized successfully!');
  await pool.end();
}

setupRepositoriesAndEvaluations().catch(console.error);
