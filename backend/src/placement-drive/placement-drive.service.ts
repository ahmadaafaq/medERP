import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ConflictException, 
  Logger 
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { 
  CreatePlacementDriveDto, 
  ApplyPlacementDriveDto, 
  UpdateApplicantStatusDto, 
  PlacementReportQueryDto 
} from './dto/placement-drive.dto';

@Injectable()
export class PlacementDriveService {
  private readonly logger = new Logger(PlacementDriveService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  /**
   * Helper to resolve student profile from JWT user context (user.sub, user.email, etc.)
   */
  private async resolveStudent(slug: string, user: any) {
    const schema = `tenant_${slug}`;
    const userId = user?.sub || user?.id;
    const email = user?.email;
    const identifier = user?.registration_no || user?.username || user?.rollno;

    const isUuid = userId && typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    let studentRows: any[] = [];
    if (isUuid) {
      studentRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT s.id, s.registration_no, s.rollno, s.name, s.course_cd, s.batch_cd
         FROM "${schema}".students s
         WHERE s.user_id = $1 LIMIT 1`,
        [userId],
      ).catch(() => []);
    }

    if ((!studentRows || studentRows.length === 0) && identifier) {
      studentRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT s.id, s.registration_no, s.rollno, s.name, s.course_cd, s.batch_cd
         FROM "${schema}".students s
         WHERE s.registration_no = $1 OR s.rollno = $1 LIMIT 1`,
        [identifier],
      ).catch(() => []);
    }

    if ((!studentRows || studentRows.length === 0) && email) {
      studentRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT s.id, s.registration_no, s.rollno, s.name, s.course_cd, s.batch_cd
         FROM "${schema}".students s
         JOIN "${schema}".users u ON s.user_id = u.id
         WHERE u.email = $1 LIMIT 1`,
        [email],
      ).catch(() => []);
    }

    if (studentRows && studentRows.length > 0) {
      return studentRows[0];
    }

    return {
      registration_no: identifier || (email ? email.split('@')[0] : 'REG_UNKNOWN'),
      name: user?.name || (email ? email.split('@')[0] : 'Student Applicant'),
      course_cd: null,
      batch_cd: null,
    };
  }

  /**
   * Admin: Create a new Placement Drive
   */
  async createPlacementDrive(tenantSlug: string, dto: CreatePlacementDriveDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const createdByEmpId = user?.emp_id || user?.username || user?.sub || user?.email || 'ADMIN001';

    const sql = `
      INSERT INTO "${schema}".placement_drives (
        colg_cd, company_name, role, package_ctc, description,
        eligibility_course_cd, eligibility_branch_cd, eligibility_batch_cd,
        min_score_required, drive_date, deadline_date, status,
        created_by_empid, created_at, updated_at
      ) VALUES (
        '1', $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, 'Open',
        $11, NOW(), NOW()
      )
      RETURNING *
    `;

    const drive = await this.tenantSchemaService.queryInTenant(slug, sql, [
      dto.company_name,
      dto.role,
      dto.package_ctc || null,
      dto.description,
      dto.eligibility_course_cd,
      dto.eligibility_branch_cd || null,
      dto.eligibility_batch_cd,
      dto.min_score_required || 0.0,
      dto.drive_date,
      dto.deadline_date,
      createdByEmpId,
    ]);

    return {
      message: 'Placement drive created successfully',
      drive: drive[0],
    };
  }

  /**
   * List placement drives
   */
  async listPlacementDrives(tenantSlug: string, user: any, status?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const params: any[] = [];
    let whereConditions: string[] = ['1=1'];

    if (status) {
      params.push(status);
      whereConditions.push(`pd.status = $${params.length}`);
    }

    const sql = `
      SELECT pd.*,
             (SELECT COUNT(*)::int FROM "${schema}".placement_applications pa WHERE pa.drive_id = pd.drive_id) AS total_applicants,
             (SELECT COUNT(*)::int FROM "${schema}".placement_applications pa WHERE pa.drive_id = pd.drive_id AND pa.status = 'Selected') AS total_selected
      FROM "${schema}".placement_drives pd
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY pd.drive_date ASC, pd.created_at DESC
    `;

    const drives = await this.tenantSchemaService.queryInTenant(slug, sql, params);

    // If student user, attach student's own application status for each drive
    if (user?.role === 'STUDENT') {
      const student = await this.resolveStudent(slug, user);
      const regNo = student.registration_no;
      const myApps = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT drive_id, status, applied_at, selected_company, selected_role FROM "${schema}".placement_applications WHERE student_reg_no = $1`,
        [regNo],
      );
      const appMap = new Map(myApps.map((a: any) => [a.drive_id, a]));

      drives.forEach((d: any) => {
        d.my_application = appMap.get(d.drive_id) || null;
      });
    }

