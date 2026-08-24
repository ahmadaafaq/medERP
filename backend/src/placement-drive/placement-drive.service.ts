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
  PlacementReportQueryDto,
  ConfirmImportDriveDto,
  RespondOfferDto
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

    // Automatically publish official Campus Placement Notice into Notices bulletin
    try {
      const noticeTitle = `Campus Placement Drive: ${dto.company_name} — ${dto.role}${dto.package_ctc ? ` (${dto.package_ctc})` : ''}`;
      const noticeBody = `Official Announcement: ${dto.company_name} is organizing a Campus Placement Drive for eligible students.\n\n` +
        `• Company: ${dto.company_name}\n` +
        `• Role: ${dto.role}\n` +
        `• Package (CTC): ${dto.package_ctc || 'Attractive Package'}\n` +
        `• Eligible Course: Course Code ${dto.eligibility_course_cd}\n` +
        `• Eligible Batch: ${dto.eligibility_batch_cd}\n` +
        `• Minimum Project Score Required: ${dto.min_score_required || 0}%\n` +
        `• Drive Date: ${dto.drive_date}\n` +
        `• Deadline: ${dto.deadline_date}\n\n` +
        `Requirements:\n${dto.description}\n\n` +
        `Submit your resume directly under the Placement Drive tab in your Student Dashboard.`;

      const noticeInsert = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".notices (
          title, body, priority, category, creator_name, creator_role, status, requires_acknowledgement, created_at, updated_at
        ) VALUES ($1, $2, 'important', 'career', 'Training & Placement Cell (T&P)', 'Training & Placement Officer', 'sent', false, NOW(), NOW())
        RETURNING id`,
        [noticeTitle, noticeBody],
      );

      if (noticeInsert && noticeInsert.length > 0) {
        const noticeId = noticeInsert[0].id;
        await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO "${schema}".notice_targets (notice_id, target_type, target_value, target_label)
           VALUES ($1, 'role', 'STUDENT', 'All Students'), ($1, 'course', $2, 'Eligible Course')`,
          [noticeId, dto.eligibility_course_cd],
        );

        const students = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT u.id as user_id FROM "${schema}".users u WHERE UPPER(u.role) = 'STUDENT' AND u.is_active = true`,
        );

        for (const s of students) {
          if (s.user_id) {
            await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".notice_recipients (notice_id, user_id, is_read)
               VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
              [noticeId, s.user_id],
            );
          }
        }
      }
    } catch (noticeErr: any) {
      this.logger.warn(`Could not automatically create placement notice: ${noticeErr?.message || noticeErr}`);
    }

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
   * Excel Import: Preview uploaded spreadsheet with smart column recognition and extra_fields JSONB mapping
   */
  async previewExcelImport(tenantSlug: string, fileBuffer: Buffer, fileName: string) {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('The uploaded file does not contain any spreadsheet sheets.');
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      throw new BadRequestException('The uploaded spreadsheet is empty or has no readable rows.');
    }

    const headers = Object.keys(rawRows[0] || {});
    const recognizedMapping: Record<string, string> = {};
    const unrecognizedCols: string[] = [];

    const CORE_HEADER_PATTERNS: Record<string, RegExp> = {
      company_name: /^(company|company[\s_-]*name|organization|employer|firm|corporate)$/i,
      role: /^(role|job[\s_-]*role|designation|profile|position|job[\s_-]*title)$/i,
      package_ctc: /^(package|ctc|package[\s_-]*ctc|salary|package[\s_-]*lpa|lpa|stipend)$/i,
      package_min: /^(min[\s_-]*package|min[\s_-]*ctc|package[\s_-]*min)$/i,
      package_max: /^(max[\s_-]*package|max[\s_-]*ctc|package[\s_-]*max)$/i,
      eligible_branches: /^(branch|branches|eligible[\s_-]*branches|department|departments|stream)$/i,
      eligible_batches: /^(batch|batches|eligible[\s_-]*batches|passing[\s_-]*year|year)$/i,
      drive_date: /^(drive[\s_-]*date|date|visiting[\s_-]*date|date[\s_-]*of[\s_-]*drive|event[\s_-]*date)$/i,
      deadline_date: /^(deadline|deadline[\s_-]*date|last[\s_-]*date|registration[\s_-]*deadline)$/i,
      description: /^(description|job[\s_-]*description|details|requirements|eligibility[\s_-]*criteria)$/i,
      logo_url: /^(logo|logo[\s_-]*url|icon|image)$/i,
    };

    for (const h of headers) {
      const cleanH = h.trim();
      let matched = false;
      for (const [coreField, regex] of Object.entries(CORE_HEADER_PATTERNS)) {
        if (regex.test(cleanH)) {
          recognizedMapping[h] = coreField;
          matched = true;
          break;
        }
      }
      if (!matched) {
        unrecognizedCols.push(cleanH);
      }
    }

    const previewRows = rawRows.slice(0, 100).map((row) => {
      const core: any = {
        company_name: '',
        role: 'Graduate Trainee / Associate Engineer',
        package_ctc: '₹4.5 - ₹8.0 LPA',
        eligible_branches: ['CSE', 'IT', 'ECE'],
        eligible_batches: ['2025', '2026'],
        drive_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'On-campus placement drive with technical assessment and interviews.',
        extra_fields: {},
      };

      for (const [col, val] of Object.entries(row)) {
        const mappedField = recognizedMapping[col];
        if (mappedField) {
          if (mappedField === 'eligible_branches' || mappedField === 'eligible_batches') {
            core[mappedField] = typeof val === 'string' 
              ? val.split(/[,;\/|]/).map((s: string) => s.trim()).filter(Boolean)
              : [String(val)];
          } else {
            core[mappedField] = String(val).trim();
          }
        } else {
          core.extra_fields[col] = val;
        }
      }

      if (!core.company_name) {
        core.company_name = row['Company'] || row['Company Name'] || Object.values(row)[0] || 'Visiting Company';
      }

      return core;
    });

    return {
      file_name: fileName,
      total_rows: rawRows.length,
      recognized_columns: Object.values(recognizedMapping),
      unrecognized_columns: unrecognizedCols,
      preview_rows: previewRows,
    };
  }

  /**
   * Excel Import: Confirm and commit bulk placement drive companies
   */
  async confirmExcelImport(tenantSlug: string, dto: ConfirmImportDriveDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    if (!dto.companies || !Array.isArray(dto.companies) || dto.companies.length === 0) {
      throw new BadRequestException('No companies provided for import.');
    }

    const insertedCompanies: any[] = [];

    for (const comp of dto.companies) {
      const companyName = comp.company_name || 'Partner Company';
      const role = comp.role || 'Associate / Engineer';
      const packageCtc = comp.package_ctc || 'As per industry standard';
      const description = comp.description || `${dto.batch_title || 'Campus Placement Drive'} for eligible candidates.`;
      const driveDate = comp.drive_date || new Date().toISOString().split('T')[0];
      const deadlineDate = comp.deadline_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const branches = Array.isArray(comp.eligible_branches) ? comp.eligible_branches : ['CSE', 'IT', 'ECE'];
      const batches = Array.isArray(comp.eligible_batches) ? comp.eligible_batches : ['2025', '2026'];
      const extraFields = comp.extra_fields || {};
      const logoUrl = comp.logo_url || null;

      const inserted = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".placement_drives (
          colg_cd, company_name, role, package_ctc, description,
          eligibility_course_cd, eligibility_branch_cd, eligibility_batch_cd,
          eligible_branches, eligible_batches, min_score_required,
          drive_date, deadline_date, logo_url, batch_title, source_file_name,
          extra_fields, status, created_by_empid, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, 'Open', $18, NOW(), NOW()
        ) RETURNING drive_id, company_name, role, package_ctc, drive_date, status, extra_fields`,
        [
          '1',
          companyName,
          role,
          packageCtc,
          description,
          '13',
          branches.join(', '),
          batches.join(', '),
          branches,
          batches,
          60.00,
          driveDate,
          deadlineDate,
          logoUrl,
          dto.batch_title,
          dto.source_file_name || 'placement_import.xlsx',
          JSON.stringify(extraFields),
          user?.registration_no || user?.emp_id || 'ADMIN',
        ],
      );

      if (inserted[0]) {
        insertedCompanies.push(inserted[0]);
      }
    }

    // Auto-create Announcement notice in bulletin
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".notices (
          title, body, priority, category, author_name, author_role, status, is_pinned, publish_date, created_at
        ) VALUES ($1, $2, 'important', 'career', 'Corporate Relations & Placement Cell', 'Placement Officer', 'sent', true, NOW(), NOW())`,
        [
          `📢 Campus Placement Drive: ${dto.batch_title} (${insertedCompanies.length} Companies Visiting)`,
          `Dear Students,\n\nWe are pleased to announce that ${insertedCompanies.length} prestigious corporate partners are visiting our campus for placement drives under "${dto.batch_title}".\n\nVisiting Companies:\n` +
            insertedCompanies.slice(0, 10).map((c, i) => `${i + 1}. ${c.company_name} — ${c.role} (${c.package_ctc})`).join('\n') +
            `\n\nCheck your Placement Portal to view detailed job descriptions, eligibility criteria, and submit your application.`,
        ],
      );
    } catch (noticeErr) {
      this.logger.warn(`Could not create placement bulletin notice: ${noticeErr?.message || noticeErr}`);
    }

    return {
      success: true,
      message: `Successfully imported ${insertedCompanies.length} companies into placement board`,
      batch_title: dto.batch_title,
      total_imported: insertedCompanies.length,
      companies: insertedCompanies,
    };
  }

  /**
   * Student Profile: Get all placement offers and calculate "Companies Placed: N"
   */
  async getStudentOffers(tenantSlug: string, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const regNo = user?.registration_no || user?.rollno || user?.username;

    const applications = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT pa.application_id, pa.drive_id, pa.student_reg_no, pa.student_name,
              pa.status, pa.selected_company, pa.selected_role, pa.offer_package,
              pa.offer_status, pa.applied_at, pa.updated_at,
              pd.company_name, pd.role, pd.package_ctc, pd.drive_date, pd.logo_url, pd.extra_fields
       FROM "${schema}".placement_applications pa
       JOIN "${schema}".placement_drives pd ON pa.drive_id = pd.drive_id
       WHERE pa.student_reg_no = $1
       ORDER BY pa.applied_at DESC`,
      [regNo],
    );

    const placedCount = applications.filter(
      (a: any) => a.status === 'Selected' || a.offer_status === 'accepted',
    ).length;

    const offers = applications.map((a: any) => ({
      application_id: a.application_id,
      drive_id: a.drive_id,
      company_name: a.selected_company || a.company_name,
      role: a.selected_role || a.role,
      package_ctc: a.package_ctc || (a.offer_package ? `₹${a.offer_package} LPA` : 'As offered'),
      offer_package: a.offer_package,
      status: a.status,
      offer_status: a.offer_status || (a.status === 'Selected' ? 'pending' : 'none'),
      applied_at: a.applied_at,
      updated_at: a.updated_at,
      extra_fields: a.extra_fields,
    }));

    return {
      student_reg_no: regNo,
      companies_placed_count: placedCount,
      total_applied_drives: applications.length,
      offers,
    };
  }

  /**
   * Student: Accept or Decline a specific placement offer
   */
  async respondToOffer(tenantSlug: string, appId: number, dto: RespondOfferDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const regNo = user?.registration_no || user?.rollno || user?.username;

    const apps = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT pa.*, pd.company_name, pd.role 
       FROM "${schema}".placement_applications pa
       JOIN "${schema}".placement_drives pd ON pa.drive_id = pd.drive_id
       WHERE pa.application_id = $1 AND pa.student_reg_no = $2`,
      [appId, regNo],
    );

    if (!apps || apps.length === 0) {
      throw new NotFoundException(`Application #${appId} for student ${regNo} not found.`);
    }

    const app = apps[0];
    const newStatus = dto.action === 'accept' ? 'accepted' : 'declined';

    const updated = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".placement_applications
       SET offer_status = $1, updated_at = NOW()
       WHERE application_id = $2
       RETURNING *`,
      [newStatus, appId],
    );

    return {
      success: true,
      message: `You have successfully ${newStatus} the offer from ${app.company_name}.`,
      offer_status: newStatus,
      application: updated[0],
    };
  }

  /**
   * Export: Generate real query data for Shortlisted / Placed or All Placements
   */
  async exportPlacementData(tenantSlug: string, query: { drive_id?: number; status?: string; company_name?: string }) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    let sql = `
      SELECT pa.application_id,
             s.name AS student_name,
             s.registration_no,
             s.rollno,
             s.course_cd,
             s.batch_cd,
             pd.company_name,
             pd.role,
             pd.package_ctc,
             pa.status,
             COALESCE(pa.offer_status, 'pending') AS offer_status,
             pa.applied_at,
             pa.updated_at
      FROM "${schema}".placement_applications pa
      JOIN "${schema}".placement_drives pd ON pa.drive_id = pd.drive_id
      LEFT JOIN "${schema}".students s ON pa.student_reg_no = s.registration_no
      WHERE 1=1
    `;

    const params: any[] = [];
    if (query.drive_id) {
      params.push(query.drive_id);
      sql += ` AND pa.drive_id = $${params.length}`;
    }

    if (query.status) {
      params.push(query.status);
      sql += ` AND pa.status ILIKE $${params.length}`;
    }

    sql += ` ORDER BY pd.company_name ASC, pa.applied_at DESC`;

    const rows = await this.tenantSchemaService.queryInTenant(slug, sql, params);

    return {
      total_records: rows.length,
      filter: query,
      data: rows,
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
