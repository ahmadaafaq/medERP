import { queryDb } from './db';

export function resolveTenantSchema(tenantSlug?: string): string {
  let clean = (tenantSlug || '').toLowerCase().trim();
  clean = clean.replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (!clean || clean === 'all' || clean === '1' || clean === 'srms' || clean === 'srms-cet') {
    clean = 'srms-cet-bareilly';
  }
  return `tenant_${clean}`;
}

export async function ensureObeTables(schema: string): Promise<void> {
  try {
    await queryDb(`
      CREATE SCHEMA IF NOT EXISTS "${schema}";

      CREATE TABLE IF NOT EXISTS "${schema}".program_outcomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(20) DEFAULT 'PO',
        course_cd VARCHAR(50),
        course_name VARCHAR(255),
        branch_cd VARCHAR(50),
        batch_year INT,
        po_order INT DEFAULT 1,
        target_level NUMERIC(3,2) DEFAULT 2.5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE "${schema}".program_outcomes ADD COLUMN IF NOT EXISTS target_level NUMERIC(3,2) DEFAULT 2.5;
      ALTER TABLE "${schema}".program_outcomes ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);
      ALTER TABLE "${schema}".program_outcomes ADD COLUMN IF NOT EXISTS po_order INT DEFAULT 1;

      CREATE TABLE IF NOT EXISTS "${schema}".program_educational_objectives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        course_cd VARCHAR(50),
        course_name VARCHAR(255),
        branch_cd VARCHAR(50),
        batch_year INT,
        peo_order INT DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE "${schema}".program_educational_objectives ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);
      ALTER TABLE "${schema}".program_educational_objectives ADD COLUMN IF NOT EXISTS peo_order INT DEFAULT 1;

      CREATE TABLE IF NOT EXISTS "${schema}".co_po_matrices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subject_id UUID,
        subject_code VARCHAR(50),
        unit_id UUID,
        unit_code VARCHAR(50),
        po_id UUID,
        po_code VARCHAR(50) NOT NULL,
        correlation_level INT NOT NULL DEFAULT 0,
        academic_year VARCHAR(50),
        semester VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS matrix_data JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS batch_year INT;
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(50);
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS section VARCHAR(50);
      ALTER TABLE "${schema}".co_po_matrices ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255);

      CREATE TABLE IF NOT EXISTS "${schema}".po_peo_matrices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id UUID,
        po_code VARCHAR(50) NOT NULL,
        peo_id UUID,
        peo_code VARCHAR(50) NOT NULL,
        correlation_level INT NOT NULL DEFAULT 0,
        course_cd VARCHAR(50),
        branch_cd VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS matrix_data JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS batch_year INT;
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS sem_cd VARCHAR(50);
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS section VARCHAR(50);
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS po_code VARCHAR(50);
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS peo_code VARCHAR(50);
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS correlation_level INT DEFAULT 0;
      ALTER TABLE "${schema}".po_peo_matrices ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE "${schema}".co_po_matrices ALTER COLUMN subject_id TYPE VARCHAR(255) USING subject_id::varchar;
      ALTER TABLE "${schema}".co_po_matrices ALTER COLUMN po_code DROP NOT NULL;
      ALTER TABLE "${schema}".po_peo_matrices ALTER COLUMN po_code DROP NOT NULL;
      ALTER TABLE "${schema}".po_peo_matrices ALTER COLUMN peo_code DROP NOT NULL;
    `);
  } catch (err: any) {
    console.warn(`[ensureObeTables] ${schema} check note:`, err.message);
  }
}

