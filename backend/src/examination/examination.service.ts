import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateExamPaperDto, SubmitResultDto } from './dto/examination.dto';
import {
  computePaperScore,
  computeEffectiveMax,
  validatePaperSnapshot,
  generateQuestionsFromBlueprint,
  PaperSnapshot,
  StudentAttempt,
  QuestionDefinition,
  OverAttemptPolicy,
  MarksMode,
  DEFAULT_SCORING_SETTINGS,
} from '@mederp/shared';

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
    let validDeptId = rawDeptId && this.isUUID(rawDeptId) ? rawDeptId : null;
    let finalColgCd = dto.colgCd || dto.colg_cd || null;
    let finalCourseCd = dto.courseCd || dto.course_cd || null;
    let finalBranchCd = dto.branchCd || dto.branch_cd || null;
    let finalBatchCd = dto.batchCd || dto.batch_cd || null;
    let finalSemester = dto.semester || null;
    let finalAcademicYear = dto.academicYear || dto.academic_year || null;
    let validBatchId = dto.batchId && this.isUUID(dto.batchId) ? dto.batchId : null;

    // Resolve Department UUID if not already a UUID or if branch/course maps to a department
    if (!validDeptId && (finalBranchCd || finalCourseCd)) {
      try {
        const foundDept = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM departments WHERE code = $1 OR code = $2 LIMIT 1`,
          [String(finalBranchCd || ''), String(finalCourseCd || '')],
        );
        if (foundDept && foundDept.length > 0) {
          validDeptId = foundDept[0].id;
        }
      } catch {}
    }

    // FIX: If department_id is still not resolved, fall back to the creating faculty's department_id.
    // This ensures papers are always tagged to the correct department even if the frontend omits it.
    if (!validDeptId && validUserId) {
      try {
        const facRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT department_id FROM faculty WHERE user_id::text = $1::text AND department_id IS NOT NULL LIMIT 1`,
          [validUserId],
        );
        if (facRows && facRows.length > 0 && facRows[0].department_id) {
          validDeptId = facRows[0].department_id;
        }
      } catch {}
    }

        // Resolve Subject UUID if non-UUID code is provided
    let validSubjId = dto.subjectId && this.isUUID(dto.subjectId) ? dto.subjectId : null;
    let subjRow: any = null;
    try {
      const sTarget = validSubjId || dto.subjectId || dto.code;
      if (sTarget) {
        const foundSubj = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, course_cd, branch_cd, batch_cd, sem_cd, batch_id, department_id FROM subjects WHERE id::text = $1 OR code = $1 OR $2 ILIKE (code || '%') LIMIT 1`,
          [sTarget, sTarget],
        );
        if (foundSubj && foundSubj.length > 0) {
          validSubjId = foundSubj[0].id;
          subjRow = foundSubj[0];
        }
      }
    } catch {}

    if (subjRow) {
      if (!finalCourseCd && subjRow.course_cd) finalCourseCd = String(subjRow.course_cd);
      if (!finalBranchCd && subjRow.branch_cd) finalBranchCd = String(subjRow.branch_cd);
      if (!finalBatchCd && subjRow.batch_cd) finalBatchCd = String(subjRow.batch_cd);
      if (!finalSemester && subjRow.sem_cd) finalSemester = String(subjRow.sem_cd);
      if (!validBatchId && subjRow.batch_id) validBatchId = subjRow.batch_id;
      if (!validDeptId && subjRow.department_id) validDeptId = subjRow.department_id;
      if (!finalColgCd && slug.toLowerCase().includes('srms')) finalColgCd = '1';
    }

    // Resolve Batch UUID if non-UUID batch is provided
    if (!validBatchId && (dto.batchCd || finalBatchCd)) {
      try {
        const bTarget = dto.batchCd || finalBatchCd;
        const foundBatch = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM batches WHERE batch_cd = $1 OR code = $1 OR name ILIKE ('%' || $1 || '%') LIMIT 1`,
          [bTarget],
        );
        if (foundBatch && foundBatch.length > 0) {
          validBatchId = foundBatch[0].id;
        }
      } catch {}
    }

    try {
      // Validate paper structure & choice groups using shared engine
      if (dto.sections && Array.isArray(dto.sections)) {
        const validation = this.validatePaper({ ...dto, sections: dto.sections });
        if (!validation.isValid) {
          throw new BadRequestException(`Paper validation failed: ${validation.errors.join('; ')}`);
        }
        if (validation.effectiveMaxMarks > 0) {
          dto.maxMarks = validation.effectiveMaxMarks;
          if (!dto.passingMarks || dto.passingMarks === 0) {
            dto.passingMarks = Math.round(validation.effectiveMaxMarks * 0.4);
          }
        }
      }

      const validId = dto.id && this.isUUID(dto.id) ? dto.id : null;
      const existing = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, status, version, created_by FROM examination_papers WHERE ($1::uuid IS NOT NULL AND id = $1::uuid) OR ($2::text IS NOT NULL AND code = $2) LIMIT 1`,
        [validId, dto.code || null],
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

        const isApprovedStatus = prevStatus === 'HOD_APPROVED' || prevStatus === 'DQAC_APPROVED' || prevStatus === 'APPROVED' || prevStatus === 'PUBLISHED';
        if (isApprovedStatus && dto.status !== 'ARCHIVED' && !isAdmin) {
          throw new BadRequestException('This question paper has been approved by HOD and is locked against direct edits. Please clone as a new set.');
        }

        if (prevStatus === 'CHANGES_REQUESTED' && dto.status === 'PENDING_HOD_APPROVAL') {
          nextVersion = currentVersion + 1;
        } else if ((prevStatus === 'PUBLISHED' || prevStatus === 'APPROVED') && dto.status !== 'ARCHIVED') {
          // Published papers are immutable; edits create a new version with status DRAFT
          nextVersion = currentVersion + 1;
          nextStatus = 'DRAFT';
        }

        const paperSet = dto.paperSet || dto.paper_set || 'Set A';
        const targetSections = dto.targetSections || dto.target_sections || ['All'];
        const targetSectionsJson = JSON.stringify(Array.isArray(targetSections) ? targetSections : [targetSections]);

        const res = await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE examination_papers 
           SET code = COALESCE($1, code), 
               name = COALESCE($2, name), 
               subject_id = COALESCE($3, subject_id), 
               batch_id = COALESCE($4, batch_id), 
               exam_date = COALESCE($5, exam_date), 
               max_marks = COALESCE($6, max_marks), 
               passing_marks = COALESCE($7, passing_marks), 
               type = COALESCE($8, type), 
               duration_minutes = COALESCE($9, duration_minutes), 
               sections = COALESCE($10::jsonb, sections), 
               status = $11, 
               department_id = COALESCE($12, department_id), 
               colg_cd = COALESCE($13, colg_cd),
               course_cd = COALESCE($14, course_cd), 
               branch_cd = COALESCE($15, branch_cd), 
               batch_cd = COALESCE($16, batch_cd), 
               semester = COALESCE($17, semester), 
               section = COALESCE($18, section),
               academic_year = COALESCE($19, academic_year), 
               version = $20, 
               hod_remarks = COALESCE($21, hod_remarks),
               question_remarks = COALESCE($22::jsonb, question_remarks), 
               paper_set = COALESCE($23, paper_set),
               target_sections = COALESCE($24::jsonb, target_sections),
               created_by = COALESCE($25::uuid, created_by), 
               updated_at = NOW()
           WHERE id = $26 RETURNING *`,
          [
            dto.code || null,
            dto.name || null,
            validSubjId,
            validBatchId,
            dto.examDate || null,
            dto.maxMarks !== undefined ? Number(dto.maxMarks) : null,
            dto.passingMarks !== undefined ? Number(dto.passingMarks) : null,
            dto.type || null,
            dto.durationMinutes !== undefined ? Number(dto.durationMinutes) : null,
            (sectionsJson && sectionsJson !== "[]" && sectionsJson !== "{}") ? sectionsJson : (dto.sections ? JSON.stringify(dto.sections) : null),
            nextStatus,
            validDeptId,
            finalColgCd,
            finalCourseCd,
            finalBranchCd,
            finalBatchCd,
            finalSemester || dto.semester || null,
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

      if (!dto.code || !dto.name) {
        throw new BadRequestException("Paper code and name are required to create a new paper.");
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
            validSubjId,
            validBatchId,
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
            finalSemester || dto.semester || null,
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
          validSubjId,
          validBatchId,
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
          finalSemester || dto.semester || null,
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

  // ─── Assessment Settings & Pure Scoring Extensions ─────────────────────────

  /**
   * Reads tenant assessment settings (or defaults)
   */
  async getAssessmentSettings(tenantSlug: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT settings FROM tenants WHERE slug = $1 LIMIT 1`,
        [slug],
      ).catch(() => []);

      const raw = rows && rows[0]?.settings ? rows[0].settings : {};
      const assessmentSettings = raw.assessment || {};

      return {
        defaultOverAttemptPolicy: assessmentSettings.defaultOverAttemptPolicy || DEFAULT_SCORING_SETTINGS.defaultOverAttemptPolicy,
        defaultMarksMode: assessmentSettings.defaultMarksMode || DEFAULT_SCORING_SETTINGS.defaultMarksMode,
        allowPartialCredit: assessmentSettings.allowPartialCredit !== undefined ? Boolean(assessmentSettings.allowPartialCredit) : DEFAULT_SCORING_SETTINGS.allowPartialCredit,
        enforceUniformChoiceMarks: assessmentSettings.enforceUniformChoiceMarks !== undefined ? Boolean(assessmentSettings.enforceUniformChoiceMarks) : DEFAULT_SCORING_SETTINGS.enforceUniformChoiceMarks,
      };
    } catch {
      return DEFAULT_SCORING_SETTINGS;
    }
  }

  /**
   * Updates tenant assessment settings
   */
  async updateAssessmentSettings(tenantSlug: string, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, settings FROM tenants WHERE slug = $1 LIMIT 1`,
        [slug],
      ).catch(() => []);

      if (rows && rows.length > 0) {
        const id = rows[0].id;
        const current = rows[0].settings || {};
        const updated = {
          ...current,
          assessment: {
            ...(current.assessment || {}),
            ...dto,
          },
        };
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE tenants SET settings = $1::jsonb, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(updated), id],
        );
      }
      return await this.getAssessmentSettings(tenantSlug);
    } catch (e: any) {
      this.logger.error(`updateAssessmentSettings error: ${e.message}`);
      return DEFAULT_SCORING_SETTINGS;
    }
  }

  /**
   * Validates paper structure and calculates effective max marks
   */
  validatePaper(paperSnapshot: any) {
    const questionsMap: Record<string, QuestionDefinition> = {};
    if (paperSnapshot.questions) {
      if (Array.isArray(paperSnapshot.questions)) {
        paperSnapshot.questions.forEach((q: any) => { questionsMap[q.id] = q; });
      } else {
        Object.assign(questionsMap, paperSnapshot.questions);
      }
    }

    const normalizedSnapshot: PaperSnapshot = {
      ...paperSnapshot,
      questions: questionsMap,
      sections: Array.isArray(paperSnapshot.sections) ? paperSnapshot.sections : [],
      effectiveMaxMarks: 0,
    };

    const val = validatePaperSnapshot(normalizedSnapshot);
    const eff = computeEffectiveMax(normalizedSnapshot);

    return {
      isValid: val.isValid,
      errors: val.errors,
      warnings: [...val.warnings, ...eff.warnings],
      effectiveMaxMarks: eff.effectiveMax,
    };
  }

  /**
   * Authoritative scoring endpoint using pure shared scoring engine
   */
  async calculateScore(tenantSlug: string, dto: { paperSnapshot: any; studentAttempt: any; settings?: any }) {
    const tenantSettings = await this.getAssessmentSettings(tenantSlug);
    const mergedSettings = { ...tenantSettings, ...(dto.settings || {}) };

    const questionsMap: Record<string, QuestionDefinition> = {};
    if (dto.paperSnapshot.questions) {
      if (Array.isArray(dto.paperSnapshot.questions)) {
        dto.paperSnapshot.questions.forEach((q: any) => { questionsMap[q.id] = q; });
      } else {
        Object.assign(questionsMap, dto.paperSnapshot.questions);
      }
    }

    const normalizedSnapshot: PaperSnapshot = {
      ...dto.paperSnapshot,
      questions: questionsMap,
      sections: Array.isArray(dto.paperSnapshot.sections) ? dto.paperSnapshot.sections : [],
      effectiveMaxMarks: Number(dto.paperSnapshot.max_marks || dto.paperSnapshot.maxMarks || 0),
    };

    return computePaperScore(normalizedSnapshot, dto.studentAttempt, mergedSettings);
  }

  /**
   * Auto-generate questions from blueprint against tenant's question bank
   */
  async autoGenerateBlueprint(tenantSlug: string, dto: { criteria: any[]; seed?: number; subjectId?: string; subjectCode?: string; departmentId?: string }) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (dto.subjectId) {
      params.push(dto.subjectId);
      whereClauses.push(`q.subject_id::text = $${params.length}::text`);
    } else if (dto.subjectCode) {
      params.push(dto.subjectCode);
      whereClauses.push(`(q.subject_id IN (SELECT id FROM subjects WHERE code = $${params.length}))`);
    }

    if (dto.departmentId) {
      params.push(dto.departmentId);
      whereClauses.push(`q.department_id::text = $${params.length}::text`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT q.*, 
              u.name AS unit_name, u.code AS unit_code,
              t.name AS topic_name, t.code AS topic_code
       FROM question_bank q
       LEFT JOIN units u ON q.unit_id = u.id
       LEFT JOIN topics t ON q.topic_id = t.id
       ${whereSql}`,
      params,
    );

    const bank: QuestionDefinition[] = (rows || []).map((r: any) => ({
      id: r.id,
      code: r.code,
      text: r.question_text || r.text || '',
      type: r.mode === 'MCQ' ? ('MCQ_SINGLE' as any) : (r.mode === 'DESC' ? ('LONG_ANSWER' as any) : (r.type || ('MCQ_SINGLE' as any))),
      marks: Number(r.max_marks || r.marks || 1),
      topicId: r.topic_id,
      topicName: r.topic_name || r.topic,
      unitId: r.unit_id,
      unitCode: r.unit_code,
      difficulty: r.difficulty_level ? (r.difficulty_level.toUpperCase() as any) : undefined,
      bloomLevel: r.bloom_level ? (r.bloom_level.toUpperCase() as any) : undefined,
      options: [
        r.option_a ? { id: 'A', text: r.option_a, isCorrect: r.correct_option === 'A' } : null,
        r.option_b ? { id: 'B', text: r.option_b, isCorrect: r.correct_option === 'B' } : null,
        r.option_c ? { id: 'C', text: r.option_c, isCorrect: r.correct_option === 'C' } : null,
        r.option_d ? { id: 'D', text: r.option_d, isCorrect: r.correct_option === 'D' } : null,
      ].filter(Boolean) as any,
    }));

    return generateQuestionsFromBlueprint(bank, dto.criteria, dto.seed);
  }

  /**
   * Duplicate paper as next set or template
   */
  async duplicatePaper(tenantSlug: string, paperId: string, user: any, options?: { targetSet?: string; asTemplate?: boolean }) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM examination_papers WHERE id::text = $1 LIMIT 1`,
      [paperId],
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Paper with ID ${paperId} not found.`);
    }

    const p = existing[0];
    const targetSet = options?.targetSet || (p.paper_set === 'Set A' ? 'Set B' : (p.paper_set === 'Set B' ? 'Set C' : 'Set D'));
    const isTemplate = Boolean(options?.asTemplate);
    const newCode = `${p.code}-${targetSet.replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
    const newName = `${p.name} (${targetSet})`;

    const insertRes = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO examination_papers (
        code, name, subject_id, batch_id, exam_date, max_marks, passing_marks, 
        type, duration_minutes, sections, status, department_id, colg_cd, course_cd, 
        branch_cd, batch_cd, semester, section, academic_year, version, paper_set, 
        target_sections, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, 'DRAFT', $11, $12, $13, $14, $15, $16, $17, $18, 1, $19, $20::jsonb, $21, NOW(), NOW())
      RETURNING *`,
      [
        newCode,
        newName,
        p.subject_id,
        p.batch_id,
        p.exam_date,
        p.max_marks,
        p.passing_marks,
        p.type,
        p.duration_minutes,
        JSON.stringify(p.sections || []),
        p.department_id,
        p.colg_cd,
        p.course_cd,
        p.branch_cd,
        p.batch_cd,
        p.semester,
        p.section,
        p.academic_year,
        targetSet,
        JSON.stringify(p.target_sections || ['All']),
        user?.userId || user?.id || p.created_by,
      ],
    );

    return insertRes[0];
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
      subjectId?: string;
      role?: string;
      isExplicitDeptFilter?: boolean;
    },
    user?: any,
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const whereClauses: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // ─── ROLE-BASED QUESTION PAPER CONFIDENTIALITY ACCESS CONTROL ───
    // 1. Admin/SuperAdmin/Principal -> full preview across all departments
    // 2. HOD & DQAC of department -> can preview papers from their department
    // 3. Faculty -> STRICT CONFIDENTIALITY: can ONLY view question papers that he/she prepared/submitted.
    //    Once approved, paper shows ONLY to the particular faculty who created it.
    //    Rest of faculties from the same department CANNOT view it under any circumstances.
    const rawRole = (user?.role || filters?.role || '').toUpperCase();
    const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL' || rawRole === 'SUPERADMIN';
    const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
    const isDqac = rawRole === 'DQAC';
    const isFaculty = rawRole === 'FACULTY' || rawRole === 'TEACHER' || rawRole === 'INSTRUCTOR';

    const userId = user?.userId || user?.sub || user?.id || filters?.createdBy || filters?.facultyId || null;
    const validUserId = userId && this.isUUID(userId) ? userId : null;

    let hodScope: any = null;

    if (!isAdmin) {
      if (isDqac) {
        // DQAC is the institution-wide Quality Assurance Cell.
        // It audits papers across all departments/courses in the institution.
        // We do NOT restrict DQAC by teacher profile departmentId (which hid papers from other departments).
        // Any explicit department filter in query params is handled by the filters.departmentId check below.
      } else if (isHod) {
        // HOD can view all question papers created by faculty in their department/discipline scope
        hodScope = await this.resolveHodScope(slug, {
          departmentId: filters?.departmentId,
          userId: user?.userId || user?.sub || user?.id,
          empId: user?.emp_id || user?.empId,
          courseCd: filters?.courseCd,
          user,
        });

        if (hodScope.isRestricted && hodScope.departmentIds.length > 0) {
          whereClauses.push(`(
            p.department_id::text = ANY($${pIdx}::text[])
            OR EXISTS (
              SELECT 1 FROM departments d_scope
              WHERE d_scope.id::text = ANY($${pIdx}::text[])
                AND (
                  (p.department_id::text = d_scope.id::text)
                  OR (
                    p.course_cd IS NOT NULL AND d_scope.course_cd IS NOT NULL AND p.course_cd = d_scope.course_cd
                    AND p.branch_cd IS NOT NULL AND d_scope.branch_cd IS NOT NULL AND p.branch_cd = d_scope.branch_cd
                  )
                )
            )
            OR EXISTS (
              SELECT 1 FROM faculty f2
              WHERE (f2.user_id::text = p.created_by::text OR f2.id::text = p.created_by::text OR f2.id::text = p.faculty_id::text)
                AND f2.department_id::text = ANY($${pIdx}::text[])
            )
          )`);
          params.push(hodScope.departmentIds);
          pIdx++;
        }
      } else {
        // Faculty strictly sees ONLY their prepared question papers (creator only)
        // Even once DQAC/HOD approved, it only shows to the particular creator faculty.
        // Matches flexibly across UUID, employee ID, and faculty profile.
        const effectiveCreatorId = validUserId || filters?.createdBy || filters?.facultyId || userId;
        if (effectiveCreatorId) {
          whereClauses.push(`(
            p.created_by::text = $${pIdx}
            OR p.created_by::text IN (
              SELECT id::text FROM users WHERE id::text = $${pIdx} OR emp_id = $${pIdx} OR username = $${pIdx}
            )
            OR p.created_by::text IN (
              SELECT user_id::text FROM faculty WHERE id::text = $${pIdx} OR emp_id = $${pIdx}
            )
            OR p.created_by::text IN (
              SELECT id::text FROM faculty WHERE user_id::text = $${pIdx} OR emp_id = $${pIdx}
            )
            OR p.faculty_id::text = $${pIdx}
            OR p.faculty_id::text IN (
              SELECT id::text FROM faculty WHERE id::text = $${pIdx} OR user_id::text = $${pIdx} OR emp_id = $${pIdx}
            )
          )`);
          params.push(String(effectiveCreatorId));
          pIdx++;
        } else {
          // Strict confidentiality: Block leakage if faculty user is unidentifiable
          whereClauses.push(`1 = 0`);
        }
      }
    }

    if (filters?.status && filters.status !== 'ALL') {
      if (filters.status.includes(',')) {
        const statuses = filters.status.split(',').map(s => s.trim().toUpperCase());
        whereClauses.push(`UPPER(p.status) = ANY($${pIdx++})`);
        params.push(statuses);
      } else {
        whereClauses.push(`UPPER(p.status) = UPPER($${pIdx++})`);
        params.push(filters.status.trim());
      }
    }
    if (filters?.departmentId && this.isUUID(filters.departmentId)) {
      // For HOD, hodScope already constrains papers to all departments/branches linked to this HOD.
      // Do not restrict to a single department if it is the HOD profile department or if not an explicit sub-filter
      const isHodProfileDept = isHod && (
        filters.departmentId === user?.departmentId ||
        filters.departmentId === user?.department_id ||
        filters.departmentId === user?.fac_dept_id ||
        filters.departmentId === user?.deptId ||
        (hodScope?.departmentIds && hodScope.departmentIds.includes(filters.departmentId) && !filters.isExplicitDeptFilter)
      );
      if (!isHodProfileDept) {
        whereClauses.push(`p.department_id::text = ${pIdx++}`);
        params.push(filters.departmentId);
      }
    }
    if (filters?.colgCd) {
      whereClauses.push(`p.colg_cd = $${pIdx++}`);
      params.push(filters.colgCd);
    }
        if (filters?.subjectId) {
      whereClauses.push(`(p.subject_id::text = $${pIdx} OR s.code = $${pIdx} OR s.id::text = $${pIdx} OR s2.code = $${pIdx} OR p.code ILIKE ($${pIdx} || '%'))`);
      params.push(filters.subjectId);
      pIdx++;
    }

    if (filters?.courseCd) {
      whereClauses.push(`(p.course_cd = $${pIdx} OR (p.course_cd IS NULL AND (s.course_cd = $${pIdx} OR s2.course_cd = $${pIdx})))`);
      params.push(filters.courseCd);
      pIdx++;
    }
    if (filters?.branchCd) {
      whereClauses.push(`(p.branch_cd = $${pIdx} OR (p.branch_cd IS NULL AND (s.branch_cd = $${pIdx} OR s2.branch_cd = $${pIdx})))`);
      params.push(filters.branchCd);
      pIdx++;
    }
    if (filters?.batchCd) {
      whereClauses.push(`(p.batch_cd = $${pIdx} OR (p.batch_cd IS NULL AND (s.batch_cd = $${pIdx} OR s2.batch_cd = $${pIdx})))`);
      params.push(filters.batchCd);
      pIdx++;
    }
    if (filters?.semester) {
      whereClauses.push(`(p.semester = $${pIdx} OR (p.semester IS NULL AND (s.sem_cd = $${pIdx} OR s2.sem_cd = $${pIdx} OR s.semester ILIKE ('%' || $${pIdx} || '%'))))`);
      params.push(filters.semester);
      pIdx++;
    }
    if (filters?.section) {
      whereClauses.push(`(p.section = $${pIdx} OR p.target_sections::text ILIKE '%All%' OR p.section IS NULL)`);
      params.push(filters.section);
      pIdx++;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT p.*, 
              c.name as course_name,
              COALESCE(s.name, s2.name) as subject_name, 
              COALESCE(s.code, s2.code) as subject_code, 
              COALESCE(s.course_cd, s2.course_cd) as subject_course_cd,
              COALESCE(s.semester, s2.semester) as subject_semester,
              COALESCE(b.code, b2.code, p.batch_cd) as batch_code,
              COALESCE(b.name, b2.name, CASE WHEN p.batch_cd IS NOT NULL THEN 'Batch ' || p.batch_cd ELSE 'Current Batch' END) as batch_name,
              COALESCE(d.name, d2.name) as department_name
       FROM examination_papers p 
       LEFT JOIN courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
       LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
       LEFT JOIN subjects s2 ON (p.subject_id IS NULL AND (s2.code = p.code OR p.code ILIKE s2.code || '%') AND s2.code != '')
       LEFT JOIN batches b ON p.batch_id::text = b.id::text 
       LEFT JOIN batches b2 ON (p.batch_id IS NULL AND (p.batch_cd = b2.batch_cd OR p.batch_cd = b2.code))
       LEFT JOIN departments d ON p.department_id::text = d.id::text
       LEFT JOIN departments d2 ON (p.department_id IS NULL AND (p.branch_cd = d2.code OR p.course_cd = d2.code))
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
              c.name as course_name,
              COALESCE(s.name, s2.name) as subject_name, 
              COALESCE(s.code, s2.code) as subject_code, 
              COALESCE(s.course_cd, s2.course_cd) as subject_course_cd,
              COALESCE(s.semester, s2.semester) as subject_semester,
              COALESCE(b.code, b2.code, p.batch_cd) as batch_code,
              COALESCE(b.name, b2.name, CASE WHEN p.batch_cd IS NOT NULL THEN 'Batch ' || p.batch_cd ELSE 'Current Batch' END) as batch_name,
              COALESCE(d.name, d2.name) as department_name
       FROM examination_papers p 
       LEFT JOIN courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
       LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
       LEFT JOIN subjects s2 ON (p.subject_id IS NULL AND (s2.code = p.code OR p.code ILIKE s2.code || '%') AND s2.code != '')
       LEFT JOIN batches b ON p.batch_id::text = b.id::text 
       LEFT JOIN batches b2 ON (p.batch_id IS NULL AND (p.batch_cd = b2.batch_cd OR p.batch_cd = b2.code))
       LEFT JOIN departments d ON p.department_id::text = d.id::text
       LEFT JOIN departments d2 ON (p.department_id IS NULL AND (p.branch_cd = d2.code OR p.course_cd = d2.code))
       WHERE p.id::text = $1 LIMIT 1`,
      [id],
    );
    const paper = res[0] || null;
    if (!paper) return null;

    // Strict confidentiality check on paper preview
    if (user) {
      const rawRole = (user.role || '').toUpperCase();
      const isAdmin = rawRole === 'SUPER_ADMIN' || rawRole === 'ADMIN' || rawRole === 'PRINCIPAL' || rawRole === 'SUPERADMIN';
      const isHod = rawRole === 'HOD' || rawRole === 'HEAD_OF_DEPARTMENT';
      const isDqac = rawRole === 'DQAC';
      const isFaculty = rawRole === 'FACULTY' || rawRole === 'TEACHER' || rawRole === 'INSTRUCTOR';
      const userId = user.userId || user.sub || user.id || null;

      if (!isAdmin) {
        if (isHod || isDqac) {
          const targetDept = user.departmentId || user.department;
          if (targetDept && paper.department_id && String(paper.department_id) !== String(targetDept)) {
            throw new BadRequestException('Confidentiality violation: You are not authorized to view question papers outside your department.');
          }
        } else {
          // Strictly creator-only for faculties
          const isCreator = (paper.created_by && userId && String(paper.created_by) === String(userId)) ||
                            (paper.faculty_id && userId && String(paper.faculty_id) === String(userId));
          if (!isCreator) {
            throw new BadRequestException('Confidentiality violation: You are not authorized to view a question paper prepared by another faculty member.');
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
      let paperMaxMarks = 80;
      let paperSections: any[] = [];
      const paperCodeOrId = dto.paperCode || dto.paperId || '';

      const paperRes = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, sections, max_marks, passing_marks FROM examination_papers 
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
        paperMaxMarks = paperRes[0]?.max_marks ? Number(paperRes[0].max_marks) : 80;
        if (paperRes[0].sections) {
          paperSections = typeof paperRes[0].sections === 'string'
            ? JSON.parse(paperRes[0].sections)
            : paperRes[0].sections;
        }
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

      // ── Single Source of Truth Scoring Calculation ─────────────────────────
      let scoringBreakdown: any[] = [];
      let countedQuestionIds: string[] = [];
      let ignoredQuestionIds: string[] = [];
      let finalMarksObtained = Number(dto.marksObtained) || 0;
      let effectiveMax = paperMaxMarks;
      let finalPercentage = effectiveMax > 0 ? (finalMarksObtained / effectiveMax) * 100 : 0;
      const skippedIdsList = Array.isArray(dto.skippedQuestionIds) ? dto.skippedQuestionIds : [];
      const skippedIds = new Set(skippedIdsList);

      const hasChoiceRules = Array.isArray(paperSections) && paperSections.some(
        s => (Array.isArray(s.choiceGroups) && s.choiceGroups.length > 0) ||
             s.attemptRule === 'CHOICE' ||
             (Number(s.requiredToAttempt) > 0 && Number(s.requiredToAttempt) < (s.questions?.length || 0))
      );

      if (hasChoiceRules) {
        const qMarks = dto.questionMarks || {};
        const subMarks = dto.subPartMarks || {};
        const studentAnswers: Record<string, any> = {};
        const normalizedSections: any[] = [];
        const normalizedQuestions: Record<string, any> = {};
        let orderIdx = 0;

        for (const sec of paperSections) {
          const secQIds: string[] = [];
          for (const q of (sec.questions || [])) {
            const qId = q.questionId || q.id;
            secQIds.push(qId);
            const qMax = Number(q.customMarks || q.defaultMarks || q.max_marks || q.marks || 2);
            normalizedQuestions[qId] = {
              id: qId,
              marks: qMax,
              type: q.mode || 'DESC',
            };

            const isExplicitlySkipped = skippedIds.has(qId) || qMarks[qId] === 'SKIPPED' || qMarks[qId] === null;
            let scored = 0;
            let isAttempted = false;

            if (!isExplicitlySkipped) {
              if (Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
                let subSum = 0;
                let anySubAttempted = false;
                for (const sq of q.subQuestions) {
                  const sqKey = `${qId}_${sq.id}`;
                  const val = subMarks[sqKey] ?? subMarks[sq.id];
                  if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
                    subSum += Number(val);
                    anySubAttempted = true;
                  }
                }
                if (anySubAttempted) {
                  isAttempted = true;
                  scored = Math.min(qMax, subSum);
                }
              } else {
                const val = qMarks[qId];
                if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
                  isAttempted = true;
                  scored = Math.min(qMax, Math.max(0, Number(val)));
                }
              }
            }

            studentAnswers[qId] = {
              questionId: qId,
              attempted: isAttempted,
              rawScore: scored,
              paperOrderIndex: orderIdx++,
            };
          }

          normalizedSections.push({
            ...sec,
            questionIds: secQIds,
          });
        }

        const studentAttempt: StudentAttempt = {
          studentId: realStudentId || 'unknown',
          paperId: realPaperId || 'unknown',
          answers: studentAnswers,
        };

        const tenantSettings = await this.getAssessmentSettings(tenantSlug);
        const scoreRes = computePaperScore(
          {
            id: realPaperId || 'unknown',
            code: paperRes?.[0]?.code || paperCodeOrId,
            name: paperRes?.[0]?.name || 'Exam Paper',
            durationMinutes: 60,
            passingMarksPercentage: 40,
            status: 'PUBLISHED' as any,
            version: 1,
            sections: normalizedSections,
            questions: normalizedQuestions,
            effectiveMaxMarks: paperMaxMarks,
          },
          studentAttempt,
          tenantSettings,
        );

        if (scoreRes.isRejected) {
          throw new BadRequestException(
            `Submission rejected by Over-Attempt Policy: ${scoreRes.errors.join('; ')}`,
          );
        }

        finalMarksObtained = scoreRes.obtained;
        effectiveMax = scoreRes.effectiveMax;
        finalPercentage = scoreRes.percentage;
        scoringBreakdown = scoreRes.perGroupBreakdown;
        countedQuestionIds = scoreRes.countedQuestionIds;
        ignoredQuestionIds = scoreRes.ignoredQuestionIds;
      }

      const isPass = finalMarksObtained >= passingMarks;

      // Ensure missing student_results table columns and unique constraint exist in active tenant schema
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `ALTER TABLE student_results ADD COLUMN IF NOT EXISTS question_marks JSONB DEFAULT '{}'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS sub_part_marks JSONB DEFAULT '{}'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS skipped_question_ids JSONB DEFAULT '[]'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS practical_mark NUMERIC(6,2) DEFAULT 0;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS eval_status VARCHAR(50) DEFAULT 'EVALUATED';
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS scoring_breakdown JSONB DEFAULT '[]'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS counted_question_ids JSONB DEFAULT '[]'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS ignored_question_ids JSONB DEFAULT '[]'::jsonb;
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS effective_max NUMERIC(6,2);
           ALTER TABLE student_results ADD COLUMN IF NOT EXISTS percentage NUMERIC(6,2);
           CREATE UNIQUE INDEX IF NOT EXISTS uq_student_results_stud_paper_attempt ON student_results (student_id, paper_id, attempt_number);`
        );
      } catch (e) {}

      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO student_results (
           student_id, paper_id, marks_obtained, is_pass, attempt_number, entered_by, 
           question_marks, sub_part_marks, practical_mark, scoring_breakdown, 
           counted_question_ids, ignored_question_ids, effective_max, percentage,
           skipped_question_ids
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15::jsonb)
         ON CONFLICT (student_id, paper_id, attempt_number)
         DO UPDATE SET 
           marks_obtained = EXCLUDED.marks_obtained, 
           is_pass = EXCLUDED.is_pass, 
           question_marks = EXCLUDED.question_marks,
           sub_part_marks = EXCLUDED.sub_part_marks,
           practical_mark = EXCLUDED.practical_mark,
           scoring_breakdown = EXCLUDED.scoring_breakdown,
           counted_question_ids = EXCLUDED.counted_question_ids,
           ignored_question_ids = EXCLUDED.ignored_question_ids,
           effective_max = EXCLUDED.effective_max,
           percentage = EXCLUDED.percentage,
           skipped_question_ids = EXCLUDED.skipped_question_ids,
           created_at = NOW()
         RETURNING *`,
        [
          realStudentId,
          realPaperId,
          finalMarksObtained,
          isPass,
          dto.attemptNumber || 1,
          validUserId,
          qMarksJson,
          subMarksJson,
          practicalMark,
          JSON.stringify(scoringBreakdown),
          JSON.stringify(countedQuestionIds),
          JSON.stringify(ignoredQuestionIds),
          effectiveMax,
          finalPercentage,
          JSON.stringify(skippedIdsList),
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

    // 1. Ensure table schema columns exist
    await this.tenantSchemaService.queryInTenant(
      slug,
      `ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS image_url TEXT;
       ALTER TABLE question_bank ALTER COLUMN image_url TYPE TEXT;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS created_by UUID;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS subtopic_id UUID;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS subtopic_name VARCHAR(250);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS sub_topic_id UUID;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS sub_topic_code VARCHAR(100);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS unit_id UUID;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS unit_code VARCHAR(100);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS unit_name VARCHAR(250);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS topic_id UUID;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS topic_code VARCHAR(100);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS competency_id UUID;
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS competency_code VARCHAR(100);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS topic VARCHAR(250);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
       ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS section VARCHAR(50);`
    );

    // 2. Resolve Subject (UUID or Code)
    let resolvedSubjectId: string | null = null;
    let resolvedSubjectCode: string | null = null;
    let resolvedSubjectName: string | null = null;
    const rawSubject = dto.subjectId || dto.subject_id || dto.subjectCode || dto.subject_code;
    if (rawSubject) {
      if (this.isUUID(rawSubject)) {
        const subRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name FROM subjects WHERE id = $1 LIMIT 1`,
          [rawSubject]
        );
        if (subRows && subRows.length > 0) {
          resolvedSubjectId = subRows[0].id;
          resolvedSubjectCode = subRows[0].code;
          resolvedSubjectName = subRows[0].name;
        } else {
          resolvedSubjectId = rawSubject;
        }
      } else {
        const subRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name FROM subjects WHERE code = $1 OR code ILIKE $1 OR name ILIKE $1 LIMIT 1`,
          [rawSubject]
        );
        if (subRows && subRows.length > 0) {
          resolvedSubjectId = subRows[0].id;
          resolvedSubjectCode = subRows[0].code;
          resolvedSubjectName = subRows[0].name;
        }
      }
    }

    // 3. Resolve Unit and validate hierarchy (Unit -> Subject)
    let resolvedUnitId: string | null = null;
    let resolvedUnitCode = dto.unitCode || dto.unit_code || null;
    let resolvedUnitName = dto.unitName || dto.unit_name || null;
    const rawUnit = dto.unitId || dto.unit_id || dto.unitCode || dto.unit_code;
    if (rawUnit) {
      let unitRows: any[] = [];
      if (this.isUUID(rawUnit)) {
        unitRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, subject_id, subject_code FROM units WHERE id = $1 LIMIT 1`,
          [rawUnit]
        );
      } else {
        unitRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, subject_id, subject_code FROM units 
           WHERE (code = $1 OR code ILIKE $1 OR name ILIKE $1) 
             AND (subject_id = $2::text OR subject_code = $3 OR $2::text IS NULL) 
           LIMIT 1`,
          [rawUnit, resolvedSubjectId, resolvedSubjectCode || rawSubject]
        );
        if (!unitRows.length) {
          unitRows = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id, code, name, subject_id, subject_code FROM units WHERE code = $1 OR code ILIKE $1 OR name ILIKE $1 LIMIT 1`,
            [rawUnit]
          );
        }
      }

      if (unitRows && unitRows.length > 0) {
        const u = unitRows[0];
        resolvedUnitId = u.id;
        resolvedUnitCode = u.code || resolvedUnitCode;
        resolvedUnitName = u.name || resolvedUnitName;

        // Hierarchy validation: verify Unit belongs to Subject
        if (resolvedSubjectId && u.subject_id) {
          const matchSub = String(u.subject_id).toLowerCase() === String(resolvedSubjectId).toLowerCase() ||
            (resolvedSubjectCode && String(u.subject_code).toLowerCase() === String(resolvedSubjectCode).toLowerCase()) ||
            (rawSubject && String(u.subject_id).toLowerCase() === String(rawSubject).toLowerCase()) ||
            (rawSubject && String(u.subject_code).toLowerCase() === String(rawSubject).toLowerCase());
          if (!matchSub) {
            this.logger.warn(`Unit '${resolvedUnitCode || u.name}' subject mismatch warning with subject '${resolvedSubjectCode || rawSubject}'`);
          }
        }
      } else if (this.isUUID(dto.unitId || dto.unit_id)) {
        resolvedUnitId = dto.unitId || dto.unit_id;
      }
    }

    // 4. Resolve Topic and validate hierarchy (Topic -> Unit)
    let resolvedTopicId: string | null = null;
    let resolvedTopicCode = dto.topicCode || dto.topic_code || null;
    let resolvedTopicName = dto.topic || null;
    const rawTopic = dto.topicId || dto.topic_id || dto.topicCode || dto.topic_code || dto.topic;
    if (rawTopic) {
      let topicRows: any[] = [];
      if (this.isUUID(rawTopic)) {
        topicRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, unit_id, unit_code, subject_id, subject_code FROM topics WHERE id = $1 LIMIT 1`,
          [rawTopic]
        );
      } else {
        topicRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, unit_id, unit_code, subject_id, subject_code FROM topics 
           WHERE (code = $1 OR code ILIKE $1 OR name ILIKE $1) 
             AND (unit_id = $2::text OR unit_code = $3 OR $2::text IS NULL)
           LIMIT 1`,
          [rawTopic, resolvedUnitId, resolvedUnitCode]
        );
        if (!topicRows.length) {
          topicRows = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id, code, name, unit_id, unit_code, subject_id, subject_code FROM topics WHERE code = $1 OR code ILIKE $1 OR name ILIKE $1 LIMIT 1`,
            [rawTopic]
          );
        }
      }

      if (topicRows && topicRows.length > 0) {
        const t = topicRows[0];
        resolvedTopicId = t.id;
        resolvedTopicCode = t.code || resolvedTopicCode;
        resolvedTopicName = t.name || resolvedTopicName;

        // Hierarchy validation: verify Topic belongs to Unit
        if (resolvedUnitId && t.unit_id) {
          const matchUnit = String(t.unit_id).toLowerCase() === String(resolvedUnitId).toLowerCase() ||
            (resolvedUnitCode && String(t.unit_code).toLowerCase() === String(resolvedUnitCode).toLowerCase()) ||
            (rawUnit && String(t.unit_id).toLowerCase() === String(rawUnit).toLowerCase()) ||
            (rawUnit && String(t.unit_code).toLowerCase() === String(rawUnit).toLowerCase());
          if (!matchUnit) {
            this.logger.warn(`Topic '${resolvedTopicName || t.code}' unit mismatch warning with unit '${resolvedUnitCode || 'selected'}'`);
          }
        }
      } else if (this.isUUID(dto.topicId || dto.topic_id)) {
        resolvedTopicId = dto.topicId || dto.topic_id;
      }
    }

    // 5. Resolve Subtopic / Competency and validate hierarchy (Subtopic -> Topic)
    let resolvedCompId: string | null = null;
    let resolvedCompCode = dto.competencyCode || dto.competency_code || dto.subTopicCode || dto.sub_topic_code || null;
    let resolvedCompName: string | null = null;
    const rawSubTopic = dto.subTopicId || dto.sub_topic_id || dto.subtopicId || dto.subtopic_id || dto.competencyId || dto.competency_id || dto.competencyCode || dto.competency_code || dto.subTopicCode || dto.sub_topic_code;
    if (rawSubTopic) {
      let compRows: any[] = [];
      if (this.isUUID(rawSubTopic)) {
        compRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, topic_id, topic_code, unit_id, unit_code FROM competencies WHERE id = $1 LIMIT 1`,
          [rawSubTopic]
        );
      } else {
        compRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, topic_id, topic_code, unit_id, unit_code FROM competencies 
           WHERE (code = $1 OR code ILIKE $1 OR name ILIKE $1) 
             AND (topic_id = $2::text OR topic_code = $3 OR $2::text IS NULL)
           LIMIT 1`,
          [rawSubTopic, resolvedTopicId, resolvedTopicCode]
        );
        if (!compRows.length) {
          compRows = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id, code, name, topic_id, topic_code, unit_id, unit_code FROM competencies WHERE code = $1 OR code ILIKE $1 OR name ILIKE $1 LIMIT 1`,
            [rawSubTopic]
          );
        }
      }

      if (compRows && compRows.length > 0) {
        const c = compRows[0];
        resolvedCompId = c.id;
        resolvedCompCode = c.code || resolvedCompCode;
        resolvedCompName = c.name;

        // Hierarchy validation: verify Subtopic belongs to Topic
        if (resolvedTopicId && c.topic_id) {
          const matchTopic = String(c.topic_id).toLowerCase() === String(resolvedTopicId).toLowerCase() ||
            (resolvedTopicCode && String(c.topic_code).toLowerCase() === String(resolvedTopicCode).toLowerCase()) ||
            (rawTopic && String(c.topic_id).toLowerCase() === String(rawTopic).toLowerCase()) ||
            (rawTopic && String(c.topic_code).toLowerCase() === String(rawTopic).toLowerCase());
          if (!matchTopic) {
            this.logger.warn(`Subtopic/Competency '${resolvedCompCode || c.name}' topic mismatch warning with topic '${resolvedTopicName || 'selected'}'`);
          }
        }
      } else if (this.isUUID(dto.subTopicId || dto.sub_topic_id || dto.competencyId || dto.competency_id)) {
        resolvedCompId = dto.subTopicId || dto.sub_topic_id || dto.competencyId || dto.competency_id;
      }
    }

    // 6. Resolve created_by user
    const rawUserId = user?.userId || user?.sub || user?.id || (dto as any).createdBy || (dto as any).created_by || null;
    const resolvedCreatedBy = rawUserId && this.isUUID(rawUserId) ? rawUserId : null;
    const finalColgCd = dto.colgCd || dto.colg_cd || (slug.toLowerCase().includes('srms') ? '1' : null);

    const subQuestionsJson = JSON.stringify(dto.subQuestions || dto.sub_questions || []);
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO question_bank (
         college_id, department_id, subject_id, professional_phase, topic, mode,
         question_text, option_a, option_b, option_c, option_d, correct_option,
         difficulty_level, competency_code, has_sub_questions, sub_questions, max_marks,
         topic_id, competency_id, unit_id, unit_code, unit_name, topic_code, sub_topic_id, sub_topic_code,
         subtopic_id, subtopic_name,
         colg_cd, course_cd, branch_cd, batch_cd, semester, section, image_url, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
       RETURNING *`,
      [
        this.isUUID(dto.collegeId || dto.college_id) ? (dto.collegeId || dto.college_id) : null,
        this.isUUID(dto.departmentId || dto.department_id) ? (dto.departmentId || dto.department_id) : null,
        resolvedSubjectId,
        dto.professionalPhase || dto.professional_phase || null,
        resolvedTopicName || dto.topic || null,
        dto.mode,
        dto.questionText || dto.question_text,
        dto.optionA || dto.option_a || null,
        dto.optionB || dto.option_b || null,
        dto.optionC || dto.option_c || null,
        dto.optionD || dto.option_d || null,
        dto.correctOption || dto.correct_option || null,
        dto.difficultyLevel || dto.difficulty_level || 'Medium',
        resolvedCompCode || null,
        dto.hasSubQuestions ?? dto.has_sub_questions ?? false,
        subQuestionsJson,
        dto.maxMarks ?? dto.max_marks ?? 1.0,
        resolvedTopicId,
        resolvedCompId,
        resolvedUnitId,
        resolvedUnitCode || 'CO1',
        resolvedUnitName || 'Core Unit',
        resolvedTopicCode,
        resolvedCompId,
        resolvedCompCode,
        resolvedCompId,
        resolvedCompName || null,
        finalColgCd,
        dto.courseCd || dto.course_cd || null,
        dto.branchCd || dto.branch_cd || null,
        dto.batchCd || dto.batch_cd || null,
        dto.semester || null,
        dto.section || null,
        dto.imageUrl || dto.image_url || dto.image || dto.diagramUrl || dto.diagram_url || null,
        resolvedCreatedBy,
      ],
    );
    return res[0];
  }

  async getQuestions(tenantSlug: string, query: {
    departmentId?: string; subjectId?: string; mode?: string; professionalPhase?: string; topicId?: string; topic?: string; competencyId?: string; competencyCode?: string; unitCode?: string; unitId?: string;
    colgCd?: string; courseCd?: string; branchCd?: string; batchCd?: string; semester?: string; section?: string;
    includeInactive?: string | boolean; status?: string;
  } = {}) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const params: any[] = [];
    const isArchived = query.status === 'archived';
    const isAll = query.status === 'all' || query.includeInactive === 'true' || query.includeInactive === true;
    const activeCondition = isArchived ? 'q.is_active = false' : (isAll ? '1=1' : 'q.is_active = true');
    let sql = `
      SELECT q.*, 
             d.name AS department_name, 
             s.name AS subject_name, 
             s.code AS subject_code
      FROM question_bank q
      LEFT JOIN departments d ON d.id::text = q.department_id::text
      LEFT JOIN subjects s ON s.id::text = q.subject_id::text
      WHERE ${activeCondition}
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
    if (query.subjectId && query.subjectId !== 'ALL' && query.subjectId.trim() !== '') {
      params.push(query.subjectId.trim());
      const pIdx = params.length;
      if (this.isUUID(query.subjectId.trim())) {
        sql += ` AND (q.subject_id::text = $${pIdx}::text OR q.subject_id IS NULL OR q.department_id::text IN (SELECT department_id::text FROM subjects WHERE id::text = $${pIdx}::text AND department_id IS NOT NULL))`;
      } else {
        sql += ` AND (
          s.code = $${pIdx}
          OR LOWER(s.name) LIKE '%' || LOWER($${pIdx}) || '%'
          OR q.course_cd = $${pIdx}
          OR q.subject_id::text IN (SELECT id::text FROM subjects WHERE code = $${pIdx} OR LOWER(name) LIKE '%' || LOWER($${pIdx}) || '%')
        )`;
      }
    }
    if (query.unitId && query.unitId !== 'ALL' && query.unitId.trim() !== '') {
      params.push(query.unitId.trim());
      const pIdx = params.length;
      if (this.isUUID(query.unitId.trim())) {
        sql += ` AND (q.unit_id::text = $${pIdx}::text OR q.unit_code = $${pIdx})`;
      } else {
        sql += ` AND (LOWER(TRIM(q.unit_code)) = LOWER($${pIdx}) OR LOWER(TRIM(q.unit_name)) LIKE '%' || LOWER($${pIdx}) || '%')`;
      }
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

  async updateQuestion(tenantSlug: string, id: string, dto: any) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM question_bank WHERE id::text = $1 LIMIT 1`,
      [id],
    );
    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Question with id ${id} not found`);
    }

    const current = existing[0];
    const subQuestionsJson = (dto.subQuestions !== undefined || dto.sub_questions !== undefined)
      ? JSON.stringify(dto.subQuestions || dto.sub_questions || [])
      : (current.sub_questions ? JSON.stringify(current.sub_questions) : '[]');

    const questionText = dto.questionText ?? dto.question_text ?? current.question_text;
    const maxMarks = Number(dto.maxMarks ?? dto.max_marks ?? current.max_marks ?? 1.0);
    const mode = dto.mode ?? current.mode;
    const optionA = dto.optionA ?? dto.option_a ?? current.option_a;
    const optionB = dto.optionB ?? dto.option_b ?? current.option_b;
    const optionC = dto.optionC ?? dto.option_c ?? current.option_c;
    const optionD = dto.optionD ?? dto.option_d ?? current.option_d;
    const correctOption = dto.correctOption ?? dto.correct_option ?? current.correct_option;
    const difficultyLevel = dto.difficultyLevel ?? dto.difficulty_level ?? current.difficulty_level;
    const hasSubQuestions = dto.hasSubQuestions ?? dto.has_sub_questions ?? current.has_sub_questions;
    const imageUrl = dto.imageUrl ?? dto.image_url ?? dto.image ?? dto.diagramUrl ?? dto.diagram_url ?? current.image_url;
    const isActive = dto.isActive ?? dto.is_active ?? current.is_active ?? true;
    const topic = dto.topic ?? current.topic;
    const competencyCode = dto.competencyCode ?? dto.competency_code ?? current.competency_code;

    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE question_bank SET
         question_text = $1,
         max_marks = $2,
         mode = $3,
         option_a = $4,
         option_b = $5,
         option_c = $6,
         option_d = $7,
         correct_option = $8,
         difficulty_level = $9,
         has_sub_questions = $10,
         sub_questions = $11::jsonb,
         image_url = $12,
         is_active = $13,
         topic = COALESCE($14, topic),
         competency_code = COALESCE($15, competency_code),
         updated_at = NOW()
       WHERE id::text = $16
       RETURNING *`,
      [
        questionText,
        maxMarks,
        mode,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        difficultyLevel,
        hasSubQuestions,
        subQuestionsJson,
        imageUrl,
        isActive,
        topic,
        competencyCode,
        id,
      ],
    );
    return res[0];
  }

  async resumeAllQuestions(tenantSlug: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE question_bank SET is_active = true WHERE is_active = false RETURNING id`,
    );
    const count = res ? res.length : 0;
    return {
      success: true,
      resumedCount: count,
      message: count > 0
        ? `Successfully resumed ${count} archived question(s) into active Question Bank!`
        : `All questions in Question Bank are already active.`,
    };
  }

  async resumeQuestion(tenantSlug: string, id: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE question_bank SET is_active = true WHERE id::text = $1`,
      [id],
    );
    return { success: true, message: 'Question resumed successfully' };
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
      `SELECT id, created_by, department_id, status FROM examination_papers WHERE id::text = $1 LIMIT 1`,
      [id],
    );
    if (!existing || existing.length === 0) {
      throw new NotFoundException('Examination paper not found');
    }

    const paperStatus = String(existing[0].status || '').toUpperCase();
    if (paperStatus === 'HOD_APPROVED' || paperStatus === 'DQAC_APPROVED' || paperStatus === 'APPROVED' || paperStatus === 'PUBLISHED') {
      throw new BadRequestException('This examination paper has been approved by HOD and is locked against deletion.');
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

  async submitQPForDqac(tenantSlug: string, user: any, paperId: string, notes?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = 'PENDING_DQAC_APPROVAL', 
             dqac_status = 'PENDING',
             dqac_remarks = COALESCE($2, dqac_remarks), 
             updated_at = NOW() 
         WHERE id::text = $1 RETURNING *`,
        [paperId, notes || null],
      );
      return res[0] || { success: true, message: 'Submitted for DQAC Quality Audit' };
    } catch { return { success: true, message: 'Submitted for DQAC Quality Audit' }; }
  }

  async resolveHodScope(
    slug: string,
    options: {
      departmentId?: string;
      userId?: string;
      empId?: string;
      courseCd?: string;
      user?: any;
    },
  ): Promise<{
    departmentIds: string[];
    courseCds: string[];
    isRestricted: boolean;
  }> {
    const rawDeptId = options.departmentId;
    const rawUserId = (options.userId || options.user?.sub || options.user?.userId || options.user?.id || '').toString().trim() || null;
    const rawEmpId = (options.empId || options.user?.emp_id || options.user?.empId || '').toString().trim() || null;
    const rawRole = (options.user?.role || '').toUpperCase();

    const result = {
      departmentIds: [] as string[],
      courseCds: [] as string[],
      isRestricted: true,
    };

    try {
      let userRow: any = null;
      if (rawUserId || rawEmpId) {
        const uRes = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT u.id, u.emp_id, u.department, u.role, u.assigned_roles,
                  f.id as faculty_id, f.department_id as fac_dept_id
           FROM users u
           LEFT JOIN faculty f ON (f.user_id::text = u.id::text OR (f.emp_id IS NOT NULL AND f.emp_id = u.emp_id))
           WHERE ($1::text IS NOT NULL AND u.id::text = $1::text)
              OR ($2::text IS NOT NULL AND (u.emp_id = $2::text OR u.username = $2::text))
           LIMIT 1`,
          [rawUserId, rawEmpId],
        );
        userRow = uRes[0] || null;
      }

      const facDeptId = userRow?.fac_dept_id;
      const dbRole = (userRow?.role || '').toUpperCase();
      const dbAssignedRoles = (userRow?.assigned_roles || '').toUpperCase();
      const isHodUser = rawRole.includes('HOD') || dbRole.includes('HOD') || dbAssignedRoles.includes('HOD');
      const isAdminUser = rawRole.includes('ADMIN') || rawRole.includes('PRINCIPAL') || dbRole.includes('ADMIN') || dbRole.includes('PRINCIPAL') || dbAssignedRoles.includes('ADMIN');

      if (isAdminUser) {
        result.isRestricted = false;
      }

      // Fetch all departments in tenant to dynamically group disciplines
      const allDepts = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd, hod_user_id FROM departments`,
      ).catch(() => []);

      // Dynamic discipline classifier to map sister academic departments without hardcoding
      const getDisciplineKey = (dept: any): string => {
        const raw = ((dept?.name || '') + ' ' + (dept?.code || '')).toUpperCase();
        const clean = raw.replace(/[()&,.-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (/COMPUTER\s*SCI|CSE|B\.TECH\.\s*\(?CS|\bCS\b/i.test(clean) && !/APPLICATION|MCA|BCA/i.test(clean)) {
          return 'CSE';
        }
        if (/\bBCA\b|BACHELOR.*COMPUTER.*APP/i.test(clean)) {
          return 'BCA';
        }
        if (/\bMCA\b|MASTER.*COMPUTER.*APP/i.test(clean)) {
          return 'MCA';
        }
        if (/COMPUTER\s*APP/i.test(clean)) {
          return 'COMP_APP';
        }
        if (/MECHANICAL|\bME\b/i.test(clean) && !/ELECTRICAL/i.test(clean)) {
          return 'ME';
        }
        if (/ELECTRONIC|\bECE?\b|\bEC\b/i.test(clean)) {
          return 'ECE';
        }
        if (/ELECTRICAL|\bEE\b|\bEN\b/i.test(clean)) {
          return 'EE';
        }
        if (/INFORMATION\s*TECH|\bIT\b/i.test(clean)) {
          return 'IT';
        }
        if (/PHARM/i.test(clean)) {
          return 'PHARMACY';
        }
        if (/MANAGEMENT|\bMBA\b|\bBBA\b/i.test(clean)) {
          return 'MANAGEMENT';
        }
        if (/LAW|LL\.?B/i.test(clean)) {
          return 'LAW';
        }
        return clean;
      };

      // PRIMARY: Collect departments where this user is explicitly set as hod_user_id
      const hodLinkedDepts = userRow?.id
        ? allDepts.filter((d: any) => d.hod_user_id && d.hod_user_id === userRow.id)
        : [];

      // SECONDARY: Anchor on faculty.department_id (the dept this person teaches in)
      const facDept = facDeptId ? allDepts.find((d: any) => d.id === facDeptId) : null;

      // Build anchor set: hod-linked depts + faculty dept
      const anchorDeptIds = new Set<string>(hodLinkedDepts.map((d: any) => d.id));
      if (facDept) anchorDeptIds.add(facDept.id);

      // If user wasn't linked to a dept directly but rawDeptId was supplied, use as fallback anchor
      if (anchorDeptIds.size === 0 && rawDeptId && this.isUUID(rawDeptId)) {
        anchorDeptIds.add(rawDeptId);
      }

      // TERTIARY: Match user department string name/code from user record or options.user against departments table
      if (anchorDeptIds.size === 0) {
        const userDeptStr = (userRow?.department || options.user?.department || options.user?.departmentName || '').trim().toLowerCase();
        if (userDeptStr) {
          const matchedDepts = allDepts.filter((d: any) => {
            const dName = (d.name || '').toLowerCase();
            const dCode = (d.code || '').toLowerCase();
            return dName === userDeptStr || dName.includes(userDeptStr) || userDeptStr.includes(dName) || (dCode && dCode === userDeptStr);
          });
          for (const md of matchedDepts) {
            anchorDeptIds.add(md.id);
          }
        }
      }

      // If no anchors could be identified and no explicit departmentId was passed, allow unrestricted view
      if (anchorDeptIds.size === 0 && !rawDeptId) {
        result.isRestricted = false;
      }

      // Compute discipline keys from anchors only
      const activeDisciplines = new Set<string>();
      for (const id of anchorDeptIds) {
        const d = allDepts.find((x: any) => x.id === id);
        if (d) activeDisciplines.add(getDisciplineKey(d));
      }

      // Add all departments that share the same discipline as the anchors
      for (const d of allDepts) {
        const dKey = getDisciplineKey(d);
        const isAnchor = anchorDeptIds.has(d.id);
        const matchesDiscipline = activeDisciplines.size > 0 && activeDisciplines.has(dKey);

        if (isAnchor || matchesDiscipline) {
          if (!result.departmentIds.includes(d.id)) {
            result.departmentIds.push(d.id);
          }
          const dCourse = d.course_cd ? String(d.course_cd) : '';
          if (dCourse && !result.courseCds.includes(dCourse)) {
            result.courseCds.push(dCourse);
          }
        }
      }

      if (options.courseCd && !isHodUser) {
        result.courseCds.push(options.courseCd);
      }
    } catch (e) {
      console.warn('Error resolving HOD scope:', e);
    }

    return result;
  }

  async getPendingQPForHod(
    tenantSlug: string, 
    departmentId?: string, 
    statusFilter?: string,
    userContext?: { userId?: string; empId?: string; courseCd?: string; user?: any },
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const scope = await this.resolveHodScope(slug, {
        departmentId,
        userId: userContext?.userId,
        empId: userContext?.empId,
        courseCd: userContext?.courseCd,
        user: userContext?.user,
      });

      const params: any[] = [];
      let whereClause: string;
      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING_HOD_APPROVAL') {
          whereClause = `WHERE p.status IN ('PENDING_HOD_APPROVAL', 'RESUBMITTED', 'DQAC_APPROVED', 'PENDING_DQAC_APPROVAL')`;
        } else if (statusFilter === 'PENDING_AUDIT') {
          whereClause = `WHERE p.status = 'PENDING_DQAC_APPROVAL'`;
        } else {
          params.push(statusFilter);
          whereClause = `WHERE p.status = $1`;
        }
      } else if (statusFilter === 'ALL') {
        whereClause = `WHERE 1=1`;
      } else {
        // Default pending queue for HOD review includes papers submitted for DQAC audit or pending final HOD sign-off
        whereClause = `WHERE p.status IN ('PENDING_HOD_APPROVAL', 'RESUBMITTED', 'DQAC_APPROVED', 'PENDING_DQAC_APPROVAL')`;
      }

      if (scope.departmentIds.length > 0) {
        params.push(scope.departmentIds);
        const deptParamIdx = params.length;
        whereClause += ` AND (
          p.department_id::text = ANY($${deptParamIdx}::text[])
          OR EXISTS (
            SELECT 1 FROM departments d_scope
            WHERE d_scope.id::text = ANY($${deptParamIdx}::text[])
              AND (
                (p.department_id::text = d_scope.id::text)
                OR (
                  p.course_cd IS NOT NULL AND d_scope.course_cd IS NOT NULL AND p.course_cd = d_scope.course_cd
                  AND p.branch_cd IS NOT NULL AND d_scope.branch_cd IS NOT NULL AND p.branch_cd = d_scope.branch_cd
                )
              )
          )
          OR EXISTS (
            SELECT 1 FROM faculty f2
            WHERE (f2.user_id::text = p.created_by::text OR f2.id::text = p.created_by::text OR f2.id::text = p.faculty_id::text)
              AND f2.department_id::text = ANY($${deptParamIdx}::text[])
          )
        )`;
      } else if (scope.isRestricted && !scope.departmentIds.length) {
        // DQAC is a college-wide quality auditor; do NOT hard-block when pending-dqac filter is active.
        const callerRole = (userContext?.user?.role || '').toUpperCase();
        const isDqacOrAdminCaller = callerRole.includes('DQAC') || callerRole.includes('ADMIN') || callerRole.includes('PRINCIPAL');
        const isPendingDqacFilter = statusFilter === 'PENDING_DQAC_APPROVAL' || statusFilter === 'PENDING_AUDIT';
        const hasIdentifiedUser = !!(userContext?.userId || userContext?.empId);
        if (hasIdentifiedUser && !isDqacOrAdminCaller && !isPendingDqacFilter) {
          whereClause += ` AND 1 = 0`;
        }
        // Otherwise: no dept restriction — all papers matching the status filter are returned
      } else if (departmentId && this.isUUID(departmentId)) {
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
                f.name as creator_name,
                fd.name as creator_dept_name,
                p.sections
         FROM examination_papers p 
         LEFT JOIN courses c ON p.course_cd = c.course_cd OR p.course_cd = c.code
         LEFT JOIN subjects s ON p.subject_id::text = s.id::text 
         LEFT JOIN batches b ON p.batch_id::text = b.id::text 
         LEFT JOIN departments d ON p.department_id::text = d.id::text
         LEFT JOIN faculty f ON f.user_id::text = p.created_by::text
         LEFT JOIN departments fd ON fd.id::text = f.department_id::text
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
    const dqacRemarks = dto.dqacRemarks || dto.dqac_remarks || (dto.action === 'dqac_approve' ? actionRemarks : null);
    const paperSet = dto.paperSet || dto.paper_set || null;
    const targetSections = dto.targetSections || dto.target_sections || null;
    const targetSectionsJson = targetSections ? JSON.stringify(Array.isArray(targetSections) ? targetSections : [targetSections]) : null;

    if (dto.action === 'unapprove') {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = 'PENDING_HOD_APPROVAL', 
             dqac_status = NULL,
             hod_remarks = COALESCE($1, 'HOD approval reverted back to pending'), 
             updated_at = NOW() 
         WHERE id::text = $2 RETURNING *`,
        [actionRemarks, dto.paperId],
      );
      return res[0] || { success: true, status: 'PENDING_HOD_APPROVAL' };
    } else if (dto.action === 'approve') {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = 'HOD_APPROVED', 
             hod_remarks = COALESCE($1, hod_remarks), 
             paper_set = COALESCE($2, paper_set),
             target_sections = COALESCE($3::jsonb, target_sections),
             updated_at = NOW() 
         WHERE id::text = $4 RETURNING *`,
        [actionRemarks, paperSet, targetSectionsJson, dto.paperId],
      );
      return res[0] || { success: true, status: 'HOD_APPROVED' };
    } else if (dto.action === 'dqac_approve') {
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = 'DQAC_APPROVED', 
             dqac_status = 'DQAC_APPROVED',
             dqac_remarks = COALESCE($1, dqac_remarks),
             paper_set = COALESCE($2, paper_set),
             target_sections = COALESCE($3::jsonb, target_sections),
             updated_at = NOW() 
         WHERE id::text = $4 RETURNING *`,
        [dqacRemarks || actionRemarks, paperSet, targetSectionsJson, dto.paperId],
      );
      if (paper.created_by) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'success', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'DQAC Quality Audit: Certified',
            `DQAC has verified and approved "${paper.name || paper.code}". It is now queued for HOD final sign-off.`,
          ],
        ).catch(() => null);
      }
      return res[0] || { success: true, status: 'DQAC_APPROVED' };
    } else if (dto.action === 'postpone' || dto.action === 'reschedule') {
      const newExamDate = dto.examDate || dto.newExamDate || dto.exam_date || null;
      const paperSet = dto.paperSet || dto.paper_set || null;
      const targetSectionsJson = dto.targetSections ? JSON.stringify(dto.targetSections) : null;
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = CASE WHEN $1 = 'reschedule' THEN status ELSE 'POSTPONED' END, 
             dqac_status = CASE WHEN $1 = 'reschedule' THEN dqac_status ELSE 'POSTPONED' END,
             exam_date = COALESCE($2, exam_date),
             dqac_remarks = COALESCE($3, dqac_remarks),
             paper_set = COALESCE($4, paper_set),
             target_sections = COALESCE($5::jsonb, target_sections),
             updated_at = NOW() 
         WHERE id::text = $6 RETURNING *`,
        [dto.action, newExamDate ? new Date(newExamDate) : null, actionRemarks || (dto.action === 'reschedule' ? 'Examination rescheduled by DQAC.' : 'Examination postponed by DQAC.'), paperSet, targetSectionsJson, dto.paperId],
      );
      if (paper.created_by) {
        const notifTitle = dto.action === 'reschedule' ? 'Examination Rescheduled by DQAC' : 'Examination Postponed by DQAC';
        const notifMsg = newExamDate
          ? `DQAC has ${dto.action === 'reschedule' ? 'rescheduled' : 'postponed and rescheduled'} examination paper "${paper.name || paper.code}" to ${new Date(newExamDate).toLocaleDateString()}. Directive: ${actionRemarks || 'No directives.'}`
          : `DQAC has postponed examination paper "${paper.name || paper.code}". Reason: ${actionRemarks || 'Examination rescheduled by Quality Assurance Cell.'}`;
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'warning', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            notifTitle,
            notifMsg,
          ],
        ).catch(() => null);
      }
      return res[0] || { success: true, status: dto.action === 'reschedule' ? paper.status : 'POSTPONED' };
    } else {
      // Changes requested or rejected
      const newStatus = dto.action === 'reject' ? 'REJECTED' : 'CHANGES_REQUESTED';
      const questionRemarksJson = JSON.stringify(dto.questionRemarks || {});
      const res = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE examination_papers 
         SET status = $1, 
             dqac_status = $1,
             dqac_remarks = $2,
             hod_remarks = $2, 
             question_remarks = $3::jsonb, 
             paper_set = COALESCE($4, paper_set),
             target_sections = COALESCE($5::jsonb, target_sections),
             updated_at = NOW() 
         WHERE id::text = $6 RETURNING *`,
        [newStatus, actionRemarks || 'Revisions requested on specific questions.', questionRemarksJson, paperSet, targetSectionsJson, dto.paperId],
      );
      if (newStatus === 'CHANGES_REQUESTED' && paper.created_by) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO notifications (recipient_id, title, message, type, category, is_read, created_at)
           VALUES ($1, $2, $3, 'warning', 'assessment', false, NOW())`,
          [
            String(paper.created_by),
            'DQAC Quality Audit: Revisions Required',
            `DQAC has requested revisions on your question paper "${paper.name || paper.code}". Directives: ${actionRemarks || 'Please review flagged questions in Assessment & Q Bank.'}`,
          ],
        ).catch(() => null);
      }
      return res[0] || { success: true, status: newStatus };
    }
  }

  async getApprovedPapers(
    tenantSlug: string, 
    departmentId?: string,
    userContext?: { userId?: string; empId?: string; courseCd?: string; user?: any },
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    try {
      const scope = await this.resolveHodScope(slug, {
        departmentId,
        userId: userContext?.userId,
        empId: userContext?.empId,
        courseCd: userContext?.courseCd,
        user: userContext?.user,
      });

      const params: any[] = [];
      let deptFilter = '';

      if (scope.departmentIds.length > 0 || scope.courseCds.length > 0) {
        const subConditions: string[] = [];
        if (scope.departmentIds.length > 0) {
          params.push(scope.departmentIds);
          subConditions.push(`p.department_id::text = ANY($${params.length}::text[])`);
        }
        if (scope.courseCds.length > 0) {
          params.push(scope.courseCds);
          subConditions.push(`p.course_cd = ANY($${params.length}::text[])`);
        }
        deptFilter = `AND (${subConditions.join(' OR ')})`;
      } else if (scope.isRestricted) {
        deptFilter = `AND 1 = 0`;
      } else if (departmentId && this.isUUID(departmentId)) { 
        deptFilter = `AND p.department_id::text = $1`; 
        params.push(departmentId); 
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

    let validDeptId = this.isUUID(dto.departmentId) ? dto.departmentId : null;
    if (!validDeptId && (dto.branchCd || dto.courseCd)) {
      try {
        const foundDept = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM departments WHERE (code = $1 OR branch_cd = $1) AND (course_cd = $2 OR $2 IS NULL) LIMIT 1`,
          [String(dto.branchCd || ''), String(dto.courseCd || '')],
        );
        if (foundDept && foundDept.length > 0) {
          validDeptId = foundDept[0].id;
        }
      } catch {}
    }
    if (!validDeptId && createdBy && this.isUUID(createdBy)) {
      try {
        const facRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT department_id FROM faculty WHERE user_id::text = $1::text AND department_id IS NOT NULL LIMIT 1`,
          [createdBy],
        );
        if (facRows && facRows.length > 0 && facRows[0].department_id) {
          validDeptId = facRows[0].department_id;
        }
      } catch {}
    }

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
            validDeptId,
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
          validDeptId,
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

  async getPendingTimetableForHod(
    tenantSlug: string, 
    departmentId?: string,
    userContext?: { userId?: string; empId?: string; courseCd?: string; user?: any },
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.ensureTimetableDraftsTable(slug);
    try {
      const scope = await this.resolveHodScope(slug, {
        departmentId,
        userId: userContext?.userId,
        empId: userContext?.empId,
        courseCd: userContext?.courseCd,
        user: userContext?.user,
      });

      const params: any[] = ['PENDING_HOD_APPROVAL'];
      let deptFilter = '';

      if (scope.departmentIds.length > 0) {
        params.push(scope.departmentIds);
        const deptParamIdx = params.length;
        deptFilter = `AND (
          timetable_drafts.department_id::text = ANY($${deptParamIdx}::text[])
          OR EXISTS (
            SELECT 1 FROM departments d_scope
            WHERE d_scope.id::text = ANY($${deptParamIdx}::text[])
              AND (
                (timetable_drafts.department_id::text = d_scope.id::text)
                OR (
                  timetable_drafts.course_cd IS NOT NULL AND d_scope.course_cd IS NOT NULL AND timetable_drafts.course_cd = d_scope.course_cd
                  AND timetable_drafts.branch_cd IS NOT NULL AND d_scope.branch_cd IS NOT NULL AND timetable_drafts.branch_cd = d_scope.branch_cd
                )
              )
          )
          OR EXISTS (
            SELECT 1 FROM faculty f_tt
            WHERE f_tt.user_id::text = timetable_drafts.created_by::text
              AND f_tt.department_id::text = ANY($${deptParamIdx}::text[])
          )
        )`;
      } else if (scope.isRestricted) {
        deptFilter = `AND 1 = 0`;
      } else if (departmentId && this.isUUID(departmentId)) { 
        deptFilter = `AND department_id::text = $2`; 
        params.push(departmentId); 
      }

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

