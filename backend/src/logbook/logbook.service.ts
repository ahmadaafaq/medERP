import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateLogbookCategoryDto,
  CreateLogbookTopicDto,
  UpdateLogbookTopicDto,
  CreateLogbookSubmissionDto,
  EvaluateLogbookSubmissionDto,
  CreateLogbookEntryDto,
  VerifyLogbookEntryDto,
} from './dto/logbook.dto';

@Injectable()
export class LogbookService {
  private readonly logger = new Logger(LogbookService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  // ==========================================
  // 1. CATEGORIES
  // ==========================================
  async getCategories(tenantSlug: string, query: { courseId?: string; departmentId?: string } = {}) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const params: any[] = [];
    let sql = `
      SELECT id, code, name, course_id, department_id, description, is_active, created_at
      FROM "${schema}".logbook_categories
      WHERE is_active = true
    `;

    if (query.courseId && query.courseId !== 'all') {
      params.push(query.courseId);
      sql += ` AND (course_id IS NULL OR course_id = $${params.length})`;
    }
    if (query.departmentId && query.departmentId !== 'all') {
      params.push(query.departmentId);
      sql += ` AND (department_id IS NULL OR department_id = $${params.length})`;
    }

    sql += ` ORDER BY name ASC`;
    return this.tenantSchemaService.queryInTenant(tenantSlug, sql, params);
  }

  async createCategory(tenantSlug: string, dto: CreateLogbookCategoryDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const code = dto.code || dto.name.toUpperCase().replace(/\s+/g, '_');
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_categories (code, name, course_id, department_id, description, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [code, dto.name, dto.courseId || null, dto.departmentId || null, dto.description || null],
    );
    return res[0];
  }

  // ==========================================
  // 2. TOPICS (Faculty & Student views)
  // ==========================================
  async createTopic(tenantSlug: string, facultyId: string, dto: CreateLogbookTopicDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_topics (
        category_id, faculty_id, title, description, submission_deadline,
        max_marks, course_id, branch_id, batch_id, semester_id, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING *`,
      [
        dto.categoryId,
        facultyId,
        dto.title,
        dto.description || null,
        dto.submissionDeadline || null,
        dto.maxMarks || 100,
        dto.courseId || null,
        dto.branchId || null,
        dto.batchId || null,
        dto.semesterId || null,
      ],
    );

    // Create notifications for matching cohort students
    try {
      let targetStudentsSql = `SELECT id, user_id FROM "${schema}".students WHERE 1=1`;
      const sParams: any[] = [];
      if (dto.courseId && dto.courseId !== 'all') {
        sParams.push(dto.courseId);
        targetStudentsSql += ` AND course_cd = $${sParams.length}`;
      }
      if (dto.batchId && dto.batchId !== 'all') {
        sParams.push(dto.batchId);
        targetStudentsSql += ` AND (batch_cd = $${sParams.length} OR batch_id::text = $${sParams.length})`;
      }
      const students = await this.tenantSchemaService.queryInTenant(tenantSlug, targetStudentsSql, sParams);

      for (const st of students) {
        if (st.user_id) {
          await this.tenantSchemaService.queryInTenant(
            tenantSlug,
            `INSERT INTO "${schema}".logbook_notifications (user_id, type, title, message, related_entity_id)
             VALUES ($1, 'NEW_TOPIC', $2, $3, $4)`,
            [
              st.user_id,
              'New Logbook Activity Published',
              `A new activity topic "${dto.title}" has been published by faculty.`,
              res[0].id,
            ],
          ).catch(() => null);
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to dispatch topic notifications: ${e.message}`);
    }

