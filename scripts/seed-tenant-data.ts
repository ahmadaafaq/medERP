import { Client } from 'pg';

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
        ('General Medicine Department', 'MED', 'UG'),
        ('Anatomy Department', 'ANAT', 'UG'),
        ('Physiology Department', 'PHYS', 'UG')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, code;
    `);
    const pathDeptId = deptRes.rows.find((r: any) => r.code === 'PATH')?.id;
    const pedDeptId = deptRes.rows.find((r: any) => r.code === 'PED')?.id;
    const anatDeptId = deptRes.rows.find((r: any) => r.code === 'ANAT')?.id;
    const physDeptId = deptRes.rows.find((r: any) => r.code === 'PHYS')?.id;

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
        INSERT INTO students (user_id, rollno, registration_no, name, batch_cd, course_cd, department_id, batch_id, admission_year, phone)
        VALUES ($1, 'MBBS2023045', '2023MBBS045', 'Rahul Verma', '2023-MBBS', 'MBBS', $2, $3, 2023, '+91-9876543210')
        ON CONFLICT (rollno) DO UPDATE SET registration_no = '2023MBBS045';
      `, [studUserId, pathDeptId, batchId]);
    }

    // 5. Subjects
    const subjRes = await client.query(`
      INSERT INTO subjects (code, name, department_id, batch_id, credits, type)
      VALUES 
        ('PATH301', 'Systemic Pathology & Microbiology', $1, $2, 4, 'THEORY'),
        ('SURG302', 'General Surgery & Skills Lab', $1, $2, 4, 'PRACTICAL'),
        ('PED303', 'Pediatrics & Neonatal Care', $1, $2, 3, 'THEORY'),
        ('MED304', 'General Medicine & Clinical Rotation', $1, $2, 5, 'CLINICAL'),
        ('ANAT101', 'Human Anatomy & Histology', $3, $2, 6, 'THEORY'),
        ('PHYS101', 'Human Physiology & Biophysics', $4, $2, 6, 'THEORY')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, code;
    `, [pathDeptId, batchId, anatDeptId, physDeptId]);

    const pathSubjId = subjRes.rows.find((r: any) => r.code === 'PATH301')?.id;
    const anatSubjId = subjRes.rows.find((r: any) => r.code === 'ANAT101')?.id;
    const physSubjId = subjRes.rows.find((r: any) => r.code === 'PHYS101')?.id;

    // 6. Topics Master
    await client.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        hours INT DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const topicsData = [
      { code: 'TOP-AN-01', name: 'General Anatomy & Histology', subjId: anatSubjId },
      { code: 'TOP-AN-02', name: 'Upper Limb & Brachial Plexus', subjId: anatSubjId },
      { code: 'TOP-AN-03', name: 'Thorax & Heart Development', subjId: anatSubjId },
      { code: 'TOP-AN-04', name: 'Neuroanatomy & Brainstem', subjId: anatSubjId },
      { code: 'TOP-PY-01', name: 'General Physiology & Cell Membrane', subjId: physSubjId },
      { code: 'TOP-PY-02', name: 'Nerve-Muscle Physiology', subjId: physSubjId },
      { code: 'TOP-PY-03', name: 'Blood & Hematology', subjId: physSubjId },
      { code: 'TOP-PY-04', name: 'Cardiovascular System & Cardiac Cycle', subjId: physSubjId },
      { code: 'TOP-PY-05', name: 'Respiratory Physiology', subjId: physSubjId },
    ];

    for (const t of topicsData) {
      await client.query(`
        INSERT INTO topics (subject_id, code, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
      `, [t.subjId, t.code, t.name]);
    }

    // 7. Competencies Master
    await client.query(`
      CREATE TABLE IF NOT EXISTS competencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        domain VARCHAR(50) DEFAULT 'KNOWS',
        level VARCHAR(50) DEFAULT 'K',
        is_core BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const competenciesData = [
      { code: 'AN-1.1', desc: 'Cellular junctions & gap junction nexus in cardiac & smooth muscles' },
      { code: 'AN-1.2', desc: 'Elastic cartilage distribution in epiglottis & pinna' },
      { code: 'AN-2.1', desc: 'Axillary nerve vulnerability in surgical neck humerus fractures' },
      { code: 'AN-2.2', desc: 'Erb-Duchenne palsy C5-C6 upper trunk brachial plexus lesion' },
      { code: 'AN-10.1', desc: 'Supraspinatus muscle initiation of 0-15 degrees shoulder abduction' },
      { code: 'AN-28.1', desc: 'Sinus venosus cardiac embryology & smooth right atrium' },
      { code: 'AN-28.2', desc: 'Right coronary artery supply to SA and AV conduction nodes' },
      { code: 'AN-62.1', desc: 'Oculomotor CN III nerve emergence from midbrain interpeduncular fossa' },
      { code: 'AN-62.2', desc: 'Facial CN VII LMN lesion & ipsilateral upper/lower facial paralysis' },
      { code: 'AN-4.1', desc: 'Transitional urothelium lining urinary bladder & ureters' },
      { code: 'PY-1.1', desc: 'Secondary active transport of glucose & Na+/K+-ATPase gradient' },
      { code: 'PY-1.2', desc: 'Resting membrane potential -70mV & potassium K+ leak permeability' },
      { code: 'PY-2.1', desc: 'Troponin C binding to Ca2+ in skeletal muscle contraction' },
      { code: 'PY-2.2', desc: 'Calmodulin-Ca2+ complex activation of MLCK in smooth muscle' },
      { code: 'PY-3.1', desc: 'Erythropoietin EPO renal peritubular cell synthesis' },
      { code: 'PY-3.2', desc: 'Factor III tissue factor extrinsic clotting cascade initiation' },
      { code: 'PY-4.1', desc: 'Isovolumetric contraction phase & closed AV/semilunar valves' },
      { code: 'PY-4.2', desc: 'First heart sound S1 closure of mitral & tricuspid valves' },
      { code: 'PY-5.1', desc: 'Dipalmitoylphosphatidylcholine DPPC surfactant atelectasis prevention' },
      { code: 'PY-5.2', desc: 'Central chemoreceptor response to CSF H+ ions & arterial PaCO2' },
    ];

    for (const c of competenciesData) {
      await client.query(`
        INSERT INTO competencies (code, description)
        VALUES ($1, $2)
        ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;
      `, [c.code, c.desc]);
    }

    // 8. 20 CBME MCQs for Professional 1 (Anatomy & Physiology) in Question Bank
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id UUID,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
        professional_phase VARCHAR(100),
        topic VARCHAR(250),
        mode VARCHAR(20) NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT,
        option_b TEXT,
        option_c TEXT,
        option_d TEXT,
        correct_option VARCHAR(20),
        difficulty_level VARCHAR(20) DEFAULT 'Medium',
        competency_code VARCHAR(100),
        has_sub_questions BOOLEAN DEFAULT false,
        sub_questions JSONB DEFAULT '[]'::jsonb,
        max_marks NUMERIC(5,2) DEFAULT 1.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const mcqsData = [
      // ── ANATOMY MCQS (1-10) ──
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'General Anatomy & Histology',
        code: 'AN-1.1',
        q: 'Which of the following cellular junctions is primarily responsible for electrical coupling in cardiac muscle cells?',
        a: 'Desmosome (Macula adherens)',
        b: 'Gap junction (Nexus)',
        c: 'Tight junction (Zonula occludens)',
        d: 'Hemidesmosome',
        correct: 'option_b',
        diff: 'Easy',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'General Anatomy & Histology',
        code: 'AN-1.2',
        q: 'Elastic cartilage is specifically present in which of the following anatomical structures?',
        a: 'Articular cartilage of knee joint',
        b: 'Epiglottis and auricle of pinna',
        c: 'Intervertebral discs',
        d: 'Tracheal rings',
        correct: 'option_b',
        diff: 'Medium',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Upper Limb & Brachial Plexus',
        code: 'AN-2.1',
        q: 'A 25-year-old male suffers a fracture of the surgical neck of the humerus. Which nerve is most susceptible to injury in this location?',
        a: 'Radial nerve',
        b: 'Axillary nerve',
        c: 'Median nerve',
        d: 'Musculocutaneous nerve',
        correct: 'option_b',
        diff: 'Medium',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Upper Limb & Brachial Plexus',
        code: 'AN-2.2',
        q: 'Erb-Duchenne palsy involves injury to which root levels of the brachial plexus?',
        a: 'C5 and C6 roots',
        b: 'C8 and T1 roots',
        c: 'C7 root only',
        d: 'C6 and C7 roots',
        correct: 'option_a',
        diff: 'Easy',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Upper Limb & Brachial Plexus',
        code: 'AN-10.1',
        q: 'Which muscle initiates the first 15 degrees of abduction at the glenohumeral joint?',
        a: 'Deltoid',
        b: 'Supraspinatus',
        c: 'Infraspinatus',
        d: 'Subscapularis',
        correct: 'option_b',
        diff: 'Medium',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Thorax & Heart Development',
        code: 'AN-28.1',
        q: 'The sinus venosus of the embryonic heart develops into which part of the adult human heart?',
        a: 'Smooth posterior wall of right atrium (sinus venarum)',
        b: 'Trabeculated anterior part of right atrium',
        c: 'Smooth upper outflow portion of right ventricle (conus arteriosus)',
        d: 'Left ventricle infundibulum',
        correct: 'option_a',
        diff: 'Hard',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Thorax & Heart Development',
        code: 'AN-28.2',
        q: 'The right coronary artery typically supplies which node of the cardiac conduction system in 85% of individuals?',
        a: 'Sinoatrial (SA) node and AV node',
        b: 'Purkinje fibers only',
        c: 'Left bundle branch only',
        d: 'Anterior papillary muscle of left ventricle',
        correct: 'option_a',
        diff: 'Medium',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Neuroanatomy & Brainstem',
        code: 'AN-62.1',
        q: 'Cranial nerve III (Oculomotor nerve) emerges from the brainstem through which anatomical landmark?',
        a: 'Interpeduncular fossa of midbrain',
        b: 'Pontomedullary junction',
        c: 'Posterior surface of midbrain below inferior colliculus',
        d: 'Pre-olivary sulcus of medulla',
        correct: 'option_a',
        diff: 'Hard',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Neuroanatomy & Brainstem',
        code: 'AN-62.2',
        q: 'A lower motor neuron (LMN) lesion of the facial nerve (CN VII) leads to paralysis of which facial muscles?',
        a: 'Muscles of both upper and lower quadrants of the ipsilateral face',
        b: 'Muscles of lower quadrant of contralateral face only',
        c: 'Forehead muscles only',
        d: 'Extraocular muscles',
        correct: 'option_a',
        diff: 'Hard',
      },
      {
        deptId: anatDeptId,
        subjId: anatSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'General Anatomy & Histology',
        code: 'AN-4.1',
        q: 'Which type of epithelium lines the lumen of the urinary bladder and ureters?',
        a: 'Simple columnar epithelium',
        b: 'Transitional epithelium (Urothelium)',
        c: 'Stratified squamous non-keratinized epithelium',
        d: 'Pseudostratified ciliated columnar epithelium',
        correct: 'option_b',
        diff: 'Easy',
      },

      // ── PHYSIOLOGY MCQS (11-20) ──
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'General Physiology & Cell Membrane',
        code: 'PY-1.1',
        q: 'Secondary active transport of glucose across the luminal membrane of renal proximal tubule cells relies on which primary electrochemical gradient?',
        a: 'Sodium (Na+) ion gradient maintained by Na+/K+-ATPase',
        b: 'Potassium (K+) ion inward gradient',
        c: 'Calcium (Ca2+) ATP pump',
        d: 'Hydrogen (H+) gradient',
        correct: 'option_a',
        diff: 'Medium',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'General Physiology & Cell Membrane',
        code: 'PY-1.2',
        q: 'Resting membrane potential of a nerve axon (typically -70 mV) is predominantly determined by membrane permeability to which ion?',
        a: 'Potassium (K+) ions via leak channels',
        b: 'Sodium (Na+) ions via voltage-gated channels',
        c: 'Chloride (Cl-) ions',
        d: 'Calcium (Ca2+) ions',
        correct: 'option_a',
        diff: 'Easy',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Nerve-Muscle Physiology',
        code: 'PY-2.1',
        q: 'In skeletal muscle excitation-contraction coupling, calcium ions bind directly to which regulatory protein to uncover actin-binding sites?',
        a: 'Troponin C',
        b: 'Tropomyosin',
        c: 'Myosin light chain',
        d: 'Titin',
        correct: 'option_a',
        diff: 'Easy',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Nerve-Muscle Physiology',
        code: 'PY-2.2',
        q: 'In smooth muscle contraction, calcium ions form a complex with which cytosolic protein to activate Myosin Light Chain Kinase (MLCK)?',
        a: 'Calmodulin',
        b: 'Troponin I',
        c: 'Calsequestrin',
        d: 'Parvalbumin',
        correct: 'option_a',
        diff: 'Medium',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Blood & Hematology',
        code: 'PY-3.1',
        q: 'Erythropoietin (EPO), the primary hormone stimulating red blood cell production, is synthesized predominantly by which cells?',
        a: 'Interstitial peritubular cells of the kidney (85-90%)',
        b: 'Hepatocytes of the liver',
        c: 'Bone marrow stromal cells',
        d: 'Splenic macrophages',
        correct: 'option_a',
        diff: 'Easy',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Blood & Hematology',
        code: 'PY-3.2',
        q: 'Which clotting factor initiates the extrinsic pathway of blood coagulation following vascular injury?',
        a: 'Factor III (Tissue Factor / Thromboplastin)',
        b: 'Factor XII (Hageman factor)',
        c: 'Factor VIII (Antihemophilic factor)',
        d: 'Factor IX (Christmas factor)',
        correct: 'option_a',
        diff: 'Medium',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Cardiovascular System & Cardiac Cycle',
        code: 'PY-4.1',
        q: 'During which phase of the cardiac cycle do all four cardiac valves remain closed while ventricular pressure rises rapidly?',
        a: 'Isovolumetric contraction phase',
        b: 'Isovolumetric relaxation phase',
        c: 'Rapid ejection phase',
        d: 'Reduced filling phase',
        correct: 'option_a',
        diff: 'Easy',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Cardiovascular System & Cardiac Cycle',
        code: 'PY-4.2',
        q: 'The first heart sound (S1) is primarily produced by the closure of which cardiac valves?',
        a: 'Atrioventricular (Mitral and Tricuspid) valves',
        b: 'Aortic and Pulmonic semilunar valves',
        c: 'Aortic valve only',
        d: 'Eustachian valve',
        correct: 'option_a',
        diff: 'Easy',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Respiratory Physiology',
        code: 'PY-5.1',
        q: 'Pulmonary surfactant reduces alveolar surface tension and prevents end-expiratory atelectasis. What is its main phospholipid component?',
        a: 'Dipalmitoylphosphatidylcholine (DPPC)',
        b: 'Sphingomyelin',
        c: 'Phosphatidylglycerol',
        d: 'Cephalin',
        correct: 'option_a',
        diff: 'Medium',
      },
      {
        deptId: physDeptId,
        subjId: physSubjId,
        phase: 'Phase 1 (1st Professional MBBS)',
        topic: 'Respiratory Physiology',
        code: 'PY-5.2',
        q: 'Central chemoreceptors located on the ventrolateral medulla respond primarily to changes in the concentration of which species in cerebrospinal fluid (CSF)?',
        a: 'Hydrogen ions (H+) derived from arterial PaCO2',
        b: 'Arterial PaO2 directly',
        c: 'Bicarbonate (HCO3-) ions',
        d: 'Sodium (Na+) ions',
        correct: 'option_a',
        diff: 'Hard',
      },
    ];

    for (const m of mcqsData) {
      await client.query(`
        INSERT INTO question_bank (
          department_id, subject_id, professional_phase, topic, mode,
          question_text, option_a, option_b, option_c, option_d, correct_option,
          difficulty_level, competency_code, max_marks
        )
        VALUES ($1, $2, $3, $4, 'MCQ', $5, $6, $7, $8, $9, $10, $11, $12, 1.0)
        ON CONFLICT DO NOTHING;
      `, [m.deptId, m.subjId, m.phase, m.topic, m.q, m.a, m.b, m.c, m.d, m.correct, m.diff, m.code]);
    }

    console.log('✅ Successfully seeded 20 Professional 1 Anatomy & Physiology CBME MCQs into PostgreSQL tenant_srms-ims!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seedData();
