const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'unicampus',
  password: 'unicampus_secret',
  database: 'unicampus_erp'
});

async function migrateAllLogbookSchemas() {
  const schemasRes = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`);
  const schemas = schemasRes.rows.map(r => r.schema_name);

  console.log(`Found ${schemas.length} tenant schemas to initialize Logbook...`);

  for (const schema of schemas) {
    try {
      // 1. logbook_categories
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".logbook_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(50),
          name VARCHAR(255) NOT NULL,
          course_id VARCHAR(50),
          department_id VARCHAR(50),
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 2. logbook_topics
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".logbook_topics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category_id UUID REFERENCES "${schema}".logbook_categories(id) ON DELETE SET NULL,
          faculty_id UUID,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          submission_deadline TIMESTAMPTZ,
          max_marks NUMERIC DEFAULT 100,
          course_id VARCHAR(50),
          branch_id VARCHAR(50),
          batch_id VARCHAR(50),
          semester_id VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 3. logbook_submissions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".logbook_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          topic_id UUID REFERENCES "${schema}".logbook_topics(id) ON DELETE CASCADE,
          student_id UUID,
          file_url TEXT,
          file_name VARCHAR(255),
          file_size VARCHAR(50),
          explanation_text TEXT,
          submitted_at TIMESTAMPTZ DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'SUBMITTED',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 4. logbook_evaluations
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".logbook_evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          submission_id UUID REFERENCES "${schema}".logbook_submissions(id) ON DELETE CASCADE,
          faculty_id UUID,
          marks_obtained NUMERIC NOT NULL,
          remarks TEXT,
          evaluated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 5. logbook_notifications
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".logbook_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          type VARCHAR(50),
          title VARCHAR(255),
          message TEXT,
          related_entity_id VARCHAR(100),
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // 6. Seed categories based on tenant type
      const isMed = schema.includes('ims') || schema.includes('med') || schema.includes('aiims') || schema.includes('rmch') || schema.includes('rmri') || schema.includes('kmc');
      const categories = isMed ? [
        { code: 'CENTRAL_SEMINAR', name: 'Central Seminar', description: 'Institutional and interdepartmental academic seminar' },
        { code: 'JOURNAL_CLUB', name: 'Journal Club', description: 'Critical appraisal of peer-reviewed clinical literature' },
        { code: 'PG_SEMINAR', name: 'PG Academic Seminar', description: 'Postgraduate specialized subject seminar & symposium' },
        { code: 'UG_ACADEMIC', name: 'UG Academic Presentation', description: 'Undergraduate clinical subject tutorial & presentations' },
        { code: 'CLINICAL_POSTING', name: 'Clinical Ward Posting', description: 'Bedside case analysis, procedure observation & history taking' },
        { code: 'PRACTICAL_SKILLS', name: 'Practical & Lab Skills', description: 'Laboratory work, procedural demonstrations & OSCE assessments' },
      ] : [
        { code: 'SEMINAR', name: 'Academic Seminar', description: 'Departmental seminar presentations and technical talks' },
        { code: 'TUTORIAL', name: 'Subject Tutorial', description: 'Guided problem solving and curriculum unit tutorials' },
        { code: 'ASSIGNMENT', name: 'Theory Assignment', description: 'Coursework assignments, analysis and conceptual problems' },
        { code: 'PRACTICAL', name: 'Laboratory Practical', description: 'Hands-on programming, engineering labs and experimental records' },
        { code: 'PROJECT_WORK', name: 'Mini & Capstone Project', description: 'Software design, research reports and capstone submissions' },
        { code: 'INDUSTRIAL_VISIT', name: 'Industrial Training / Case Study', description: 'Industrial training report and field-case analysis' },
      ];

      for (const cat of categories) {
        const existing = await pool.query(`SELECT id FROM "${schema}".logbook_categories WHERE code = $1`, [cat.code]);
        if (existing.rows.length === 0) {
          await pool.query(`
            INSERT INTO "${schema}".logbook_categories (code, name, description, is_active)
            VALUES ($1, $2, $3, true);
          `, [cat.code, cat.name, cat.description]);
        }
      }

      console.log(`✅ ${schema} migrated successfully (${isMed ? 'MED' : 'NONMED'})`);
    } catch (e) {
      console.error(`❌ Error migrating ${schema}:`, e.message);
    }
  }

  await pool.end();
}

migrateAllLogbookSchemas().catch(console.error);
