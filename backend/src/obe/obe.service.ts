import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { SaveObeTargetDto, CreateSurveyDto, SurveyResponseDto, ComputeAttainmentDto } from './dto/obe.dto';

@Injectable()
export class ObeService {
  private readonly logger = new Logger(ObeService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  // ─── SCHEMA SETUP ────────────────────────────────────────────────────────────

  async ensureObeTables(slug: string) {
    try {
      await this.tenantSchemaService.queryInTenant(slug, `
        -- 1. Faculty CO target declarations (pre-semester)
        CREATE TABLE IF NOT EXISTS obe_targets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          faculty_id UUID,
          subject_code VARCHAR(100) NOT NULL,
          unit_code VARCHAR(50) NOT NULL,
          semester VARCHAR(20),
          batch_year INT,
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          exam_type VARCHAR(30) DEFAULT 'COMBINED',
          mark_threshold_pct NUMERIC(5,2) DEFAULT 40,
          student_pass_pct_target NUMERIC(5,2) DEFAULT 60,
          target_level INT DEFAULT 2,
          corrective_action TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_obe_targets
          ON obe_targets (faculty_id, subject_code, unit_code, COALESCE(semester,''), COALESCE(batch_year::text,''));

        -- 2. Computed & cached CO attainment results
        CREATE TABLE IF NOT EXISTS co_attainment_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_code VARCHAR(100) NOT NULL,
          unit_code VARCHAR(50) NOT NULL,
          exam_type VARCHAR(30) DEFAULT 'COMBINED',
          semester VARCHAR(20),
          batch_year INT,
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          direct_attainment NUMERIC(5,3) DEFAULT 0,
          indirect_attainment NUMERIC(5,3) DEFAULT 0,
          final_attainment NUMERIC(5,3) DEFAULT 0,
          student_pass_pct NUMERIC(5,2) DEFAULT 0,
          total_students INT DEFAULT 0,
          students_passed INT DEFAULT 0,
          mark_threshold_pct NUMERIC(5,2) DEFAULT 40,
          computed_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_co_attainment
          ON co_attainment_results (subject_code, unit_code, exam_type, COALESCE(semester,''), COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''));

        -- 3. Computed PO attainment results
        CREATE TABLE IF NOT EXISTS po_attainment_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          po_code VARCHAR(50) NOT NULL,
          semester VARCHAR(20),
          batch_year INT,
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          attainment_value NUMERIC(5,3) DEFAULT 0,
          contributing_subjects TEXT[] DEFAULT '{}',
          computed_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_po_attainment
          ON po_attainment_results (po_code, COALESCE(semester,''), COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''));

        -- 4. Computed PEO attainment results
        CREATE TABLE IF NOT EXISTS peo_attainment_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          peo_code VARCHAR(50) NOT NULL,
          batch_year INT,
          course_cd VARCHAR(50),
          branch_cd VARCHAR(50),
          attainment_value NUMERIC(5,3) DEFAULT 0,
          computed_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_peo_attainment
          ON peo_attainment_results (peo_code, COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''));

        -- 5. Course exit surveys
        CREATE TABLE IF NOT EXISTS course_exit_surveys (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subject_code VARCHAR(100) NOT NULL,
          faculty_id UUID,
          semester VARCHAR(20),
          batch_year INT,
          course_cd VARCHAR(50),
          is_published BOOLEAN DEFAULT false,
          published_at TIMESTAMPTZ,
          closes_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- 6. Survey responses (one row per student per CO per survey)
        CREATE TABLE IF NOT EXISTS survey_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          survey_id UUID NOT NULL,
          student_id UUID,
          unit_code VARCHAR(50) NOT NULL,
          rating INT CHECK (rating BETWEEN 1 AND 5),
          responded_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_responses
          ON survey_responses (survey_id, COALESCE(student_id::text,''), unit_code);
      `);
    } catch (e: any) {
      this.logger.error(`ensureObeTables failed for schema ${slug}: ${e.message}`);
    }
  }

  private resolveTenant(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug || 'srms-cet-bareilly');
  }

  // ─── 1. OBE TARGETS (Faculty Pre-Semester Declaration) ───────────────────────

