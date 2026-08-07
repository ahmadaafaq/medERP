import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateExamPaperDto, SubmitResultDto } from './dto/examination.dto';

@Injectable()
export class ExaminationService {
  private readonly logger = new Logger(ExaminationService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async createPaper(tenantSlug: string, dto: CreateExamPaperDto) {
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO examination_papers (code, name, subject_id, batch_id, exam_date, max_marks, passing_marks, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [dto.code, dto.name, dto.subjectId || null, dto.batchId || null, dto.examDate || null, dto.maxMarks, dto.passingMarks, dto.type || 'THEORY'],
    );
    return res[0];
  }

  async getPapers(tenantSlug: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT p.*, s.name as subject_name, b.code as batch_code 
       FROM examination_papers p 
       LEFT JOIN subjects s ON p.subject_id = s.id 
       LEFT JOIN batches b ON p.batch_id = b.id 
       ORDER BY p.created_at DESC`,
    );
  }

  async submitResult(tenantSlug: string, userId: string, dto: SubmitResultDto) {
    const isPass = dto.marksObtained >= 50; // simple threshold
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO student_results (student_id, paper_id, marks_obtained, is_pass, attempt_number, entered_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (student_id, paper_id, attempt_number)
       DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, is_pass = EXCLUDED.is_pass, created_at = NOW()
       RETURNING *`,
      [dto.studentId, dto.paperId, dto.marksObtained, isPass, dto.attemptNumber || 1, userId],
    );
    return res[0];
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
         difficulty_level, competency_code, has_sub_questions, sub_questions, max_marks
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17)
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
        dto.competencyCode || null,
        dto.hasSubQuestions ?? false,
        subQuestionsJson,
        dto.maxMarks ?? 1.0,
      ],
    );
    return res[0];
  }

  async getQuestions(tenantSlug: string, query: {
    departmentId?: string; subjectId?: string; mode?: string; professionalPhase?: string; topic?: string; competencyCode?: string;
  } = {}) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const params: any[] = [];
    let sql = `
      SELECT q.*, d.name AS department_name, s.name AS subject_name, s.code AS subject_code
      FROM question_bank q
      LEFT JOIN departments d ON d.id = q.department_id
      LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE q.is_active = true
    `;
    if (query.departmentId && this.isUUID(query.departmentId)) {
      params.push(query.departmentId);
      sql += ` AND q.department_id = $${params.length}`;
    }
    if (query.subjectId && this.isUUID(query.subjectId)) {
      params.push(query.subjectId);
      sql += ` AND q.subject_id = $${params.length}`;
    }
    if (query.mode) {
      params.push(query.mode);
      sql += ` AND q.mode = $${params.length}`;
    }
    if (query.professionalPhase) {
      params.push(query.professionalPhase);
      sql += ` AND q.professional_phase = $${params.length}`;
    }
    if (query.topic) {
      params.push(query.topic);
      sql += ` AND q.topic = $${params.length}`;
    }
    if (query.competencyCode) {
      params.push(query.competencyCode);
      sql += ` AND q.competency_code = $${params.length}`;
    }
    sql += ` ORDER BY q.created_at DESC`;
    return this.tenantSchemaService.queryInTenant(slug, sql, params);
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

  async publishPaper(tenantSlug: string, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE examination_papers
       SET batch_id = COALESCE($1, batch_id),
           exam_date = COALESCE($2, exam_date),
           is_active = true
       WHERE id = $3
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
