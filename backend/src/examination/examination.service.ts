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
    const userId = user?.userId || user?.sub || user?.id || (dto as any).createdBy || (dto as any).facultyId || null;
    const validUserId = userId && this.isUUID(userId) ? userId : null;
    const rawDeptId = dto.departmentId || dto.department_id;
    const validDeptId = rawDeptId && this.isUUID(rawDeptId) ? rawDeptId : null;
    const finalColgCd = dto.colgCd || dto.colg_cd || null;
    const finalCourseCd = dto.courseCd || dto.course_cd || null;
    const finalBranchCd = dto.branchCd || dto.branch_cd || null;
    const finalBatchCd = dto.batchCd || dto.batch_cd || null;
    const finalAcademicYear = dto.academicYear || dto.academic_year || null;

    try {
      const validId = dto.id && this.isUUID(dto.id) ? dto.id : null;
      const existing = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, status, version, created_by FROM examination_papers WHERE ($1::uuid IS NOT NULL AND id = $1::uuid) OR code = $2 LIMIT 1`,
        [validId, dto.code],
      );

      if (existing && existing.length > 0) {
        const targetId = existing[0].id;
        const prevStatus = existing[0].status;
        const currentVersion = Number(existing[0].version || 1);
        const ownerId = existing[0].created_by;

        // Confidentiality check: if an existing paper belongs to another faculty, prevent overwrite
        const rawRole = (user?.role || (dto as any).role || '').toUpperCase();
        const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL';
        const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
        if (ownerId && validUserId && String(ownerId) !== String(validUserId) && !isAdmin && !isHod) {
          throw new BadRequestException('Confidentiality violation: You cannot modify a question paper prepared by another faculty member.');
        }

        let nextStatus = dto.status || prevStatus || 'DRAFT';
        let nextVersion = dto.version ? Number(dto.version) : currentVersion;
        if (prevStatus === 'CHANGES_REQUESTED' && dto.status === 'PENDING_HOD_APPROVAL') {
          nextVersion = currentVersion + 1;
        }

        const paperSet = dto.paperSet || dto.paper_set || 'Set A';
        const targetSections = dto.targetSections || dto.target_sections || ['All'];
        const targetSectionsJson = JSON.stringify(Array.isArray(targetSections) ? targetSections : [targetSections]);

        const res = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE examination_papers 
           SET code = $1, name = $2, subject_id = $3, batch_id = $4, exam_date = $5, 
               max_marks = $6, passing_marks = $7, type = $8, duration_minutes = $9, 
               sections = $10::jsonb, status = $11, department_id = $12, colg_cd = $13,
               course_cd = $14, branch_cd = $15, batch_cd = $16, semester = $17, section = $18,
               academic_year = $19, version = $20, hod_remarks = COALESCE($21, hod_remarks),
               question_remarks = COALESCE($22::jsonb, question_remarks), 
               paper_set = COALESCE($23, paper_set),
               target_sections = COALESCE($24::jsonb, target_sections),
               created_by = COALESCE($25::uuid, created_by), updated_at = NOW()
           WHERE id = $26 RETURNING *`,
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
            nextStatus,
            validDeptId,
            finalColgCd,
            finalCourseCd,
            finalBranchCd,
            finalBatchCd,
            dto.semester || null,
            dto.section || null,
            finalAcademicYear,
            nextVersion,
            dto.hodRemarks || null,
            dto.questionRemarks ? JSON.stringify(dto.questionRemarks) : null,
            paperSet,
            targetSectionsJson,
            validUserId,
            targetId,
          ],
        );
        return res[0];
      }

      const initialStatus = dto.status || 'DRAFT';
      const initialVersion = dto.version ? Number(dto.version) : 1;
      const qRemarksJson = JSON.stringify(dto.questionRemarks || {});
      const paperSet = dto.paperSet || dto.paper_set || 'Set A';
      const targetSections = dto.targetSections || dto.target_sections || ['All'];
      const targetSectionsJson = JSON.stringify(Array.isArray(targetSections) ? targetSections : [targetSections]);

      if (validId) {
        const res = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO examination_papers (
            id, code, name, subject_id, batch_id, exam_date, max_marks, passing_marks, 
            type, duration_minutes, sections, status, department_id, colg_cd, course_cd, 
            branch_cd, batch_cd, semester, section, academic_year, version, hod_remarks, 
            question_remarks, paper_set, target_sections, created_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23::jsonb, $24, $25::jsonb, $26, NOW(), NOW()) RETURNING *`,
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
            initialStatus,
            validDeptId,
            finalColgCd,
            finalCourseCd,
            finalBranchCd,
            finalBatchCd,
            dto.semester || null,
            dto.section || null,
            finalAcademicYear,
            initialVersion,
            dto.hodRemarks || null,
            qRemarksJson,
            paperSet,
            targetSectionsJson,
            validUserId,
          ],
        );
        return res[0];
      }

      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO examination_papers (
          code, name, subject_id, batch_id, exam_date, max_marks, passing_marks, 
          type, duration_minutes, sections, status, department_id, colg_cd, course_cd, 
          branch_cd, batch_cd, semester, section, academic_year, version, hod_remarks, 
          question_remarks, paper_set, target_sections, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24::jsonb, $25, NOW(), NOW()) RETURNING *`,
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
          initialStatus,
          validDeptId,
          finalColgCd,
          finalCourseCd,
          finalBranchCd,
          finalBatchCd,
          dto.semester || null,
          dto.section || null,
          finalAcademicYear,
          initialVersion,
          dto.hodRemarks || null,
          qRemarksJson,
          paperSet,
          targetSectionsJson,
          validUserId,
        ],
      );
      return res[0];
    } catch (error: any) {
      this.logger.error(`createPaper error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPapers(
    tenantSlug: string,
    filters?: {
      status?: string;
      departmentId?: string;
      colgCd?: string;
      courseCd?: string;
      branchCd?: string;
      batchCd?: string;
      semester?: string;
      section?: string;
      facultyId?: string;
      createdBy?: string;
      role?: string;
    },
    user?: any,
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const whereClauses: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // ─── ROLE-BASED QUESTION PAPER CONFIDENTIALITY ACCESS CONTROL ───
    // 1. Admin/SuperAdmin/Principal -> full preview across all departments
    // 2. HOD of department -> can preview papers from their department
    // 3. Faculty -> STRICT CONFIDENTIALITY: can ONLY view question papers that he/she prepared.
    //    Other faculties from the same department cannot see it.
    const rawRole = (user?.role || filters?.role || '').toUpperCase();
    const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL';
    const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
    const isFaculty = rawRole === 'FACULTY' || rawRole === 'TEACHER' || rawRole === 'INSTRUCTOR';

    const userId = user?.userId || user?.sub || user?.id || filters?.createdBy || filters?.facultyId || null;
    const validUserId = userId && this.isUUID(userId) ? userId : null;

    if (!isAdmin) {
      if (isHod) {
        // HOD can preview question papers belonging to their department
        const targetDept = filters?.departmentId || user?.departmentId || user?.department;
        if (targetDept) {
          if (this.isUUID(targetDept)) {
            whereClauses.push(`p.department_id::text = $${pIdx++}`);
            params.push(targetDept);
          } else {
            whereClauses.push(`(p.branch_cd = $${pIdx} OR p.department_id::text = $${pIdx})`);
            params.push(targetDept);
            pIdx++;
          }
        }
      } else if (isFaculty || validUserId) {
        // Faculty strictly sees only their prepared question papers
        // Other faculties from the same department cannot view it
        if (validUserId) {
          whereClauses.push(`p.created_by::text = $${pIdx++}`);
          params.push(validUserId);
        } else if (filters?.createdBy || filters?.facultyId) {
          whereClauses.push(`p.created_by::text = $${pIdx++}`);
          params.push(filters.createdBy || filters.facultyId);
        } else {
          // Strict confidentiality: Block leakage if faculty user is unidentifiable
          whereClauses.push(`1 = 0`);
        }
      }
    }

    if (filters?.status && filters.status !== 'ALL') {
      whereClauses.push(`p.status = $${pIdx++}`);
      params.push(filters.status);
    }
    if (filters?.departmentId && this.isUUID(filters.departmentId)) {
      whereClauses.push(`p.department_id::text = $${pIdx++}`);
      params.push(filters.departmentId);
    }
    if (filters?.colgCd) {
      whereClauses.push(`p.colg_cd = $${pIdx++}`);
      params.push(filters.colgCd);
    }
    if (filters?.courseCd) {
      whereClauses.push(`p.course_cd = $${pIdx++}`);
      params.push(filters.courseCd);
    }
    if (filters?.branchCd) {
      whereClauses.push(`p.branch_cd = $${pIdx++}`);
      params.push(filters.branchCd);
    }
    if (filters?.batchCd) {
      whereClauses.push(`p.batch_cd = $${pIdx++}`);
      params.push(filters.batchCd);
    }
    if (filters?.semester) {
      whereClauses.push(`p.semester = $${pIdx++}`);
      params.push(filters.semester);
    }
    if (filters?.section) {
      whereClauses.push(`p.section = $${pIdx++}`);
      params.push(filters.section);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT p.*, 
              c.name as course_name,
              s.name as subject_name, 
              s.code as subject_code, 
              s.course_cd as subject_course_cd,
              s.semester as subject_semester,
              b.code as batch_code,
              d.name as department_name
       FROM examination_papers p 
       LEFT JOIN courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
       LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
       LEFT JOIN batches b ON p.batch_id::text = b.id::text 
       LEFT JOIN departments d ON p.department_id::text = d.id::text
       ${whereStr}
       ORDER BY COALESCE(p.updated_at, p.created_at, '1970-01-01'::timestamptz) DESC, p.id DESC`,
      params,
    );
  }

  async getPaperById(tenantSlug: string, id: string, user?: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT p.*, 
              s.name as subject_name, 
              s.code as subject_code, 
              s.course_cd as subject_course_cd,
              s.semester as subject_semester,
              b.code as batch_code,
              d.name as department_name
       FROM examination_papers p 
       LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
       LEFT JOIN batches b ON p.batch_id::text = b.id::text 
       LEFT JOIN departments d ON p.department_id::text = d.id::text
       WHERE p.id::text = $1 LIMIT 1`,
      [id],
    );
    const paper = res[0] || null;
    if (!paper) return null;

    // Strict confidentiality check on paper preview
    if (user) {
      const rawRole = (user.role || '').toUpperCase();
      const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL';
      const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
      const isFaculty = rawRole === 'FACULTY' || rawRole === 'TEACHER' || rawRole === 'INSTRUCTOR';
      const userId = user.userId || user.sub || user.id || null;

      if (!isAdmin) {
        if (isFaculty && paper.created_by && userId && String(paper.created_by) !== String(userId)) {
          throw new BadRequestException('Confidentiality violation: You are not authorized to view a question paper prepared by another faculty member.');
        }
        if (isHod) {
          const targetDept = user.departmentId || user.department;
          if (targetDept && paper.department_id && String(paper.department_id) !== String(targetDept)) {
            throw new BadRequestException('Confidentiality violation: You are not authorized to view question papers outside your department.');
          }
        }
      }
    }

    return paper;
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
         topic_id, competency_id, unit_id, unit_code, unit_name, topic_code, sub_topic_id, sub_topic_code,
         colg_cd, course_cd, branch_cd, batch_cd, semester, section, image_url
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
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
        dto.unitName || 'Core Unit',
        dto.topicCode || null,
        this.isUUID(dto.subTopicId) ? dto.subTopicId : null,
        dto.subTopicCode || dto.competencyCode || null,
        dto.colgCd || '1',
        dto.courseCd || null,
        dto.branchCd || null,
        dto.batchCd || null,
        dto.semester || null,
        dto.section || null,
        dto.imageUrl || dto.image_url || null,
      ],
    );
    return res[0];
  }

  async getQuestions(tenantSlug: string, query: {
    departmentId?: string; subjectId?: string; mode?: string; professionalPhase?: string; topicId?: string; topic?: string; competencyId?: string; competencyCode?: string; unitCode?: string; unitId?: string;
    colgCd?: string; courseCd?: string; branchCd?: string; batchCd?: string; semester?: string; section?: string;
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
    if (query.colgCd && query.colgCd !== 'ALL') {
      params.push(query.colgCd);
      sql += ` AND (q.colg_cd = $${params.length} OR q.colg_cd IS NULL)`;
    }
    if (query.courseCd && query.courseCd !== 'ALL') {
      params.push(query.courseCd);
      sql += ` AND (q.course_cd = $${params.length} OR q.course_cd IS NULL)`;
    }
    if (query.branchCd && query.branchCd !== 'ALL') {
      params.push(query.branchCd);
      sql += ` AND (q.branch_cd = $${params.length} OR q.branch_cd IS NULL)`;
    }
    if (query.batchCd && query.batchCd !== 'ALL') {
      params.push(query.batchCd);
      sql += ` AND (q.batch_cd = $${params.length} OR q.batch_cd IS NULL)`;
    }
    if (query.semester && query.semester !== 'ALL') {
      params.push(query.semester);
      sql += ` AND (q.semester = $${params.length} OR q.semester IS NULL)`;
    }
    if (query.section && query.section !== 'ALL') {
      params.push(query.section);
      sql += ` AND (q.section = $${params.length} OR q.section IS NULL)`;
    }
    if (query.departmentId && this.isUUID(query.departmentId)) {
      params.push(query.departmentId);
      sql += ` AND (q.department_id::text = $${params.length}::text OR q.department_id IS NULL)`;
    }
    if (query.subjectId && this.isUUID(query.subjectId)) {
      params.push(query.subjectId);
      sql += ` AND (q.subject_id::text = $${params.length}::text OR q.subject_id IS NULL OR q.department_id::text IN (SELECT department_id::text FROM subjects WHERE id::text = $${params.length}::text AND department_id IS NOT NULL))`;
    }
    if (query.unitId && this.isUUID(query.unitId)) {
      params.push(query.unitId);
      sql += ` AND (q.unit_id::text = $${params.length}::text OR q.unit_code = $${params.length})`;
    } else if (query.unitCode && query.unitCode.trim() && query.unitCode.toUpperCase() !== 'ALL') {
      params.push(query.unitCode.trim());
      sql += ` AND (LOWER(TRIM(q.unit_code)) = LOWER($${params.length}) OR LOWER(TRIM(q.unit_name)) LIKE '%' || LOWER($${params.length}) || '%')`;
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

  async deletePaper(tenantSlug: string, id: string, user?: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id, created_by, department_id FROM examination_papers WHERE id::text = $1 LIMIT 1`,
      [id],
    );
    if (!existing || existing.length === 0) {
      throw new NotFoundException('Examination paper not found');
    }

    if (user) {
      const rawRole = (user.role || '').toUpperCase();
      const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL';
      const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
      const isFaculty = rawRole === 'FACULTY' || rawRole === 'TEACHER' || rawRole === 'INSTRUCTOR';
      const userId = user.userId || user.sub || user.id || null;

      if (!isAdmin) {
        if (isFaculty && existing[0].created_by && userId && String(existing[0].created_by) !== String(userId)) {
          throw new BadRequestException('Confidentiality violation: You cannot delete a question paper prepared by another faculty member.');
        }
        if (isHod) {
          const targetDept = user.departmentId || user.department;
          if (targetDept && existing[0].department_id && String(existing[0].department_id) !== String(targetDept)) {
            throw new BadRequestException('Confidentiality violation: You cannot delete question papers outside your department.');
          }
        }
      }
    }

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
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id, status, name, code FROM examination_papers WHERE id::text = $1 LIMIT 1`,
      [dto.paperId],
    );
    if (!existing || existing.length === 0) {
      throw new BadRequestException('Examination paper not found');
    }
    const paper = existing[0];
    if (paper.status !== 'HOD_APPROVED' && paper.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot publish paper "${paper.name || paper.code}". HOD approval is mandatory before publishing (current status: ${paper.status || 'DRAFT'}).`,
      );
    }

    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE examination_papers
       SET batch_id = COALESCE($1, batch_id),
           batch_cd = COALESCE($2, batch_cd),
           exam_date = COALESCE($3, exam_date),
           colg_cd = COALESCE($4, colg_cd),
           course_cd = COALESCE($5, course_cd),
           branch_cd = COALESCE($6, branch_cd),
           semester = COALESCE($7, semester),
           start_time = COALESCE($8, start_time),
           end_time = COALESCE($9, end_time),
           status = 'PUBLISHED',
           is_active = true,
           updated_at = NOW()
       WHERE id::text = $10
       RETURNING *`,
      [
        this.isUUID(dto.batchId) ? dto.batchId : null,
        dto.batchCd || dto.target_batch || null,
        dto.examDate ? new Date(dto.examDate) : null,
        dto.colgCd || null,
        dto.courseCd || null,
        dto.branchCd || null,
        dto.semester || null,
        dto.startTime || null,
        dto.endTime || null,
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
        `UPDATE examination_papers 
         SET status = 'PENDING_HOD_APPROVAL', 
             hod_remarks = COALESCE($2, hod_remarks), 
             updated_at = NOW() 
         WHERE id::text = $1 RETURNING *`,
        [paperId, notes || null],
      );
      return res[0] || { success: true, message: 'Submitted for HOD approval' };
    } catch { return { success: true, message: 'Submitted for HOD approval' }; }
  }

  async getPendingQPForHod(tenantSlug: string, departmentId?: string, statusFilter?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const params: any[] = [];
      let whereClause: string;
      if (statusFilter && statusFilter !== 'ALL') {
        params.push(statusFilter);
        whereClause = `WHERE p.status = $1`;
      } else {
        whereClause = `WHERE p.status IN ('PENDING_HOD_APPROVAL', 'CHANGES_REQUESTED', 'RESUBMITTED')`;
      }

      if (departmentId && this.isUUID(departmentId)) {
        params.push(departmentId);
        whereClause += ` AND p.department_id::text = $${params.length}`;
      }

      return await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT p.*, 
                c.name as course_name,
                s.name as subject_name, 
                s.code as subject_code, 
                s.course_cd as subject_course_cd,
                s.semester as subject_semester,
                b.code as batch_code,
                d.name as department_name,
                p.sections
         FROM examination_papers p 
         LEFT JOIN courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
         LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
         LEFT JOIN batches b ON p.batch_id::text = b.id::text 
         LEFT JOIN departments d ON p.department_id::text = d.id::text
         ${whereClause} 
         ORDER BY COALESCE(p.updated_at, p.created_at, '1970-01-01'::timestamptz) DESC, p.id DESC`,
        params,
      );
    } catch { return []; }
  }

  async hodQPAction(tenantSlug: string, user: any, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM examination_papers WHERE id::text = $1 LIMIT 1`,
      [dto.paperId],
    );
    if (!existing || existing.length === 0) {
      return { success: false, message: 'Question paper not found' };
    }
    const paper = existing[0];

    // Version safety check: Prevent approval of outdated version
    if (dto.version !== undefined && dto.version !== null && Number(paper.version || 1) !== Number(dto.version)) {
      return {
        success: false,
        message: `Version conflict: This paper has been revised to v${paper.version}. Please review the latest version before taking action.`,
      };
    }

    const actionRemarks = dto.remarks || dto.hodRemarks || dto.hod_remarks || dto.notes || null;

    if (dto.action === 'approve') {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = 'HOD_APPROVED', 
             hod_remarks = COALESCE($1, hod_remarks), 
             updated_at = NOW() 
         WHERE id::text = $2 RETURNING *`,
        [actionRemarks, dto.paperId],
      );
      return res[0] || { success: true, status: 'HOD_APPROVED' };
    } else {
      // Changes requested
      const newStatus = 'CHANGES_REQUESTED';
      const questionRemarksJson = JSON.stringify(dto.questionRemarks || {});
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = $1, 
             hod_remarks = $2, 
             question_remarks = $3::jsonb, 
             updated_at = NOW() 
         WHERE id::text = $4 RETURNING *`,
        [newStatus, actionRemarks || 'HOD requested revisions on specific questions.', questionRemarksJson, dto.paperId],
      );
      return res[0] || { success: true, status: newStatus };
    }
  }

  async getApprovedPapers(tenantSlug: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const params: any[] = [];
      let deptFilter = '';
      if (departmentId && this.isUUID(departmentId)) { deptFilter = `AND p.department_id::text = $1`; params.push(departmentId); }
      return await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT p.*, 
                c.name as course_name,
                s.name as subject_name, 
                s.code as subject_code, 
                s.course_cd as subject_course_cd,
                s.semester as subject_semester,
                b.code as batch_code,
                d.name as department_name,
                p.sections 
         FROM examination_papers p 
         LEFT JOIN courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
         LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
         LEFT JOIN batches b ON p.batch_id::text = b.id::text 
         LEFT JOIN departments d ON p.department_id::text = d.id::text
         WHERE p.status IN ('HOD_APPROVED', 'PUBLISHED') ${deptFilter} 
         ORDER BY COALESCE(p.updated_at, p.created_at, '1970-01-01'::timestamptz) DESC, p.id DESC`,
        params,
      );
    } catch {
      return [];
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
          colg_cd        VARCHAR(50),
          course_cd      VARCHAR(50),
          branch_cd      VARCHAR(50),
          batch_cd       VARCHAR(50),
          section        VARCHAR(50),
          created_at     TIMESTAMPTZ  DEFAULT NOW(),
          updated_at     TIMESTAMPTZ  DEFAULT NOW()
        );
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS hod_remarks TEXT;
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT';
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS section VARCHAR(50);
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS week_start DATE;
        ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS week_end DATE;
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
          colg_cd        VARCHAR(50),
          course_cd      VARCHAR(50),
          branch_cd      VARCHAR(50),
          batch_cd       VARCHAR(50),
          section        VARCHAR(50),
          created_at     TIMESTAMPTZ  DEFAULT NOW(),
          updated_at     TIMESTAMPTZ  DEFAULT NOW()
        );
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS hod_remarks TEXT;
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT';
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS section VARCHAR(50);
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS week_start DATE;
        ALTER TABLE public.timetable_drafts ADD COLUMN IF NOT EXISTS week_end DATE;
      `).catch(() => {});
    } catch (e: any) {
      this.logger.warn(`ensureTimetableDraftsTable: ${e.message}`);
    }
  }

  async createTimetableDraft(tenantSlug: string, user: any, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    const createdBy = user?.userId || user?.sub || user?.id || null;
    const rawSlots = Array.isArray(dto.slots) ? dto.slots : [];
    const slotsJson = JSON.stringify(rawSlots);

    try {
      // If updating an existing draft by ID
      if (dto.id && this.isUUID(dto.id)) {
        const updateRes = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE timetable_drafts 
           SET title = COALESCE($1, title), 
               department_id = COALESCE($2::uuid, department_id),
               batch_id = COALESCE($3::uuid, batch_id),
               semester = COALESCE($4, semester),
               academic_year = COALESCE($5, academic_year),
               slots = $6::jsonb,
               notes = COALESCE($7, notes),
               colg_cd = COALESCE($8, colg_cd),
               course_cd = COALESCE($9, course_cd),
               branch_cd = COALESCE($10, branch_cd),
               batch_cd = COALESCE($11, batch_cd),
               section = COALESCE($12, section),
               week_start = COALESCE($14, week_start),
               week_end = COALESCE($15, week_end),
               updated_at = NOW()
           WHERE id::text = $13 RETURNING *, week_start::text AS week_start, week_end::text AS week_end`,
          [
            dto.title || null,
            this.isUUID(dto.departmentId) ? dto.departmentId : null,
            this.isUUID(dto.batchId) ? dto.batchId : null,
            dto.semester || null,
            dto.academicYear || null,
            slotsJson,
            dto.notes || null,
            dto.colgCd || null,
            dto.courseCd || null,
            dto.branchCd || null,
            dto.batchCd || null,
            dto.section || null,
            dto.id,
            dto.weekStart || null,
            dto.weekEnd || null,
          ],
        );
        if (updateRes && updateRes.length > 0) {
          this.dispatchTimetableScheduleNotifications(slug, updateRes[0]).catch(() => {});
          return updateRes[0];
        }
      }

      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO timetable_drafts (
           title, department_id, batch_id, semester, academic_year, slots, status, notes, created_by,
           colg_cd, course_cd, branch_cd, batch_cd, section, week_start, week_end, created_at, updated_at
         ) VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6::jsonb, 'DRAFT', $7, $8::uuid, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()) RETURNING *, week_start::text AS week_start, week_end::text AS week_end`,
        [
          dto.title,
          this.isUUID(dto.departmentId) ? dto.departmentId : null,
          this.isUUID(dto.batchId) ? dto.batchId : null,
          dto.semester || null,
          dto.academicYear || null,
          slotsJson,
          dto.notes || null,
          this.isUUID(createdBy) ? createdBy : null,
          dto.colgCd || null,
          dto.courseCd || null,
          dto.branchCd || null,
          dto.batchCd || null,
          dto.section || null,
          dto.weekStart || null,
          dto.weekEnd || null,
        ],
      );
      const saved = res[0] || { success: true };
      this.dispatchTimetableScheduleNotifications(slug, saved).catch(() => {});
      return saved;
    } catch (err: any) {
      this.logger.warn(`createTimetableDraft: ${err.message}`);
      return { success: true, message: 'Draft saved', dto };
    }
  }

  async deleteTimetableDraft(tenantSlug: string, draftId: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `DELETE FROM timetable_drafts WHERE id::text = $1`,
        [draftId],
      );
      return { success: true, message: 'Timetable draft deleted' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async submitTimetableDraftForApproval(tenantSlug: string, user: any, draftId: string, notes?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE timetable_drafts SET status = 'PENDING_HOD_APPROVAL', updated_at = NOW() WHERE id::text = $1 RETURNING *, week_start::text AS week_start, week_end::text AS week_end`,
        [draftId],
      );
      const submitted = res[0] || { success: true, message: 'Submitted for HOD approval' };
      this.dispatchTimetableScheduleNotifications(slug, submitted).catch(() => {});
      return submitted;
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
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      return await this.tenantSchemaService.queryInTenant(slug, `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM timetable_drafts ${where} ORDER BY updated_at DESC, created_at DESC`, params);
    } catch { return []; }
  }

  async getPendingTimetableForHod(tenantSlug: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const params: any[] = ['PENDING_HOD_APPROVAL'];
      let deptFilter = '';
      if (departmentId && this.isUUID(departmentId)) { deptFilter = `AND department_id::text = $2`; params.push(departmentId); }
      return await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM timetable_drafts 
         WHERE status = $1 
           AND (slots IS NOT NULL AND jsonb_array_length(slots) > 0)
           ${deptFilter} 
         ORDER BY updated_at DESC, created_at DESC`,
        params,
      );

    } catch { return []; }
  }

  async hodTimetableAction(tenantSlug: string, user: any, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    const newStatus = dto.action === 'approve' ? 'HOD_APPROVED' : 'HOD_REJECTED';

    // Block approval if any slot is still PENDING
    if (dto.action === 'approve') {
      const checkRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT slots FROM timetable_drafts WHERE id::text = $1`,
        [dto.draftId],
      ).catch(() => []);
      if (checkRows && checkRows.length > 0) {
        const rawSlots = checkRows[0].slots;
        const checkSlots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
        const hasPending = checkSlots.some(
          (s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING',
        );
        if (hasPending) {
          throw new BadRequestException(
            'Cannot approve: all faculty must link their Schedule Planner slots before approval. ' +
            `${checkSlots.filter((s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING').length} slot(s) are still PENDING.`,
          );
        }
      }
    }

    try {
      const slotsJson = dto.slots ? JSON.stringify(dto.slots) : null;
      let res;
      if (slotsJson) {
        res = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE timetable_drafts 
           SET status = $1, 
               hod_remarks = $2, 
               slots = $3::jsonb, 
               updated_at = NOW() 
           WHERE id::text = $4 
           RETURNING *`,
          [newStatus, dto.remarks || null, slotsJson, dto.draftId],
        );
      } else {
        res = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE timetable_drafts 
           SET status = $1, 
               hod_remarks = $2, 
               updated_at = NOW() 
           WHERE id::text = $3 
           RETURNING *`,
          [newStatus, dto.remarks || null, dto.draftId],
        );
      }

      // On approval, persist all draft slots into timetable_slots with status = 'APPROVED'
      if (dto.action === 'approve') {
        const draftRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT * FROM timetable_drafts WHERE id::text = $1`,
          [dto.draftId],
        );
        const draft = draftRows?.[0];
        if (draft) {
          const rawSlots = draft.slots;
          const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);

          // Clear any previous slots from this draft to avoid duplicates
          await this.tenantSchemaService.queryInTenant(
            slug,
            `DELETE FROM timetable_slots WHERE draft_id = $1::uuid`,
            [dto.draftId],
          ).catch(() => {});

          for (const sl of slots) {
            try {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `INSERT INTO timetable_slots (
                   faculty_id, subject_id, department_id, batch_id, day_of_week,
                   start_time, end_time, room, slot_type, effective_from, effective_until,
                   group_name, topic, competency_codes, unit_name, unit_id, sub_topics,
                   colg_cd, course_cd, branch_cd, batch_cd, semester, section, description,
                   status, draft_id
                 ) VALUES (
                   $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5,
                   $6::TIME, $7::TIME, $8, $9, $10, $11,
                   $12, $13, $14, $15, $16, $17,
                   $18, $19, $20, $21, $22, $23, $24,
                   'APPROVED', $25::uuid
                 )`,
                [
                  this.isUUID(sl.facultyId || sl.faculty_id) ? (sl.facultyId || sl.faculty_id) : null,
                  this.isUUID(sl.subjectId || sl.subject_id) ? (sl.subjectId || sl.subject_id) : null,
                  this.isUUID(sl.departmentId || sl.department_id || draft.department_id) ? (sl.departmentId || sl.department_id || draft.department_id) : null,
                  this.isUUID(sl.batchId || sl.batch_id || draft.batch_id) ? (sl.batchId || sl.batch_id || draft.batch_id) : null,
                  Number(sl.dayOfWeek || sl.day_of_week || 1),
                  sl.startTime || sl.start_time || '09:00:00',
                  sl.endTime || sl.end_time || '10:00:00',
                  sl.room || null,
                  sl.slotType || sl.slot_type || 'Lecture',
                  sl.effectiveFrom ? new Date(sl.effectiveFrom) : null,
                  (() => {
                    if (!sl.effectiveUntil) return null;
                    const uDate = new Date(sl.effectiveUntil);
                    if (sl.effectiveFrom) {
                      const fDate = new Date(sl.effectiveFrom);
                      const fDay = fDate.getDay();
                      const fDiff = fDate.getDate() - fDay + (fDay === 0 ? -6 : 1);
                      const sun = new Date(fDate.getFullYear(), fDate.getMonth(), fDiff + 6, 23, 59, 59, 999);
                      if (uDate > sun) return sun;
                    }
                    return uDate;
                  })(),
                  sl.groupName || sl.group_name || 'All Group',
                  sl.topic || null,
                  sl.competencyCodes || sl.competency_codes || null,
                  sl.unitName || sl.unit_name || null,
                  sl.unitId || sl.unit_id || null,
                  sl.subTopics || sl.sub_topics || null,
                  sl.colgcd || sl.colgCd || sl.colg_cd || draft.colg_cd || '1',
                  sl.coursecd || sl.courseCd || sl.course_cd || draft.course_cd || null,
                  sl.branchcd || sl.branchCd || sl.branch_cd || draft.branch_cd || null,
                  sl.batchcd || sl.batchCd || sl.batch_cd || draft.batch_cd || null,
                  sl.semester || draft.semester || null,
                  sl.section || draft.section || null,
                  sl.description || `${sl.subject_name || sl.topic || 'Lecture'} ${sl.faculty_name || ''}`.trim(),
                  dto.draftId,
                ],
              );
            } catch (insErr: any) {
              this.logger.warn(`Failed to insert slot from approved draft into timetable_slots: ${insErr.message}`);
            }
          }
        }
      }

      return res[0] || { success: true, status: newStatus };
    } catch { return { success: true, status: newStatus }; }
  }

  async getApprovedTimetable(tenantSlug: string, departmentId?: string, batchId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const conditions: string[] = [
        `status = $1`,
        `(slots IS NOT NULL AND jsonb_array_length(slots) > 0)`,
      ];
      const params: any[] = ['HOD_APPROVED'];
      let idx = 2;
      if (departmentId && this.isUUID(departmentId)) { conditions.push(`department_id::text = $${idx++}`); params.push(departmentId); }
      if (batchId && this.isUUID(batchId)) { conditions.push(`batch_id::text = $${idx++}`); params.push(batchId); }
      return await this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM timetable_drafts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`, params);
    } catch { return []; }
  }

  /** Get a single timetable draft by ID */
  async getDraftById(tenantSlug: string, draftId: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM timetable_drafts WHERE id::text = $1 LIMIT 1`,
        [draftId],
      );
      return rows?.[0] || null;
    } catch { return null; }
  }

  /**
   * Faculty: Get weeks whose drafts are PENDING_HOD_APPROVAL or HOD_APPROVED,
   * filtered to only slots where faculty_id or faculty_emp_id matches.
   */
  async getDraftsByWeekForFaculty(tenantSlug: string, facultyId: string, facultyEmpId?: string, facultyName?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT t.*, t.week_start::text AS week_start, t.week_end::text AS week_end FROM timetable_drafts t
         WHERE t.status IN ('DRAFT', 'PENDING_HOD_APPROVAL', 'HOD_APPROVED')
           AND t.slots IS NOT NULL
           AND jsonb_array_length(t.slots) > 0
         ORDER BY t.week_start DESC NULLS LAST, t.updated_at DESC`,
        [],
      );
      const fName = (facultyName || '').trim().toLowerCase();
      // Filter server-side to only include drafts that have at least one slot for this faculty
      return (rows || []).map((draft: any) => {
        const rawSlots = draft.slots;
        const allSlots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
        const mySlots = allSlots.filter((s: any) => {
          const slotFacId = String(s.facultyId || s.faculty_id || '').trim();
          const slotEmpId = String(s.facultyEmpId || s.faculty_emp_id || s.faculty_code || '').trim();
          const slotName = String(s.facultyName || s.faculty_name || '').trim().toLowerCase();
          return (
            (facultyId && slotFacId && slotFacId === facultyId) ||
            (facultyEmpId && slotEmpId && slotEmpId === facultyEmpId) ||
            (fName && slotName && (slotName.includes(fName) || fName.includes(slotName)))
          );
        });
        if (mySlots.length === 0) return null;
        return { ...draft, slots: mySlots };
      }).filter(Boolean);
    } catch { return []; }
  }

  /**
   * Faculty: Link unit/topic/subTopic to a specific slot in a draft.
   * Sets mappingStatus = 'LINKED' on the slot.
   */
  async facultyLinkSlot(tenantSlug: string, dto: {
    draftId: string;
    slotId: string;
    unitId?: string;
    unitName?: string;
    topic?: string;
    subTopics?: string;
    competencyCodes?: string;
  }) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT slots FROM timetable_drafts WHERE id::text = $1 LIMIT 1`,
        [dto.draftId],
      );
      if (!rows || rows.length === 0) throw new Error('Draft not found');
      const rawSlots = rows[0].slots;
      let slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
      let matched = false;
      slots = slots.map((s: any) => {
        if (String(s.id) === String(dto.slotId)) {
          matched = true;
          return {
            ...s,
            unitId: dto.unitId || s.unitId || s.unit_id,
            unit_id: dto.unitId || s.unitId || s.unit_id,
            unitName: dto.unitName || s.unitName || s.unit_name,
            unit_name: dto.unitName || s.unitName || s.unit_name,
            topic: dto.topic || s.topic,
            subTopics: dto.subTopics || s.subTopics || s.sub_topics,
            sub_topics: dto.subTopics || s.subTopics || s.sub_topics,
            competencyCodes: dto.competencyCodes || s.competencyCodes || s.competency_codes,
            competency_codes: dto.competencyCodes || s.competencyCodes || s.competency_codes,
            curriculumMappings: (dto as any).curriculumMappings || s.curriculumMappings || undefined,
            mappingStatus: 'LINKED',
            mapping_status: 'LINKED',
          };
        }
        return s;
      });
      if (!matched) throw new Error(`Slot ${dto.slotId} not found in draft`);
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE timetable_drafts SET slots = $1::jsonb, updated_at = NOW() WHERE id::text = $2`,
        [JSON.stringify(slots), dto.draftId],
      );
      return { success: true, message: 'Slot linked successfully', slots };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to link slot');
    }
  }

  /**
   * Clerk: Copy a draft's slots to the next week (creates a new DRAFT).
   * New draft has all slots with mappingStatus = 'PENDING'.
   */
  async copyDraftToNextWeek(tenantSlug: string, user: any, draftId: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM timetable_drafts WHERE id::text = $1 LIMIT 1`,
      [draftId],
    ).catch(() => []);
    if (!rows || rows.length === 0) throw new BadRequestException('Draft not found');
    const src = rows[0];
    const rawSlots = src.slots;
    const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);

    // Advance week_start / week_end by 7 days without timezone shift
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let srcDate = new Date();
    if (src.week_start) {
      if (src.week_start instanceof Date) {
        srcDate = new Date(src.week_start.getFullYear(), src.week_start.getMonth(), src.week_start.getDate());
      } else {
        const str = String(src.week_start).slice(0, 10);
        if (str.includes('-')) {
          const parts = str.split('-').map(Number);
          srcDate = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          srcDate = new Date(src.week_start);
        }
      }
    } else {
      const day = srcDate.getDay();
      const diff = srcDate.getDate() - day + (day === 0 ? -6 : 1);
      srcDate = new Date(srcDate.getFullYear(), srcDate.getMonth(), diff);
    }
    const nextStart = new Date(srcDate.getFullYear(), srcDate.getMonth(), srcDate.getDate() + 7);
    const nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() + 6);
    const nextStartStr = toYMD(nextStart);
    const nextEndStr = toYMD(nextEnd);

    // Keep slot copy (day, time, subject, faculty, room) but CLEAR unit, topic, subtopic for next week faculty planning
    const newSlots = slots.map((s: any) => {
      const dow = Number(s.dayOfWeek || s.day_of_week || 1);
      const slotTargetDate = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() + (dow - 1));
      const slotYmd = toYMD(slotTargetDate);
      const startTime = (s.startTime || s.start_time || '09:00').slice(0, 5);
      const endTime = (s.endTime || s.end_time || '10:00').slice(0, 5);

      let srmsPayload = s.srmsPayload;
      if (srmsPayload && typeof srmsPayload === 'object') {
        const improper = srmsPayload.improperEvent ? { ...srmsPayload.improperEvent } : undefined;
        if (improper) {
          improper.start = `${slotYmd} ${startTime} `;
          improper.end = `${slotYmd} ${endTime} `;
          improper.unit_id = '';
          improper.unit_name = '';
          improper.topic = '';
          improper.sub_topics = '';
          improper.competency_codes = '';
          improper.hodRemark = '';
          improper.hod_remark = '';
        }
        srmsPayload = {
          ...srmsPayload,
          improperEvent: improper,
        };
      }

      return {
        ...s,
        id: `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        mappingStatus: 'PENDING',
        mapping_status: 'PENDING',
        curriculumMappings: undefined,
        unitId: '',
        unit_id: '',
        unitName: '',
        unit_name: '',
        topic: '',
        subTopics: '',
        sub_topics: '',
        competencyCodes: '',
        competency_codes: '',
        effectiveFrom: nextStartStr,
        effectiveUntil: nextEndStr,
        effective_from: nextStartStr,
        effective_until: nextEndStr,
        hodRemark: undefined,
        hod_remark: undefined,
        remark: undefined,
        srmsPayload,
      };
    });

    const createdBy = user?.userId || user?.sub || user?.id || null;
    const newTitle = `Week of ${nextStartStr} – ${nextEndStr}`;
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO timetable_drafts (
         title, department_id, batch_id, semester, academic_year, slots, status, notes, created_by,
         colg_cd, course_cd, branch_cd, batch_cd, section, week_start, week_end, hod_remarks, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'DRAFT', $7, $8, $9, $10, $11, $12, $13, $14, $15, NULL, NOW(), NOW()) RETURNING *`,
      [
        newTitle,
        src.department_id || null,
        src.batch_id || null,
        src.semester || null,
        src.academic_year || null,
        JSON.stringify(newSlots),
        src.notes || null,
        this.isUUID(createdBy) ? createdBy : null,
        src.colg_cd || null,
        src.course_cd || null,
        src.branch_cd || null,
        src.batch_cd || null,
        src.section || null,
        nextStartStr,
        nextEndStr,
      ],
    );
    const created = res[0] || { success: true };
    this.dispatchTimetableScheduleNotifications(slug, created).catch(() => {});
    return created;
  }

  /**
   * Dispatch notification alerts to assigned faculties and HOD when clerk schedules lectures
   */
  async dispatchTimetableScheduleNotifications(tenantSlug: string, draft: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    try {
      const rawSlots = draft?.slots;
      const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
      if (!slots || slots.length === 0) return;

      const draftTitle = draft.title || 'Weekly Timetable';
      const weekStart = draft.week_start ? String(draft.week_start).slice(0, 10) : '';
      const weekEnd = draft.week_end ? String(draft.week_end).slice(0, 10) : '';
      const dateRangeStr = weekStart && weekEnd ? ` (Week: ${weekStart} to ${weekEnd})` : '';

      await this.tenantSchemaService.queryInTenant(slug, `
        CREATE TABLE IF NOT EXISTS "${schema}".notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id TEXT,
          title TEXT,
          message TEXT,
          body TEXT,
          type TEXT,
          category TEXT,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE "${schema}".notifications ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE "${schema}".notifications ADD COLUMN IF NOT EXISTS body TEXT;
      `).catch(() => {});

      const facMap = new Map<string, { facultyId: string; facultyEmpId: string; facultyName: string; slots: any[]; subjects: Set<string> }>();
      for (const s of slots) {
        const facId = String(s.facultyId || s.faculty_id || '').trim();
        const facEmpId = String(s.facultyEmpId || s.faculty_emp_id || s.faculty_code || '').trim();
        const facName = String(s.facultyName || s.faculty_name || '').trim();
        const key = facEmpId || facId || facName;
        if (!key) continue;

        if (!facMap.has(key)) {
          facMap.set(key, { facultyId: facId, facultyEmpId: facEmpId, facultyName: facName, slots: [], subjects: new Set() });
        }
        const entry = facMap.get(key)!;
        entry.slots.push(s);
        const sub = s.subjectName || s.subject_name || s.subject || s.subjectCode || '';
        if (sub) entry.subjects.add(sub);
      }

      // 1. Notify each Faculty
      for (const [, fac] of facMap.entries()) {
        const pendingCnt = fac.slots.filter((s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
        const subList = Array.from(fac.subjects).slice(0, 3).join(', ');
        const title = `🗓️ Weekly Schedule Added: Planning Required`;
        const message = `Clerk scheduled ${fac.slots.length} lecture(s) for you (${subList || 'Curriculum'}) in ${draftTitle}${dateRangeStr}. ${pendingCnt > 0 ? `${pendingCnt} lecture(s) need topic & syllabus linking in Schedule Planner.` : 'All currently linked.'}`;

        const recId = fac.facultyEmpId || fac.facultyId || fac.facultyName;
        if (recId) {
          const dupCheck = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id FROM notifications WHERE recipient_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '4 hours' LIMIT 1`,
            [recId, title],
          ).catch(() => []);

          if (!dupCheck || dupCheck.length === 0) {
            await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $3, 'warning', 'timetable', false, NOW())`,
              [recId, title, message],
            ).catch(() => {});
          }
        }
      }

      // 2. Notify HOD
      const hodTitle = `📅 Clerk Scheduled Lectures Awaiting Review`;
      const hodMsg = `Clerk has scheduled ${slots.length} lecture(s) across ${facMap.size} faculty member(s) for ${draftTitle}${dateRangeStr}. Awaiting faculty curriculum linking before HOD approval.`;
      const dupHod = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM notifications WHERE (recipient_id = 'HOD' OR recipient_id = 'ALL_HODS') AND title = $1 AND created_at > NOW() - INTERVAL '4 hours' LIMIT 1`,
        [hodTitle],
      ).catch(() => []);

      if (!dupHod || dupHod.length === 0) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
           VALUES (gen_random_uuid(), 'HOD', $1, $2, $2, 'info', 'timetable', false, NOW())`,
          [hodTitle, hodMsg],
        ).catch(() => {});
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
           VALUES (gen_random_uuid(), 'ALL_HODS', $1, $2, $2, 'info', 'timetable', false, NOW())`,
          [hodTitle, hodMsg],
        ).catch(() => {});
      }
    } catch (err: any) {
      this.logger.warn(`dispatchTimetableScheduleNotifications error: ${err.message}`);
    }
  }

  /**
   * HOD: Get compliance breakdown of which faculties have linked vs pending schedule planner slots
   */
  async getFacultyTimetableCompliance(tenantSlug: string, draftId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      let drafts: any[] = [];
      if (draftId && this.isUUID(draftId)) {
        drafts = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM timetable_drafts WHERE id::text = $1`,
          [draftId],
        );
      } else {
        drafts = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM timetable_drafts 
           WHERE status IN ('DRAFT', 'PENDING_HOD_APPROVAL') AND slots IS NOT NULL AND jsonb_array_length(slots) > 0
           ORDER BY week_start DESC NULLS LAST, updated_at DESC LIMIT 10`,
          [],
        );
      }

      const facMap = new Map<string, {
        facultyId: string;
        facultyEmpId: string;
        facultyName: string;
        totalSlots: number;
        linkedSlots: number;
        pendingSlots: number;
        drafts: Array<{ id: string; title: string; weekStart?: string; weekEnd?: string }>;
        pendingSlotList: any[];
        subjects: string[];
      }>();

      for (const d of drafts) {
        const rawSlots = d.slots;
        const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
        for (const s of slots) {
          const facId = String(s.facultyId || s.faculty_id || '').trim();
          const facEmpId = String(s.facultyEmpId || s.faculty_emp_id || s.faculty_code || '').trim();
          const facName = String(s.facultyName || s.faculty_name || '').trim();
          const key = facEmpId || facId || facName;
          if (!key) continue;

          if (!facMap.has(key)) {
            facMap.set(key, {
              facultyId: facId,
              facultyEmpId: facEmpId,
              facultyName: facName || facEmpId || 'Faculty',
              totalSlots: 0,
              linkedSlots: 0,
              pendingSlots: 0,
              drafts: [],
              pendingSlotList: [],
              subjects: [],
            });
          }
          const item = facMap.get(key)!;
          item.totalSlots++;
          const isLinked = s.mappingStatus === 'LINKED';
          if (isLinked) {
            item.linkedSlots++;
          } else {
            item.pendingSlots++;
            item.pendingSlotList.push({
              id: s.id,
              dayOfWeek: s.dayOfWeek || s.day_of_week || 1,
              startTime: s.startTime || s.start_time || '',
              endTime: s.endTime || s.end_time || '',
              subjectName: s.subjectName || s.subject_name || s.subject || '',
              subjectCode: s.subjectCode || s.subject_code || '',
              room: s.room || '',
              draftId: d.id,
              draftTitle: d.title,
            });
          }

          const subName = s.subjectName || s.subject_name || s.subject || s.subjectCode || '';
          if (subName && !item.subjects.includes(subName)) {
            item.subjects.push(subName);
          }

          if (!item.drafts.some((x) => x.id === d.id)) {
            item.drafts.push({
              id: d.id,
              title: d.title,
              weekStart: d.week_start,
              weekEnd: d.week_end,
            });
          }
        }
      }

      const facultyCompliance = Array.from(facMap.values()).map((f) => {
        const complianceStatus = f.pendingSlots === 0 && f.totalSlots > 0 ? 'COMPLETED' : f.linkedSlots === 0 ? 'NOT_STARTED' : 'PARTIAL';
        const compliancePct = f.totalSlots > 0 ? Math.round((f.linkedSlots / f.totalSlots) * 100) : 100;
        return {
          ...f,
          complianceStatus,
          compliancePct,
        };
      }).sort((a, b) => a.compliancePct - b.compliancePct);

      const totalPendingFaculties = facultyCompliance.filter((f) => f.pendingSlots > 0).length;

      return {
        success: true,
        drafts,
        facultyCompliance,
        totalPendingFaculties,
      };
    } catch (err: any) {
      return { success: false, drafts: [], facultyCompliance: [], totalPendingFaculties: 0 };
    }
  }

  /**
   * HOD: Send an urgent reminder to a specific faculty member to link their schedule planner
   */
  async remindFacultyForPlanning(
    tenantSlug: string,
    dto: {
      draftId: string;
      facultyId?: string;
      facultyEmpId?: string;
      facultyName?: string;
      customMessage?: string;
    },
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const draftRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT title, week_start::text AS week_start, week_end::text AS week_end FROM timetable_drafts WHERE id::text = $1`,
        [dto.draftId],
      ).catch(() => []);
      const draft = draftRows?.[0];
      const draftTitle = draft?.title || 'Weekly Timetable';
      const dates = draft?.week_start ? ` (${draft.week_start} – ${draft.week_end})` : '';

      const recId = (dto.facultyEmpId || dto.facultyId || dto.facultyName || '').trim();
      if (!recId) throw new BadRequestException('Faculty identifier is required');

      const title = `⚠️ URGENT: Link Syllabus in Schedule Planner`;
      const message = dto.customMessage || `HOD has requested you to link your curriculum topics & syllabus for ${draftTitle}${dates}. Timetable approval is currently blocked until all lectures are linked.`;

      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $3, 'warning', 'timetable', false, NOW())`,
        [recId, title, message],
      );

      return {
        success: true,
        message: `Reminder sent to ${dto.facultyName || recId}`,
      };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to send reminder');
    }
  }
}