    return res[0];
  }

  async getTopics(
    tenantSlug: string,
    query: {
      facultyId?: string;
      courseId?: string;
      branchId?: string;
      batchId?: string;
      semesterId?: string;
      categoryId?: string;
      search?: string;
      studentId?: string;
    } = {},
  ) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const params: any[] = [];
    let sql = `
      SELECT t.id, t.title, t.description, t.submission_deadline, t.max_marks,
             t.course_id, t.branch_id, t.batch_id, t.semester_id, t.is_active, t.created_at,
             c.id AS category_id, c.name AS category_name, c.code AS category_code,
             f.id AS faculty_id, COALESCE(f.name, 'Faculty') AS faculty_name,
             cr.name AS course_name,
             COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, t.batch_id) AS batch_name,
             (SELECT COUNT(*) FROM "${schema}".logbook_submissions s WHERE s.topic_id = t.id) AS submission_count,
             (SELECT COUNT(*) FROM "${schema}".logbook_submissions s WHERE s.topic_id = t.id AND s.status = 'EVALUATED') AS evaluated_count
    `;

    if (query.studentId) {
      params.push(query.studentId);
      sql += `, (
        SELECT json_build_object(
          'id', sub.id,
          'status', sub.status,
          'submitted_at', sub.submitted_at,
          'file_url', sub.file_url,
          'file_name', sub.file_name,
          'marks_obtained', ev.marks_obtained,
          'remarks', ev.remarks,
          'evaluated_at', ev.evaluated_at
        )
        FROM "${schema}".logbook_submissions sub
        LEFT JOIN "${schema}".logbook_evaluations ev ON ev.submission_id = sub.id
        WHERE sub.topic_id = t.id AND (sub.student_id = $${params.length}::uuid OR sub.student_id::text = $${params.length})
        LIMIT 1
      ) AS student_submission`;
    }

    sql += `
      FROM "${schema}".logbook_topics t
      LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
      LEFT JOIN "${schema}".faculty f ON f.id = t.faculty_id
      LEFT JOIN "${schema}".courses cr ON cr.course_cd = t.course_id
      LEFT JOIN "${schema}".batches b ON (b.id::text = t.batch_id OR (b.batch_cd = t.batch_id AND b.course_cd = t.course_id))
      WHERE t.is_active = true
    `;

    if (query.facultyId) {
      params.push(query.facultyId);
      sql += ` AND (t.faculty_id = $${params.length}::uuid OR t.faculty_id::text = $${params.length})`;
    }
    if (query.categoryId && query.categoryId !== 'all') {
      params.push(query.categoryId);
      sql += ` AND (t.category_id = $${params.length}::uuid OR t.category_id::text = $${params.length})`;
    }
    if (query.courseId && query.courseId !== 'all') {
      params.push(query.courseId);
      sql += ` AND (t.course_id IS NULL OR t.course_id = $${params.length})`;
    }
    if (query.branchId && query.branchId !== 'all') {
      params.push(query.branchId);
      sql += ` AND (t.branch_id IS NULL OR t.branch_id = $${params.length})`;
    }
    if (query.batchId && query.batchId !== 'all') {
      params.push(query.batchId);
      sql += ` AND (t.batch_id IS NULL OR t.batch_id = $${params.length} OR t.batch_id = 'all')`;
    }
    if (query.semesterId && query.semesterId !== 'all') {
      params.push(query.semesterId);
      sql += ` AND (t.semester_id IS NULL OR t.semester_id = $${params.length} OR t.semester_id = 'all')`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
    }

    sql += ` ORDER BY t.created_at DESC`;
    return this.tenantSchemaService.queryInTenant(tenantSlug, sql, params);
  }

  async getTopicById(tenantSlug: string, topicId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT t.*, c.name AS category_name, c.code AS category_code,
              f.name AS faculty_name, f.emp_id AS faculty_code,
              cr.name AS course_name
       FROM "${schema}".logbook_topics t
       LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
       LEFT JOIN "${schema}".faculty f ON f.id = t.faculty_id
       LEFT JOIN "${schema}".courses cr ON cr.course_cd = t.course_id
       WHERE t.id = $1::uuid`,
      [topicId],
    );
    if (!res || res.length === 0) throw new NotFoundException('Logbook topic not found');
    return res[0];
  }

  async updateTopic(tenantSlug: string, topicId: string, dto: UpdateLogbookTopicDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [topicId];

    if (dto.title !== undefined) {
      params.push(dto.title);
      sets.push(`title = $${params.length}`);
    }
    if (dto.description !== undefined) {
      params.push(dto.description);
      sets.push(`description = $${params.length}`);
    }
    if (dto.submissionDeadline !== undefined) {
      params.push(dto.submissionDeadline);
      sets.push(`submission_deadline = $${params.length}`);
    }
    if (dto.maxMarks !== undefined) {
      params.push(dto.maxMarks);
      sets.push(`max_marks = $${params.length}`);
    }
    if (dto.categoryId !== undefined) {
      params.push(dto.categoryId);
      sets.push(`category_id = $${params.length}::uuid`);
    }
    if (dto.batchId !== undefined) {
      params.push(dto.batchId);
      sets.push(`batch_id = $${params.length}`);
    }
    if (dto.semesterId !== undefined) {
      params.push(dto.semesterId);
      sets.push(`semester_id = $${params.length}`);
    }
    if (dto.isActive !== undefined) {
      params.push(dto.isActive);
      sets.push(`is_active = $${params.length}`);
    }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_topics SET ${sets.join(', ')} WHERE id = $1::uuid RETURNING *`,
      params,
    );
    if (!res || res.length === 0) throw new NotFoundException('Topic not found');
    return res[0];
  }

  async deleteTopic(tenantSlug: string, topicId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `DELETE FROM "${schema}".logbook_topics WHERE id = $1::uuid`,
      [topicId],
    );
    return { success: true, message: 'Topic deleted successfully' };
  }

  // ==========================================
  // 3. SUBMISSIONS & EVALUATIONS
  // ==========================================
  async createSubmission(tenantSlug: string, studentId: string, dto: CreateLogbookSubmissionDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    
    // Check topic and deadline
    const topic = await this.getTopicById(tenantSlug, dto.topicId);
    let status = 'SUBMITTED';
    if (topic.submission_deadline && new Date() > new Date(topic.submission_deadline)) {
      status = 'LATE';
    }

    // Check if student already submitted
    const existing = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id FROM "${schema}".logbook_submissions WHERE topic_id = $1::uuid AND student_id = $2::uuid`,
      [dto.topicId, studentId],
    );

    let submission;
    if (existing.length > 0) {
      const res = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `UPDATE "${schema}".logbook_submissions
         SET file_url = COALESCE($1, file_url),
             file_name = COALESCE($2, file_name),
             file_size = COALESCE($3, file_size),
             explanation_text = COALESCE($4, explanation_text),
             submitted_at = NOW(),
             status = $5,
             updated_at = NOW()
         WHERE id = $6::uuid RETURNING *`,
        [dto.fileUrl || null, dto.fileName || null, dto.fileSize || null, dto.explanationText || null, status, existing[0].id],
      );
      submission = res[0];
    } else {
      const res = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `INSERT INTO "${schema}".logbook_submissions (
          topic_id, student_id, file_url, file_name, file_size, explanation_text, status, submitted_at
         ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
        [dto.topicId, studentId, dto.fileUrl || null, dto.fileName || null, dto.fileSize || null, dto.explanationText || null, status],
      );
      submission = res[0];
    }

    // Notify faculty of submission
    if (topic.faculty_id) {
      try {
        const studentInfo = await this.tenantSchemaService.queryInTenant(
          tenantSlug,
          `SELECT name, rollno FROM "${schema}".students WHERE id = $1::uuid`,
          [studentId],
        );
        const sName = studentInfo[0]?.name || 'Student';
        await this.tenantSchemaService.queryInTenant(
          tenantSlug,
          `INSERT INTO "${schema}".logbook_notifications (user_id, type, title, message, related_entity_id)
           VALUES ($1, 'SUBMISSION_RECEIVED', $2, $3, $4)`,
          [
            topic.faculty_id,
            'New Logbook Submission Received',
            `${sName} submitted work for "${topic.title}".`,
            submission.id,
          ],
        );
      } catch (e) {}
    }

    return submission;
  }

  async getMySubmissions(tenantSlug: string, studentId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT s.*, t.title AS topic_title, t.description AS topic_description, t.max_marks,
              t.submission_deadline,
              c.name AS category_name, c.code AS category_code,
              f.name AS faculty_name,
              e.marks_obtained, e.remarks, e.evaluated_at
       FROM "${schema}".logbook_submissions s
       JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
       LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
       LEFT JOIN "${schema}".faculty f ON f.id = t.faculty_id
       LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
       WHERE s.student_id = $1::uuid OR s.student_id::text = $1
       ORDER BY s.submitted_at DESC`,
      [studentId],
    );
  }

  async getSubmissions(
    tenantSlug: string,
    query: { topicId?: string; status?: string; search?: string } = {},
  ) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const params: any[] = [];
    let sql = `
      SELECT s.id, s.topic_id, s.student_id, s.file_url, s.file_name, s.file_size,
             s.explanation_text, s.submitted_at, s.status,
             st.name AS student_name, st.rollno, st.registration_no, st.photo_url,
             cr.name AS course_name,
             COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, st.batch_cd) AS batch_name,
             t.title AS topic_title, t.max_marks, t.submission_deadline,
             c.name AS category_name, c.code AS category_code,
             e.id AS evaluation_id, e.marks_obtained, e.remarks, e.evaluated_at,
             ef.name AS evaluated_by_name
      FROM "${schema}".logbook_submissions s
      JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
      LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
      LEFT JOIN "${schema}".students st ON st.id = s.student_id
      LEFT JOIN "${schema}".courses cr ON cr.course_cd = st.course_cd
      LEFT JOIN "${schema}".batches b ON (b.id = st.batch_id OR (b.batch_cd = st.batch_cd AND b.course_cd = st.course_cd))
      LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
      LEFT JOIN "${schema}".faculty ef ON ef.id = e.faculty_id
      WHERE 1=1
    `;

    if (query.topicId && query.topicId !== 'all') {
      params.push(query.topicId);
      sql += ` AND s.topic_id = $${params.length}::uuid`;
    }
    if (query.status && query.status !== 'all') {
      params.push(query.status.toUpperCase());
      sql += ` AND s.status = $${params.length}`;
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (st.name ILIKE $${params.length} OR st.rollno ILIKE $${params.length} OR st.registration_no ILIKE $${params.length})`;
    }

    sql += ` ORDER BY s.submitted_at DESC`;
    return this.tenantSchemaService.queryInTenant(tenantSlug, sql, params);
  }

  async getSubmissionById(tenantSlug: string, submissionId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT s.*,
              st.name AS student_name, st.rollno, st.registration_no, st.photo_url, st.course_cd,
              cr.name AS course_name,
              COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, st.batch_cd) AS batch_name,
              t.title AS topic_title, t.description AS topic_description, t.max_marks, t.submission_deadline,
              c.name AS category_name, c.code AS category_code,
              e.id AS evaluation_id, e.marks_obtained, e.remarks, e.evaluated_at,
              ef.name AS evaluated_by_name
       FROM "${schema}".logbook_submissions s
       JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
       LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
       LEFT JOIN "${schema}".students st ON st.id = s.student_id
       LEFT JOIN "${schema}".courses cr ON cr.course_cd = st.course_cd
       LEFT JOIN "${schema}".batches b ON (b.id = st.batch_id OR (b.batch_cd = st.batch_cd AND b.course_cd = st.course_cd))
       LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
       LEFT JOIN "${schema}".faculty ef ON ef.id = e.faculty_id
       WHERE s.id = $1::uuid`,
      [submissionId],
    );
    if (!res || res.length === 0) throw new NotFoundException('Submission not found');
    return res[0];
  }

  async evaluateSubmission(
    tenantSlug: string,
    submissionId: string,
    facultyId: string,
    dto: EvaluateLogbookSubmissionDto,
  ) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;

    // Verify submission exists
    const sub = await this.getSubmissionById(tenantSlug, submissionId);

    // Upsert evaluation record
    const existing = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id FROM "${schema}".logbook_evaluations WHERE submission_id = $1::uuid`,
      [submissionId],
    );

    let evaluation;
    if (existing.length > 0) {
      const res = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `UPDATE "${schema}".logbook_evaluations
         SET marks_obtained = $1, remarks = $2, faculty_id = $3, evaluated_at = NOW()
         WHERE id = $4::uuid RETURNING *`,
        [dto.marksObtained, dto.remarks || null, facultyId, existing[0].id],
      );
      evaluation = res[0];
    } else {
      const res = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `INSERT INTO "${schema}".logbook_evaluations (submission_id, faculty_id, marks_obtained, remarks, evaluated_at)
         VALUES ($1::uuid, $2, $3, $4, NOW()) RETURNING *`,
        [submissionId, facultyId, dto.marksObtained, dto.remarks || null],
      );
      evaluation = res[0];
    }

    // Flip status to EVALUATED
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_submissions SET status = 'EVALUATED', updated_at = NOW() WHERE id = $1::uuid`,
      [submissionId],
    );

    // Send evaluation notification to student
    if (sub.student_id) {
      try {
        const student = await this.tenantSchemaService.queryInTenant(
          tenantSlug,
          `SELECT user_id FROM "${schema}".students WHERE id = $1::uuid`,
          [sub.student_id],
        );
        if (student[0]?.user_id) {
          await this.tenantSchemaService.queryInTenant(
            tenantSlug,
            `INSERT INTO "${schema}".logbook_notifications (user_id, type, title, message, related_entity_id)
             VALUES ($1, 'EVALUATED', $2, $3, $4)`,
            [
              student[0].user_id,
              'Logbook Submission Evaluated',
              `Your submission for "${sub.topic_title}" was evaluated: ${dto.marksObtained}/${sub.max_marks} marks.`,
              submissionId,
            ],
          );
        }
      } catch (e) {}
    }

    return {
      success: true,
      message: 'Evaluation submitted successfully',
      evaluation,
      status: 'EVALUATED',
    };
  }

  // ==========================================
  // 4. LEADERBOARD & ANALYTICS (Admin / Faculty)
  // ==========================================
  async getLeaderboard(
    tenantSlug: string,
    query: {
      categoryId?: string;
      courseId?: string;
      branchId?: string;
      batchId?: string;
      semesterId?: string;
      limit?: number;
    } = {},
  ) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const params: any[] = [];

    let whereClause = `WHERE s.status = 'EVALUATED'`;

    if (query.categoryId && query.categoryId !== 'all') {
      params.push(query.categoryId);
      whereClause += ` AND (t.category_id = $${params.length}::uuid OR t.category_id::text = $${params.length})`;
    }
    if (query.courseId && query.courseId !== 'all') {
      params.push(query.courseId);
      whereClause += ` AND st.course_cd = $${params.length}`;
    }
    if (query.batchId && query.batchId !== 'all') {
      params.push(query.batchId);
      whereClause += ` AND (st.batch_cd = $${params.length} OR st.batch_id::text = $${params.length})`;
    }

    params.push(limit);

    const rawSql = `
      WITH evaluated_data AS (
        SELECT s.student_id,
               st.name AS student_name,
               st.rollno,
               st.registration_no,
               st.photo_url,
               st.course_cd,
               st.batch_cd,
               cr.name AS course_name,
               COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, st.batch_cd) AS batch_name,
               t.category_id,
               c.name AS category_name,
               e.marks_obtained,
               t.max_marks,
               ROUND((e.marks_obtained / NULLIF(t.max_marks, 0)) * 100, 2) AS score_pct
        FROM "${schema}".logbook_submissions s
        JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
        LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
        JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
        JOIN "${schema}".students st ON st.id = s.student_id
        LEFT JOIN "${schema}".courses cr ON cr.course_cd = st.course_cd
        LEFT JOIN "${schema}".batches b ON (b.id = st.batch_id OR (b.batch_cd = st.batch_cd AND b.course_cd = st.course_cd))
        ${whereClause}
      )
      SELECT student_id, student_name, rollno, registration_no, photo_url, course_name, batch_name,
             COUNT(*) AS total_evaluated_activities,
             SUM(marks_obtained) AS total_marks_obtained,
             SUM(max_marks) AS total_max_marks,
             ROUND((SUM(marks_obtained) / NULLIF(SUM(max_marks), 0)) * 100, 1) AS overall_performance_pct,
             MAX(score_pct) AS peak_activity_pct,
             json_agg(
               json_build_object(
                 'category_name', category_name,
                 'marks_obtained', marks_obtained,
                 'max_marks', max_marks,
                 'score_pct', score_pct
               )
             ) AS category_breakdown
      FROM evaluated_data
      GROUP BY student_id, student_name, rollno, registration_no, photo_url, course_name, batch_name
      ORDER BY overall_performance_pct DESC, total_evaluated_activities DESC
      LIMIT $${params.length};
    `;

    const rows = await this.tenantSchemaService.queryInTenant(tenantSlug, rawSql, params);

    return {
      success: true,
      data: rows.map((r: any, idx: number) => ({
        rank: idx + 1,
        studentId: r.student_id,
        studentName: r.student_name,
        rollNo: r.rollno || r.registration_no,
        regNo: r.registration_no || r.rollno,
        photoUrl: r.photo_url,
        courseName: r.course_name || 'Academic Program',
        batchName: r.batch_name || 'Batch 2025',
        totalActivities: Number(r.total_evaluated_activities || 0),
        totalMarks: Number(r.total_marks_obtained || 0),
        maxMarks: Number(r.total_max_marks || 0),
        performancePct: Number(r.overall_performance_pct || 0),
        peakPct: Number(r.peak_activity_pct || 0),
        tier: idx === 0 ? 'Tier S (Top Performer)' : idx < 3 ? 'Tier A+' : 'Tier A',
        categoryBreakdown: r.category_breakdown || [],
      })),
    };
  }

  // ==========================================
  // 5. NOTIFICATIONS
  // ==========================================
  async getNotifications(tenantSlug: string, userId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM "${schema}".logbook_notifications
       WHERE user_id = $1::uuid OR user_id::text = $1
       ORDER BY created_at DESC LIMIT 30`,
      [userId],
    );
  }

  async markNotificationRead(tenantSlug: string, notificationId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_notifications SET is_read = true WHERE id = $1::uuid`,
      [notificationId],
    );
    return { success: true };
  }

  // ==========================================
  // LEGACY BACKWARDS-COMPATIBLE METHODS
  // ==========================================
  async createEntry(tenantSlug: string, dto: CreateLogbookEntryDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_entries (student_id, activity_type_id, entry_date, description, faculty_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.studentId, dto.activityTypeId, dto.entryDate, dto.description || null, dto.facultyId || null],
    );
    return res[0];
  }

  async getActivityTypes(tenantSlug: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id, code, name, category, max_required, activity_type FROM "${schema}".logbook_activity_types ORDER BY name ASC`,
    );
  }

  async getStudentEntries(tenantSlug: string, identifier: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT e.*, a.name as activity_name, a.code as activity_code, a.category, COALESCE(v.status, 'PENDING') as verification_status, v.remarks
       FROM "${schema}".logbook_entries e
       JOIN "${schema}".students s ON e.student_id = s.id
       LEFT JOIN "${schema}".logbook_activity_types a ON e.activity_type_id = a.id
       LEFT JOIN "${schema}".logbook_verifications v ON e.id = v.entry_id
       WHERE LOWER(COALESCE(s.rollno, '')) = LOWER($1)
          OR LOWER(COALESCE(s.registration_no, '')) = LOWER($1)
          OR s.id::text = $1
       ORDER BY e.entry_date DESC`,
      [identifier],
    );
  }

  async verifyEntry(tenantSlug: string, entryId: string, verifierId: string, verifierRole: string, dto: VerifyLogbookEntryDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_verifications (entry_id, verifier_id, verifier_role, status, verified_at, remarks)
       VALUES ($1, $2, $3, $4, NOW(), $5) RETURNING *`,
      [entryId, verifierId, verifierRole, dto.status, dto.remarks || null],
    );
    return res[0];
  }

  async getMonthlyPgAudit(tenantSlug: string, rollno?: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    if (rollno) {
      return this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT e.month_number, e.year, COUNT(e.id) as total_entries, 
                COUNT(CASE WHEN v.status = 'VERIFIED' THEN 1 END) as verified_entries
         FROM "${schema}".logbook_entries e
         JOIN "${schema}".students s ON e.student_id = s.id
         LEFT JOIN "${schema}".logbook_verifications v ON e.id = v.entry_id
         WHERE s.rollno = $1
         GROUP BY e.month_number, e.year
         ORDER BY e.year DESC, e.month_number DESC`,
        [rollno],
      );
    }
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT s.rollno, s.name as student_name, COUNT(e.id) as total_entries,
              COUNT(CASE WHEN v.status = 'VERIFIED' THEN 1 END) as verified_entries
       FROM "${schema}".students s
       LEFT JOIN "${schema}".logbook_entries e ON s.id = e.student_id
       LEFT JOIN "${schema}".logbook_verifications v ON e.id = v.entry_id
       GROUP BY s.id, s.rollno, s.name
       ORDER BY s.rollno ASC`,
    );
  }
}
