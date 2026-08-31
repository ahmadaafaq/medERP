import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException, 
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { NotificationsService } from '../notifications/notifications.service';
import { 
  CreateInternshipProgramDto, 
  ApplyInternshipDto, 
  UpdateApplicantStatusDto,
  UploadExternalCertificateDto
} from './dto/internship.dto';

@Injectable()
export class InternshipsService {
  private readonly logger = new Logger(InternshipsService.name);
  private static readonly ensuredSchemas = new Set<string>();

  constructor(
    private readonly tenantSchemaService: TenantSchemaService,
    private readonly notificationsService: NotificationsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private resolveTenantSlug(slug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(slug);
  }

  private async ensureTables(slug?: string): Promise<string> {
    const resolved = this.resolveTenantSlug(slug);
    if (InternshipsService.ensuredSchemas.has(resolved)) {
      return resolved;
    }
    const schema = `tenant_${resolved}`;

    try {
      await this.tenantSchemaService.queryInTenant(
        resolved,
        `CREATE TABLE IF NOT EXISTS "${schema}".internship_programs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'IT',
          duration VARCHAR(50) NOT NULL DEFAULT '3_MONTH',
          fee_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
          fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
          stipend_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
          campus_type VARCHAR(50) NOT NULL DEFAULT 'ON_CAMPUS',
          organization_name VARCHAR(255),
          organization_type VARCHAR(100),
          off_campus_title VARCHAR(255),
          location VARCHAR(255),
          working_conditions TEXT,
          work_mode VARCHAR(50) NOT NULL DEFAULT 'ON_SITE',
          certification_mode VARCHAR(50) NOT NULL DEFAULT 'IN_HOUSE_AUTO',
          description TEXT,
          seats_available INT NOT NULL DEFAULT 50,
          application_deadline DATE,
          published_by VARCHAR(100),
          status VARCHAR(50) NOT NULL DEFAULT 'published',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      );

      // Safe schema migrations
      const progColumns = [
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS stipend_amount NUMERIC(10, 2) DEFAULT 0`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS campus_type VARCHAR(50) DEFAULT 'ON_CAMPUS'`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255)`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100)`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS off_campus_title VARCHAR(255)`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS working_conditions TEXT`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS work_mode VARCHAR(50) DEFAULT 'ON_SITE'`,
        `ALTER TABLE "${schema}".internship_programs ADD COLUMN IF NOT EXISTS certification_mode VARCHAR(50) DEFAULT 'IN_HOUSE_AUTO'`,
      ];

      for (const colSql of progColumns) {
        await this.tenantSchemaService.queryInTenant(resolved, colSql).catch(() => {});
      }

      await this.tenantSchemaService.queryInTenant(
        resolved,
        `CREATE TABLE IF NOT EXISTS "${schema}".internship_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          program_id UUID NOT NULL REFERENCES "${schema}".internship_programs(id) ON DELETE CASCADE,
          student_id VARCHAR(100),
          student_reg_no VARCHAR(100) NOT NULL,
          student_name VARCHAR(255) NOT NULL,
          course_cd VARCHAR(100),
          batch_cd VARCHAR(100),
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          status VARCHAR(50) NOT NULL DEFAULT 'applied',
          locked BOOLEAN NOT NULL DEFAULT FALSE,
          payment_status VARCHAR(50) NOT NULL DEFAULT 'not_required',
          completed_at TIMESTAMPTZ,
          external_cert_url TEXT,
          cert_source VARCHAR(50) DEFAULT 'in_house',
          remarks TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      );

      const appColumns = [
        `ALTER TABLE "${schema}".internship_applications ADD COLUMN IF NOT EXISTS course_cd VARCHAR(100)`,
        `ALTER TABLE "${schema}".internship_applications ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(100)`,
        `ALTER TABLE "${schema}".internship_applications ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`,
        `ALTER TABLE "${schema}".internship_applications ADD COLUMN IF NOT EXISTS external_cert_url TEXT`,
        `ALTER TABLE "${schema}".internship_applications ADD COLUMN IF NOT EXISTS cert_source VARCHAR(50) DEFAULT 'in_house'`,
      ];

      for (const colSql of appColumns) {
        await this.tenantSchemaService.queryInTenant(resolved, colSql).catch(() => {});
      }

      await this.tenantSchemaService.queryInTenant(
        resolved,
        `CREATE TABLE IF NOT EXISTS "${schema}".certificates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          application_id UUID UNIQUE REFERENCES "${schema}".internship_applications(id) ON DELETE SET NULL,
          certificate_no VARCHAR(100) UNIQUE,
          student_name VARCHAR(255),
          student_reg_no VARCHAR(100),
          applicant_name VARCHAR(255),
          internship_name VARCHAR(255),
          program_title VARCHAR(255),
          organization_name VARCHAR(255),
          course VARCHAR(100),
          batch VARCHAR(100),
          duration VARCHAR(50),
          issued_date DATE DEFAULT CURRENT_DATE,
          approved_by VARCHAR(100) DEFAULT 'Prof. (Dr.) Prabhakar Gupta',
          pdf_url TEXT,
          external_cert_url TEXT,
          cert_source VARCHAR(50) DEFAULT 'in_house',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      );

      const certColumns = [
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS applicant_name VARCHAR(255)`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS internship_name VARCHAR(255)`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255)`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS course VARCHAR(100)`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS batch VARCHAR(100)`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS pdf_url TEXT`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS external_cert_url TEXT`,
        `ALTER TABLE "${schema}".certificates ADD COLUMN IF NOT EXISTS cert_source VARCHAR(50) DEFAULT 'in_house'`,
      ];

      for (const colSql of certColumns) {
        await this.tenantSchemaService.queryInTenant(resolved, colSql).catch(() => {});
      }
      InternshipsService.ensuredSchemas.add(resolved);
    } catch (e: any) {
      this.logger.warn(`Could not ensure internship tables in ${schema}: ${e.message}`);
    }

    return resolved;
  }

  /**
   * Admin / Faculty: Publish a new Internship or Certification Program
   */
  async createProgram(tenantSlug: string, dto: CreateInternshipProgramDto, user: any) {
    const slug = await this.ensureTables(tenantSlug);
    const schema = `tenant_${slug}`;

    if (dto.fee_type === 'PAID' && (!dto.fee_amount || dto.fee_amount <= 0)) {
      throw new BadRequestException('A valid fee amount is required for paid internship programs.');
    }

    const isOffCampus = dto.campus_type === 'OFF_CAMPUS';
    const orgName = dto.organization_name || (isOffCampus ? 'Partner Organization' : 'SRMS In-house Innovation & Research Cell');
    const orgType = dto.organization_type || (isOffCampus ? 'Industry / Company' : 'College Firm');
    const certMode = dto.certification_mode || (isOffCampus ? 'OFF_CAMPUS_UPLOAD' : 'IN_HOUSE_AUTO');
    const workMode = dto.work_mode || (isOffCampus ? 'ON_SITE' : 'ON_SITE');

    const inserted = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO "${schema}".internship_programs (
        title, category, duration, fee_type, fee_amount, stipend_amount,
        campus_type, organization_name, organization_type, off_campus_title,
        location, working_conditions, work_mode, certification_mode,
        description, seats_available, application_deadline, published_by, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, 'published',
        NOW(), NOW()
      ) RETURNING *`,
      [
        dto.title,
        dto.category,
        dto.duration,
        dto.fee_type,
        dto.fee_type === 'PAID' ? dto.fee_amount : 0,
        dto.fee_type === 'STIPEND' ? (dto.stipend_amount || 0) : (dto.stipend_amount || 0),
        dto.campus_type || 'ON_CAMPUS',
        orgName,
        orgType,
        dto.off_campus_title || dto.title,
        dto.location || (isOffCampus ? 'Corporate Location' : 'SRMS Bareilly Campus'),
        dto.working_conditions || (isOffCampus ? 'Standard Industry Protocols & Working Hours' : 'Standard College Lab Guidelines'),
        workMode,
        certMode,
        dto.description || `${dto.title} - ${isOffCampus ? `Off-Campus Industry Internship at ${orgName}` : 'On-Campus In-house Hands-on Internship & Certification'}.`,
        dto.seats_available || 50,
        dto.application_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        user?.registration_no || user?.emp_id || user?.id || 'ADMIN',
      ],
    );

    const prog = inserted[0];

    // Publish announcement notice
    try {
      const typeLabel = isOffCampus ? `🏢 Off-Campus (${orgName})` : '🏛️ On-Campus (In-House)';
      const compLabel = dto.fee_type === 'STIPEND' ? `Stipend: ₹${dto.stipend_amount || 0}/mo` : (dto.fee_type === 'PAID' ? `Fee: ₹${dto.fee_amount}` : '100% Free');

      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".notices (
          title, body, priority, category, author_name, author_role, status, is_pinned, publish_date, created_at
        ) VALUES ($1, $2, 'normal', 'career', 'Academic & Training Cell', 'Dean Academics', 'sent', false, NOW(), NOW())`,
        [
          `🎓 New Internship Opportunity: ${dto.title} [${typeLabel}]`,
          `Applications are now open for "${dto.title}".\n\nType: ${typeLabel}\nSector: ${orgType}\nDuration: ${dto.duration.replace('_', ' ')}\nCompensation: ${compLabel}\nMode: ${workMode}\nCertification: ${certMode === 'IN_HOUSE_AUTO' ? 'Verifiable In-house E-Certificate' : 'External Organization Completion Certificate'}\n\nEligible students can apply directly under the Internships section in the portal.`,
        ],
      );
    } catch (e) {
      this.logger.warn(`Could not create notice for internship: ${e.message}`);
    }

    return {
      success: true,
      message: 'Internship program published successfully',
      program: prog,
    };
  }

  /**
   * List all programs (visible to Student, Faculty, Admin, Clerk)
   */
  async listPrograms(tenantSlug: string, user: any, category?: string, feeType?: string, campusType?: string) {
    const slug = await this.ensureTables(tenantSlug);
    const schema = `tenant_${slug}`;

    let sql = `
      SELECT p.*,
             COUNT(DISTINCT a.id)::int AS total_applicants,
             COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.id END)::int AS selected_count,
             COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END)::int AS completed_count
      FROM "${schema}".internship_programs p
      LEFT JOIN "${schema}".internship_applications a ON p.id = a.program_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (category && category !== 'ALL') {
      params.push(category);
      sql += ` AND p.category = $${params.length}`;
    }
    if (feeType && feeType !== 'ALL') {
      params.push(feeType);
      sql += ` AND p.fee_type = $${params.length}`;
    }
    if (campusType && campusType !== 'ALL') {
      params.push(campusType);
      sql += ` AND p.campus_type = $${params.length}`;
    }

    sql += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const programs = await this.tenantSchemaService.queryInTenant(slug, sql, params);

    // If student, attach their specific application status
    const regNo = user?.registration_no || user?.rollno || user?.username || user?.id || '';
    if (regNo) {
      const myApps = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT a.*, c.certificate_no, c.issued_date, c.approved_by, c.external_cert_url AS cert_external_url, c.cert_source AS certificate_source
         FROM "${schema}".internship_applications a
         LEFT JOIN "${schema}".certificates c ON a.id = c.application_id
         WHERE a.student_reg_no = $1 OR a.student_id = $1 OR a.student_id = $2 OR a.student_reg_no = $2`,
        [regNo, user?.id || regNo],
      );

      const appMap = new Map(myApps.map((a: any) => [a.program_id, a]));

      return programs.map((p: any) => ({
        ...p,
        my_application: appMap.get(p.id) || null,
      }));
    }

    return programs;
  }

  /**
   * Get single program details
   */
  async getProgramById(tenantSlug: string, id: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const res = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT p.*,
              COUNT(a.id)::int AS total_applicants,
              COUNT(CASE WHEN a.status = 'selected' THEN 1 END)::int AS selected_count
       FROM "${schema}".internship_programs p
       LEFT JOIN "${schema}".internship_applications a ON p.id = a.program_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id],
    );

    if (!res[0]) {
      throw new NotFoundException(`Internship program '${id}' not found`);
    }

    return res[0];
  }

  /**
   * Student: Apply for an internship program
   */
  async applyProgram(tenantSlug: string, dto: ApplyInternshipDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const regNo = dto?.student_reg_no || user?.registration_no || user?.rollno || user?.username || '2025107666';

    const progRes = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".internship_programs WHERE id = $1`,
      [dto.program_id],
    );

    if (!progRes[0]) {
      throw new NotFoundException(`Internship program '${dto.program_id}' not found`);
    }

    const program = progRes[0];

    if (program.status === 'applications_locked') {
      throw new BadRequestException('Applications for this internship program are currently locked.');
    }

    if (program.application_deadline) {
      const deadlineDate = new Date(program.application_deadline);
      const endOfDay = new Date(deadlineDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (endOfDay.getTime() < Date.now()) {
        throw new BadRequestException('Applications for this internship program are closed as the deadline has passed.');
      }
    }

    // Check if already applied (prevent duplicate applications)
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM "${schema}".internship_applications 
       WHERE program_id = $1 
         AND (
           student_reg_no = $2 
           OR student_id = $2 
           OR student_reg_no = $3 
           OR student_id = $3
         )`,
      [dto.program_id, regNo, user?.id || dto?.student_id || regNo],
    );

    if (existing.length > 0) {
      throw new ConflictException('You have already applied for this certification program.');
    }

    const paymentStatus = program.fee_type === 'PAID' ? 'pending' : 'not_required';

    // Look up student from students table if exists
    let studentName = dto?.student_name || user?.name || user?.username || 'JASPREET SINGH';
    let courseCd: string | null = dto?.course_cd || null;
    let batchCd: string | null = dto?.batch_cd || null;
    let studentId: string | null = dto?.student_id || user?.id || regNo;

    try {
      const studentRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, name, course_cd, batch_cd, rollno, registration_no FROM "${schema}".students 
         WHERE registration_no = $1 OR rollno = $1 OR user_id::text = $2 OR id::text = $2 LIMIT 1`,
        [regNo, studentId],
      );
      if (studentRows[0]) {
        if (studentRows[0].name) studentName = studentRows[0].name;
        if (studentRows[0].course_cd) courseCd = studentRows[0].course_cd;
        if (studentRows[0].batch_cd) batchCd = studentRows[0].batch_cd;
        if (studentRows[0].registration_no) studentId = studentRows[0].registration_no;
      }
    } catch (e: any) {
      this.logger.warn(`Could not fetch student record: ${e.message}`);
    }

    const inserted = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO "${schema}".internship_applications (
        program_id, student_id, student_reg_no, student_name,
        course_cd, batch_cd, applied_at, status, locked, payment_status, remarks,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, NOW(), 'applied', FALSE, $7, $8,
        NOW(), NOW()
      ) RETURNING *`,
      [
        dto.program_id,
        studentId,
        regNo,
        studentName,
        courseCd,
        batchCd,
        paymentStatus,
        dto.remarks || (program.campus_type === 'OFF_CAMPUS' ? `Applied for Off-Campus Internship at ${program.organization_name}` : 'Applied for In-house Training Program'),
      ],
    );

    // Send confirmation notification
    try {
      await this.notificationsService.sendNotification(slug, {
        recipient_id: regNo,
        title: `✅ Application Submitted: ${program.title}`,
        message: `Your application for "${program.title}" (${program.campus_type === 'OFF_CAMPUS' ? `Off-Campus: ${program.organization_name}` : 'On-Campus'}) has been registered. Track review status in your portal.`,
        type: 'info',
        category: 'announcements',
      });
    } catch (e) {}

    return {
      success: true,
      message: 'Application submitted successfully',
      application: inserted[0],
    };
  }

  /**
   * Process simulated payment for paid certification programs
   */
  async processPayment(tenantSlug: string, applicationId: string, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const apps = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT a.*, p.fee_amount, p.title AS program_title
       FROM "${schema}".internship_applications a
       JOIN "${schema}".internship_programs p ON a.program_id = p.id
       WHERE a.id = $1`,
      [applicationId],
    );

    if (!apps[0]) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    const updated = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".internship_applications
       SET payment_status = 'paid', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [applicationId],
    );

    return {
      success: true,
      message: 'Payment confirmed successfully. Enrollment is complete.',
      application: updated[0],
    };
  }

  /**
   * Faculty / Admin: List applicants for a specific program
   */
  async getApplicants(tenantSlug: string, programId: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM (
        SELECT DISTINCT ON (a.id)
               a.*,
               COALESCE(s.name, a.student_name) AS student_full_name,
               COALESCE(s.rollno, a.student_reg_no) AS student_rollno,
               COALESCE(s.course_cd, a.course_cd) AS student_course_cd,
               COALESCE(s.batch_cd, a.batch_cd) AS student_batch_cd,
               crs.name AS course_name,
               bth.name AS batch_name,
               c.certificate_no,
               c.issued_date,
               c.approved_by,
               c.external_cert_url AS cert_external_url,
               c.cert_source AS cert_origin
        FROM "${schema}".internship_applications a
        LEFT JOIN "${schema}".students s ON (
          a.student_reg_no = s.registration_no 
          OR a.student_reg_no = s.rollno 
          OR a.student_id = s.registration_no 
          OR a.student_id = s.rollno
          OR a.student_id = s.user_id::text
        )
        LEFT JOIN "${schema}".courses crs ON (
          s.course_cd = crs.code 
          OR s.course_cd = crs.course_cd 
          OR s.course_cd = crs.id::text 
          OR a.course_cd = crs.code
        )
        LEFT JOIN "${schema}".batches bth ON (
          s.batch_cd = bth.batch_cd 
          OR s.batch_cd = bth.code 
          OR s.batch_id::text = bth.id::text 
          OR a.batch_cd = bth.batch_cd
        )
        LEFT JOIN "${schema}".certificates c ON a.id::text = c.application_id::text
        WHERE a.program_id::text = $1::text
        ORDER BY a.id, a.applied_at ASC
      ) sub
      ORDER BY sub.applied_at ASC`,
      [programId],
    );
  }

  /**
   * Lock / Unlock applicant intake for a program
   */
  async toggleLockApplicants(tenantSlug: string, programId: string, locked: boolean) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const newStatus = locked ? 'applications_locked' : 'published';

    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".internship_programs SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, programId],
    );

    await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".internship_applications SET locked = $1, updated_at = NOW() WHERE program_id = $2`,
      [locked, programId],
    );

    return {
      success: true,
      message: locked ? 'Applicant list locked. No new applications accepted.' : 'Program applications unlocked.',
      status: newStatus,
      locked,
    };
  }

  /**
   * Faculty / Admin: Update applicant status (selected, rejected, completed)
   * Supports auto-generated in-house certificate or external uploaded certificate!
   */
  async updateApplicationStatus(tenantSlug: string, applicationId: string, dto: UpdateApplicantStatusDto) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const apps = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT a.*, p.title AS internship_title, p.category, p.duration, p.fee_type, p.fee_amount,
              p.campus_type, p.organization_name, p.organization_type, p.certification_mode,
              s.name AS student_full_name, s.course_cd AS student_course_cd, s.batch_cd AS student_batch_cd,
              crs.name AS course_full_name,
              bth.name AS batch_full_name
       FROM "${schema}".internship_applications a
       JOIN "${schema}".internship_programs p ON a.program_id = p.id
       LEFT JOIN "${schema}".students s ON (
         a.student_reg_no = s.registration_no 
         OR a.student_reg_no = s.rollno 
         OR a.student_id = s.registration_no 
         OR a.student_id = s.rollno
         OR a.student_id = s.user_id::text
       )
       LEFT JOIN "${schema}".courses crs ON (
         s.course_cd = crs.code 
         OR s.course_cd = crs.course_cd 
         OR s.course_cd = crs.id::text 
         OR a.course_cd = crs.code
       )
       LEFT JOIN "${schema}".batches bth ON (
         s.batch_cd = bth.batch_cd 
         OR s.batch_cd = bth.code 
         OR s.batch_id = bth.id 
         OR a.batch_cd = bth.batch_cd
       )
       WHERE a.id = $1`,
      [applicationId],
    );

    if (!apps[0]) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    const app = apps[0];
    const isCompleted = dto.status === 'completed';
    const completedAt = isCompleted ? new Date().toISOString() : app.completed_at;
    const certUrl = dto.external_cert_url || app.external_cert_url || null;
    const certSource = dto.cert_source || (certUrl ? 'uploaded' : (app.certification_mode === 'OFF_CAMPUS_UPLOAD' ? 'uploaded' : 'in_house'));

    const updated = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".internship_applications
       SET status = $1, 
           payment_status = COALESCE($2, payment_status),
           remarks = COALESCE($3, remarks),
           completed_at = $4,
           external_cert_url = COALESCE($5, external_cert_url),
           cert_source = COALESCE($6, cert_source),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [dto.status, dto.payment_status || null, dto.remarks || null, completedAt, certUrl, certSource, applicationId],
    );

    let cert = null;
    if (isCompleted || certUrl) {
      // Generate or retrieve digital certificate record
      const certNo = `SRMS-CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const applicantName = app.student_full_name || app.student_name || 'Candidate';
      const course = app.course_full_name || app.student_course_cd || app.course_cd || 'General Program';
      const batch = app.batch_full_name || app.student_batch_cd || app.batch_cd || '2022-2026';
      const internshipName = app.internship_title || 'Certification Program';
      const organizationName = app.organization_name || (app.campus_type === 'OFF_CAMPUS' ? 'Partner Organization' : 'SRMS CET In-House Cell');

      const certRes = await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".certificates (
          application_id, certificate_no, internship_name, applicant_name, organization_name,
          course, batch, duration, issued_date, approved_by, pdf_url, external_cert_url, cert_source, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, CURRENT_DATE, 'Prof. (Dr.) Prabhakar Gupta',
          '/certificates/sample-cert.pdf', $9, $10, NOW()
        ) ON CONFLICT (application_id) DO UPDATE 
          SET internship_name = EXCLUDED.internship_name,
              applicant_name = EXCLUDED.applicant_name,
              organization_name = EXCLUDED.organization_name,
              course = EXCLUDED.course,
              batch = EXCLUDED.batch,
              duration = EXCLUDED.duration,
              external_cert_url = COALESCE(EXCLUDED.external_cert_url, "${schema}".certificates.external_cert_url),
              cert_source = COALESCE(EXCLUDED.cert_source, "${schema}".certificates.cert_source)
        RETURNING *`,
        [applicationId, certNo, internshipName, applicantName, organizationName, course, batch, app.duration || '3_MONTH', certUrl, certSource],
      );

      cert = certRes[0];
    }

    // Send real-time notification alert to student
    try {
      const recipientId = app.student_reg_no || app.student_id || 'ALL_STUDENTS';
      const notifTitle = isCompleted
        ? '🎓 Digital Certificate Issued!'
        : dto.status === 'selected'
        ? '🎉 Internship Application Approved!'
        : `Internship Status: ${dto.status?.toUpperCase()}`;

      const notifMessage = isCompleted
        ? `Congratulations! Your certificate for "${app.internship_title}" (${app.organization_name || 'Internship'}) is ready on your dashboard.`
        : dto.status === 'selected'
        ? `You have been selected for "${app.internship_title}" at ${app.organization_name || 'the assigned facility'}.`
        : `Your application status for "${app.internship_title}" has been updated to ${dto.status}.`;

      await this.notificationsService.sendNotification(slug, {
        recipient_id: recipientId,
        title: notifTitle,
        message: notifMessage,
        type: isCompleted || dto.status === 'selected' ? 'success' : 'info',
        category: 'announcements',
      });
    } catch (e: any) {
      this.logger.warn(`Could not dispatch status notification: ${e.message}`);
    }

    return {
      success: true,
      message: `Applicant status updated to ${dto.status}`,
      application: updated[0],
      certificate: cert,
    };
  }

  /**
   * Upload / Attach external certificate directly to an applicant
   */
  async uploadExternalCertificate(tenantSlug: string, dto: UploadExternalCertificateDto) {
    return this.updateApplicationStatus(tenantSlug, dto.application_id, {
      status: 'completed',
      external_cert_url: dto.external_cert_url,
      cert_source: 'uploaded',
      remarks: dto.remarks || 'External Off-Campus certificate uploaded by administrator.',
    });
  }

  /**
   * Certificate Eligibility & Download Gating
   * GATED: Requires status = 'completed' AND (fee_type = 'FREE' OR payment_status = 'paid' OR fee_type = 'STIPEND')
   */
  async getCertificate(tenantSlug: string, applicationId: string, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const regNo = user?.registration_no || user?.rollno || user?.username;

    const apps = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT a.*, p.title AS internship_title, p.category, p.duration, p.fee_type, p.campus_type,
              p.organization_name, p.organization_type, p.off_campus_title, p.certification_mode,
              c.certificate_no, c.issued_date, c.approved_by, c.pdf_url,
              c.external_cert_url AS cert_external_url, c.cert_source AS cert_origin,
              c.applicant_name AS cert_applicant_name,
              c.internship_name AS cert_internship_name,
              c.organization_name AS cert_org_name,
              c.course AS cert_course, c.batch AS cert_batch
       FROM "${schema}".internship_applications a
       JOIN "${schema}".internship_programs p ON a.program_id = p.id
       LEFT JOIN "${schema}".certificates c ON a.id = c.application_id
       WHERE a.id = $1`,
      [applicationId],
    );

    if (!apps[0]) {
      throw new NotFoundException(`Application #${applicationId} not found`);
    }

    const app = apps[0];
    const targetRegNo = app.student_reg_no || regNo || '2025107990';

    // Verify ownership if student
    if (user?.role === 'STUDENT' && regNo && app.student_reg_no !== regNo && app.student_id !== regNo) {
      throw new ForbiddenException('You are not authorized to view another student\'s certificate.');
    }

    // Gate 1: Must be marked completed
    if (app.status !== 'completed') {
      throw new BadRequestException('Certificate unlocks once your internship is marked complete by faculty/admin.');
    }

    // Gate 2: If paid program, payment must be confirmed
    if (app.fee_type === 'PAID' && app.payment_status !== 'paid') {
      throw new BadRequestException('Certificate unlocks once internship enrollment fee payment is confirmed.');
    }

    // Query Student Master Details for this student
    const studentMasterRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT s.id, s.name, s.registration_no, s.rollno, s.course_cd, s.batch_cd,
              sa.course_code AS adm_course_code, sa.batch_code AS adm_batch_code, sa.academic_session AS adm_session,
              crs.name AS course_full_name,
              bth.name AS batch_full_name
       FROM "${schema}".students s
       LEFT JOIN "${schema}".student_admissions sa ON s.id = sa.student_id
       LEFT JOIN "${schema}".courses crs ON (s.course_cd = crs.code OR s.course_cd = crs.course_cd OR sa.course_id = crs.id OR sa.course_code = crs.code)
       LEFT JOIN "${schema}".batches bth ON (s.batch_cd = bth.batch_cd OR s.batch_cd = bth.code OR sa.batch_id = bth.id OR sa.batch_code = bth.code OR bth.year::text = s.batch_cd)
       WHERE s.registration_no = $1 
          OR s.rollno = $1 
          OR s.id::text = $1 
          OR (s.user_id::text = $2 AND $2 IS NOT NULL)
          OR LOWER(s.name) = LOWER($3)
       LIMIT 1`,
      [targetRegNo, user?.id || null, app.student_name || 'AAFREEN KHAN'],
    );

    const sm = studentMasterRows[0] || {};

    // Query firm branding dynamically from public.firms or public.tenants
    let firmLogoUrl: string | null = null;
    let firmTitle: string | null = null;
    try {
      const resolvedSlug = this.resolveTenantSlug(tenantSlug);
      const firmRows = await this.dataSource.query(
        `SELECT logo_url, title, tenant_name FROM public.firms 
         WHERE (LOWER(slug) = $1 OR LOWER(slug) = $2 OR LOWER(slug) = $3 OR LOWER(slug) LIKE '%cet%')
           AND logo_url IS NOT NULL AND logo_url != ''
         ORDER BY updated_at DESC LIMIT 1`,
        [slug.toLowerCase(), `tenant_${slug.toLowerCase()}`, resolvedSlug.toLowerCase()],
      );
      if (firmRows[0] && firmRows[0].logo_url) {
        firmLogoUrl = firmRows[0].logo_url;
        firmTitle = firmRows[0].title || firmRows[0].tenant_name || null;
      }
      if (!firmLogoUrl) {
        const tenantRows = await this.dataSource.query(
          `SELECT logo_url, name FROM public.tenants 
           WHERE (LOWER(slug) = $1 OR LOWER(slug) = $2 OR LOWER(slug) = $3 OR LOWER(slug) LIKE '%cet%')
             AND logo_url IS NOT NULL AND logo_url != ''
           ORDER BY updated_at DESC LIMIT 1`,
          [slug.toLowerCase(), `tenant_${slug.toLowerCase()}`, resolvedSlug.toLowerCase()],
        );
        if (tenantRows[0] && tenantRows[0].logo_url) {
          firmLogoUrl = tenantRows[0].logo_url;
          if (!firmTitle) firmTitle = tenantRows[0].name || null;
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not load firm branding for ${slug}: ${e.message}`);
    }

    const studentName = 
      sm.name || 
      app.cert_applicant_name ||
      app.student_name || 
      user?.name || 
      'AAFREEN KHAN';

    const internshipName = 
      app.cert_internship_name ||
      app.internship_title || 
      'Full-Stack Cloud & AI Engineering Internship';

    const organizationName = 
      app.cert_org_name ||
      app.organization_name || 
      (app.campus_type === 'OFF_CAMPUS' ? 'Partner Organization' : 'SRMS CET In-House Cell');

    const courseName = 
      sm.course_full_name || 
      sm.adm_course_code || 
      app.cert_course ||
      sm.course_cd || 
      app.course_cd || 
      'BCA';

    const batchName = 
      sm.batch_full_name || 
      sm.adm_batch_code || 
      sm.adm_session || 
      app.cert_batch ||
      sm.batch_cd || 
      app.batch_cd || 
      'Batch 2025';

    const issuedDate = app.issued_date
      ? (typeof app.issued_date === 'string' ? app.issued_date.split('T')[0] : new Date(app.issued_date).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];

    const officialInstitutionName = 
      firmTitle === 'SRMS CET,BAREILLY' || !firmTitle 
        ? 'SHRI RAM MURTI SMARAK COLLEGE OF ENGINEERING & TECHNOLOGY, BAREILLY' 
        : firmTitle;

    return {
      eligible: true,
      certificate_no: app.certificate_no || `SRMS-CERT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      internship_name: internshipName,
      organization_name: organizationName,
      campus_type: app.campus_type || 'ON_CAMPUS',
      certification_mode: app.certification_mode || 'IN_HOUSE_AUTO',
      external_cert_url: app.cert_external_url || app.external_cert_url || null,
      cert_source: app.cert_origin || app.cert_source || 'in_house',
      applicant_name: studentName,
      course: courseName,
      batch: batchName,
      duration: app.duration ? app.duration.replace('_', ' ') : '3 Months',
      category: app.category,
      issued_date: issuedDate,
      approved_by: app.approved_by || 'Prof. (Dr.) Prabhakar Gupta',
      approver_title: 'Dean Academics & Training Cell',
      pdf_url: app.pdf_url,
      logo_url: firmLogoUrl,
      institution_name: officialInstitutionName,
    };
  }
}