  async saveTarget(dto: SaveObeTargetDto, tenantSlug?: string) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM obe_targets
       WHERE faculty_id = $1 AND subject_code = $2 AND unit_code = $3
         AND COALESCE(semester,'') = COALESCE($4,'') AND COALESCE(batch_year::text,'') = COALESCE($5::text,'')
       LIMIT 1`,
      [dto.faculty_id || null, dto.subject_code, dto.unit_code, dto.semester || null, dto.batch_year || null],
    ).catch(() => []);

    if (existing?.length > 0) {
      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE obe_targets SET
           exam_type = COALESCE($1, exam_type),
           mark_threshold_pct = COALESCE($2, mark_threshold_pct),
           student_pass_pct_target = COALESCE($3, student_pass_pct_target),
           target_level = COALESCE($4, target_level),
           corrective_action = COALESCE($5, corrective_action),
           course_cd = COALESCE($6, course_cd),
           branch_cd = COALESCE($7, branch_cd),
           updated_at = NOW()
         WHERE id = $8 RETURNING *`,
        [
          dto.exam_type || null, dto.mark_threshold_pct || null, dto.student_pass_pct_target || null,
          dto.target_level || null, dto.corrective_action || null,
          dto.course_cd || null, dto.branch_cd || null, existing[0].id,
        ],
      );
      return { success: true, data: rows[0], message: 'Target updated' };
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO obe_targets
         (faculty_id, subject_code, unit_code, semester, batch_year, course_cd, branch_cd,
          exam_type, mark_threshold_pct, student_pass_pct_target, target_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        dto.faculty_id || null, dto.subject_code, dto.unit_code,
        dto.semester || null, dto.batch_year || null, dto.course_cd || null, dto.branch_cd || null,
        dto.exam_type || 'COMBINED', dto.mark_threshold_pct ?? 40,
        dto.student_pass_pct_target ?? 60, dto.target_level ?? 2,
      ],
    );
    return { success: true, data: rows[0], message: 'Target saved' };
  }

  async getTargets(tenantSlug?: string, params?: {
    facultyId?: string; subjectCode?: string; semester?: string;
    batchYear?: number; courseCd?: string; branchCd?: string;
  }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);
    let q = `SELECT * FROM obe_targets WHERE 1=1`;
    const p: any[] = [];
    if (params?.facultyId) { p.push(params.facultyId); q += ` AND faculty_id = $${p.length}`; }
    if (params?.subjectCode) { p.push(params.subjectCode); q += ` AND subject_code = $${p.length}`; }
    if (params?.semester) { p.push(params.semester); q += ` AND semester = $${p.length}`; }
    if (params?.batchYear) { p.push(params.batchYear); q += ` AND batch_year = $${p.length}`; }
    if (params?.courseCd) { p.push(params.courseCd); q += ` AND course_cd = $${p.length}`; }
    if (params?.branchCd) { p.push(params.branchCd); q += ` AND branch_cd = $${p.length}`; }
    q += ` ORDER BY subject_code, unit_code`;
    const rows = await this.tenantSchemaService.queryInTenant(slug, q, p).catch(() => []);
    return { success: true, data: rows };
  }

  async updateCorrectiveAction(id: string, corrective_action: string, tenantSlug?: string) {
    const slug = this.resolveTenant(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE obe_targets SET corrective_action = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [corrective_action, id],
    );
    return { success: true, data: rows[0] };
  }

  // ─── 2. CO ATTAINMENT ENGINE ─────────────────────────────────────────────────

  /**
   * Core computation: reads examination_papers + student_results for a subject,
   * groups per-question marks by competencyCode (CO), and computes attainment.
   */
  async computeCoAttainment(tenantSlug: string, opts: ComputeAttainmentDto & { subject_code: string }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    const markThresholdPct = opts.mark_threshold_pct ?? 40;
    const internalWeight = (opts.internal_ese_weights?.[0] ?? 40) / 100;
    const eseWeight = (opts.internal_ese_weights?.[1] ?? 60) / 100;
    const directWeight = (opts.direct_indirect_weights?.[0] ?? 80) / 100;
    const indirectWeight = (opts.direct_indirect_weights?.[1] ?? 20) / 100;

    // 1. Load CO-PO matrix to know which COs exist for this subject
    const matrixRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT matrix_data FROM co_po_matrices
       WHERE subject_code = $1 OR subject_id = $1
       ORDER BY updated_at DESC NULLS LAST LIMIT 1`,
      [opts.subject_code],
    ).catch(() => []);

    const matrixData: Record<string, Record<string, number>> = matrixRows[0]?.matrix_data || {};
    let coList = Object.keys(matrixData);

    // Also include any COs defined in targets
    const targetRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT DISTINCT unit_code FROM obe_targets WHERE subject_code = $1`,
      [opts.subject_code],
    ).catch(() => []);
    const targetCos = targetRows.map((r: any) => r.unit_code);
    coList = Array.from(new Set([...coList, ...targetCos]));
    if (!coList.length) {
      coList = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
    }
    coList.sort();

    // 2. Load all papers for this subject
    let paperQuery = `
      SELECT p.id, p.code, p.name, p.type, p.max_marks, p.passing_marks, p.sections
      FROM examination_papers p
      WHERE (p.subject_id::text IN (
          SELECT id::text FROM subjects WHERE code = $1 UNION SELECT $1
        ) OR p.code ILIKE $1 OR p.name ILIKE '%' || $1 || '%')
    `;
    const paperParams: any[] = [opts.subject_code];
    if (opts.semester) {
      paperParams.push(opts.semester);
      paperQuery += ` AND (p.semester = $${paperParams.length} OR p.semester ILIKE '%' || $${paperParams.length} || '%' OR p.semester IS NULL)`;
    }
    if (opts.course_cd) { paperParams.push(opts.course_cd); paperQuery += ` AND (p.course_cd = $${paperParams.length} OR p.course_cd IS NULL)`; }
    if (opts.branch_cd) { paperParams.push(opts.branch_cd); paperQuery += ` AND (p.branch_cd = $${paperParams.length} OR p.branch_cd IS NULL)`; }
    paperQuery += ` AND (p.status = 'APPROVED' OR p.status = 'PUBLISHED' OR p.status = 'DRAFT' OR p.status IS NULL) ORDER BY p.created_at`;

    const papers = await this.tenantSchemaService.queryInTenant(slug, paperQuery, paperParams).catch(() => []);

    const isInternal = (p: any) => {
      const str = `${p.type || ''} ${p.name || ''} ${p.code || ''}`.toUpperCase();
      return ['INTERNAL', 'CIA', 'QUIZ', 'MID', 'TEST', 'SESSIONAL', 'SESS', 'UNIT', 'LAB', 'PRACTICAL'].some(t => str.includes(t));
    };
    const isEse = (p: any) => {
      const str = `${p.type || ''} ${p.name || ''} ${p.code || ''}`.toUpperCase();
      return ['ESE', 'MAIN', 'FINAL', 'SEMESTER', 'UNIVERSITY', 'EXTERNAL'].some(t => str.includes(t));
    };

    let internalPapers = papers.filter(isInternal);
    let esePapers = papers.filter(isEse);
    if (internalPapers.length === 0 && esePapers.length === 0 && papers.length > 0) {
      internalPapers = papers;
    }

    // 3. For each CO, compute attainment
    const coResults: Record<string, any> = {};

    for (const co of coList) {
      const A_internal = await this._computeAttainmentLevel(slug, internalPapers, co, markThresholdPct);
      const A_external = await this._computeAttainmentLevel(slug, esePapers, co, markThresholdPct);

      let direct: number;
      if (A_internal !== null && A_external !== null) {
        direct = (internalWeight * A_internal.level) + (eseWeight * A_external.level);
      } else if (A_internal !== null) {
        direct = A_internal.level;
      } else if (A_external !== null) {
        direct = A_external.level;
      } else {
        direct = 0;
      }

      // 4. Indirect attainment from exit survey
      const surveyAvg = await this._getSurveyAvg(slug, opts.subject_code, co, opts.semester);
      const indirect = surveyAvg !== null ? (surveyAvg / 5) * 3 : direct;

      const finalAttainment = (directWeight * direct) + (indirectWeight * indirect);

      // Combined student stats (prefer combined both paper types)
      const allStats = [A_internal, A_external].filter(Boolean);
      const totalStudents = allStats.length ? Math.max(...allStats.map((s: any) => s.totalStudents)) : 0;
      const studentsPassed = allStats.length ? Math.max(...allStats.map((s: any) => s.studentsPassed)) : 0;
      const studentPassPct = totalStudents > 0 ? (studentsPassed / totalStudents) * 100 : 0;

      coResults[co] = {
        co_code: co,
        direct_attainment: parseFloat(direct.toFixed(3)),
        indirect_attainment: parseFloat(indirect.toFixed(3)),
        final_attainment: parseFloat(finalAttainment.toFixed(3)),
        attainment_level: finalAttainment >= 2.5 ? 3 : finalAttainment >= 1.5 ? 2 : finalAttainment >= 0.5 ? 1 : 0,
        student_pass_pct: parseFloat(studentPassPct.toFixed(2)),
        total_students: totalStudents,
        students_passed: studentsPassed,
        internal_level: A_internal?.level ?? null,
        ese_level: A_external?.level ?? null,
        has_survey: surveyAvg !== null,
      };

      // 5. Persist to cache table
      await this._persistCoAttainment(slug, opts.subject_code, co, coResults[co], opts);
    }

    return { success: true, data: coResults, co_count: coList.length };
  }

  /** Compute attainment level for a set of papers for one CO code */
  private async _computeAttainmentLevel(
    slug: string, papers: any[], coCode: string, thresholdPct: number,
  ): Promise<{ level: number; totalStudents: number; studentsPassed: number } | null> {
    if (!papers.length) return null;

    const perPaperLevels: number[] = [];
    let maxStudents = 0;
    let maxPassed = 0;

    for (const paper of papers) {
      const sections: any[] = paper.sections || [];
      const allQuestions = sections.flatMap((s: any) => s.questions || []);
      const coUpper = coCode.toUpperCase();
      const coQuestions = allQuestions.filter((q: any) => {
        const cCode = String(q.competencyCode || q.competency_code || '').toUpperCase();
        const topic = String(q.topic || '').toUpperCase();
        return (
          cCode === coUpper ||
          cCode.startsWith(coUpper + '.') ||
          cCode.startsWith(coUpper + '-') ||
          cCode.startsWith(coUpper + '_') ||
          topic === coUpper ||
          topic.startsWith(coUpper + '.') ||
          topic.startsWith(coUpper + '-')
        );
      });

      // Load student results for this paper
      const results = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT marks_obtained, question_marks FROM student_results WHERE paper_id::text = $1`,
        [paper.id],
      ).catch(() => []);

      if (!results.length) continue;

      let passed = 0;
      if (coQuestions.length > 0) {
        const coMaxMarks = coQuestions.reduce((sum: number, q: any) => sum + (Number(q.defaultMarks || q.marks || q.customMarks) || 0), 0);
        const threshold = coMaxMarks > 0 ? coMaxMarks * (thresholdPct / 100) : 0;
        for (const sr of results) {
          const qMarks: Record<string, number> = sr.question_marks || {};
          const coScore = coQuestions.reduce(
            (sum: number, q: any) => sum + (Number(qMarks[q.questionId]) || 0), 0,
          );
          if (coScore >= threshold) passed++;
        }
      } else {
        const paperPassingMarks = Number(paper.passing_marks) || (Number(paper.max_marks) * (thresholdPct / 100)) || 20;
        for (const sr of results) {
          const totalObtained = Number(sr.marks_obtained) || 0;
          if (totalObtained >= paperPassingMarks) passed++;
        }
      }

      const P = (passed / results.length) * 100;
      const level = P >= 70 ? 3 : P >= 60 ? 2 : P >= 50 ? 1 : 0;
      perPaperLevels.push(level);

      if (results.length > maxStudents) {
        maxStudents = results.length;
        maxPassed = passed;
      }
    }

    if (!perPaperLevels.length) return null;
    const avgLevel = perPaperLevels.reduce((a, b) => a + b, 0) / perPaperLevels.length;
    return { level: avgLevel, totalStudents: maxStudents, studentsPassed: maxPassed };
  }

  private async _getSurveyAvg(slug: string, subjectCode: string, coCode: string, semester?: string): Promise<number | null> {
    try {
      let q = `
        SELECT AVG(sr.rating) as avg_rating
        FROM survey_responses sr
        JOIN course_exit_surveys cs ON sr.survey_id = cs.id
        WHERE cs.subject_code = $1 AND sr.unit_code = $2
      `;
      const p: any[] = [subjectCode, coCode];
      if (semester) { p.push(semester); q += ` AND cs.semester = $${p.length}`; }
      const rows = await this.tenantSchemaService.queryInTenant(slug, q, p);
      return rows[0]?.avg_rating ? parseFloat(rows[0].avg_rating) : null;
    } catch { return null; }
  }

  private async _persistCoAttainment(slug: string, subjectCode: string, coCode: string, result: any, opts: any) {
    try {
      const existing = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM co_attainment_results
         WHERE subject_code = $1 AND unit_code = $2 AND exam_type = $3
           AND COALESCE(semester,'') = COALESCE($4,'')
           AND COALESCE(batch_year::text,'') = COALESCE($5::text,'')
           AND COALESCE(course_cd,'') = COALESCE($6,'')
           AND COALESCE(branch_cd,'') = COALESCE($7,'')
         LIMIT 1`,
        [
          subjectCode, coCode, opts.exam_type || 'COMBINED',
          opts.semester || null, opts.batch_year || null,
          opts.course_cd || null, opts.branch_cd || null,
        ],
      ).catch(() => []);

      if (existing.length > 0) {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE co_attainment_results SET
             direct_attainment = $1, indirect_attainment = $2, final_attainment = $3,
             student_pass_pct = $4, total_students = $5, students_passed = $6, computed_at = NOW()
           WHERE id = $7`,
          [
            result.direct_attainment, result.indirect_attainment, result.final_attainment,
            result.student_pass_pct, result.total_students, result.students_passed,
            existing[0].id,
          ],
        );
      } else {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO co_attainment_results
             (subject_code, unit_code, exam_type, semester, batch_year, course_cd, branch_cd,
              direct_attainment, indirect_attainment, final_attainment,
              student_pass_pct, total_students, students_passed, computed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
          [
            subjectCode, coCode, opts.exam_type || 'COMBINED',
            opts.semester || null, opts.batch_year || null,
            opts.course_cd || null, opts.branch_cd || null,
            result.direct_attainment, result.indirect_attainment, result.final_attainment,
            result.student_pass_pct, result.total_students, result.students_passed,
          ],
        );
      }
    } catch (e: any) {
      this.logger.warn(`_persistCoAttainment warn: ${e.message}`);
    }
  }

  // ─── 3. PO ATTAINMENT ROLLUP ─────────────────────────────────────────────────

  async computePoAttainment(tenantSlug: string, opts: {
    semester?: string; batchYear?: number; courseCd?: string; branchCd?: string;
  }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    // 1. Load all cached CO attainments for this scope
    let q = `SELECT subject_code, unit_code, final_attainment FROM co_attainment_results WHERE 1=1`;
    const p: any[] = [];
    if (opts.semester) { p.push(opts.semester); q += ` AND semester = $${p.length}`; }
    if (opts.batchYear) { p.push(opts.batchYear); q += ` AND batch_year = $${p.length}`; }
    if (opts.courseCd) { p.push(opts.courseCd); q += ` AND course_cd = $${p.length}`; }
    if (opts.branchCd) { p.push(opts.branchCd); q += ` AND branch_cd = $${p.length}`; }

    const coRows = await this.tenantSchemaService.queryInTenant(slug, q, p).catch(() => []);
    if (!coRows.length) {
      return { success: false, message: 'No CO attainment data found. Please compute CO attainment first.', data: {} };
    }

    // 2. Load CO-PO matrices for all relevant subjects
    const subjectCodes = [...new Set(coRows.map((r: any) => r.subject_code))];
    const poAccum: Record<string, { wSum: number; wTotal: number; subjects: Set<string> }> = {};

    for (const subjectCode of subjectCodes) {
      const matrixRow = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT matrix_data FROM co_po_matrices WHERE subject_code = $1 OR subject_id = $1
         ORDER BY updated_at DESC NULLS LAST LIMIT 1`,
        [subjectCode],
      ).catch(() => []);

      const matrixData: Record<string, Record<string, number>> = matrixRow[0]?.matrix_data || {};

      // For each CO in this subject's matrix, roll up to each PO
      for (const [co, poMap] of Object.entries(matrixData)) {
        const coRow = coRows.find((r: any) => r.subject_code === subjectCode && r.unit_code === co);
        if (!coRow) continue;
        const coAttainment = parseFloat(coRow.final_attainment);

        for (const [po, level] of Object.entries(poMap)) {
          const mappingLevel = Number(level);
          if (mappingLevel <= 0) continue;
          if (!poAccum[po]) poAccum[po] = { wSum: 0, wTotal: 0, subjects: new Set() };
          poAccum[po].wSum += coAttainment * mappingLevel;
          poAccum[po].wTotal += mappingLevel;
          poAccum[po].subjects.add(subjectCode);
        }
      }
    }

    // 3. Compute final PO attainment & persist
    const poResults: Record<string, any> = {};
    for (const [po, accum] of Object.entries(poAccum)) {
      const value = accum.wTotal > 0 ? accum.wSum / accum.wTotal : 0;
      const level = value >= 2.5 ? 3 : value >= 1.5 ? 2 : value >= 0.5 ? 1 : 0;
      poResults[po] = { po_code: po, attainment_value: parseFloat(value.toFixed(3)), attainment_level: level, contributing_subjects: [...accum.subjects] };

      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO po_attainment_results (po_code, semester, batch_year, course_cd, branch_cd, attainment_value, contributing_subjects)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (po_code, COALESCE(semester,''), COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''))
         DO UPDATE SET attainment_value = EXCLUDED.attainment_value, contributing_subjects = EXCLUDED.contributing_subjects, computed_at = NOW()`,
        [po, opts.semester || null, opts.batchYear || null, opts.courseCd || null, opts.branchCd || null, value, [...accum.subjects]],
      ).catch(() => {});
    }

    return { success: true, data: poResults, po_count: Object.keys(poResults).length };
  }

  // ─── 4. PEO ATTAINMENT ROLLUP ────────────────────────────────────────────────

  async computePeoAttainment(tenantSlug: string, opts: {
    batchYear?: number; courseCd?: string; branchCd?: string; semester?: string;
  }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    // 1. Load PO attainments
    let q = `SELECT po_code, attainment_value FROM po_attainment_results WHERE 1=1`;
    const p: any[] = [];
    if (opts.semester) { p.push(opts.semester); q += ` AND semester = $${p.length}`; }
    if (opts.batchYear) { p.push(opts.batchYear); q += ` AND batch_year = $${p.length}`; }
    if (opts.courseCd) { p.push(opts.courseCd); q += ` AND course_cd = $${p.length}`; }
    if (opts.branchCd) { p.push(opts.branchCd); q += ` AND branch_cd = $${p.length}`; }
    const poRows = await this.tenantSchemaService.queryInTenant(slug, q, p).catch(() => []);
    const poAttainments: Record<string, number> = {};
    for (const row of poRows) poAttainments[row.po_code] = parseFloat(row.attainment_value);

    if (!Object.keys(poAttainments).length) {
      return { success: false, message: 'No PO attainment data. Compute PO attainment first.', data: {} };
    }

    // 2. Load PO-PEO matrix
    let matQ = `SELECT matrix_data FROM po_peo_matrices WHERE 1=1`;
    const matP: any[] = [];
    if (opts.courseCd) { matP.push(opts.courseCd); matQ += ` AND course_cd = $${matP.length}`; }
    if (opts.branchCd) { matP.push(opts.branchCd); matQ += ` AND branch_cd = $${matP.length}`; }
    matQ += ` ORDER BY updated_at DESC NULLS LAST LIMIT 1`;
    const matRows = await this.tenantSchemaService.queryInTenant(slug, matQ, matP).catch(() => []);
    const poPeoMatrix: Record<string, Record<string, number>> = matRows[0]?.matrix_data || {};

    if (!Object.keys(poPeoMatrix).length) {
      return { success: false, message: 'No PO-PEO matrix defined. Please define it in Matrix Mapping.', data: {} };
    }

    // 3. Roll up POs → PEOs
    const peoAccum: Record<string, { wSum: number; wTotal: number }> = {};
    for (const [po, peoMap] of Object.entries(poPeoMatrix)) {
      const poVal = poAttainments[po] ?? 0;
      for (const [peo, level] of Object.entries(peoMap)) {
        const l = Number(level);
        if (l <= 0) continue;
        if (!peoAccum[peo]) peoAccum[peo] = { wSum: 0, wTotal: 0 };
        peoAccum[peo].wSum += poVal * l;
        peoAccum[peo].wTotal += l;
      }
    }

    const peoResults: Record<string, any> = {};
    for (const [peo, accum] of Object.entries(peoAccum)) {
      const value = accum.wTotal > 0 ? accum.wSum / accum.wTotal : 0;
      peoResults[peo] = { peo_code: peo, attainment_value: parseFloat(value.toFixed(3)), attainment_level: value >= 2.5 ? 3 : value >= 1.5 ? 2 : value >= 0.5 ? 1 : 0 };

      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO peo_attainment_results (peo_code, batch_year, course_cd, branch_cd, attainment_value)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (peo_code, COALESCE(batch_year::text,''), COALESCE(course_cd,''), COALESCE(branch_cd,''))
         DO UPDATE SET attainment_value = EXCLUDED.attainment_value, computed_at = NOW()`,
        [peo, opts.batchYear || null, opts.courseCd || null, opts.branchCd || null, value],
      ).catch(() => {});
    }

    return { success: true, data: peoResults, peo_count: Object.keys(peoResults).length };
  }

  // ─── 5. FACULTY DASHBOARD ────────────────────────────────────────────────────

  async getFacultyDashboard(tenantSlug: string, params: {
    facultyId?: string; subjectCode?: string; semester?: string; batchYear?: number; courseCd?: string; branchCd?: string;
  }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    // Load targets for this faculty
    let targetsQ = `SELECT * FROM obe_targets WHERE 1=1`;
    const targetsP: any[] = [];
    if (params.facultyId) {
      targetsP.push(params.facultyId);
      targetsQ += ` AND (faculty_id::text = $${targetsP.length} OR faculty_id IS NULL)`;
    }
    if (params.subjectCode) {
      targetsP.push(params.subjectCode);
      targetsQ += ` AND (subject_code = $${targetsP.length} OR subject_code IS NULL)`;
    }
    if (params.semester) {
      targetsP.push(params.semester);
      targetsQ += ` AND (semester = $${targetsP.length} OR semester IS NULL)`;
    }
    if (params.courseCd) {
      targetsP.push(params.courseCd);
      targetsQ += ` AND (course_cd = $${targetsP.length} OR course_cd IS NULL)`;
    }
    if (params.branchCd) {
      targetsP.push(params.branchCd);
      targetsQ += ` AND (branch_cd = $${targetsP.length} OR branch_cd IS NULL)`;
    }
    if (params.batchYear) {
      targetsP.push(params.batchYear);
      targetsQ += ` AND (batch_year = $${targetsP.length} OR batch_year IS NULL)`;
    }
    targetsQ += ` ORDER BY subject_code, unit_code`;
    const targets = await this.tenantSchemaService.queryInTenant(slug, targetsQ, targetsP).catch(() => []);

    // Load CO attainment results for same scope
    let attQ = `SELECT * FROM co_attainment_results WHERE 1=1`;
    const attP: any[] = [];
    if (params.subjectCode) { attP.push(params.subjectCode); attQ += ` AND (subject_code = $${attP.length} OR subject_code IS NULL)`; }
    if (params.semester) { attP.push(params.semester); attQ += ` AND (semester = $${attP.length} OR semester IS NULL)`; }
    if (params.batchYear) { attP.push(params.batchYear); attQ += ` AND (batch_year = $${attP.length} OR batch_year IS NULL)`; }
    if (params.courseCd) { attP.push(params.courseCd); attQ += ` AND (course_cd = $${attP.length} OR course_cd IS NULL)`; }
    if (params.branchCd) { attP.push(params.branchCd); attQ += ` AND (branch_cd = $${attP.length} OR branch_cd IS NULL)`; }
    attQ += ` ORDER BY computed_at DESC`;
    const attainments = await this.tenantSchemaService.queryInTenant(slug, attQ, attP).catch(() => []);

    const attainmentMap: Record<string, Record<string, any>> = {};
    for (const row of attainments) {
      if (!attainmentMap[row.subject_code]) attainmentMap[row.subject_code] = {};
      if (!attainmentMap[row.subject_code][row.unit_code]) {
        attainmentMap[row.subject_code][row.unit_code] = row;
      }
    }

    // Compute gap analysis
    const gapAnalysis: any[] = [];
    let metCount = 0;
    for (const target of targets) {
      const achieved = attainmentMap[target.subject_code]?.[target.unit_code];
      const achievedLevel = achieved ? Math.round(parseFloat(achieved.final_attainment) >= 2.5 ? 3 : parseFloat(achieved.final_attainment) >= 1.5 ? 2 : parseFloat(achieved.final_attainment) >= 0.5 ? 1 : 0) : null;
      const met = achievedLevel !== null && achievedLevel >= target.target_level;
      if (met) metCount++;
      gapAnalysis.push({
        subject_code: target.subject_code,
        unit_code: target.unit_code,
        target_level: target.target_level,
        achieved_attainment: achieved ? parseFloat(achieved.final_attainment) : null,
        achieved_level: achievedLevel,
        met,
        gap: achievedLevel !== null ? target.target_level - achievedLevel : null,
        corrective_action: target.corrective_action,
        target_id: target.id,
      });
    }

    const totalTargets = targets.length;
    const score = totalTargets > 0 ? (metCount / totalTargets) * 100 : null;
    const grade = score === null ? 'No Data' : score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Satisfactory' : 'Needs Improvement';

    return {
      success: true,
      data: {
        targets_count: totalTargets,
        targets_met: metCount,
        target_score_pct: score !== null ? parseFloat(score.toFixed(1)) : null,
        grade,
        gap_analysis: gapAnalysis,
        co_attainments: attainments,
      },
    };
  }

  // ─── 6. HOD DASHBOARD ────────────────────────────────────────────────────────

  async getHodDashboard(tenantSlug: string, params: {
    semester?: string; batchYear?: number; courseCd?: string; branchCd?: string;
  }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    const [coRows, poRows, peoRows, targets, subjects] = await Promise.all([
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM co_attainment_results ${this._scopeWhere(params, [])[0]}`, this._scopeWhere(params, [])[1]).catch(() => []),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM po_attainment_results ${this._scopeWhere(params, [])[0]}`, this._scopeWhere(params, [])[1]).catch(() => []),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM peo_attainment_results ${this._peoScopeWhere(params, [])[0]}`, this._peoScopeWhere(params, [])[1]).catch(() => []),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM obe_targets ${this._scopeWhere(params, [])[0]}`, this._scopeWhere(params, [])[1]).catch(() => []),
      this.tenantSchemaService.queryInTenant(slug, `SELECT id, code, name, sem_cd, semester FROM subjects`).catch(() => []),
    ]);

    // Sub names lookup
    const subNameMap: Record<string, any> = {};
    for (const s of subjects) {
      if (s.code) subNameMap[s.code] = s;
    }

    // Faculty scorecard
    const facultyMap: Record<string, { met: number; total: number }> = {};
    for (const target of targets) {
      const fid = String(target.faculty_id || 'unknown');
      if (!facultyMap[fid]) facultyMap[fid] = { met: 0, total: 0 };
      facultyMap[fid].total++;
      const att = coRows.find((r: any) => r.subject_code === target.subject_code && r.unit_code === target.unit_code);
      if (att) {
        const level = parseFloat(att.final_attainment) >= 2.5 ? 3 : parseFloat(att.final_attainment) >= 1.5 ? 2 : parseFloat(att.final_attainment) >= 0.5 ? 1 : 0;
        if (level >= target.target_level) facultyMap[fid].met++;
      }
    }

    // Subject summary
    const subjectMap: Record<string, any> = {};
    for (const r of coRows) {
      if (!subjectMap[r.subject_code]) {
        const info = subNameMap[r.subject_code];
        subjectMap[r.subject_code] = {
          subject_code: r.subject_code,
          subject_name: info?.name || r.subject_code,
          sem_cd: info?.sem_cd || r.semester || '—',
          attainments: [],
          target_count: 0,
        };
      }
      subjectMap[r.subject_code].attainments.push(parseFloat(r.final_attainment) || 0);
    }
    for (const t of targets) {
      if (!subjectMap[t.subject_code]) {
        const info = subNameMap[t.subject_code];
        subjectMap[t.subject_code] = {
          subject_code: t.subject_code,
          subject_name: info?.name || t.subject_code,
          sem_cd: info?.sem_cd || t.semester || '—',
          attainments: [],
          target_count: 0,
        };
      }
      subjectMap[t.subject_code].target_count++;
    }

    const subjectSummary = Object.values(subjectMap).map((s: any) => ({
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      sem_cd: s.sem_cd,
      co_count: Math.max(s.attainments.length, s.target_count, 5),
      target_count: s.target_count,
      avg_attainment: s.attainments.length > 0
        ? parseFloat((s.attainments.reduce((a: number, b: number) => a + b, 0) / s.attainments.length).toFixed(2))
        : 0,
    }));

    // Pending corrective actions
    const pendingActions: any[] = [];
    for (const t of targets) {
      const att = coRows.find((r: any) => r.subject_code === t.subject_code && r.unit_code === t.unit_code);
      const val = att ? parseFloat(att.final_attainment) : 0;
      const level = val >= 2.5 ? 3 : val >= 1.5 ? 2 : val >= 0.5 ? 1 : 0;
      if (level < t.target_level) {
        pendingActions.push({
          subject_code: t.subject_code,
          co_code: t.unit_code,
          target_level: t.target_level,
          attained_level: level,
          corrective_action: t.corrective_action,
        });
      }
    }

    return {
      success: true,
      data: {
        co_attainments: coRows,
        po_attainments: poRows,
        peo_attainments: peoRows,
        subject_summary: subjectSummary,
        pending_corrective_actions: pendingActions,
        faculty_scorecard: Object.entries(facultyMap).map(([fid, s]) => ({
          faculty_id: fid,
          targets_met: s.met,
          total_targets: s.total,
          score_pct: s.total > 0 ? parseFloat(((s.met / s.total) * 100).toFixed(1)) : 0,
          grade: s.total === 0 ? 'No Data' : (s.met / s.total) >= 0.8 ? 'Excellent' : (s.met / s.total) >= 0.6 ? 'Good' : (s.met / s.total) >= 0.4 ? 'Satisfactory' : 'Needs Improvement',
        })),
      },
    };
  }

  private _scopeWhere(params: any, p: any[]): [string, any[]] {
    let w = `WHERE 1=1`;
    if (params?.semester) { p.push(params.semester); w += ` AND (semester = $${p.length} OR semester IS NULL)`; }
    if (params?.batchYear) { p.push(params.batchYear); w += ` AND (batch_year = $${p.length} OR batch_year IS NULL)`; }
    if (params?.courseCd) { p.push(params.courseCd); w += ` AND (course_cd = $${p.length} OR course_cd IS NULL)`; }
    if (params?.branchCd) { p.push(params.branchCd); w += ` AND (branch_cd = $${p.length} OR branch_cd IS NULL)`; }
    return [w, p];
  }

  private _peoScopeWhere(params: any, p: any[]): [string, any[]] {
    let w = `WHERE 1=1`;
    if (params?.batchYear) { p.push(params.batchYear); w += ` AND (batch_year = $${p.length} OR batch_year IS NULL)`; }
    if (params?.courseCd) { p.push(params.courseCd); w += ` AND (course_cd = $${p.length} OR course_cd IS NULL)`; }
    if (params?.branchCd) { p.push(params.branchCd); w += ` AND (branch_cd = $${p.length} OR branch_cd IS NULL)`; }
    return [w, p];
  }

  // ─── 7. COURSE EXIT SURVEY ───────────────────────────────────────────────────

  async createSurvey(dto: CreateSurveyDto, tenantSlug?: string) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO course_exit_surveys (subject_code, faculty_id, semester, batch_year, course_cd, is_published, published_at, closes_at)
       VALUES ($1,$2,$3,$4,$5,true,NOW(),$6) RETURNING *`,
      [dto.subject_code, dto.faculty_id || null, dto.semester || null, dto.batch_year || null, dto.course_cd || null, dto.closes_at || null],
    );
    return { success: true, data: rows[0], message: 'Survey published' };
  }

  async getSurveys(tenantSlug?: string, subjectCode?: string, semester?: string) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);
    let q = `SELECT cs.*, COUNT(DISTINCT sr.student_id) as response_count
             FROM course_exit_surveys cs
             LEFT JOIN survey_responses sr ON sr.survey_id = cs.id
             WHERE 1=1`;
    const p: any[] = [];
    if (subjectCode) { p.push(subjectCode); q += ` AND cs.subject_code = $${p.length}`; }
    if (semester) { p.push(semester); q += ` AND cs.semester = $${p.length}`; }
    q += ` GROUP BY cs.id ORDER BY cs.created_at DESC`;
    const rows = await this.tenantSchemaService.queryInTenant(slug, q, p).catch(() => []);
    return { success: true, data: rows };
  }

  async submitSurveyResponse(dto: SurveyResponseDto, tenantSlug?: string) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO survey_responses (survey_id, student_id, unit_code, rating)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (survey_id, COALESCE(student_id::text,''), unit_code)
       DO UPDATE SET rating = EXCLUDED.rating, responded_at = NOW()
       RETURNING *`,
      [dto.survey_id, dto.student_id || null, dto.unit_code, dto.rating],
    );
    return { success: true, data: rows[0] };
  }

  async getSurveyResults(surveyId: string, tenantSlug?: string) {
    const slug = this.resolveTenant(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT unit_code, COUNT(*) as responses, AVG(rating) as avg_rating, 
              SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as strongly_agree,
              SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as agree,
              SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as neutral,
              SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as disagree,
              SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as strongly_disagree
       FROM survey_responses WHERE survey_id = $1
       GROUP BY unit_code ORDER BY unit_code`,
      [surveyId],
    ).catch(() => []);
    return { success: true, data: rows };
  }

  // ─── 8. REPORT: CO ATTAINMENT SHEET ─────────────────────────────────────────

  async getCoAttainmentSheet(tenantSlug: string, params: {
    semester?: string; batchYear?: number; courseCd?: string; branchCd?: string; subjectCode?: string;
  }) {
    const slug = this.resolveTenant(tenantSlug);
    await this.ensureObeTables(slug);

    let q = `
      SELECT ca.*, ot.target_level, ot.student_pass_pct_target, ot.corrective_action,
             CASE WHEN ca.final_attainment >= 2.5 THEN 3 WHEN ca.final_attainment >= 1.5 THEN 2 WHEN ca.final_attainment >= 0.5 THEN 1 ELSE 0 END as attainment_level,
             CASE WHEN CASE WHEN ca.final_attainment >= 2.5 THEN 3 WHEN ca.final_attainment >= 1.5 THEN 2 WHEN ca.final_attainment >= 0.5 THEN 1 ELSE 0 END >= COALESCE(ot.target_level, 2) THEN true ELSE false END as target_met
      FROM co_attainment_results ca
      LEFT JOIN obe_targets ot ON ot.subject_code = ca.subject_code AND ot.unit_code = ca.unit_code
        AND COALESCE(ot.semester,'') = COALESCE(ca.semester,'')
      WHERE 1=1
    `;
    const p: any[] = [];
    if (params.subjectCode) { p.push(params.subjectCode); q += ` AND ca.subject_code = $${p.length}`; }
    if (params.semester) { p.push(params.semester); q += ` AND ca.semester = $${p.length}`; }
    if (params.batchYear) { p.push(params.batchYear); q += ` AND ca.batch_year = $${p.length}`; }
    if (params.courseCd) { p.push(params.courseCd); q += ` AND ca.course_cd = $${p.length}`; }
    if (params.branchCd) { p.push(params.branchCd); q += ` AND ca.branch_cd = $${p.length}`; }
    q += ` ORDER BY ca.subject_code, ca.unit_code`;
    const rows = await this.tenantSchemaService.queryInTenant(slug, q, p).catch(() => []);
    return { success: true, data: rows };
  }
}