export const BTECH_CSE_PROGRAM_OUTCOMES = [
  {
    code: 'PO1',
    title: 'Engineering Knowledge',
    description: 'Apply mathematics, natural sciences, computing fundamentals, and engineering knowledge to solve complex engineering problems.',
    type: 'PO',
    order: 1,
    target_level: 2.5,
  },
  {
    code: 'PO2',
    title: 'Problem Analysis',
    description: 'Identify, formulate, review research literature, and analyze complex engineering problems using first principles of mathematics and engineering sciences.',
    type: 'PO',
    order: 2,
    target_level: 2.5,
  },
  {
    code: 'PO3',
    title: 'Design/Development of Solutions',
    description: 'Design solutions for complex engineering problems and develop systems, components, or processes that meet specified needs.',
    type: 'PO',
    order: 3,
    target_level: 2.5,
  },
  {
    code: 'PO4',
    title: 'Conduct Investigations of Complex Problems',
    description: 'Use research-based knowledge and methods, including design of experiments, data analysis, and interpretation of results.',
    type: 'PO',
    order: 4,
    target_level: 2.5,
  },
  {
    code: 'PO5',
    title: 'Modern Tool Usage',
    description: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools, including prediction and modelling.',
    type: 'PO',
    order: 5,
    target_level: 2.5,
  },
  {
    code: 'PO6',
    title: 'The Engineer and Society',
    description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural issues.',
    type: 'PO',
    order: 6,
    target_level: 2.5,
  },
  {
    code: 'PO7',
    title: 'Environment and Sustainability',
    description: 'Understand the impact of engineering solutions in societal and environmental contexts and demonstrate knowledge of sustainable development.',
    type: 'PO',
    order: 7,
    target_level: 2.5,
  },
  {
    code: 'PO8',
    title: 'Ethics',
    description: 'Apply ethical principles and commit to professional ethics, responsibilities, and norms of engineering practice.',
    type: 'PO',
    order: 8,
    target_level: 2.5,
  },
  {
    code: 'PO9',
    title: 'Individual and Team Work',
    description: 'Function effectively as an individual and as a member or leader in diverse teams and multidisciplinary settings.',
    type: 'PO',
    order: 9,
    target_level: 2.5,
  },
  {
    code: 'PO10',
    title: 'Communication',
    description: 'Communicate effectively on complex engineering activities with the engineering community and society.',
    type: 'PO',
    order: 10,
    target_level: 2.5,
  },
  {
    code: 'PO11',
    title: 'Project Management and Finance',
    description: 'Demonstrate knowledge and understanding of engineering and management principles and apply these to manage projects and multidisciplinary environments.',
    type: 'PO',
    order: 11,
    target_level: 2.5,
  },
  {
    code: 'PO12',
    title: 'Life-long Learning',
    description: 'Recognize the need for independent and lifelong learning and demonstrate the capacity to engage in it in the broadest context of technological change.',
    type: 'PO',
    order: 12,
    target_level: 2.5,
  },
  {
    code: 'PSO1',
    title: 'Domain Specific Professional Expertise',
    description: 'Apply domain-specific engineering principles, modern technologies, and architectural paradigms to specify, design, and validate robust systems.',
    type: 'PSO',
    order: 13,
    target_level: 2.5,
  },
  {
    code: 'PSO2',
    title: 'Problem Solving & Innovation',
    description: 'Exhibit competence in solving real-world challenges through research, contemporary software/hardware tools, and sustainable innovations.',
    type: 'PSO',
    order: 14,
    target_level: 2.5,
  },
];

export const STANDARD_PEOS = [
  {
    code: 'PEO1',
    title: 'Core Technical Competence & Problem Solving',
    description: 'Graduates will establish successful professional careers in computing, software engineering, and related industries by applying fundamental mathematical, scientific, and computing principles.',
    order: 1,
  },
  {
    code: 'PEO2',
    title: 'Innovation, Research & Advanced Studies',
    description: 'Graduates will pursue higher education, research, and lifelong learning to adapt to rapidly evolving technologies and foster sustainable innovations.',
    order: 2,
  },
  {
    code: 'PEO3',
    title: 'Leadership, Teamwork & Professional Ethics',
    description: 'Graduates will demonstrate leadership qualities, multidisciplinary teamwork capabilities, and high professional ethics while addressing societal and global computing challenges.',
    order: 3,
  },
  {
    code: 'PEO4',
    title: 'Entrepreneurship & Socio-Economic Impact',
    description: 'Graduates will leverage computing tools and entrepreneurial mindsets to design socio-economically viable engineering solutions.',
    order: 4,
  },
  {
    code: 'PEO5',
    title: 'Multidisciplinary Systems & Modern Engineering',
    description: 'Graduates will architect robust, secure, and scalable solutions for multidisciplinary systems that adhere to modern industrial standards.',
    order: 5,
  },
];

