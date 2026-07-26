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

  async getStudentMarks(tenantSlug: string, rollno: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT r.*, p.name as paper_name, p.code as paper_code, p.max_marks, p.passing_marks
       FROM student_results r
       JOIN students s ON r.student_id = s.id
       JOIN examination_papers p ON r.paper_id = p.id
       WHERE s.rollno = $1
       ORDER BY r.created_at DESC`,
      [rollno],
    );
  }
}
