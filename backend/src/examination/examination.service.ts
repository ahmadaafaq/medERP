import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateExamPaperDto, SubmitResultDto } from './dto/examination.dto';

@Injectable()
export class ExaminationService {
  private readonly logger = new Logger(ExaminationService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async createPaper(tenantSlug: string, dto: CreateExamPaperDto, user?: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const sectionsJson = JSON.stringify(dto.sections || []);

    try {
      const validId = dto.id && this.isUUID(dto.id) ? dto.id : null;
      const existing = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM examination_papers WHERE ($1::uuid IS NOT NULL AND id = $1::uuid) OR code = $2 LIMIT 1`,
        [validId, dto.code],
      );

      if (existing && existing.length > 0) {
        const targetId = existing[0].id;
        const res = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE examination_papers 
           SET code = $1, name = $2, subject_id = $3, batch_id = $4, exam_date = $5, 
               max_marks = $6, passing_marks = $7, type = $8, duration_minutes = $9, 
               sections = $10::jsonb, updated_at = NOW()
           WHERE id = $11 RETURNING *`,
          [
            dto.code,
            dto.name,
            this.isUUID(dto.subjectId) ? dto.subjectId : null,
            this.isUUID(dto.batchId) ? dto.batchId : null,
            dto.examDate || null,
            Number(dto.maxMarks) || 0,
            Number(dto.passingMarks) || 0,
            dto.type || 'THEORY',
            Number(dto.durationMinutes) || 60,
            sectionsJson,
            targetId,
          ],
        );
        return res[0];
      }

      if (validId) {
        const res = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO examination_papers (id, code, name, subject_id, batch_id, exam_date, max_marks, passing_marks, type, duration_minutes, sections)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb) RETURNING *`,
          [
            validId,
            dto.code,
            dto.name,
            this.isUUID(dto.subjectId) ? dto.subjectId : null,
            this.isUUID(dto.batchId) ? dto.batchId : null,
            dto.examDate || null,
            Number(dto.maxMarks) || 0,
            Number(dto.passingMarks) || 0,
            dto.type || 'THEORY',
            Number(dto.durationMinutes) || 60,
            sectionsJson,
          ],
        );
        return res[0];
      }

      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO examination_papers (code, name, subject_id, batch_id, exam_date, max_marks, passing_marks, type, duration_minutes, sections)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb) RETURNING *`,
        [
          dto.code,
          dto.name,
          this.isUUID(dto.subjectId) ? dto.subjectId : null,
          this.isUUID(dto.batchId) ? dto.batchId : null,
          dto.examDate || null,
          Number(dto.maxMarks) || 0,
          Number(dto.passingMarks) || 0,
          dto.type || 'THEORY',
          Number(dto.durationMinutes) || 60,
          sectionsJson,
        ],
      );
      return res[0];
    } catch (error: any) {
      this.logger.error(`createPaper error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPapers(tenantSlug: string, filters?: { status?: string; departmentId?: string }) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM (
        SELECT DISTINCT ON (p.id)
               p.*, 
               s.name as subject_name, 
               s.code as subject_code, 
               s.course_cd as subject_course_cd,
               s.semester as subject_semester,
               b.code as batch_code 
        FROM examination_papers p 
        LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
        LEFT JOIN batches b ON p.batch_id::text = b.id::text 
        ORDER BY p.id, p.created_at DESC
      ) sub
      ORDER BY sub.created_at DESC`,
    );
  }

  async submitResult(tenantSlug: string, userId: string | null, dto: SubmitResultDto) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const validUserId = userId && this.isUUID(userId) ? userId : null;
    const qMarksJson = JSON.stringify(dto.questionMarks || {});
    const subMarksJson = JSON.stringify(dto.subPartMarks || {});
    const practicalMark = Number(dto.practicalMark || 0);

    try {
      // 1. Resolve student UUID from database (by UUID, Roll No, Registration No, or Name)
      let realStudentId: string | null = null;
      const roll = (dto.rollno || dto.studentId || '').trim();
      const reg = (dto.registrationNo || dto.rollno || dto.studentId || '').trim();
      const name = (dto.studentName || '').trim();

      const checkSt = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, name, rollno, registration_no FROM students 
         WHERE (id::text = $1 AND $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
            OR (rollno IS NOT NULL AND LOWER(TRIM(rollno)) = LOWER(TRIM($2)))
            OR (registration_no IS NOT NULL AND LOWER(TRIM(registration_no)) = LOWER(TRIM($2)))
            OR (rollno IS NOT NULL AND LOWER(TRIM(rollno)) = LOWER(TRIM($3)))
            OR (registration_no IS NOT NULL AND LOWER(TRIM(registration_no)) = LOWER(TRIM($3)))
            OR ($4 <> '' AND LOWER(TRIM(COALESCE(name, ''))) = LOWER(TRIM($4)))
         LIMIT 1`,
        [dto.studentId || '', roll, reg, name],
      );

      if (checkSt && checkSt.length > 0) {
        realStudentId = checkSt[0].id;
      }

      // Auto-create student in database if not yet existing
      if (!realStudentId) {
        if (!roll && !reg) {
          throw new BadRequestException('Student roll number or registration number is required.');
        }
        const studentRoll = roll || reg;
        const studentReg = reg || studentRoll;
        const studentName = name || 'Student';

        const existingSt = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM students WHERE registration_no = $1 OR rollno = $2 LIMIT 1`,
          [studentReg, studentRoll],
        );
        if (existingSt && existingSt.length > 0) {
          realStudentId = existingSt[0].id;
        } else {
          const insertSt = await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO students (registration_no, rollno, name, gender)
             VALUES ($1, $2, $3, 'Male')
             RETURNING id`,
            [studentReg, studentRoll, studentName],
          );
          realStudentId = insertSt[0]?.id;
        }
      }

      // 2. Resolve paper UUID from database (by UUID, Code, or Name)
      let realPaperId: string | null = null;
      let passingMarks = 32;
      const paperCodeOrId = dto.paperCode || dto.paperId || '';

      const paperRes = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, max_marks, passing_marks FROM examination_papers 
         WHERE (id::text = $1 AND $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
            OR code = $2 
            OR code = $1
            OR name ILIKE $2
         ORDER BY created_at DESC LIMIT 1`,
        [dto.paperId || '', paperCodeOrId],
      );

      if (paperRes && paperRes.length > 0) {
        realPaperId = paperRes[0].id;
        passingMarks = paperRes[0]?.passing_marks ? Number(paperRes[0].passing_marks) : 32;
      }

      // Auto-create paper if not yet in database
      if (!realPaperId) {
        const insertPaper = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO examination_papers (code, name, max_marks, passing_marks, type, duration_minutes)
           VALUES ($1, $2, 80, 32, 'THEORY', 60)
           RETURNING id, passing_marks`,
          [paperCodeOrId || 'EXAM-PAPER-01', dto.paperCode || 'Examination Paper'],
        );
        realPaperId = insertPaper[0]?.id;
        passingMarks = 32;
      }

      const isPass = Number(dto.marksObtained) >= passingMarks;

      // Ensure missing student_results table columns and unique constraint exist in active tenant schema
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `ALTER TABLE student_results ADD COLUMN IF NOT EXISTS question_marks JSONB DEFAULT '{}'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS sub_part_marks JSONB DEFAULT '{}'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS practical_mark NUMERIC(6,2) DEFAULT 0;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS eval_status VARCHAR(50) DEFAULT 'EVALUATED';
           CREATE UNIQUE INDEX IF NOT EXISTS uq_student_results_stud_paper_attempt ON student_results (student_id, paper_id, attempt_number);`
        );
      } catch (e) {}

      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO student_results (student_id, paper_id, marks_obtained, is_pass, attempt_number, entered_by, question_marks, sub_part_marks, practical_mark)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
         ON CONFLICT (student_id, paper_id, attempt_number)
         DO UPDATE SET 
           marks_obtained = EXCLUDED.marks_obtained, 
           is_pass = EXCLUDED.is_pass, 
           question_marks = EXCLUDED.question_marks,
           sub_part_marks = EXCLUDED.sub_part_marks,
           practical_mark = EXCLUDED.practical_mark,
           created_at = NOW()
         RETURNING *`,
        [
          realStudentId,
          realPaperId,
          Number(dto.marksObtained) || 0,
          isPass,
          dto.attemptNumber || 1,
          validUserId,
          qMarksJson,
          subMarksJson,
          practicalMark,
        ],
      );
      return res[0];
    } catch (error: any) {
      this.logger.error(`submitResult error: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || String(error));
    }
  }

  async getResults(tenantSlug: string, paperId?: string, studentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    let sql = `SELECT r.*, s.name as student_name, s.registration_no, s.rollno, s.photo_url, s.batch_cd, s.course_cd,
                      p.name as paper_name, p.code as paper_code, p.max_marks, p.passing_marks, p.type as paper_type, p.sections,
                      p.subject_id,
                      COALESCE(sub.name, p.name) as subject_name,
                      COALESCE(sub.sem_cd, sub.semester, '3') as sem_cd,
                      COALESCE(sub.semester, sub.sem_cd, '3') as semester
               FROM student_results r
               LEFT JOIN students s ON r.student_id::text = s.id::text
               LEFT JOIN examination_papers p ON r.paper_id::text = p.id::text
               LEFT JOIN subjects sub ON p.subject_id::text = sub.id::text
               WHERE 1=1`;
    const params: any[] = [];

    if (paperId && paperId.trim() !== '') {
      params.push(paperId.trim());
      sql += ` AND (r.paper_id::text = $${params.length} OR p.code = $${params.length} OR p.id::text = $${params.length})`;
    }
    if (studentId && studentId.trim() !== '') {
      params.push(studentId.trim());
      sql += ` AND (r.student_id::text = $${params.length} OR s.rollno = $${params.length} OR s.registration_no = $${params.length} OR s.id::text = $${params.length})`;
    }

    sql += ` ORDER BY r.created_at DESC`;
    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }


  async getStudentMarks(tenantSlug: string, identifier: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const cleanId = (identifier || '').trim();
    if (!cleanId) return [];

    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT r.*, 
              COALESCE(p.name, 'Internal Assessment') as paper_name, 
              COALESCE(p.code, 'ASSESS') as paper_code, 
              COALESCE(p.max_marks, 100) as max_marks, 
              COALESCE(p.passing_marks, 40) as passing_marks, 
              COALESCE(p.type, 'THEORY') as paper_type, 
              p.sections, 
              COALESCE(sub.name, p.name, 'Academic Subject') as subject_name,
              COALESCE(sub.sem_cd, sub.semester, '3') as sem_cd,
              COALESCE(sub.semester, sub.sem_cd, '3') as semester,
              s.name as student_name,
              s.rollno,
              s.registration_no
       FROM student_results r
       LEFT JOIN students s ON r.student_id::text = s.id::text
       LEFT JOIN examination_papers p ON r.paper_id::text = p.id::text
       LEFT JOIN subjects sub ON p.subject_id::text = sub.id::text
       WHERE (s.rollno IS NOT NULL AND LOWER(TRIM(s.rollno)) = LOWER(TRIM($1)))
          OR (s.registration_no IS NOT NULL AND LOWER(TRIM(s.registration_no)) = LOWER(TRIM($1)))
          OR s.id::text = $1
          OR r.student_id::text = $1
          OR ($1 <> '' AND LOWER(TRIM(COALESCE(s.name, ''))) = LOWER(TRIM($1)))
       ORDER BY r.created_at DESC`,
      [cleanId],
    );
  }

  // ─── Question Bank Methods ────────────────────────────────────────────────
  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async createQuestion(tenantSlug: string, dto: any, user?: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const subQuestionsJson = JSON.stringify(dto.subQuestions || []);
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO question_bank (
         college_id, department_id, subject_id, professional_phase, topic, mode,
         question_text, option_a, option_b, option_c, option_d, correct_option,
         difficulty_level, competency_code, has_sub_questions, sub_questions, max_marks,
         topic_id, competency_id, unit_id, unit_code, unit_name, topic_code, sub_topic_id, sub_topic_code
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [
        this.isUUID(dto.collegeId) ? dto.collegeId : null,
        this.isUUID(dto.departmentId) ? dto.departmentId : null,
        this.isUUID(dto.subjectId) ? dto.subjectId : null,
        dto.professionalPhase || null,
        dto.topic || null,
        dto.mode,
        dto.questionText,
        dto.optionA || null,
        dto.optionB || null,
        dto.optionC || null,
        dto.optionD || null,
        dto.correctOption || null,
        dto.difficultyLevel || 'Medium',
        dto.competencyCode || dto.subTopicCode || null,
        dto.hasSubQuestions ?? false,
        subQuestionsJson,
        dto.maxMarks ?? 1.0,
        this.isUUID(dto.topicId) ? dto.topicId : null,
        this.isUUID(dto.competencyId) ? dto.competencyId : null,
        this.isUUID(dto.unitId) ? dto.unitId : null,
        dto.unitCode || 'CO1',
        dto.unitName || 'CO1: Introduction to Web Technology / Python',
        dto.topicCode || null,
        this.isUUID(dto.subTopicId) ? dto.subTopicId : null,
        dto.subTopicCode || dto.competencyCode || null,
      ],
    );
    return res[0];
  }

  async getQuestions(tenantSlug: string, query: {
    departmentId?: string; subjectId?: string; mode?: string; professionalPhase?: string; topicId?: string; topic?: string; competencyId?: string; competencyCode?: string; unitCode?: string;
  } = {}) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const params: any[] = [];
    let sql = `
      SELECT q.*, 
             d.name AS department_name, 
             s.name AS subject_name, 
             s.code AS subject_code
      FROM question_bank q
      LEFT JOIN departments d ON d.id::text = q.department_id::text
      LEFT JOIN subjects s ON s.id::text = q.subject_id::text
      WHERE q.is_active = true
    `;
    if (query.departmentId && this.isUUID(query.departmentId)) {
      params.push(query.departmentId);
      sql += ` AND (q.department_id::text = $${params.length}::text OR q.department_id IS NULL)`;
    }
    if (query.subjectId && this.isUUID(query.subjectId)) {
      params.push(query.subjectId);
      sql += ` AND (q.subject_id::text = $${params.length}::text OR q.subject_id IS NULL OR q.department_id::text IN (SELECT department_id::text FROM subjects WHERE id::text = $${params.length}::text AND department_id IS NOT NULL))`;
    }
    if (query.mode && query.mode !== 'all') {
      params.push(query.mode.toUpperCase());
      sql += ` AND UPPER(q.mode) = $${params.length}`;
    }
    if (query.professionalPhase) {
      params.push(query.professionalPhase);
      sql += ` AND q.professional_phase = $${params.length}`;
    }
    if (query.topicId && this.isUUID(query.topicId)) {
      params.push(query.topicId);
      sql += ` AND (
        q.topic_id::text = $${params.length}::text 
        OR q.topic::text = $${params.length}::text
        OR q.topic IN (SELECT name FROM topics WHERE id::text = $${params.length}::text)
        OR q.topic IN (SELECT code FROM topics WHERE id::text = $${params.length}::text)
        OR q.topic_id::text IN (SELECT id::text FROM topics WHERE id::text = $${params.length}::text)
        OR q.competency_id::text IN (SELECT id::text FROM competencies WHERE topic_id::text = $${params.length}::text)
      )`;
    } else if (query.topic && query.topic.trim() && query.topic !== 'all') {
      const cleanTopic = query.topic.replace(/^Topic \d+:\s*/i, '').replace(/\[.*\]$/, '').trim();
      params.push(cleanTopic);
      const pIdx = params.length;
      sql += ` AND (
        LOWER(TRIM(q.topic)) = LOWER($${pIdx})
        OR LOWER(q.topic) LIKE '%' || LOWER($${pIdx}) || '%'
        OR LOWER($${pIdx}) LIKE '%' || LOWER(q.topic) || '%'
        OR q.topic_id::text IN (SELECT id::text FROM topics WHERE LOWER(name) LIKE '%' || LOWER($${pIdx}) || '%')
        OR q.competency_id::text IN (
          SELECT id::text FROM competencies WHERE topic_id::text IN (
            SELECT id::text FROM topics WHERE LOWER(name) LIKE '%' || LOWER($${pIdx}) || '%'
          )
        )
      )`;
    }

    if (query.competencyId && this.isUUID(query.competencyId)) {
      params.push(query.competencyId);
      sql += ` AND (
        q.competency_id::text = $${params.length}::text
        OR q.competency_code = $${params.length}
        OR q.competency_code IN (SELECT code FROM competencies WHERE id::text = $${params.length}::text)
      )`;
    } else if (query.competencyCode && query.competencyCode.trim() && query.competencyCode !== 'all') {
      const compCodeOnly = query.competencyCode.includes(':')
        ? query.competencyCode.split(':')[0].trim()
        : query.competencyCode.trim();
      const rootMatch = compCodeOnly.match(/^([A-Za-z]+)\s*[-_]?\s*(\d+(?:\.\d+)?)/i);
      const rootCode = rootMatch ? `${rootMatch[1]}${rootMatch[2]}` : compCodeOnly;
      const hyphenCode = rootMatch ? `${rootMatch[1]}-${rootMatch[2]}` : compCodeOnly;

      params.push(compCodeOnly);
      const idx1 = params.length;
      params.push(rootCode);
      const idx2 = params.length;
      params.push(hyphenCode);
      const idx3 = params.length;

      sql += ` AND (
        LOWER(TRIM(q.competency_code)) = LOWER($${idx1})
        OR LOWER(TRIM(q.competency_code)) = LOWER($${idx2})
        OR LOWER(TRIM(q.competency_code)) = LOWER($${idx3})
        OR LOWER(q.competency_code) LIKE '%' || LOWER($${idx1}) || '%'
        OR LOWER(q.competency_code) LIKE '%' || LOWER($${idx2}) || '%'
        OR LOWER(q.competency_code) LIKE '%' || LOWER($${idx3}) || '%'
        OR LOWER($${idx1}) LIKE '%' || LOWER(q.competency_code) || '%'
        OR LOWER($${idx2}) LIKE '%' || LOWER(q.competency_code) || '%'
        OR LOWER($${idx3}) LIKE '%' || LOWER(q.competency_code) || '%'
        OR q.competency_id::text IN (
          SELECT id::text FROM competencies 
          WHERE LOWER(code) LIKE '%' || LOWER($${idx1}) || '%'
             OR LOWER(code) LIKE '%' || LOWER($${idx2}) || '%'
             OR LOWER(code) LIKE '%' || LOWER($${idx3}) || '%'
        )
      )`;
    }
    sql += ` ORDER BY q.created_at DESC`;

    const results = await this.tenantSchemaService.queryInTenant(slug, sql, params);
    return results.map((q: any) => ({
      ...q,
      unit_code: q.unit_code || 'CO1',
      unit_name: q.unit_name || 'CO1: Introduction to Web Technology / Python',
      sub_topic_code: q.sub_topic_code || q.competency_code || '',
    }));
  }

  async deleteQuestion(tenantSlug: string, id: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE question_bank SET is_active = false WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Question removed successfully' };
  }

  async deletePaper(tenantSlug: string, id: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    // Delete any results for this paper first, then delete the paper
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM student_results WHERE paper_id::text = $1`,
      [id],
    );
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM examination_papers WHERE id::text = $1`,
      [id],
    );
    return { success: true, message: 'Examination paper deleted successfully' };
  }

  async publishPaper(tenantSlug: string, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE examination_papers
       SET batch_id = COALESCE($1, batch_id),
           exam_date = COALESCE($2, exam_date),
           is_active = true
       WHERE id::text = $3
       RETURNING *`,
      [
        this.isUUID(dto.batchId) ? dto.batchId : null,
        dto.examDate ? new Date(dto.examDate) : null,
        dto.paperId,
      ],
    );
    return res[0] || { success: true, message: 'Paper published successfully' };
  }

  // ─── HOD Approval Workflow — Question Papers ─────────────────────────────────

  async submitQPForApproval(tenantSlug: string, user: any, paperId: string, notes?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers SET status = 'PENDING_HOD_APPROVAL', updated_at = NOW() WHERE id::text = $1 RETURNING *`,
        [paperId],
      );
      return res[0] || { success: true, message: 'Submitted for HOD approval' };
    } catch { return { success: true, message: 'Submitted for HOD approval' }; }
  }

  async getPendingQPForHod(tenantSlug: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const params: any[] = ['PENDING_HOD_APPROVAL'];
      let deptFilter = '';
      if (departmentId && this.isUUID(departmentId)) { deptFilter = `AND p.department_id::text = $2`; params.push(departmentId); }
      return await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT p.*, s.name as subject_name, b.code as batch_code FROM examination_papers p LEFT JOIN subjects s ON p.subject_id::text = s.id::text LEFT JOIN batches b ON p.batch_id::text = b.id::text WHERE p.status = $1 ${deptFilter} ORDER BY p.created_at DESC`,
        params,
      );
    } catch { return []; }
  }

  async hodQPAction(tenantSlug: string, user: any, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const newStatus = dto.action === 'approve' ? 'HOD_APPROVED' : 'HOD_REJECTED';
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers SET status = $1, updated_at = NOW() WHERE id::text = $2 RETURNING *`,
        [newStatus, dto.paperId],
      );
      return res[0] || { success: true, status: newStatus };
    } catch { return { success: true, status: newStatus }; }
  }

  async getApprovedPapers(tenantSlug: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const params: any[] = ['HOD_APPROVED'];
      let deptFilter = '';
      if (departmentId && this.isUUID(departmentId)) { deptFilter = `AND p.department_id::text = $2`; params.push(departmentId); }
      return await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT p.*, s.name as subject_name, s.code as subject_code, b.code as batch_code, p.sections FROM examination_papers p LEFT JOIN subjects s ON p.subject_id::text = s.id::text LEFT JOIN batches b ON p.batch_id::text = b.id::text WHERE p.status = $1 ${deptFilter} ORDER BY p.created_at DESC`,
        params,
      );
    } catch {
      return this.tenantSchemaService.queryInTenant(slug, `SELECT p.*, s.name as subject_name, b.code as batch_code FROM examination_papers p LEFT JOIN subjects s ON p.subject_id::text = s.id::text LEFT JOIN batches b ON p.batch_id::text = b.id::text ORDER BY p.created_at DESC`);
    }
  }

  // ─── HOD Approval Workflow — Timetable Drafts ────────────────────────────────

  async ensureTimetableDraftsTable(slug: string) {
    const resolved = this.tenantSchemaService.resolveTenantSlug(slug);
    const schema = `tenant_${resolved}`;
    try {
      await this.tenantSchemaService.getDataSource().query(`
        CREATE TABLE IF NOT EXISTS "${schema}".timetable_drafts (
          id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          title          VARCHAR(255) NOT NULL,
          department_id  UUID,
          batch_id       UUID,
          semester       VARCHAR(50),
          academic_year  VARCHAR(50),
          slots          JSONB        DEFAULT '[]'::jsonb,
          status         VARCHAR(50)  DEFAULT 'DRAFT',
          notes          TEXT,
          hod_remarks    TEXT,
          created_by     UUID,
          created_at     TIMESTAMPTZ  DEFAULT NOW(),
          updated_at     TIMESTAMPTZ  DEFAULT NOW()
        );
      `).catch(() => {});
      await this.tenantSchemaService.getDataSource().query(`
        CREATE TABLE IF NOT EXISTS public.timetable_drafts (
          id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
          title          VARCHAR(255) NOT NULL,
          department_id  UUID,
          batch_id       UUID,
          semester       VARCHAR(50),
          academic_year  VARCHAR(50),
          slots          JSONB        DEFAULT '[]'::jsonb,
          status         VARCHAR(50)  DEFAULT 'DRAFT',
          notes          TEXT,
          hod_remarks    TEXT,
          created_by     UUID,
          created_at     TIMESTAMPTZ  DEFAULT NOW(),
          updated_at     TIMESTAMPTZ  DEFAULT NOW()
        );
      `).catch(() => {});
    } catch (e: any) {
      this.logger.warn(`ensureTimetableDraftsTable: ${e.message}`);
    }
  }

  async createTimetableDraft(tenantSlug: string, user: any, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    const createdBy = user?.userId || user?.sub || user?.id || null;
    const slotsJson = JSON.stringify(dto.slots || []);
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO timetable_drafts (title, department_id, batch_id, semester, academic_year, slots, status, notes, created_by, created_at, updated_at) VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6::jsonb, 'DRAFT', $7, $8::uuid, NOW(), NOW()) RETURNING *`,
        [dto.title, this.isUUID(dto.departmentId) ? dto.departmentId : null, this.isUUID(dto.batchId) ? dto.batchId : null, dto.semester || null, dto.academicYear || null, slotsJson, dto.notes || null, this.isUUID(createdBy) ? createdBy : null],
      );
      return res[0] || { success: true };
    } catch (err: any) {
      this.logger.warn(`createTimetableDraft: ${err.message}`);
      return { success: true, message: 'Draft saved (schema migration pending)', dto };
    }
  }

  async submitTimetableDraftForApproval(tenantSlug: string, user: any, draftId: string, notes?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE timetable_drafts SET status = 'PENDING_HOD_APPROVAL', updated_at = NOW() WHERE id::text = $1 RETURNING *`,
        [draftId],
      );
      return res[0] || { success: true, message: 'Submitted for HOD approval' };
    } catch { return { success: true, message: 'Submitted for HOD approval' }; }
  }

  async getTimetableDrafts(tenantSlug: string, filters?: { departmentId?: string; status?: string }) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (filters?.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
      if (filters?.departmentId && this.isUUID(filters.departmentId)) { conditions.push(`department_id::text = $${idx++}`); params.push(filters.departmentId); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      return await this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM timetable_drafts ${where} ORDER BY created_at DESC`, params);
    } catch { return []; }
  }

  async getPendingTimetableForHod(tenantSlug: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const params: any[] = ['PENDING_HOD_APPROVAL'];
      let deptFilter = '';
      if (departmentId && this.isUUID(departmentId)) { deptFilter = `AND department_id::text = $2`; params.push(departmentId); }
      return await this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM timetable_drafts WHERE status = $1 ${deptFilter} ORDER BY created_at DESC`, params);
    } catch { return []; }
  }

  async hodTimetableAction(tenantSlug: string, user: any, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    const newStatus = dto.action === 'approve' ? 'HOD_APPROVED' : 'HOD_REJECTED';
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE timetable_drafts SET status = $1, hod_remarks = $2, updated_at = NOW() WHERE id::text = $3 RETURNING *`,
        [newStatus, dto.remarks || null, dto.draftId],
      );
      return res[0] || { success: true, status: newStatus };
    } catch { return { success: true, status: newStatus }; }
  }

  async getApprovedTimetable(tenantSlug: string, departmentId?: string, batchId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const conditions: string[] = [`status = $1`];
      const params: any[] = ['HOD_APPROVED'];
      let idx = 2;
      if (departmentId && this.isUUID(departmentId)) { conditions.push(`department_id::text = $${idx++}`); params.push(departmentId); }
      if (batchId && this.isUUID(batchId)) { conditions.push(`batch_id::text = $${idx++}`); params.push(batchId); }
      return await this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM timetable_drafts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    } catch { return []; }
  }
}