export async function listProgramOutcomesDb(tenantSlug?: string, courseCd?: string, branchCd?: string) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  let sql = `
    SELECT po.*, 
           COALESCE(c.name, po.course_name) AS course_name,
           COALESCE(d.name, po.branch_cd) AS branch_name
    FROM "${schema}".program_outcomes po
    LEFT JOIN "${schema}".courses c ON c.code = po.course_cd OR c.course_cd = po.course_cd
    LEFT JOIN "${schema}".departments d ON d.code = po.branch_cd OR d.branch_cd = po.branch_cd
    WHERE 1=1
  `;
  const params: any[] = [];
  if (courseCd && courseCd !== 'all') {
    params.push(courseCd);
    sql += ` AND (po.course_cd = $${params.length} OR po.course_cd IS NULL)`;
  }
  if (branchCd && branchCd !== 'all') {
    params.push(branchCd);
    sql += ` AND (po.branch_cd = $${params.length} OR po.branch_cd IS NULL)`;
  }
  sql += ` ORDER BY po.po_order ASC, po.code ASC`;

  const rows = await queryDb(sql, params).catch(async () => {
    // Fallback without joins if courses/departments not in schema
    return await queryDb(`SELECT * FROM "${schema}".program_outcomes ORDER BY po_order ASC, code ASC`).catch(() => []);
  });

  return rows.map((r: any) => ({
    ...r,
    college_slug: schema.replace(/^tenant_/, ''),
  }));
}

