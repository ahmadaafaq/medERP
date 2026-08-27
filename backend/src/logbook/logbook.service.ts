import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateLogbookCategoryDto,
  CreateLogbookTopicDto,
  UpdateLogbookTopicDto,
  CreateLogbookSubmissionDto,
  EvaluateLogbookSubmissionDto,
  CreateMiniProjectDto,
  UpdateMiniProjectDto,
  CreateWeeklyLogDto,
  UpdateWeeklyLogDto,
  CreateSeminarDto,
  UpdateSeminarDto,
  CreateTutorialDto,
  UpdateTutorialDto,
  CreateTechnicalActivityDto,
  UpdateTechnicalActivityDto,
  CreateProjectReviewDto,
  CreateFacultyRemarkDto,
  FacultyReviewActionDto,
  CreateLogbookEntryDto,
  VerifyLogbookEntryDto,
  EvaluateWeeklyLogDto,
  FinalizeProjectLockDto,
} from './dto/logbook.dto';

@Injectable()
export class LogbookService {
  private readonly logger = new Logger(LogbookService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  /**
   * Automatically ensure all digital logbook tables exist in the current tenant schema
   */
  private async ensureTables(tenantSlug: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    try {
      await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `
        CREATE TABLE IF NOT EXISTS "${schema}".logbook_mini_projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          faculty_id UUID,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          prompt_instructions TEXT,
          technologies TEXT[],
          course_id VARCHAR(50),
          batch_id VARCHAR(50),
          branch_id VARCHAR(50),
          semester_id VARCHAR(50),
          submission_deadline TIMESTAMPTZ,
          max_marks NUMERIC DEFAULT 100,
          repository_url TEXT,
          live_demo_url TEXT,
          team_members TEXT,
          project_status VARCHAR(50) DEFAULT 'IN_PROGRESS',
          guide_marks NUMERIC,
          guide_remarks TEXT,
          guide_signature TEXT,
          approved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_weekly_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          week_number INTEGER NOT NULL,
          start_date DATE,
          end_date DATE,
          hours_spent NUMERIC DEFAULT 0,
          tasks_planned TEXT NOT NULL,
          tasks_accomplished TEXT NOT NULL,
          challenges_faced TEXT,
          next_week_goals TEXT,
          attachment_url TEXT,
          attachment_name VARCHAR(255),
          status VARCHAR(50) DEFAULT 'SUBMITTED',
          guide_marks NUMERIC,
          guide_remarks TEXT,
          guide_signature TEXT,
          verified_by UUID,
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_seminars (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          title VARCHAR(255) NOT NULL,
          presentation_date DATE,
          abstract_text TEXT,
          slide_deck_url TEXT,
          slide_deck_name VARCHAR(255),
          key_learnings TEXT,
          faculty_advisor VARCHAR(255),
          status VARCHAR(50) DEFAULT 'SUBMITTED',
          guide_marks NUMERIC,
          guide_remarks TEXT,
          guide_signature TEXT,
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_tutorials (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          unit_title VARCHAR(255) NOT NULL,
          subject_code VARCHAR(50),
          problem_statement TEXT NOT NULL,
          solution_text TEXT,
          file_url TEXT,
          file_name VARCHAR(255),
          submission_date DATE DEFAULT CURRENT_DATE,
          status VARCHAR(50) DEFAULT 'SUBMITTED',
          guide_marks NUMERIC,
          guide_remarks TEXT,
          guide_signature TEXT,
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_technical_activities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          title VARCHAR(255) NOT NULL,
          activity_type VARCHAR(100) NOT NULL,
          organization VARCHAR(255),
          event_date DATE,
          description TEXT,
          certificate_url TEXT,
          certificate_name VARCHAR(255),
          status VARCHAR(50) DEFAULT 'VERIFIED',
          guide_marks NUMERIC,
          guide_remarks TEXT,
          guide_signature TEXT,
          verified_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_project_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          review_stage VARCHAR(50) NOT NULL,
          review_date DATE DEFAULT CURRENT_DATE,
          technical_score NUMERIC DEFAULT 0,
          documentation_score NUMERIC DEFAULT 0,
          presentation_score NUMERIC DEFAULT 0,
          total_score NUMERIC DEFAULT 0,
          feedback TEXT,
          guide_remarks TEXT,
          approval_status VARCHAR(50) DEFAULT 'PENDING',
          guide_signature TEXT,
          reviewed_by UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_faculty_remarks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          faculty_id UUID,
          category VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
          remarks TEXT NOT NULL,
          action_required TEXT,
          deadline TIMESTAMPTZ,
          signature_stamp TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "${schema}".logbook_final_evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID,
          faculty_id UUID,
          technical_implementation_marks NUMERIC DEFAULT 0,
          report_documentation_marks NUMERIC DEFAULT 0,
          presentation_viva_marks NUMERIC DEFAULT 0,
          regularity_attendance_marks NUMERIC DEFAULT 0,
          total_marks NUMERIC DEFAULT 0,
          grade VARCHAR(10),
          faculty_comments TEXT,
          digital_signature TEXT,
          approval_status VARCHAR(50) DEFAULT 'APPROVED',
          evaluated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS final_grade VARCHAR(10);
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS final_percentage NUMERIC;
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS zip_submission_url TEXT;
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS documentation_url TEXT;
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS documentation_name TEXT;
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS college_id VARCHAR(100);
        ALTER TABLE "${schema}".logbook_mini_projects ADD COLUMN IF NOT EXISTS discipline_type VARCHAR(100);
        ALTER TABLE "${schema}".logbook_weekly_logs ADD COLUMN IF NOT EXISTS project_id UUID;
        `,
      );
    } catch (e) {
      this.logger.warn(`Failed to auto-ensure digital logbook tables: ${e.message}`);
    }
  }

  // ==========================================
  // RESOLVE STUDENT ID HELPER
  // ==========================================
  private async resolveStudentId(tenantSlug: string, identifier?: string): Promise<string | null> {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const trimmed = identifier ? String(identifier).trim() : '';

    if (trimmed) {
      try {
        const stRows = await this.tenantSchemaService.queryInTenant(
          tenantSlug,
          `SELECT id, user_id, name, rollno, registration_no
           FROM "${schema}".students
           WHERE id::text = $1
              OR user_id::text = $1
              OR LOWER(COALESCE(rollno, '')) = LOWER($1)
              OR LOWER(COALESCE(registration_no, '')) = LOWER($1)
              OR LOWER(COALESCE(name, '')) = LOWER($1)
           LIMIT 1`,
          [trimmed],
        );
        if (stRows && stRows.length > 0) {
          return stRows[0].id;
        }
      } catch (e) {}

      // Validate if it is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(trimmed)) {
        return trimmed;
      }
    }

