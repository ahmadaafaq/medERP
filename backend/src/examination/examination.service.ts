import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateExamPaperDto, SubmitResultDto } from './dto/examination.dto';

@Injectable()
export class ExaminationService {
  private readonly logger = new Logger(ExaminationService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async createPaper(tenantSlug: string, dto: CreateExamPaperDto) {
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

  async getPapers(tenantSlug: string) {
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
      const roll = dto.rollno || dto.studentId || '';
      const reg = dto.registrationNo || dto.rollno || dto.studentId || '';
      const name = dto.studentName || '';

      const checkSt = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM students 
         WHERE (id::text = $1 AND $1 ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
            OR rollno = $2 
            OR registration_no = $2 
            OR rollno = $3 
            OR registration_no = $3 
            OR ($4 <> '' AND LOWER(name) = LOWER($4))
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
        const insertSt = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO students (registration_no, rollno, name, gender)
           VALUES ($1, $2, $3, 'Male')
           ON CONFLICT (registration_no) 
           DO UPDATE SET name = EXCLUDED.name, rollno = EXCLUDED.rollno
           RETURNING id`,
          [studentReg, studentRoll, studentName],
        );
        realStudentId = insertSt[0]?.id;
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
    let sql = `SELECT r.*, s.name as student_name, s.registration_no, s.rollno, s.photo_url, p.name as paper_name, p.code as paper_code, p.max_marks, p.passing_marks
               FROM student_results r
               LEFT JOIN students s ON r.student_id::text = s.id::text
               LEFT JOIN examination_papers p ON r.paper_id::text = p.id::text
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
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT r.*, p.name as paper_name, p.code as paper_code, p.max_marks, p.passing_marks, p.type as paper_type, sub.name as subject_name
       FROM student_results r
       JOIN students s ON r.student_id = s.id
       JOIN examination_papers p ON r.paper_id = p.id
       LEFT JOIN subjects sub ON p.subject_id = sub.id
       WHERE LOWER(COALESCE(s.rollno, '')) = LOWER($1)
          OR LOWER(COALESCE(s.registration_no, '')) = LOWER($1)
          OR s.id::text = $1
       ORDER BY r.created_at DESC`,
      [identifier],
    );
  }

  // ─── Question Bank Methods ────────────────────────────────────────────────
  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async createQuestion(tenantSlug: string, dto: any) {
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
}
