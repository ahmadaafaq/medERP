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
  role?: string;
  userId?: string;
  createdBy?: string;
  facultyId?: string;
}) {
  const pool = getDbPool();
  const schema = resolveSchema(tenantSlug);

  const params: any[] = [];
  const conditions: string[] = [];

  const rawRole = (filters?.role || '').toUpperCase();
  const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL' || rawRole === 'SUPERADMIN';
  const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
  const isDqac = rawRole === 'DQAC';
  const userId = filters?.userId || filters?.createdBy || filters?.facultyId || null;
  const validUserId = userId && isUUID(userId) ? userId : null;

  if (!isAdmin && rawRole) {
    if (isHod || isDqac) {
      if (filters?.departmentId && isUUID(filters.departmentId)) {
        params.push(filters.departmentId);
        conditions.push(`p.department_id::text = $${params.length}`);
      }
    } else {
      // Faculty: strict confidentiality — only creator faculty sees their question papers
      if (validUserId) {
        params.push(validUserId);
        conditions.push(`p.created_by::text = $${params.length}`);
      } else if (filters?.createdBy || filters?.facultyId) {
        const fid = filters.createdBy || filters.facultyId;
        params.push(fid);
        conditions.push(`p.created_by::text = $${params.length}`);
      } else {
        conditions.push(`1 = 0`);
      }
    }
  }

  if (filters?.status && filters.status !== 'ALL') {
    if (filters.status === 'PENDING_HOD_APPROVAL') {
      conditions.push(`p.status IN ('PENDING_HOD_APPROVAL', 'CHANGES_REQUESTED', 'RESUBMITTED', 'PENDING_DQAC_APPROVAL', 'DQAC_APPROVED')`);
    } else if (filters.status === 'PENDING_DQAC_APPROVAL') {
      conditions.push(`p.status IN ('PENDING_DQAC_APPROVAL', 'CHANGES_REQUESTED', 'RESUBMITTED')`);
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
              COALESCE(s.name, s2.name) as subject_name,
              COALESCE(s.code, s2.code) as subject_code,
              COALESCE(s.course_cd, s2.course_cd) as subject_course_cd,
              COALESCE(s.semester, s2.semester) as subject_semester,
              COALESCE(b.code, b2.code, p.batch_cd) as batch_code,
              COALESCE(b.name, b2.name, CASE WHEN p.batch_cd IS NOT NULL THEN 'Batch ' || p.batch_cd ELSE 'Current Batch' END) as batch_name,
              COALESCE(d.name, d2.name) as department_name,
              p.sections
       FROM "${schema}".examination_papers p
       LEFT JOIN "${schema}".courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
       LEFT JOIN "${schema}".subjects s ON p.subject_id::text = s.id::text
       LEFT JOIN "${schema}".subjects s2 ON (p.subject_id IS NULL AND (s2.code = p.code OR p.code ILIKE s2.code || '%') AND s2.code != '')
       LEFT JOIN "${schema}".batches b ON p.batch_id::text = b.id::text
       LEFT JOIN "${schema}".batches b2 ON (p.batch_id IS NULL AND (p.batch_cd = b2.batch_cd OR p.batch_cd = b2.code))
       LEFT JOIN "${schema}".departments d ON p.department_id::text = d.id::text
       LEFT JOIN "${schema}".departments d2 ON (p.department_id IS NULL AND (p.branch_cd = d2.code OR p.course_cd = d2.code))
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
  let validDeptId = dto.departmentId && isUUID(dto.departmentId) ? dto.departmentId : null;
  if (!validDeptId && (dto.departmentId || dto.courseCd || dto.branchCd)) {
    try {
      const dRes = await pool.query(
        `SELECT id FROM "${schema}".departments WHERE code = $1 OR code = $2 OR code = $3 LIMIT 1`,
        [dto.departmentId || '', dto.branchCd || '', dto.courseCd || '']
      );
      if (dRes.rows.length > 0) validDeptId = dRes.rows[0].id;
    } catch {}
  }

  let validSubjectId = dto.subjectId && isUUID(dto.subjectId) ? dto.subjectId : null;
  if (!validSubjectId && dto.subjectId) {
    try {
      const sRes = await pool.query(`SELECT id FROM "${schema}".subjects WHERE code = $1 OR id::text = $1 LIMIT 1`, [dto.subjectId]);
      if (sRes.rows.length > 0) validSubjectId = sRes.rows[0].id;
    } catch {}
  }

  let validBatchId = dto.batchId && isUUID(dto.batchId) ? dto.batchId : null;
  if (!validBatchId && (dto.batchId || dto.batchCd)) {
    try {
      const bRes = await pool.query(
        `SELECT id FROM "${schema}".batches WHERE batch_cd = $1 OR code = $1 OR id::text = $1 LIMIT 1`,
        [dto.batchCd || dto.batchId || '']
      );
      if (bRes.rows.length > 0) validBatchId = bRes.rows[0].id;
    } catch {}
  }

  const rawCreator = user?.id || dto.createdBy || dto.created_by || dto.facultyId || dto.faculty_id || null;
  const validUserId = rawCreator && isUUID(rawCreator) ? rawCreator : null;
  const paperSet = dto.paperSet || dto.paper_set || 'Set A';
  const targetSectionsJson = JSON.stringify(
    Array.isArray(dto.targetSections) ? dto.targetSections :
    Array.isArray(dto.target_sections) ? dto.target_sections : ['All']
  );
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
             question_remarks = COALESCE($22::jsonb, question_remarks),
             paper_set = COALESCE($23, paper_set),
             target_sections = COALESCE($24::jsonb, target_sections),
             created_by = COALESCE($25, created_by),
             updated_at = NOW()
         WHERE id = $26 RETURNING *`,
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
          paperSet,
          targetSectionsJson,
          validUserId,
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
          question_remarks, paper_set, target_sections, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23::jsonb, $24, $25::jsonb, $26, NOW(), NOW()) RETURNING *`,
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
          paperSet,
          targetSectionsJson,
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
        question_remarks, paper_set, target_sections, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24::jsonb, $25, NOW(), NOW()) RETURNING *`,
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
        paperSet,
        targetSectionsJson,
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

    if (paper.created_by) {
      try {
        await pool.query(
          `INSERT INTO "${schema}".notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'success', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'HOD Final Approval Granted',
            `Your question paper "${paper.name || paper.code}" has been approved by HOD and is ready for live conduction.`,
          ]
        );
      } catch {}
    }

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

    if (paper.created_by) {
      try {
        await pool.query(
          `INSERT INTO "${schema}".notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'warning', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'HOD Review: Revisions Required',
            `HOD requested revisions on your question paper "${paper.name || paper.code}". Remarks: ${dto.remarks || 'Please revise in Assessment & Q Bank.'}`,
          ]
        );
      } catch {}
    }

    return { success: true, status: newStatus, data: res.rows[0] };
  }
}

export async function dqacPaperActionInDb(tenantSlug: string, dto: {
  paperId: string;
  action: 'dqac_approve' | 'postpone' | 'changes_requested' | 'reject';
  version?: number;
  remarks?: string;
  dqacRemarks?: string;
  questionRemarks?: any;
  paperSet?: string;
  targetSections?: string[];
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

  const targetSectionsJson = dto.targetSections ? JSON.stringify(Array.isArray(dto.targetSections) ? dto.targetSections : [dto.targetSections]) : null;
  const remarksText = dto.dqacRemarks || dto.remarks || null;

  if (dto.action === 'dqac_approve') {
    const res = await pool.query(
      `UPDATE "${schema}".examination_papers
       SET status = 'DQAC_APPROVED',
           dqac_status = 'DQAC_APPROVED',
           dqac_remarks = COALESCE($1, dqac_remarks),
           paper_set = COALESCE($2, paper_set),
           target_sections = COALESCE($3::jsonb, target_sections),
           updated_at = NOW()
       WHERE id::text = $4 RETURNING *`,
      [remarksText || 'DQAC Quality Approved', dto.paperSet || null, targetSectionsJson, dto.paperId]
    );

    if (paper.created_by) {
      try {
        await pool.query(
          `INSERT INTO "${schema}".notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'success', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'DQAC Quality Audit: Certified',
            `DQAC has verified and approved "${paper.name || paper.code}". It is now queued for HOD final sign-off.`,
          ]
        );
      } catch {}
    }

    return { success: true, status: 'DQAC_APPROVED', data: res.rows[0] };
  } else if (dto.action === 'postpone') {
    const res = await pool.query(
      `UPDATE "${schema}".examination_papers
       SET status = 'POSTPONED',
           dqac_status = 'POSTPONED',
           dqac_remarks = COALESCE($1, dqac_remarks),
           updated_at = NOW()
       WHERE id::text = $2 RETURNING *`,
      [remarksText || 'Examination postponed by DQAC.', dto.paperId]
    );

    if (paper.created_by) {
      try {
        await pool.query(
          `INSERT INTO "${schema}".notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'warning', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'Examination Postponed by DQAC',
            `DQAC has postponed examination paper "${paper.name || paper.code}". Reason: ${remarksText || 'Examination rescheduled by Quality Assurance Cell.'}`,
          ]
        );
      } catch {}
    }

    return { success: true, status: 'POSTPONED', data: res.rows[0] };
  } else {
    const newStatus = dto.action === 'reject' ? 'REJECTED' : 'CHANGES_REQUESTED';
    const qRemJson = JSON.stringify(dto.questionRemarks || {});
    const res = await pool.query(
      `UPDATE "${schema}".examination_papers
       SET status = $1,
           dqac_status = $1,
           dqac_remarks = $2,
           hod_remarks = $2,
           question_remarks = $3::jsonb,
           paper_set = COALESCE($4, paper_set),
           target_sections = COALESCE($5::jsonb, target_sections),
           updated_at = NOW()
       WHERE id::text = $6 RETURNING *`,
      [newStatus, remarksText || 'DQAC requested revisions on specific questions.', qRemJson, dto.paperSet || null, targetSectionsJson, dto.paperId]
    );

    if (paper.created_by) {
      try {
        await pool.query(
          `INSERT INTO "${schema}".notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'warning', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'DQAC Quality Audit: Revisions Required',
            `DQAC has requested revisions on your question paper "${paper.name || paper.code}". Directives: ${remarksText || 'Please review flagged questions in Assessment & Q Bank.'}`,
          ]
        );
      } catch {}
    }

    return { success: true, status: newStatus, data: res.rows[0] };
  }
}
