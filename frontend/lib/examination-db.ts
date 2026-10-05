import { getDbPool } from './db';

function resolveSchema(slug: string): string {
  const clean = (slug || 'srms-cet-bareilly').trim();
  return `tenant_${clean}`;
}

const isUUID = (str?: string | null): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export async function getExamPapersFromDb(tenantSlug: string, filters?: {
  status?: string;
  departmentId?: string;
  colgCd?: string;
  courseCd?: string;
  branchCd?: string;
  batchCd?: string;
  semester?: string;
  section?: string;
}) {
  const pool = getDbPool();
  const schema = resolveSchema(tenantSlug);

  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.status && filters.status !== 'ALL') {
    if (filters.status === 'PENDING_HOD_APPROVAL') {
      conditions.push(`p.status IN ('PENDING_HOD_APPROVAL', 'CHANGES_REQUESTED', 'RESUBMITTED')`);
    } else {
      params.push(filters.status);
      conditions.push(`p.status = $${params.length}`);
    }
  }

  if (filters?.departmentId && isUUID(filters.departmentId)) {
    params.push(filters.departmentId);
    conditions.push(`p.department_id::text = $${params.length}`);
  }
  if (filters?.colgCd) {
    params.push(filters.colgCd);
    conditions.push(`p.colg_cd = $${params.length}`);
  }
  if (filters?.courseCd) {
    params.push(filters.courseCd);
    conditions.push(`p.course_cd = $${params.length}`);
  }
  if (filters?.branchCd) {
    params.push(filters.branchCd);
    conditions.push(`p.branch_cd = $${params.length}`);
  }
  if (filters?.batchCd) {
    params.push(filters.batchCd);
    conditions.push(`p.batch_cd = $${params.length}`);
  }
  if (filters?.semester) {
    params.push(filters.semester);
    conditions.push(`p.semester = $${params.length}`);
  }
  if (filters?.section) {
    params.push(filters.section);
    conditions.push(`p.section = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const res = await pool.query(
      `SELECT p.*,
              c.name as course_name,
              s.name as subject_name,
              s.code as subject_code,
              s.course_cd as subject_course_cd,
              s.semester as subject_semester,
              b.code as batch_code,
              d.name as department_name,
              p.sections
       FROM "${schema}".examination_papers p
       LEFT JOIN "${schema}".courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
       LEFT JOIN "${schema}".subjects s ON p.subject_id::text = s.id::text
       LEFT JOIN "${schema}".batches b ON p.batch_id::text = b.id::text
       LEFT JOIN "${schema}".departments d ON p.department_id::text = d.id::text
       ${whereClause}
       ORDER BY COALESCE(p.updated_at, p.created_at, '1970-01-01'::timestamptz) DESC, p.id DESC`,
      params
    );
    return res.rows;
  } catch (err: any) {
    console.error('getExamPapersFromDb error:', err.message);
    return [];
  }
}

export async function saveExamPaperToDb(tenantSlug: string, dto: any, user?: any) {
  const pool = getDbPool();
  const schema = resolveSchema(tenantSlug);

  const sectionsJson = JSON.stringify(dto.sections || []);
  const validDeptId = dto.departmentId && isUUID(dto.departmentId) ? dto.departmentId : null;
  const validSubjectId = dto.subjectId && isUUID(dto.subjectId) ? dto.subjectId : null;
  const validBatchId = dto.batchId && isUUID(dto.batchId) ? dto.batchId : null;
  const validUserId = user?.id && isUUID(user.id) ? user.id : null;
  const validId = dto.id && isUUID(dto.id) ? dto.id : null;

  try {
    const existing = await pool.query(
      `SELECT id, status, version FROM "${schema}".examination_papers 
       WHERE ($1::uuid IS NOT NULL AND id = $1::uuid) OR code = $2 LIMIT 1`,
      [validId, dto.code]
    );

    if (existing.rows && existing.rows.length > 0) {
      const targetId = existing.rows[0].id;
      const prevStatus = existing.rows[0].status;
      const currentVersion = Number(existing.rows[0].version || 1);

      let nextStatus = dto.status || prevStatus || 'DRAFT';
      let nextVersion = dto.version ? Number(dto.version) : currentVersion;
      if (prevStatus === 'CHANGES_REQUESTED' && dto.status === 'PENDING_HOD_APPROVAL') {
        nextVersion = currentVersion + 1;
      }

      const res = await pool.query(
        `UPDATE "${schema}".examination_papers
         SET code = $1, name = $2, subject_id = $3, batch_id = $4, exam_date = $5,
             max_marks = $6, passing_marks = $7, type = $8, duration_minutes = $9,
             sections = $10::jsonb, status = $11, department_id = $12, colg_cd = $13,
             course_cd = $14, branch_cd = $15, batch_cd = $16, semester = $17, section = $18,
             academic_year = $19, version = $20, hod_remarks = COALESCE($21, hod_remarks),
             question_remarks = COALESCE($22::jsonb, question_remarks), updated_at = NOW()
         WHERE id = $23 RETURNING *`,
        [
          dto.code,
          dto.name,
          validSubjectId,
          validBatchId,
          dto.examDate || null,
          Number(dto.maxMarks) || 0,
          Number(dto.passingMarks) || 0,
          dto.type || 'THEORY',
          Number(dto.durationMinutes) || 60,
          sectionsJson,
          nextStatus,
          validDeptId,
          dto.colgCd || null,
          dto.courseCd || null,
          dto.branchCd || null,
          dto.batchCd || null,
          dto.semester || null,
          dto.section || null,
          dto.academicYear || null,
          nextVersion,
          dto.hodRemarks || null,
          dto.questionRemarks ? JSON.stringify(dto.questionRemarks) : null,
          targetId,
        ]
      );
      return res.rows[0];
    }

    const initialStatus = dto.status || 'DRAFT';
    const initialVersion = dto.version ? Number(dto.version) : 1;
    const qRemarksJson = JSON.stringify(dto.questionRemarks || {});

    if (validId) {
      const res = await pool.query(
        `INSERT INTO "${schema}".examination_papers (
          id, code, name, subject_id, batch_id, exam_date, max_marks, passing_marks,
          type, duration_minutes, sections, status, department_id, colg_cd, course_cd,
          branch_cd, batch_cd, semester, section, academic_year, version, hod_remarks,
          question_remarks, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23::jsonb, $24, NOW(), NOW()) RETURNING *`,
        [
          validId,
          dto.code,
          dto.name,
          validSubjectId,
          validBatchId,
          dto.examDate || null,
          Number(dto.maxMarks) || 0,
          Number(dto.passingMarks) || 0,
          dto.type || 'THEORY',
          Number(dto.durationMinutes) || 60,
          sectionsJson,
          initialStatus,
          validDeptId,
          dto.colgCd || null,
          dto.courseCd || null,
          dto.branchCd || null,
          dto.batchCd || null,
          dto.semester || null,
          dto.section || null,
          dto.academicYear || null,
          initialVersion,
          dto.hodRemarks || null,
          qRemarksJson,
          validUserId,
        ]
      );
      return res.rows[0];
    }

    const res = await pool.query(
      `INSERT INTO "${schema}".examination_papers (
        code, name, subject_id, batch_id, exam_date, max_marks, passing_marks,
        type, duration_minutes, sections, status, department_id, colg_cd, course_cd,
        branch_cd, batch_cd, semester, section, academic_year, version, hod_remarks,
        question_remarks, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, NOW(), NOW()) RETURNING *`,
      [
        dto.code,
        dto.name,
        validSubjectId,
        validBatchId,
        dto.examDate || null,
        Number(dto.maxMarks) || 0,
        Number(dto.passingMarks) || 0,
        dto.type || 'THEORY',
        Number(dto.durationMinutes) || 60,
        sectionsJson,
        initialStatus,
        validDeptId,
        dto.colgCd || null,
        dto.courseCd || null,
        dto.branchCd || null,
        dto.batchCd || null,
        dto.semester || null,
        dto.section || null,
        dto.academicYear || null,
        initialVersion,
        dto.hodRemarks || null,
        qRemarksJson,
        validUserId,
      ]
    );
    return res.rows[0];
  } catch (err: any) {
    console.error('saveExamPaperToDb error:', err.message);
    throw err;
  }
}

export async function hodPaperActionInDb(tenantSlug: string, dto: {
  paperId: string;
  action: 'approve' | 'reject' | 'changes_requested';
  version?: number;
  remarks?: string;
  questionRemarks?: any;
}) {
  const pool = getDbPool();
  const schema = resolveSchema(tenantSlug);

  const existing = await pool.query(
    `SELECT * FROM "${schema}".examination_papers WHERE id::text = $1 LIMIT 1`,
    [dto.paperId]
  );
  if (!existing.rows || existing.rows.length === 0) {
    return { success: false, message: 'Question paper not found' };
  }
  const paper = existing.rows[0];

  if (dto.action === 'approve') {
    const res = await pool.query(
      `UPDATE "${schema}".examination_papers
       SET status = 'HOD_APPROVED',
           hod_remarks = COALESCE($1, hod_remarks),
           updated_at = NOW()
       WHERE id::text = $2 RETURNING *`,
      [dto.remarks || 'HOD Approved for live conduction', dto.paperId]
    );
    return { success: true, status: 'HOD_APPROVED', data: res.rows[0] };
  } else {
    const newStatus = 'CHANGES_REQUESTED';
    const qRemJson = JSON.stringify(dto.questionRemarks || {});
    const res = await pool.query(
      `UPDATE "${schema}".examination_papers
       SET status = $1,
           hod_remarks = $2,
           question_remarks = $3::jsonb,
           updated_at = NOW()
       WHERE id::text = $4 RETURNING *`,
      [newStatus, dto.remarks || 'HOD requested revisions on specific questions.', qRemJson, dto.paperId]
    );
    return { success: true, status: newStatus, data: res.rows[0] };
  }
}