export async function seedProgramOutcomesDb(tenantSlug?: string) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  let count = 0;
  for (const item of BTECH_CSE_PROGRAM_OUTCOMES) {
    const existing = await queryDb(
      `SELECT id FROM "${schema}".program_outcomes WHERE code = $1 LIMIT 1`,
      [item.code]
    );

    if (existing.length === 0) {
      await queryDb(
        `INSERT INTO "${schema}".program_outcomes (
           code, title, description, type, po_order, target_level, is_active
         ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [item.code, item.title, item.description, item.type, item.order, item.target_level]
      );
      count++;
    } else {
      await queryDb(
        `UPDATE "${schema}".program_outcomes
         SET title = $1, description = $2, type = $3, po_order = $4, target_level = $5, is_active = true, updated_at = NOW()
         WHERE id = $6`,
        [item.title, item.description, item.type, item.order, item.target_level, existing[0].id]
      );
      count++;
    }
  }

  return {
    success: true,
    message: `Successfully seeded/updated ${count} NBA Program Outcomes (PO1–PO12, PSO1–PSO2)`,
    count,
  };
}

export async function listProgramEducationalObjectivesDb(tenantSlug?: string, courseCd?: string, branchCd?: string) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  let sql = `
    SELECT peo.*, 
           COALESCE(c.name, peo.course_name) AS course_name,
           COALESCE(d.name, peo.branch_cd) AS branch_name
    FROM "${schema}".program_educational_objectives peo
    LEFT JOIN "${schema}".courses c ON c.code = peo.course_cd OR c.course_cd = peo.course_cd
    LEFT JOIN "${schema}".departments d ON d.code = peo.branch_cd OR d.branch_cd = peo.branch_cd
    WHERE 1=1
  `;
  const params: any[] = [];
  if (courseCd && courseCd !== 'all') {
    params.push(courseCd);
    sql += ` AND (peo.course_cd = $${params.length} OR peo.course_cd IS NULL)`;
  }
  if (branchCd && branchCd !== 'all') {
    params.push(branchCd);
    sql += ` AND (peo.branch_cd = $${params.length} OR peo.branch_cd IS NULL)`;
  }
  sql += ` ORDER BY peo.peo_order ASC, peo.code ASC`;

  const rows = await queryDb(sql, params).catch(async () => {
    return await queryDb(`SELECT * FROM "${schema}".program_educational_objectives ORDER BY peo_order ASC, code ASC`).catch(() => []);
  });

  return rows.map((r: any) => ({
    ...r,
    college_slug: schema.replace(/^tenant_/, ''),
  }));
}

export async function seedProgramEducationalObjectivesDb(tenantSlug?: string) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  let count = 0;
  for (const item of STANDARD_PEOS) {
    const existing = await queryDb(
      `SELECT id FROM "${schema}".program_educational_objectives WHERE code = $1 LIMIT 1`,
      [item.code]
    );

    if (existing.length === 0) {
      await queryDb(
        `INSERT INTO "${schema}".program_educational_objectives (
           code, title, description, peo_order, is_active
         ) VALUES ($1, $2, $3, $4, true)`,
        [item.code, item.title, item.description, item.order]
      );
      count++;
    } else {
      await queryDb(
        `UPDATE "${schema}".program_educational_objectives
         SET title = $1, description = $2, peo_order = $3, is_active = true, updated_at = NOW()
         WHERE id = $4`,
        [item.title, item.description, item.order, existing[0].id]
      );
      count++;
    }
  }

  return {
    success: true,
    message: `Successfully seeded/updated ${count} Program Educational Objectives (PEO1–PEO5)`,
    count,
  };
}

export async function getCoPoMatrixDb(
  tenantSlug: string,
  filters: {
    subjectId?: string;
    subjectCode?: string;
    courseCd?: string;
    branchCd?: string;
    semester?: string;
    section?: string;
    academicYear?: string;
  }
) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  let sql = `SELECT * FROM "${schema}".co_po_matrices WHERE 1=1`;
  const params: any[] = [];
  if (filters.subjectId) {
    params.push(filters.subjectId);
    sql += ` AND (subject_id = $${params.length} OR subject_code = $${params.length})`;
  } else if (filters.subjectCode) {
    params.push(filters.subjectCode);
    sql += ` AND subject_code = $${params.length}`;
  }
  if (filters.courseCd && filters.courseCd !== 'all') {
    params.push(filters.courseCd);
    sql += ` AND (course_cd = $${params.length} OR course_cd IS NULL)`;
  }
  if (filters.branchCd && filters.branchCd !== 'all') {
    params.push(filters.branchCd);
    sql += ` AND (branch_cd = $${params.length} OR branch_cd IS NULL)`;
  }
  if (filters.semester && filters.semester !== 'all') {
    params.push(filters.semester);
    sql += ` AND (sem_cd = $${params.length} OR sem_cd IS NULL)`;
  }
  if (filters.section && filters.section !== 'all') {
    params.push(filters.section);
    sql += ` AND (section = $${params.length} OR section IS NULL)`;
  }
  if (filters.academicYear && filters.academicYear !== 'all') {
    params.push(parseInt(filters.academicYear, 10));
    sql += ` AND (batch_year = $${params.length} OR batch_year IS NULL)`;
  }
  sql += ` ORDER BY updated_at DESC NULLS LAST, created_at DESC`;

  const rows = await queryDb(sql, params).catch(() => []);
  const matrix_data: Record<string, Record<string, number>> = {};
  rows.forEach((r: any) => {
    if (r.matrix_data && typeof r.matrix_data === 'object' && Object.keys(r.matrix_data).length > 0) {
      Object.entries(r.matrix_data).forEach(([key, val]: [string, any]) => {
        if (key !== 'averages' && typeof val === 'object' && val) {
          if (!matrix_data[key]) matrix_data[key] = {};
          Object.assign(matrix_data[key], val);
        }
      });
    } else if (r.unit_code && r.po_code) {
      if (!matrix_data[r.unit_code]) matrix_data[r.unit_code] = {};
      matrix_data[r.unit_code][r.po_code] = Number(r.correlation_level) || 0;
    }
  });

  return { rows, matrix_data };
}

export async function saveCoPoMatrixDb(
  tenantSlug: string,
  dto: {
    subject_id?: string;
    subject_code?: string;
    subject_name?: string;
    course_cd?: string;
    branch_cd?: string;
    semester?: string;
    sem_cd?: string;
    section?: string;
    academic_year?: string;
    batch_year?: number;
    matrix_data?: Record<string, any>;
    mappings?: Array<{
      unit_id?: string;
      unit_code: string;
      po_id?: string;
      po_code: string;
      correlation_level: number;
      notes?: string;
    }>;
  }
) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  const {
    subject_id,
    subject_code,
    subject_name,
    course_cd,
    branch_cd,
    section,
    matrix_data,
  } = dto;
  const sem = dto.sem_cd || dto.semester || null;
  const batchYr = dto.batch_year ? Number(dto.batch_year) : (dto.academic_year ? parseInt(dto.academic_year, 10) : null);

  let mappings = dto.mappings || [];
  if (mappings.length === 0 && matrix_data) {
    Object.entries(matrix_data).forEach(([unitCode, poMap]: [string, any]) => {
      if (unitCode === 'averages' || typeof poMap !== 'object' || !poMap) return;
      Object.entries(poMap).forEach(([poCode, level]: [string, any]) => {
        mappings.push({
          unit_code: unitCode,
          po_code: poCode,
          correlation_level: Number(level) || 0,
        });
      });
    });
  }

  // Also store / update in co_po_matrices as jsonb row if supported
  const existingMaster = await queryDb(
    `SELECT id FROM "${schema}".co_po_matrices
     WHERE (subject_id = $1 OR subject_code = $2)
       AND (course_cd = $3 OR ($3 IS NULL AND course_cd IS NULL) OR course_cd IS NULL)
       AND (sem_cd = $4 OR ($4 IS NULL AND sem_cd IS NULL) OR sem_cd IS NULL)
       AND (section = $5 OR ($5 IS NULL AND section IS NULL) OR section IS NULL)
     LIMIT 1`,
    [subject_id || null, subject_code || '', course_cd || null, sem, section || null]
  ).catch(() => []);

  if (existingMaster.length > 0) {
    await queryDb(
      `UPDATE "${schema}".co_po_matrices
       SET matrix_data = $1, subject_name = COALESCE($2, subject_name),
           course_cd = COALESCE($3, course_cd), branch_cd = COALESCE($4, branch_cd),
           batch_year = COALESCE($5, batch_year), sem_cd = COALESCE($6, sem_cd),
           section = COALESCE($7, section), updated_at = NOW()
       WHERE id = $8`,
      [matrix_data || {}, subject_name || null, course_cd || null, branch_cd || null, batchYr, sem, section || null, existingMaster[0].id]
    ).catch(() => {});
  } else {
    await queryDb(
      `INSERT INTO "${schema}".co_po_matrices (
         subject_id, subject_code, subject_name, course_cd, branch_cd, batch_year, sem_cd, section, po_code, matrix_data
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ALL', $9)`,
      [subject_id || null, subject_code || null, subject_name || null, course_cd || null, branch_cd || null, batchYr, sem, section || null, matrix_data || {}]
    ).catch((e) => console.error('[saveCoPoMatrixDb] Master insert error:', e));
  }

  let savedCount = 0;
  for (const m of mappings) {
    const existing = await queryDb(
      `SELECT id FROM "${schema}".co_po_matrices
       WHERE (subject_id = $1 OR subject_code = $2)
         AND unit_code = $3 AND po_code = $4
       LIMIT 1`,
      [subject_id || null, subject_code || '', m.unit_code, m.po_code]
    ).catch(() => []);

    if (existing && existing.length > 0) {
      await queryDb(
        `UPDATE "${schema}".co_po_matrices
         SET correlation_level = $1, notes = $2, course_cd = COALESCE($3, course_cd),
             branch_cd = COALESCE($4, branch_cd), batch_year = COALESCE($5, batch_year),
             sem_cd = COALESCE($6, sem_cd), section = COALESCE($7, section), updated_at = NOW()
         WHERE id = $8`,
        [Number(m.correlation_level) || 0, m.notes || null, course_cd || null, branch_cd || null, batchYr, sem, section || null, existing[0].id]
      ).catch(() => {});
    } else {
      await queryDb(
        `INSERT INTO "${schema}".co_po_matrices (
           subject_id, subject_code, subject_name, course_cd, branch_cd, batch_year, sem_cd, section, unit_code, po_code, correlation_level
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [subject_id || null, subject_code || '', subject_name || null, course_cd || null, branch_cd || null, batchYr, sem, section || null, m.unit_code, m.po_code, Number(m.correlation_level) || 0]
      ).catch((e) => console.error('[saveCoPoMatrixDb] Row insert error:', e));
    }
    savedCount++;
  }

  return { success: true, message: `Saved ${savedCount} CO-PO matrix correlations`, count: savedCount };
}

export async function getPoPeoMatrixDb(
  tenantSlug: string,
  filters: {
    courseCd?: string;
    branchCd?: string;
    semCd?: string;
    section?: string;
    batchYear?: string;
  }
) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  let sql = `SELECT * FROM "${schema}".po_peo_matrices WHERE 1=1`;
  const params: any[] = [];
  if (filters.courseCd && filters.courseCd !== 'all') {
    params.push(filters.courseCd);
    sql += ` AND (course_cd = $${params.length} OR course_cd IS NULL)`;
  }
  if (filters.branchCd && filters.branchCd !== 'all') {
    params.push(filters.branchCd);
    sql += ` AND (branch_cd = $${params.length} OR branch_cd IS NULL)`;
  }
  if (filters.semCd && filters.semCd !== 'all') {
    params.push(filters.semCd);
    sql += ` AND (sem_cd = $${params.length} OR sem_cd IS NULL)`;
  }
  if (filters.section && filters.section !== 'all') {
    params.push(filters.section);
    sql += ` AND (section = $${params.length} OR section IS NULL)`;
  }
  if (filters.batchYear && filters.batchYear !== 'all') {
    params.push(parseInt(filters.batchYear, 10));
    sql += ` AND (batch_year = $${params.length} OR batch_year IS NULL)`;
  }
  sql += ` ORDER BY updated_at DESC NULLS LAST, created_at DESC`;

  const rows = await queryDb(sql, params).catch(() => []);
  const matrix_data: Record<string, Record<string, number>> = {};
  rows.forEach((r: any) => {
    if (r.matrix_data && typeof r.matrix_data === 'object' && Object.keys(r.matrix_data).length > 0) {
      Object.entries(r.matrix_data).forEach(([key, val]: [string, any]) => {
        if (key !== 'averages' && typeof val === 'object' && val) {
          if (!matrix_data[key]) matrix_data[key] = {};
          Object.assign(matrix_data[key], val);
        }
      });
    } else if (r.po_code && r.peo_code) {
      if (!matrix_data[r.po_code]) matrix_data[r.po_code] = {};
      matrix_data[r.po_code][r.peo_code] = Number(r.correlation_level) || 0;
    }
  });

  return { rows, matrix_data };
}

export async function savePoPeoMatrixDb(
  tenantSlug: string,
  dto: {
    course_cd?: string;
    branch_cd?: string;
    sem_cd?: string;
    section?: string;
    batch_year?: number;
    matrix_data?: Record<string, any>;
    mappings?: Array<{
      po_id?: string;
      po_code: string;
      peo_id?: string;
      peo_code: string;
      correlation_level: number;
      notes?: string;
    }>;
  }
) {
  const schema = resolveTenantSchema(tenantSlug);
  await ensureObeTables(schema);

  const { course_cd, branch_cd, sem_cd, section, batch_year, matrix_data } = dto;
  let mappings = dto.mappings || [];
  if (mappings.length === 0 && matrix_data) {
    Object.entries(matrix_data).forEach(([poCode, peoMap]: [string, any]) => {
      if (poCode === 'averages' || typeof peoMap !== 'object' || !peoMap) return;
      Object.entries(peoMap).forEach(([peoCode, level]: [string, any]) => {
        mappings.push({
          po_code: poCode,
          peo_code: peoCode,
          correlation_level: Number(level) || 0,
        });
      });
    });
  }

  // Also store / update in po_peo_matrices as jsonb row
  const existingMaster = await queryDb(
    `SELECT id FROM "${schema}".po_peo_matrices
     WHERE (course_cd = $1 OR ($1 IS NULL AND course_cd IS NULL))
       AND (branch_cd = $2 OR ($2 IS NULL AND branch_cd IS NULL))
       AND (sem_cd = $3 OR ($3 IS NULL AND sem_cd IS NULL) OR sem_cd IS NULL)
       AND (section = $4 OR ($4 IS NULL AND section IS NULL) OR section IS NULL)
     LIMIT 1`,
    [course_cd || null, branch_cd || null, sem_cd || null, section || null]
  ).catch(() => []);

  if (existingMaster.length > 0) {
    await queryDb(
      `UPDATE "${schema}".po_peo_matrices
       SET matrix_data = $1, batch_year = COALESCE($2, batch_year),
           sem_cd = COALESCE($3, sem_cd), section = COALESCE($4, section), updated_at = NOW()
       WHERE id = $5`,
      [matrix_data || {}, batch_year || null, sem_cd || null, section || null, existingMaster[0].id]
    ).catch(() => {});
  } else {
    await queryDb(
      `INSERT INTO "${schema}".po_peo_matrices (
         course_cd, branch_cd, batch_year, sem_cd, section, po_code, peo_code, matrix_data
       ) VALUES ($1, $2, $3, $4, $5, 'ALL', 'ALL', $6)`,
      [course_cd || null, branch_cd || null, batch_year || null, sem_cd || null, section || null, matrix_data || {}]
    ).catch((e) => console.error('[savePoPeoMatrixDb] Master insert error:', e));
  }

  let savedCount = 0;
  for (const m of mappings) {
    const existing = await queryDb(
      `SELECT id FROM "${schema}".po_peo_matrices
       WHERE po_code = $1 AND peo_code = $2
         AND (course_cd = $3 OR (course_cd IS NULL AND $3 IS NULL))
       LIMIT 1`,
      [m.po_code, m.peo_code, course_cd || null]
    ).catch(() => []);

    if (existing && existing.length > 0) {
      await queryDb(
        `UPDATE "${schema}".po_peo_matrices
         SET correlation_level = $1, notes = $2, batch_year = COALESCE($3, batch_year),
             sem_cd = COALESCE($4, sem_cd), section = COALESCE($5, section), updated_at = NOW()
         WHERE id = $6`,
        [Number(m.correlation_level) || 0, m.notes || null, batch_year || null, sem_cd || null, section || null, existing[0].id]
      ).catch(() => {});
    } else {
      await queryDb(
        `INSERT INTO "${schema}".po_peo_matrices (
           course_cd, branch_cd, batch_year, sem_cd, section, po_code, peo_code, correlation_level
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [course_cd || null, branch_cd || null, batch_year || null, sem_cd || null, section || null, m.po_code, m.peo_code, Number(m.correlation_level) || 0]
      ).catch((e) => console.error('[savePoPeoMatrixDb] Row insert error:', e));
    }
    savedCount++;
  }

  return { success: true, message: `Saved ${savedCount} PO-PEO matrix correlations`, count: savedCount };
}