    // Resilient fallback: lookup first active student in the tenant schema
    try {
      const activeSt = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT id FROM "${schema}".students ORDER BY created_at ASC LIMIT 1`,
      );
      if (activeSt && activeSt.length > 0) {
        return activeSt[0].id;
      }
    } catch (e) {}

    return null;
  }

  // ==========================================
  // 1. DASHBOARD & OVERVIEW STATS
  // ==========================================
  async getStudentDashboardStats(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    let studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    if (!studentId) {
      const activeSt = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT student_id FROM "${schema}".logbook_submissions ORDER BY submitted_at DESC LIMIT 1`,
      );
      if (activeSt && activeSt.length > 0) {
        studentId = activeSt[0].student_id;
      }
    }

    // 1. Student Info
    const studentInfo = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT st.*, cr.name as course_name, b.name as batch_name
       FROM "${schema}".students st
       LEFT JOIN "${schema}".courses cr ON cr.course_cd::text = st.course_cd::text
       LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR (b.batch_cd::text = st.batch_cd::text AND b.course_cd::text = st.course_cd::text))
       WHERE st.id::text = $1 LIMIT 1`,
      [studentId],
    );

    // 2. Mini Project
    const miniProject = await this.getMiniProject(tenantSlug, studentId || undefined);

    // 3. Weekly Logs Count
    const weeklyLogs = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN status = 'APPROVED' OR status = 'VERIFIED' THEN 1 END) as approved,
              COALESCE(SUM(hours_spent), 0) as total_hours
       FROM "${schema}".logbook_weekly_logs WHERE student_id::text = $1`,
      [studentId],
    );

    // 4. Seminars Count
    const seminars = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COUNT(*) as total FROM "${schema}".logbook_seminars WHERE student_id::text = $1`,
      [studentId],
    );

    // 5. Tutorials Count
    const tutorials = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COUNT(*) as total FROM "${schema}".logbook_tutorials WHERE student_id::text = $1`,
      [studentId],
    );

    // 6. Technical Activities Count
    const techActivities = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COUNT(*) as total FROM "${schema}".logbook_technical_activities WHERE student_id::text = $1`,
      [studentId],
    );

    // 7. Milestone Reviews Count
    const reviews = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN approval_status = 'APPROVED' THEN 1 END) as approved
       FROM "${schema}".logbook_project_reviews WHERE student_id::text = $1`,
      [studentId],
    );

    // 8. Faculty Remarks
    const remarks = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT r.*, f.name as faculty_name
       FROM "${schema}".logbook_faculty_remarks r
       LEFT JOIN "${schema}".faculty f ON f.id::text = r.faculty_id::text
       WHERE r.student_id::text = $1 ORDER BY r.created_at DESC LIMIT 5`,
      [studentId],
    );

    // 9. Final Evaluation
    const finalEval = await this.getFinalEvaluation(tenantSlug, studentId || undefined);

    // Calculate Completion %
    const totalWeekly = Number(weeklyLogs[0]?.total || 0);
    const approvedWeekly = Number(weeklyLogs[0]?.approved || 0);
    const totalSeminars = Number(seminars[0]?.total || 0);
    const totalTutorials = Number(tutorials[0]?.total || 0);
    const totalTech = Number(techActivities[0]?.total || 0);
    const totalReviews = Number(reviews[0]?.total || 0);

    const progressScore = Math.min(
      100,
      Math.round(
        (miniProject ? 20 : 0) +
        Math.min(30, approvedWeekly * 5) +
        Math.min(15, totalSeminars * 15) +
        Math.min(15, totalTutorials * 5) +
        Math.min(10, totalTech * 10) +
        Math.min(10, totalReviews * 5)
      )
    );

    return {
      student: studentInfo[0] || null,
      miniProject,
      stats: {
        progressPercentage: progressScore,
        totalHoursLogged: Number(weeklyLogs[0]?.total_hours || 0),
        weeklyLogsCount: totalWeekly,
        weeklyLogsApproved: approvedWeekly,
        seminarsCount: totalSeminars,
        tutorialsCount: totalTutorials,
        technicalActivitiesCount: totalTech,
        reviewsCount: totalReviews,
        reviewsApproved: Number(reviews[0]?.approved || 0),
      },
      recentRemarks: remarks,
      finalEvaluation: finalEval,
    };
  }

  // ==========================================
  // 2. MINI PROJECT (Faculty Assign & Student View)
  // ==========================================
  async getMiniProject(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT p.*, f.name as guide_name
       FROM "${schema}".logbook_mini_projects p
       LEFT JOIN "${schema}".faculty f ON f.id::text = p.faculty_id::text
       WHERE ($1::text IS NULL OR p.student_id::text = $1 OR p.student_id IS NULL)
       ORDER BY (CASE WHEN p.student_id::text = $1 THEN 0 ELSE 1 END), p.updated_at DESC LIMIT 1`,
      [studentId],
    );

    if (res && res.length > 0) return res[0];

    const cohortProject = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT p.*, f.name as guide_name
       FROM "${schema}".logbook_mini_projects p
       LEFT JOIN "${schema}".faculty f ON f.id::text = p.faculty_id::text
       ORDER BY p.created_at DESC LIMIT 1`,
    );
    if (cohortProject && cohortProject.length > 0) return cohortProject[0];

    return null;
  }

  async createOrAssignMiniProject(tenantSlug: string, facultyId: string, dto: CreateMiniProjectDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_mini_projects (
        faculty_id, title, description, prompt_instructions, technologies,
        college_id, discipline_type, course_id, batch_id, branch_id, semester_id, submission_deadline,
        max_marks, repository_url, live_demo_url, team_members, project_status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'IN_PROGRESS') RETURNING *`,
      [
        facultyId,
        dto.title,
        dto.description || null,
        dto.promptInstructions || 'Implement full CRUD, RESTful endpoints, proper UI layout, and clear documentation.',
        dto.technologies || ['React', 'TypeScript', 'TailwindCSS', 'PostgreSQL'],
        dto.collegeId || null,
        dto.disciplineType || null,
        dto.courseId || null,
        dto.batchId || null,
        dto.branchId || null,
        dto.semesterId || null,
        dto.submissionDeadline || null,
        dto.maxMarks || 100,
        dto.repositoryUrl || null,
        dto.liveDemoUrl || null,
        dto.teamMembers || null,
      ],
    );

    return res[0];
  }

  async updateMiniProject(tenantSlug: string, projectId: string, dto: UpdateMiniProjectDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [projectId];

    if (dto.title !== undefined) { params.push(dto.title); sets.push(`title = $${params.length}`); }
    if (dto.description !== undefined) { params.push(dto.description); sets.push(`description = $${params.length}`); }
    if (dto.promptInstructions !== undefined) { params.push(dto.promptInstructions); sets.push(`prompt_instructions = $${params.length}`); }
    if (dto.technologies !== undefined) { params.push(dto.technologies); sets.push(`technologies = $${params.length}`); }
    if ((dto as any).collegeId !== undefined) { params.push((dto as any).collegeId); sets.push(`college_id = $${params.length}`); }
    if ((dto as any).disciplineType !== undefined) { params.push((dto as any).disciplineType); sets.push(`discipline_type = $${params.length}`); }
    if (dto.repositoryUrl !== undefined) { params.push(dto.repositoryUrl); sets.push(`repository_url = $${params.length}`); }
    if (dto.liveDemoUrl !== undefined) { params.push(dto.liveDemoUrl); sets.push(`live_demo_url = $${params.length}`); }
    if (dto.documentationUrl !== undefined) { params.push(dto.documentationUrl); sets.push(`documentation_url = $${params.length}`); }
    if (dto.documentationName !== undefined) { params.push(dto.documentationName); sets.push(`documentation_name = $${params.length}`); }
    if (dto.zipSubmissionUrl !== undefined) { params.push(dto.zipSubmissionUrl); sets.push(`zip_submission_url = $${params.length}`); }
    if (dto.teamMembers !== undefined) { params.push(dto.teamMembers); sets.push(`team_members = $${params.length}`); }
    if (dto.projectStatus !== undefined) { params.push(dto.projectStatus); sets.push(`project_status = $${params.length}`); }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_mini_projects SET ${sets.join(', ')} WHERE id = $1::uuid RETURNING *`,
      params,
    );
    return res[0];
  }

  async getAllFacultyMiniProjects(tenantSlug: string, facultyId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT DISTINCT ON (COALESCE(p.id::text, p.title))
              p.*, f.name as guide_name, f.emp_id as faculty_code,
              cr.name as course_name,
              (SELECT COUNT(*) FROM "${schema}".logbook_weekly_logs WHERE project_id = p.id OR (project_id IS NULL AND student_id = p.student_id)) as logs_count,
              (SELECT COUNT(DISTINCT student_id) FROM "${schema}".logbook_weekly_logs WHERE project_id = p.id OR project_id IS NULL) as students_count
       FROM "${schema}".logbook_mini_projects p
       LEFT JOIN "${schema}".faculty f ON f.id::text = p.faculty_id::text
       LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = p.course_id::text OR cr.id::text = p.course_id::text)
       ORDER BY COALESCE(p.id::text, p.title), p.created_at DESC`,
    );
  }

  async getMiniProjectApplicants(tenantSlug: string, projectId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;

    const students = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT st.id as student_id, st.name as student_name, st.rollno, st.registration_no,
              cr.name as course_name, b.name as batch_name,
              p.id as project_id, p.title as project_title, p.repository_url, p.live_demo_url, p.zip_submission_url,
              p.documentation_url, p.documentation_name,
              p.is_locked, p.project_status, p.final_grade, p.final_percentage, p.guide_remarks, p.locked_at,
              COALESCE(SUM(w.hours_spent), 0) as total_hours_spent,
              COUNT(w.id) as total_weeks_logged,
              MAX(w.week_number) as latest_week_number,
              MAX(w.updated_at) as last_activity_at
       FROM "${schema}".students st
       LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text OR cr.id::text = st.course_cd::text)
       LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR (b.batch_cd::text = st.batch_cd::text AND b.course_cd::text = st.course_cd::text))
       LEFT JOIN "${schema}".logbook_mini_projects p ON (
         (p.student_id = st.id OR p.student_id IS NULL)
         AND ($1::text IS NULL OR p.id::text = $1 OR p.title ILIKE $1)
       )
       LEFT JOIN "${schema}".logbook_weekly_logs w ON (
         w.student_id = st.id
         AND ($1::text IS NULL OR w.project_id::text = $1 OR w.project_id IS NULL)
       )
       GROUP BY st.id, st.name, st.rollno, st.registration_no, cr.name, b.name,
                p.id, p.title, p.repository_url, p.live_demo_url, p.zip_submission_url,
                p.documentation_url, p.documentation_name,
                p.is_locked, p.project_status, p.final_grade, p.final_percentage, p.guide_remarks, p.locked_at
       ORDER BY total_weeks_logged DESC, st.name ASC`,
      [projectId || null],
    );

    const allLogs = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT w.*, st.name as student_name, st.rollno
       FROM "${schema}".logbook_weekly_logs w
       LEFT JOIN "${schema}".students st ON st.id = w.student_id
       WHERE ($1::text IS NULL OR w.project_id::text = $1 OR w.project_id IS NULL)
       ORDER BY w.week_number ASC, w.created_at ASC`,
      [projectId || null],
    );

    const logsByStudent = new Map<string, any[]>();
    for (const log of (allLogs || [])) {
      const sId = String(log.student_id);
      if (!logsByStudent.has(sId)) logsByStudent.set(sId, []);
      logsByStudent.get(sId)!.push(log);
    }

    return (students || []).map((s: any) => {
      const userLogs = logsByStudent.get(String(s.student_id)) || [];
      const totalHours = userLogs.reduce((sum, l) => sum + Number(l.hours_spent || 0), 0);
      return {
        ...s,
        total_hours_spent: totalHours > 0 ? totalHours : Number(s.total_hours_spent || 0),
        total_weeks_logged: userLogs.length,
        weekly_logs: userLogs,
      };
    });
  }

  async evaluateWeeklyLog(tenantSlug: string, logId: string, facultyId: string, dto: EvaluateWeeklyLogDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;

    let guideSignature = dto.guideSignature || null;
    if (!guideSignature && facultyId && facultyId.length === 36) {
      const fac = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT name, designation FROM "${schema}".faculty WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [facultyId],
      );
      if (fac && fac.length > 0) {
        guideSignature = fac[0].designation ? `${fac[0].name} (${fac[0].designation})` : fac[0].name;
      }
    }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_weekly_logs
       SET guide_marks = $2,
           guide_remarks = $3,
           guide_signature = $4,
           status = $5,
           verified_by = $6::uuid,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1::uuid RETURNING *`,
      [
        logId,
        dto.marks,
        dto.remarks,
        guideSignature,
        dto.status || 'VERIFIED',
        facultyId && facultyId.length === 36 ? facultyId : null,
      ],
    );

    return res ? res[0] : null;
  }

  async finalizeAndLockStudentProject(tenantSlug: string, facultyId: string, dto: FinalizeProjectLockDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId);

    let guideSignature = dto.guideSignature || null;
    if (!guideSignature && facultyId && facultyId.length === 36) {
      const fac = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT name, designation FROM "${schema}".faculty WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
        [facultyId],
      );
      if (fac && fac.length > 0) {
        guideSignature = fac[0].designation ? `${fac[0].name} (${fac[0].designation})` : fac[0].name;
      }
    }

    // Update logbook_mini_projects
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_mini_projects
       SET final_grade = $2,
           final_percentage = $3,
           guide_remarks = $4,
           guide_signature = $5,
           is_locked = TRUE,
           project_status = 'CLOSED',
           locked_at = NOW(),
           updated_at = NOW()
       WHERE student_id = $1::uuid OR (student_id IS NULL AND id = $6::uuid)`,
      [
        studentId,
        dto.finalGrade,
        dto.finalPercentage,
        dto.finalRemarks,
        guideSignature,
        dto.projectId || null,
      ],
    );

    // Also update any cohort default project to locked if single student mode
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_mini_projects
       SET final_grade = $1,
           final_percentage = $2,
           guide_remarks = $3,
           guide_signature = $4,
           is_locked = TRUE,
           project_status = 'CLOSED',
           locked_at = NOW(),
           updated_at = NOW()
       WHERE student_id IS NULL`,
      [
        dto.finalGrade,
        dto.finalPercentage,
        dto.finalRemarks,
        guideSignature,
      ],
    );

    // Record into logbook_final_evaluations
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_final_evaluations (
        student_id, faculty_id, total_marks, grade, faculty_comments, digital_signature, approval_status, evaluated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        studentId,
        facultyId && facultyId.length === 36 ? facultyId : null,
        dto.finalPercentage,
        dto.finalGrade,
        dto.finalRemarks,
        dto.guideSignature || null,
      ],
    );

    // Record into faculty remarks
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_faculty_remarks (
        student_id, faculty_id, category, remarks, signature_stamp
       ) VALUES ($1, $2, 'PROJECT_FINAL_EVALUATION', $3, $4)`,
      [
        studentId,
        facultyId && facultyId.length === 36 ? facultyId : null,
        `Final Project Evaluation: Grade ${dto.finalGrade} (${dto.finalPercentage}%) - ${dto.finalRemarks}`,
        dto.guideSignature || null,
      ],
    );

    return {
      success: true,
      message: 'Mini project has been successfully evaluated, locked, and closed.',
      status: 'CLOSED',
      is_locked: true,
      grade: dto.finalGrade,
      percentage: dto.finalPercentage,
    };
  }

  async getAllWeeklyLogs(tenantSlug: string, query: { projectId?: string; status?: string } = {}) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT w.*, st.name as student_name, st.rollno, st.registration_no,
              p.title as project_title, p.repository_url as project_repo, p.live_demo_url as project_demo
       FROM "${schema}".logbook_weekly_logs w
       LEFT JOIN "${schema}".students st ON st.id::text = w.student_id::text
       LEFT JOIN "${schema}".logbook_mini_projects p ON (p.id = w.project_id OR (w.project_id IS NULL AND p.student_id = w.student_id))
       ORDER BY w.created_at DESC`,
    );
  }
  // ==========================================
  async getWeeklyLogs(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT w.*, st.name as student_name, st.rollno
       FROM "${schema}".logbook_weekly_logs w
       LEFT JOIN "${schema}".students st ON st.id::text = w.student_id::text
       WHERE w.student_id::text = $1
       ORDER BY w.week_number ASC, w.created_at ASC`,
      [studentId],
    );
  }

  async createWeeklyLog(tenantSlug: string, userIdOrStudentId: string | undefined, dto: CreateWeeklyLogDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId || userIdOrStudentId);

    // Verify if mini project is locked / closed
    if (studentId) {
      const lockedProj = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT is_locked, project_status FROM "${schema}".logbook_mini_projects
         WHERE student_id = $1::uuid OR student_id IS NULL
         ORDER BY updated_at DESC LIMIT 1`,
        [studentId],
      );
      if (lockedProj && lockedProj.length > 0 && (lockedProj[0].is_locked || lockedProj[0].project_status === 'CLOSED')) {
        throw new BadRequestException('This mini project is evaluated and locked. Submissions are closed.');
      }
    }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_weekly_logs (
        student_id, week_number, start_date, end_date, hours_spent,
        tasks_planned, tasks_accomplished, challenges_faced, next_week_goals,
        attachment_url, attachment_name, project_id, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SUBMITTED') RETURNING *`,
      [
        studentId,
        dto.weekNumber,
        dto.startDate || null,
        dto.endDate || null,
        dto.hoursSpent || 0,
        dto.tasksPlanned,
        dto.tasksAccomplished,
        dto.challengesFaced || null,
        dto.nextWeekGoals || null,
        dto.attachmentUrl || null,
        dto.attachmentName || null,
        dto.projectId || null,
      ],
    );
    return res[0];
  }

  async updateWeeklyLog(tenantSlug: string, logId: string, dto: UpdateWeeklyLogDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [logId];

    if (dto.weekNumber !== undefined) { params.push(dto.weekNumber); sets.push(`week_number = $${params.length}`); }
    if (dto.startDate !== undefined) { params.push(dto.startDate); sets.push(`start_date = $${params.length}`); }
    if (dto.endDate !== undefined) { params.push(dto.endDate); sets.push(`end_date = $${params.length}`); }
    if (dto.hoursSpent !== undefined) { params.push(dto.hoursSpent); sets.push(`hours_spent = $${params.length}`); }
    if (dto.tasksPlanned !== undefined) { params.push(dto.tasksPlanned); sets.push(`tasks_planned = $${params.length}`); }
    if (dto.tasksAccomplished !== undefined) { params.push(dto.tasksAccomplished); sets.push(`tasks_accomplished = $${params.length}`); }
    if (dto.challengesFaced !== undefined) { params.push(dto.challengesFaced); sets.push(`challenges_faced = $${params.length}`); }
    if (dto.nextWeekGoals !== undefined) { params.push(dto.nextWeekGoals); sets.push(`next_week_goals = $${params.length}`); }
    if (dto.attachmentUrl !== undefined) { params.push(dto.attachmentUrl); sets.push(`attachment_url = $${params.length}`); }
    if (dto.attachmentName !== undefined) { params.push(dto.attachmentName); sets.push(`attachment_name = $${params.length}`); }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_weekly_logs SET ${sets.join(', ')} WHERE id = $1::uuid RETURNING *`,
      params,
    );
    return res[0];
  }

  async deleteWeeklyLog(tenantSlug: string, logId: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `DELETE FROM "${schema}".logbook_weekly_logs WHERE id = $1::uuid`,
      [logId],
    );
    return { success: true, message: 'Weekly log deleted successfully' };
  }

  // ==========================================
  // 4. SEMINARS (Add / View / Edit / Delete)
  // ==========================================
  async getSeminars(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM "${schema}".logbook_seminars WHERE student_id::text = $1 ORDER BY presentation_date DESC, created_at DESC`,
      [studentId],
    );
  }

  async createSeminar(tenantSlug: string, userIdOrStudentId: string | undefined, dto: CreateSeminarDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId || userIdOrStudentId);

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_seminars (
        student_id, title, presentation_date, abstract_text, slide_deck_url, slide_deck_name, key_learnings, faculty_advisor, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED') RETURNING *`,
      [
        studentId,
        dto.title,
        dto.presentationDate || null,
        dto.abstractText || null,
        dto.slideDeckUrl || null,
        dto.slideDeckName || null,
        dto.keyLearnings || null,
        dto.facultyAdvisor || null,
      ],
    );
    return res[0];
  }

  async updateSeminar(tenantSlug: string, seminarId: string, dto: UpdateSeminarDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [seminarId];

    if (dto.title !== undefined) { params.push(dto.title); sets.push(`title = $${params.length}`); }
    if (dto.presentationDate !== undefined) { params.push(dto.presentationDate); sets.push(`presentation_date = $${params.length}`); }
    if (dto.abstractText !== undefined) { params.push(dto.abstractText); sets.push(`abstract_text = $${params.length}`); }
    if (dto.slideDeckUrl !== undefined) { params.push(dto.slideDeckUrl); sets.push(`slide_deck_url = $${params.length}`); }
    if (dto.slideDeckName !== undefined) { params.push(dto.slideDeckName); sets.push(`slide_deck_name = $${params.length}`); }
    if (dto.keyLearnings !== undefined) { params.push(dto.keyLearnings); sets.push(`key_learnings = $${params.length}`); }
    if (dto.facultyAdvisor !== undefined) { params.push(dto.facultyAdvisor); sets.push(`faculty_advisor = $${params.length}`); }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_seminars SET ${sets.join(', ')} WHERE id = $1::uuid RETURNING *`,
      params,
    );
    return res[0];
  }

  async deleteSeminar(tenantSlug: string, seminarId: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.tenantSchemaService.queryInTenant(tenantSlug, `DELETE FROM "${schema}".logbook_seminars WHERE id = $1::uuid`, [seminarId]);
    return { success: true, message: 'Seminar entry deleted successfully' };
  }

  // ==========================================
  // 5. TUTORIALS (Add / View / Edit / Delete)
  // ==========================================
  async getTutorials(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM "${schema}".logbook_tutorials WHERE student_id::text = $1 ORDER BY submission_date DESC, created_at DESC`,
      [studentId],
    );
  }

  async createTutorial(tenantSlug: string, userIdOrStudentId: string | undefined, dto: CreateTutorialDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId || userIdOrStudentId);

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_tutorials (
        student_id, unit_title, subject_code, problem_statement, solution_text, file_url, file_name, submission_date, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SUBMITTED') RETURNING *`,
      [
        studentId,
        dto.unitTitle,
        dto.subjectCode || null,
        dto.problemStatement,
        dto.solutionText || null,
        dto.fileUrl || null,
        dto.fileName || null,
        dto.submissionDate || new Date().toISOString(),
      ],
    );
    return res[0];
  }

  async updateTutorial(tenantSlug: string, tutorialId: string, dto: UpdateTutorialDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [tutorialId];

    if (dto.unitTitle !== undefined) { params.push(dto.unitTitle); sets.push(`unit_title = $${params.length}`); }
    if (dto.subjectCode !== undefined) { params.push(dto.subjectCode); sets.push(`subject_code = $${params.length}`); }
    if (dto.problemStatement !== undefined) { params.push(dto.problemStatement); sets.push(`problem_statement = $${params.length}`); }
    if (dto.solutionText !== undefined) { params.push(dto.solutionText); sets.push(`solution_text = $${params.length}`); }
    if (dto.fileUrl !== undefined) { params.push(dto.fileUrl); sets.push(`file_url = $${params.length}`); }
    if (dto.fileName !== undefined) { params.push(dto.fileName); sets.push(`file_name = $${params.length}`); }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_tutorials SET ${sets.join(', ')} WHERE id = $1::uuid RETURNING *`,
      params,
    );
    return res[0];
  }

  async deleteTutorial(tenantSlug: string, tutorialId: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.tenantSchemaService.queryInTenant(tenantSlug, `DELETE FROM "${schema}".logbook_tutorials WHERE id = $1::uuid`, [tutorialId]);
    return { success: true, message: 'Tutorial entry deleted successfully' };
  }

  // ==========================================
  // 6. TECHNICAL ACTIVITIES (Add / View / Edit / Delete)
  // ==========================================
  async getTechnicalActivities(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM "${schema}".logbook_technical_activities WHERE student_id::text = $1 ORDER BY event_date DESC, created_at DESC`,
      [studentId],
    );
  }

  async createTechnicalActivity(tenantSlug: string, userIdOrStudentId: string | undefined, dto: CreateTechnicalActivityDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId || userIdOrStudentId);

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_technical_activities (
        student_id, title, activity_type, organization, event_date, description, certificate_url, certificate_name, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VERIFIED') RETURNING *`,
      [
        studentId,
        dto.title,
        dto.activityType,
        dto.organization || null,
        dto.eventDate || null,
        dto.description || null,
        dto.certificateUrl || null,
        dto.certificateName || null,
      ],
    );
    return res[0];
  }

  async updateTechnicalActivity(tenantSlug: string, activityId: string, dto: UpdateTechnicalActivityDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const sets: string[] = ['updated_at = NOW()'];
    const params: any[] = [activityId];

    if (dto.title !== undefined) { params.push(dto.title); sets.push(`title = $${params.length}`); }
    if (dto.activityType !== undefined) { params.push(dto.activityType); sets.push(`activity_type = $${params.length}`); }
    if (dto.organization !== undefined) { params.push(dto.organization); sets.push(`organization = $${params.length}`); }
    if (dto.eventDate !== undefined) { params.push(dto.eventDate); sets.push(`event_date = $${params.length}`); }
    if (dto.description !== undefined) { params.push(dto.description); sets.push(`description = $${params.length}`); }
    if (dto.certificateUrl !== undefined) { params.push(dto.certificateUrl); sets.push(`certificate_url = $${params.length}`); }
    if (dto.certificateName !== undefined) { params.push(dto.certificateName); sets.push(`certificate_name = $${params.length}`); }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_technical_activities SET ${sets.join(', ')} WHERE id = $1::uuid RETURNING *`,
      params,
    );
    return res[0];
  }

  async deleteTechnicalActivity(tenantSlug: string, activityId: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.tenantSchemaService.queryInTenant(tenantSlug, `DELETE FROM "${schema}".logbook_technical_activities WHERE id = $1::uuid`, [activityId]);
    return { success: true, message: 'Technical activity deleted successfully' };
  }

  // ==========================================
  // 7. PROGRESS REVIEWS (Review 0 to 3)
  // ==========================================
  async getProjectReviews(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    const reviews = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT r.*, f.name as reviewer_name
       FROM "${schema}".logbook_project_reviews r
       LEFT JOIN "${schema}".faculty f ON f.id::text = r.reviewed_by::text
       WHERE r.student_id::text = $1
       ORDER BY r.review_stage ASC, r.created_at ASC`,
      [studentId],
    );

    // Return standard 4 milestones if not recorded yet
    const standardStages = ['REVIEW_0', 'REVIEW_1', 'REVIEW_2', 'REVIEW_3'];
    const stageMap: Record<string, any> = {};
    reviews.forEach((r: any) => { stageMap[r.review_stage] = r; });

    return standardStages.map((stg, idx) => {
      if (stageMap[stg]) return stageMap[stg];
      return {
        id: `virtual-${stg}`,
        student_id: studentId,
        review_stage: stg,
        stage_label: idx === 0 ? 'Review 0: Problem Formulation & Scope' : idx === 1 ? 'Review 1: Architecture & UI/UX Design' : idx === 2 ? 'Review 2: Mid-Term Implementation & DB' : 'Review 3: Final Testing & Viva',
        technical_score: 0,
        documentation_score: 0,
        presentation_score: 0,
        total_score: 0,
        approval_status: 'PENDING',
        feedback: 'Awaiting scheduled milestone review with guide.',
      };
    });
  }

  async createOrUpdateProjectReview(tenantSlug: string, facultyId: string, dto: CreateProjectReviewDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId);

    const total = (Number(dto.technicalScore) || 0) + (Number(dto.documentationScore) || 0) + (Number(dto.presentationScore) || 0);

    const existing = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id FROM "${schema}".logbook_project_reviews WHERE student_id::text = $1 AND review_stage = $2 LIMIT 1`,
      [studentId, dto.reviewStage],
    );

    if (existing && existing.length > 0) {
      const res = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `UPDATE "${schema}".logbook_project_reviews
         SET technical_score = $1, documentation_score = $2, presentation_score = $3,
             total_score = $4, feedback = $5, guide_remarks = $6, approval_status = $7,
             guide_signature = $8, reviewed_by = $9, updated_at = NOW()
         WHERE id = $10::uuid RETURNING *`,
        [
          dto.technicalScore || 0,
          dto.documentationScore || 0,
          dto.presentationScore || 0,
          total,
          dto.feedback || null,
          dto.guideRemarks || null,
          dto.approvalStatus || 'APPROVED',
          `DIGITALLY_SIGNED_BY_FACULTY_${facultyId.slice(0, 8).toUpperCase()}`,
          facultyId,
          existing[0].id,
        ],
      );
      return res[0];
    } else {
      const res = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `INSERT INTO "${schema}".logbook_project_reviews (
          student_id, review_stage, technical_score, documentation_score, presentation_score,
          total_score, feedback, guide_remarks, approval_status, guide_signature, reviewed_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          studentId,
          dto.reviewStage,
          dto.technicalScore || 0,
          dto.documentationScore || 0,
          dto.presentationScore || 0,
          total,
          dto.feedback || null,
          dto.guideRemarks || null,
          dto.approvalStatus || 'APPROVED',
          `DIGITALLY_SIGNED_BY_FACULTY_${facultyId.slice(0, 8).toUpperCase()}`,
          facultyId,
        ],
      );
      return res[0];
    }
  }

  // ==========================================
  // 8. FACULTY REMARKS
  // ==========================================
  async getFacultyRemarks(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT r.*, f.name as faculty_name, f.email as faculty_email
       FROM "${schema}".logbook_faculty_remarks r
       LEFT JOIN "${schema}".faculty f ON f.id::text = r.faculty_id::text
       WHERE r.student_id::text = $1
       ORDER BY r.created_at DESC`,
      [studentId],
    );
  }

  async createFacultyRemark(tenantSlug: string, facultyId: string, dto: CreateFacultyRemarkDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, dto.studentId);

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_faculty_remarks (
        student_id, faculty_id, category, remarks, action_required, deadline, signature_stamp
       ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        studentId,
        facultyId,
        dto.category,
        dto.remarks,
        dto.actionRequired || null,
        dto.deadline || null,
        dto.signatureStamp || `GUIDE_SIG_${new Date().toISOString().slice(0, 10)}`,
      ],
    );
    return res[0];
  }

  // ==========================================
  // 9. FINAL EVALUATION & RUBRIC SUMMARY
  // ==========================================
  async getFinalEvaluation(tenantSlug: string, userIdOrStudentId?: string) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const studentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT e.*, f.name as faculty_name
       FROM "${schema}".logbook_final_evaluations e
       LEFT JOIN "${schema}".faculty f ON f.id::text = e.faculty_id::text
       WHERE e.student_id::text = $1
       ORDER BY e.updated_at DESC LIMIT 1`,
      [studentId],
    );

    if (res && res.length > 0) return res[0];

    // Compute automatic progressive scorecard
    const weeklyApproved = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COUNT(*) as c FROM "${schema}".logbook_weekly_logs WHERE student_id::text = $1 AND (status = 'APPROVED' OR status = 'VERIFIED')`,
      [studentId],
    );
    const revScores = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT COALESCE(AVG(total_score), 0) as avg_score FROM "${schema}".logbook_project_reviews WHERE student_id::text = $1 AND approval_status = 'APPROVED'`,
      [studentId],
    );

    const techMarks = Math.min(30, Math.round(Number(revScores[0]?.avg_score || 25) * 0.3));
    const docMarks = Math.min(25, 22);
    const vivaMarks = Math.min(25, 23);
    const regMarks = Math.min(20, Math.max(16, Number(weeklyApproved[0]?.c || 0) * 4));
    const total = techMarks + docMarks + vivaMarks + regMarks;

    return {
      technical_implementation_marks: techMarks,
      report_documentation_marks: docMarks,
      presentation_viva_marks: vivaMarks,
      regularity_attendance_marks: regMarks,
      total_marks: total,
      grade: total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 70 ? 'B+' : 'B',
      approval_status: 'IN_PROGRESS',
      faculty_comments: 'Regular weekly progress observed. Continuous milestones submitted on schedule.',
      digital_signature: 'PROVISIONAL_SYSTEM_VERIFIED',
    };
  }

  // ==========================================
  // 10. UNIVERSAL FACULTY REVIEW ACTION
  // ==========================================
  async facultyReviewAction(tenantSlug: string, facultyId: string, dto: FacultyReviewActionDto) {
    await this.ensureTables(tenantSlug);
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const stamp = dto.signatureStamp || `VERIFIED_BY_FACULTY_${new Date().toISOString().slice(0, 10)}`;

    let targetTable = '';
    switch (dto.entityType.toUpperCase()) {
      case 'WEEKLY_LOG':
        targetTable = 'logbook_weekly_logs';
        break;
      case 'SEMINAR':
        targetTable = 'logbook_seminars';
        break;
      case 'TUTORIAL':
        targetTable = 'logbook_tutorials';
        break;
      case 'TECHNICAL_ACTIVITY':
        targetTable = 'logbook_technical_activities';
        break;
      case 'PROJECT_REVIEW':
        targetTable = 'logbook_project_reviews';
        break;
      case 'MINI_PROJECT':
        targetTable = 'logbook_mini_projects';
        break;
      default:
        targetTable = 'logbook_submissions';
    }

    if (targetTable === 'logbook_submissions') {
      return this.evaluateSubmission(tenantSlug, dto.entityId, facultyId, {
        marksObtained: dto.marks || 100,
        remarks: dto.remarks || 'Approved by Faculty Guide',
      });
    }

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}"."${targetTable}"
       SET status = $1, guide_marks = $2, guide_remarks = $3, guide_signature = $4, verified_at = NOW(), updated_at = NOW()
       WHERE id = $5::uuid RETURNING *`,
      [dto.approvalStatus, dto.marks || null, dto.remarks || null, stamp, dto.entityId],
    );

    return {
      success: true,
      message: `${dto.entityType} evaluated and updated successfully`,
      data: res[0],
    };
  }

  // ==========================================
  // TOPICS & SUBMISSIONS (Backwards-Compatible API)
  // ==========================================
  async getCategories(tenantSlug: string, query: { courseId?: string; departmentId?: string } = {}) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const params: any[] = [];
    let sql = `SELECT id, code, name, course_id, department_id, description, is_active, created_at FROM "${schema}".logbook_categories WHERE is_active = true`;
    if (query.courseId && query.courseId !== 'all') { params.push(query.courseId); sql += ` AND (course_id IS NULL OR course_id = $${params.length})`; }
    if (query.departmentId && query.departmentId !== 'all') { params.push(query.departmentId); sql += ` AND (department_id IS NULL OR department_id = $${params.length})`; }
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

  async createTopic(tenantSlug: string, facultyId: string, dto: CreateLogbookTopicDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_topics (
        category_id, faculty_id, title, description, submission_deadline,
        max_marks, course_id, branch_id, batch_id, semester_id, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true) RETURNING *`,
      [
        dto.categoryId, facultyId, dto.title, dto.description || null,
        dto.submissionDeadline || null, dto.maxMarks || 100,
        dto.courseId || null, dto.branchId || null, dto.batchId || null, dto.semesterId || null,
      ],
    );
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
      studentUserId?: string;
    } = {},
  ) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const params: any[] = [];

    let effectiveStudentId: string | null = query.studentId || query.studentUserId || null;
    let fallbackUserId: string | null = query.studentUserId || query.studentId || null;

    if (effectiveStudentId) {
      try {
        const stRows = await this.tenantSchemaService.queryInTenant(
          tenantSlug,
          `SELECT id, user_id, course_cd, batch_cd, batch_id, branch_id FROM "${schema}".students WHERE id::text = $1 OR user_id::text = $1 LIMIT 1`,
          [effectiveStudentId],
        );
        if (stRows && stRows.length > 0) {
          effectiveStudentId = stRows[0].id;
          fallbackUserId = stRows[0].user_id || fallbackUserId;
        }
      } catch (e) {}
    }

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

    if (effectiveStudentId) {
      params.push(effectiveStudentId);
      const p1 = params.length;
      params.push(fallbackUserId || effectiveStudentId);
      const p2 = params.length;

      sql += `, (
        SELECT json_build_object(
          'id', sub.id,
          'status', sub.status,
          'submitted_at', sub.submitted_at,
          'file_url', sub.file_url,
          'file_name', sub.file_name,
          'file_size', sub.file_size,
          'explanation_text', sub.explanation_text,
          'marks_obtained', ev.marks_obtained,
          'remarks', ev.remarks,
          'evaluated_at', ev.evaluated_at
        )
        FROM "${schema}".logbook_submissions sub
        LEFT JOIN "${schema}".logbook_evaluations ev ON ev.submission_id = sub.id
        WHERE sub.topic_id = t.id AND (sub.student_id::text = $${p1}::text OR sub.student_id::text = $${p2}::text)
        LIMIT 1
      ) AS student_submission`;
    }

    sql += `
      FROM "${schema}".logbook_topics t
      LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
      LEFT JOIN "${schema}".faculty f ON f.id::text = t.faculty_id::text
      LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = t.course_id::text OR cr.id::text = t.course_id::text)
      LEFT JOIN "${schema}".batches b ON (b.id::text = t.batch_id::text OR (b.batch_cd::text = t.batch_id::text AND b.course_cd::text = t.course_id::text))
      WHERE t.is_active = true
    `;

    if (query.facultyId) {
      params.push(query.facultyId);
      sql += ` AND (t.faculty_id::text = $${params.length}::text)`;
    }
    if (query.categoryId && query.categoryId !== 'all') {
      params.push(query.categoryId);
      sql += ` AND (t.category_id::text = $${params.length}::text)`;
    }
    if (query.courseId && query.courseId !== 'all') {
      params.push(query.courseId);
      sql += ` AND (t.course_id IS NULL OR t.course_id = 'all' OR t.course_id = '' OR t.course_id = $${params.length})`;
    }
    if (query.batchId && query.batchId !== 'all') {
      params.push(query.batchId);
      sql += ` AND (t.batch_id IS NULL OR t.batch_id = 'all' OR t.batch_id = '' OR t.batch_id = $${params.length})`;
    }
    if (query.branchId && query.branchId !== 'all' && query.branchId !== '1') {
      params.push(query.branchId);
      sql += ` AND (t.branch_id IS NULL OR t.branch_id = 'all' OR t.branch_id = '1' OR t.branch_id = '' OR t.branch_id = $${params.length})`;
    }
    if (query.semesterId && query.semesterId !== 'all') {
      params.push(query.semesterId);
      sql += ` AND (t.semester_id IS NULL OR t.semester_id = 'all' OR t.semester_id = '' OR t.semester_id = $${params.length})`;
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

    if (dto.title !== undefined) { params.push(dto.title); sets.push(`title = $${params.length}`); }
    if (dto.description !== undefined) { params.push(dto.description); sets.push(`description = $${params.length}`); }
    if (dto.maxMarks !== undefined) { params.push(dto.maxMarks); sets.push(`max_marks = $${params.length}`); }
    if (dto.submissionDeadline !== undefined) { params.push(dto.submissionDeadline); sets.push(`submission_deadline = $${params.length}`); }
    if (dto.courseId !== undefined) { params.push(dto.courseId); sets.push(`course_id = $${params.length}`); }
    if (dto.branchId !== undefined) { params.push(dto.branchId); sets.push(`branch_id = $${params.length}`); }
    if (dto.batchId !== undefined) { params.push(dto.batchId); sets.push(`batch_id = $${params.length}`); }
    if (dto.categoryId !== undefined) { params.push(dto.categoryId); sets.push(`category_id = $${params.length}::uuid`); }
    if (dto.semesterId !== undefined) { params.push(dto.semesterId); sets.push(`semester_id = $${params.length}`); }
    if (dto.isActive !== undefined) { params.push(dto.isActive); sets.push(`is_active = $${params.length}`); }

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
    await this.tenantSchemaService.queryInTenant(tenantSlug, `DELETE FROM "${schema}".logbook_topics WHERE id = $1::uuid`, [topicId]);
    return { success: true, message: 'Topic deleted successfully' };
  }

  async createSubmission(tenantSlug: string, userIdOrStudentId: string | undefined, dto: CreateLogbookSubmissionDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const effectiveStudentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    const topic = await this.getTopicById(tenantSlug, dto.topicId);
    let status = 'SUBMITTED';
    if (topic.submission_deadline && new Date() > new Date(topic.submission_deadline)) {
      status = 'LATE';
    }

    const existing = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT s.id, s.status, e.id AS eval_id
       FROM "${schema}".logbook_submissions s
       LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
       WHERE s.topic_id = $1::uuid AND (s.student_id::text = $2::text OR s.student_id::text = $3::text)`,
      [dto.topicId, String(effectiveStudentId), String(userIdOrStudentId || effectiveStudentId)],
    );

    let submission;
    if (existing.length > 0) {
      if (existing[0].status === 'EVALUATED' || existing[0].eval_id) {
        throw new BadRequestException('This activity has already been evaluated by faculty and locked. Modifications are disabled.');
      }

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
        [dto.topicId, effectiveStudentId, dto.fileUrl || null, dto.fileName || null, dto.fileSize || null, dto.explanationText || null, status],
      );
      submission = res[0];
    }

    return submission;
  }

  async getMySubmissions(tenantSlug: string, userIdOrStudentId?: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const effectiveStudentId = await this.resolveStudentId(tenantSlug, userIdOrStudentId);

    const whereClause = effectiveStudentId
      ? `WHERE (s.student_id::text = $1::text OR s.student_id::text = $2::text)`
      : ``;
    const params = effectiveStudentId
      ? [String(effectiveStudentId), String(userIdOrStudentId || effectiveStudentId)]
      : [];

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
       LEFT JOIN "${schema}".faculty f ON f.id::text = t.faculty_id::text
       LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
       ${whereClause}
       ORDER BY s.submitted_at DESC`,
      params,
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
      LEFT JOIN "${schema}".students st ON st.id::text = s.student_id::text
      LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text)
      LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR (b.batch_cd::text = st.batch_cd::text AND b.course_cd::text = st.course_cd::text))
      LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
      LEFT JOIN "${schema}".faculty ef ON ef.id::text = e.faculty_id::text
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
       LEFT JOIN "${schema}".students st ON st.id::text = s.student_id::text
       LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text)
       LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR (b.batch_cd::text = st.batch_cd::text AND b.course_cd::text = st.course_cd::text))
       LEFT JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
       LEFT JOIN "${schema}".faculty ef ON ef.id::text = e.faculty_id::text
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
    const sub = await this.getSubmissionById(tenantSlug, submissionId);

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

    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE "${schema}".logbook_submissions SET status = 'EVALUATED', updated_at = NOW() WHERE id = $1::uuid`,
      [submissionId],
    );

    return {
      success: true,
      message: 'Evaluation submitted successfully',
      evaluation,
      status: 'EVALUATED',
    };
  }

  async getLeaderboard(
    tenantSlug: string,
    query: { categoryId?: string; courseId?: string; branchId?: string; batchId?: string; semesterId?: string; limit?: number } = {},
  ) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const params: any[] = [];

    let whereClause = `WHERE s.status = 'EVALUATED'`;
    if (query.categoryId && query.categoryId !== 'all') { params.push(query.categoryId); whereClause += ` AND (t.category_id::text = $${params.length}::text)`; }
    if (query.courseId && query.courseId !== 'all') { params.push(query.courseId); whereClause += ` AND st.course_cd::text = $${params.length}::text`; }
    if (query.batchId && query.batchId !== 'all') { params.push(query.batchId); whereClause += ` AND (st.batch_cd::text = $${params.length}::text OR st.batch_id::text = $${params.length}::text)`; }
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
               COALESCE(cr.name, 'Undergraduate Program') AS course_name,
               COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, st.batch_cd, 'Batch 2025') AS batch_name,
               t.category_id,
               c.name AS category_name,
               e.marks_obtained,
               t.max_marks,
               ROUND((e.marks_obtained / NULLIF(t.max_marks, 0)) * 100, 2) AS score_pct
        FROM "${schema}".logbook_submissions s
        JOIN "${schema}".logbook_topics t ON t.id = s.topic_id
        LEFT JOIN "${schema}".logbook_categories c ON c.id = t.category_id
        JOIN "${schema}".logbook_evaluations e ON e.submission_id = s.id
        JOIN "${schema}".students st ON st.id::text = s.student_id::text
        LEFT JOIN "${schema}".courses cr ON (cr.course_cd::text = st.course_cd::text OR cr.id::text = t.course_id::text OR cr.course_cd::text = t.course_id::text)
        LEFT JOIN "${schema}".batches b ON (b.id::text = st.batch_id::text OR b.id::text = t.batch_id::text OR (b.batch_cd::text = st.batch_cd::text AND b.course_cd::text = st.course_cd::text))
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

  async getNotifications(tenantSlug: string, userId: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM "${schema}".logbook_notifications WHERE user_id::text = $1::text ORDER BY created_at DESC LIMIT 30`,
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

  // Legacy
  async createEntry(tenantSlug: string, dto: CreateLogbookEntryDto) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO "${schema}".logbook_entries (student_id, activity_type_id, entry_date, description, faculty_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.studentId, dto.activityTypeId, dto.entryDate, dto.description || null, dto.facultyId || null],
    );
    return res[0];
  }

  async getActivityTypes(tenantSlug: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    return this.tenantSchemaService.queryInTenant(tenantSlug, `SELECT id, code, name, category, max_required, activity_type FROM "${schema}".logbook_activity_types ORDER BY name ASC`);
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
       WHERE LOWER(COALESCE(s.rollno, '')) = LOWER($1) OR LOWER(COALESCE(s.registration_no, '')) = LOWER($1) OR s.id::text = $1
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

  async getAcademicStructure(tenantSlug: string) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    try {
      const courses = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT id, COALESCE(course_cd, code) as course_cd, name FROM "${schema}".courses WHERE is_active = true OR is_active IS NULL ORDER BY name ASC`,
      ).catch(() => []);

      const branches = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT id, COALESCE(branch_cd, code) as branch_cd, name, course_id, course_cd FROM "${schema}".branches ORDER BY name ASC`,
      ).catch(() => []);

      const batches = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT id, COALESCE(batch_cd, code, year::text) as batch_cd, name, course_id, course_cd, year FROM "${schema}".batches ORDER BY year DESC, name DESC`,
      ).catch(() => []);

      const semesters = [
        { id: '1', sem_cd: '1', name: 'Semester 1' },
        { id: '2', sem_cd: '2', name: 'Semester 2' },
        { id: '3', sem_cd: '3', name: 'Semester 3' },
        { id: '4', sem_cd: '4', name: 'Semester 4' },
        { id: '5', sem_cd: '5', name: 'Semester 5' },
        { id: '6', sem_cd: '6', name: 'Semester 6' },
        { id: '7', sem_cd: '7', name: 'Semester 7' },
        { id: '8', sem_cd: '8', name: 'Semester 8' },
      ];

      // Robust fallback data if tables are empty
      const finalCourses = courses.length > 0 ? courses : [
        { id: '13', course_cd: '13', name: 'BCA (Bachelor of Computer Applications)' },
        { id: '1', course_cd: '1', name: 'B.Tech (Bachelor of Technology)' },
        { id: '4', course_cd: '4', name: 'MCA (Master of Computer Applications)' },
        { id: '3', course_cd: '3', name: 'MBA (Master of Business Administration)' },
        { id: '2', course_cd: '2', name: 'B.Pharm (Bachelor of Pharmacy)' },
      ];

      return {
        courses: finalCourses,
        branches,
        batches,
        semesters,
      };
    } catch (e: any) {
      return {
        courses: [
          { id: '13', course_cd: '13', name: 'BCA (Bachelor of Computer Applications)' },
          { id: '1', course_cd: '1', name: 'B.Tech (Bachelor of Technology)' },
          { id: '4', course_cd: '4', name: 'MCA (Master of Computer Applications)' },
          { id: '3', course_cd: '3', name: 'MBA (Master of Business Administration)' },
          { id: '2', course_cd: '2', name: 'B.Pharm (Bachelor of Pharmacy)' },
        ],
        branches: [],
        batches: [],
        semesters: [
          { id: '1', sem_cd: '1', name: 'Semester 1' },
          { id: '2', sem_cd: '2', name: 'Semester 2' },
          { id: '3', sem_cd: '3', name: 'Semester 3' },
          { id: '4', sem_cd: '4', name: 'Semester 4' },
          { id: '5', sem_cd: '5', name: 'Semester 5' },
          { id: '6', sem_cd: '6', name: 'Semester 6' },
        ],
      };
    }
  }

  async createSeminarOrTutorialTopic(tenantSlug: string, facultyId: string, dto: any) {
    const schema = `tenant_${tenantSlug.replace(/^tenant_/, '')}`;
    await this.ensureTables(tenantSlug);

    const type = (dto.type || 'SEMINAR').toUpperCase();
    const categoryCode = type === 'TUTORIAL' ? 'TUTORIAL' : 'SEMINAR';
    const categoryName = type === 'TUTORIAL' ? 'Tutorial & Problem Sheet' : 'Academic Seminar';

    // 1. Get or create category
    let cat = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT id FROM "${schema}".logbook_categories WHERE code = $1 LIMIT 1`,
      [categoryCode],
    );
    let categoryId = cat[0]?.id;
    if (!categoryId) {
      const insCat = await this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `INSERT INTO "${schema}".logbook_categories (code, name, description, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
        [categoryCode, categoryName, `${categoryName} Logbook Activities`],
      );
      categoryId = insCat[0]?.id;
    }

    return this.createTopic(tenantSlug, facultyId, {
      categoryId,
      title: dto.title,
      description: dto.description || null,
      submissionDeadline: dto.submissionDeadline ? new Date(dto.submissionDeadline).toISOString() : undefined,
      maxMarks: Number(dto.maxMarks) || 20,
      courseId: dto.courseId || null,
      branchId: dto.branchId || null,
      batchId: dto.batchId || null,
      semesterId: dto.semesterId || null,
    });
  }
}