    return { data: drives, count: drives.length };
  }

  /**
   * Get Drive Details + Applicants List
   */
  async getPlacementDriveById(tenantSlug: string, driveId: number) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const drives = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".placement_drives WHERE drive_id = $1`,
      [driveId],
    );

    if (!drives || drives.length === 0) {
      throw new NotFoundException(`Placement drive with ID ${driveId} not found`);
    }

    const applicants = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT pa.*, s.course_cd, s.batch_cd
       FROM "${schema}".placement_applications pa
       LEFT JOIN (
         SELECT DISTINCT ON (registration_no) registration_no, course_cd, batch_cd
         FROM "${schema}".students
       ) s ON pa.student_reg_no = s.registration_no
       WHERE pa.drive_id = $1
       ORDER BY pa.applied_at DESC`,
      [driveId],
    );

    return {
      drive: drives[0],
      applicants,
    };
  }

  /**
   * Cross-Module Feature: Get Nominated Projects (`is_placement_eligible = true`) for a Drive
   */
  async getNominatedProjectsForDrive(tenantSlug: string, driveId: number) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const drives = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".placement_drives WHERE drive_id = $1`,
      [driveId],
    );

    if (!drives || drives.length === 0) {
      throw new NotFoundException(`Placement drive with ID ${driveId} not found`);
    }

    const drive = drives[0];

    const sql = `
      SELECT r.repo_id, r.title, r.description, r.repo_link, r.tech_stack,
             r.student_reg_no, r.student_name, r.course_cd, r.branch_cd, r.batch_cd,
             r.score, r.grade, r.submitted_at
      FROM "${schema}".repositories r
      WHERE r.is_placement_eligible = true
        AND r.course_cd = $1
        AND ($2::varchar IS NULL OR r.branch_cd = $2)
        AND r.batch_cd = $3
        AND (r.score >= $4 OR $4 IS NULL)
      ORDER BY r.score DESC NULLS LAST, r.submitted_at DESC
    `;

    const nominatedProjects = await this.tenantSchemaService.queryInTenant(slug, sql, [
      drive.eligibility_course_cd,
      drive.eligibility_branch_cd || null,
      drive.eligibility_batch_cd,
      drive.min_score_required || null,
    ]);

    return {
      drive,
      nominatedProjects,
      count: nominatedProjects.length,
    };
  }

  /**
   * Student: Apply to a Placement Drive
   */
  async applyToPlacementDrive(tenantSlug: string, dto: ApplyPlacementDriveDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const student = await this.resolveStudent(slug, user);
    const regNo = student.registration_no;
    const studentName = student.name || user?.name || 'Student Applicant';

    // Verify drive existence and status
    const drives = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".placement_drives WHERE drive_id = $1`,
      [dto.drive_id],
    );

    if (!drives || drives.length === 0) {
      throw new NotFoundException(`Placement drive with ID ${dto.drive_id} not found`);
    }

    const drive = drives[0];
    if (drive.status !== 'Open') {
      throw new BadRequestException(`This placement drive is currently ${drive.status} and not accepting applications.`);
    }

    // Application Deadline check
    const now = new Date();
    const deadline = new Date(drive.deadline_date);
    deadline.setHours(23, 59, 59, 999);
    if (now > deadline) {
      throw new BadRequestException(`Application deadline (${drive.deadline_date}) has passed for this drive.`);
    }

    // Check duplicate submission
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT application_id FROM "${schema}".placement_applications WHERE drive_id = $1 AND student_reg_no = $2`,
      [dto.drive_id, regNo],
    );

    if (existing && existing.length > 0) {
      throw new ConflictException('You have already applied for this placement drive.');
    }

    const insertResult = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO "${schema}".placement_applications (
        drive_id, student_reg_no, student_name, resume_link, cover_note, status, applied_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'Applied', NOW(), NOW())
      RETURNING *`,
      [dto.drive_id, regNo, studentName, dto.resume_link, dto.cover_note || null],
    );

    return {
      message: 'Application submitted successfully',
      application: insertResult[0],
    };
  }

  /**
   * Admin/Faculty: Shortlist or Update Applicant Status
   */
  async updateApplicantStatus(tenantSlug: string, dto: UpdateApplicantStatusDto) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const apps = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT pa.*, pd.company_name, pd.role
       FROM "${schema}".placement_applications pa
       JOIN "${schema}".placement_drives pd ON pa.drive_id = pd.drive_id
       WHERE pa.application_id = $1`,
      [dto.application_id],
    );

    if (!apps || apps.length === 0) {
      throw new NotFoundException(`Application with ID ${dto.application_id} not found`);
    }

    const app = apps[0];
    const selectedCompany = dto.status === 'Selected' ? (dto.selected_company || app.company_name) : null;
    const selectedRole = dto.status === 'Selected' ? (dto.selected_role || app.role) : null;

    const updated = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".placement_applications
       SET status = $1,
           selected_company = $2,
           selected_role = $3,
           remarks = $4,
           updated_at = NOW()
       WHERE application_id = $5
       RETURNING *`,
      [dto.status, selectedCompany, selectedRole, dto.remarks || null, dto.application_id],
    );

    // Insert Notification for Student
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".notifications (recipient_id, title, message, type, is_read, created_at)
         VALUES ($1, $2, $3, $4, false, NOW())`,
        [
          app.student_reg_no,
          `Placement Application Update: ${app.company_name}`,
          `Your placement application for ${app.company_name} (${app.role}) has been updated to: ${dto.status}.`,
          dto.status === 'Selected' ? 'success' : dto.status === 'Shortlisted' ? 'info' : 'warning',
        ],
      );
    } catch (e) {
      this.logger.warn(`Could not create notification record for ${app.student_reg_no}: ${e.message}`);
    }

    return {
      message: `Applicant status updated to ${dto.status} and student notified successfully`,
      application: updated[0],
      notified: true,
      student_reg_no: app.student_reg_no,
      student_name: app.student_name,
    };
  }

  /**
   * Page 4: Comprehensive Placement Status Reports
   */
  async getPlacementStatusReports(tenantSlug: string, query: PlacementReportQueryDto) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const filterType = query.filter_type || 'all';

    // 1. Drive-Wise Summary
    const driveSummary = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT pd.drive_id, pd.company_name, pd.role, pd.package_ctc, pd.drive_date, pd.status,
              COUNT(pa.application_id)::int AS total_applied,
              COUNT(CASE WHEN pa.status = 'Shortlisted' THEN 1 END)::int AS shortlisted_count,
              COUNT(CASE WHEN pa.status = 'Selected' THEN 1 END)::int AS selected_count
       FROM "${schema}".placement_drives pd
       LEFT JOIN "${schema}".placement_applications pa ON pd.drive_id = pa.drive_id
       GROUP BY pd.drive_id, pd.company_name, pd.role, pd.package_ctc, pd.drive_date, pd.status
       ORDER BY pd.drive_date DESC`
    );

    // 2. Student Placement Status Reports
    let studentReportSql = '';
    const params: any[] = [];

    if (filterType === 'zero') {
      // Students with zero placements
      studentReportSql = `
        SELECT s.registration_no, s.name AS student_name, s.course_cd, s.batch_cd,
               COUNT(pa.application_id)::int AS total_drives_applied,
               0::int AS total_placements,
               'Unplaced' AS placement_status
        FROM "${schema}".students s
        LEFT JOIN "${schema}".placement_applications pa ON s.registration_no = pa.student_reg_no
        LEFT JOIN "${schema}".placement_applications pa_sel 
          ON s.registration_no = pa_sel.student_reg_no AND pa_sel.status = 'Selected'
        WHERE s.is_active = true
        GROUP BY s.registration_no, s.name, s.course_cd, s.batch_cd
        HAVING COUNT(pa_sel.application_id) = 0
        ORDER BY s.name ASC
      `;
    } else if (filterType === 'multiple') {
      // Students with multiple placements (2+)
      studentReportSql = `
        SELECT s.registration_no, s.name AS student_name, s.course_cd, s.batch_cd,
               COUNT(pa_sel.application_id)::int AS total_placements,
               STRING_AGG(CONCAT(pd.company_name, ' (', pd.role, ')'), ', ') AS companies_placed
        FROM "${schema}".students s
        JOIN "${schema}".placement_applications pa_sel 
          ON s.registration_no = pa_sel.student_reg_no AND pa_sel.status = 'Selected'
        JOIN "${schema}".placement_drives pd ON pa_sel.drive_id = pd.drive_id
        WHERE s.is_active = true
        GROUP BY s.registration_no, s.name, s.course_cd, s.batch_cd
        HAVING COUNT(pa_sel.application_id) >= 2
        ORDER BY total_placements DESC, s.name ASC
      `;
    } else {
      // All active students with placement counts
      studentReportSql = `
        SELECT s.registration_no, s.name AS student_name, s.course_cd, s.batch_cd,
               COUNT(pa.application_id)::int AS total_drives_applied,
               COUNT(CASE WHEN pa.status = 'Selected' THEN 1 END)::int AS total_placements,
               STRING_AGG(CASE WHEN pa.status = 'Selected' THEN CONCAT(pd.company_name, ' (', pd.role, ')') END, ', ') AS companies_placed
        FROM "${schema}".students s
        LEFT JOIN "${schema}".placement_applications pa ON s.registration_no = pa.student_reg_no
        LEFT JOIN "${schema}".placement_drives pd ON pa.drive_id = pd.drive_id
        WHERE s.is_active = true
        GROUP BY s.registration_no, s.name, s.course_cd, s.batch_cd
        ORDER BY total_placements DESC, s.name ASC
      `;
    }

    const studentReports = await this.tenantSchemaService.queryInTenant(slug, studentReportSql, params);

    return {
      driveSummary,
      studentReports,
      count: studentReports.length,
      filterType,
    };
  }

  /**
   * Admin & Student Dashboard Summaries
   */
  async getDashboardSummary(tenantSlug: string, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const totalDrives = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT COUNT(*)::int AS cnt FROM "${schema}".placement_drives WHERE status = 'Open'`,
    );

    const totalPlaced = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT COUNT(DISTINCT student_reg_no)::int AS cnt FROM "${schema}".placement_applications WHERE status = 'Selected'`,
    );

    const zeroPlacementCount = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT COUNT(DISTINCT s.registration_no)::int AS cnt
       FROM "${schema}".students s
       LEFT JOIN "${schema}".placement_applications pa ON s.registration_no = pa.student_reg_no AND pa.status = 'Selected'
       WHERE s.is_active = true AND pa.application_id IS NULL`,
    );

    const topRecruiters = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT company_name, COUNT(*)::int AS count_placed
       FROM "${schema}".placement_applications pa
       JOIN "${schema}".placement_drives pd ON pa.drive_id = pd.drive_id
       WHERE pa.status = 'Selected'
       GROUP BY company_name
       ORDER BY count_placed DESC
       LIMIT 5`,
    );

    return {
      openDrivesCount: totalDrives[0]?.cnt || 0,
      totalStudentsPlaced: totalPlaced[0]?.cnt || 0,
      zeroPlacementCount: zeroPlacementCount[0]?.cnt || 0,
      topRecruiters,
    };
  }
}
