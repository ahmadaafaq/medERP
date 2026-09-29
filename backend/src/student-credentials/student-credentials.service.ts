import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { SubmitCredentialDto, ReviewCredentialDto } from './dto/student-credentials.dto';

@Injectable()
export class StudentCredentialsService {
  private readonly logger = new Logger(StudentCredentialsService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  /**
   * Ensures the student_credentials table exists in the tenant schema.
   */
  async ensureTable(tenantSlug: string): Promise<string> {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    await this.tenantSchemaService.queryInTenant(
      slug,
      `CREATE TABLE IF NOT EXISTS "${schema}".student_credentials (
        id SERIAL PRIMARY KEY,
        student_reg_no VARCHAR(50) NOT NULL,
        student_name VARCHAR(200) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        issuer VARCHAR(255),
        date VARCHAR(50),
        description TEXT,
        file_url TEXT,
        points INT DEFAULT 50,
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_by VARCHAR(100),
        reviewer_notes TEXT,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_student_cred_reg ON "${schema}".student_credentials(student_reg_no);
      CREATE INDEX IF NOT EXISTS idx_student_cred_status ON "${schema}".student_credentials(status);
      ALTER TABLE "${schema}".students ADD COLUMN IF NOT EXISTS social_credits INT DEFAULT 0;
      ALTER TABLE "${schema}".students ADD COLUMN IF NOT EXISTS current_skills TEXT[];
      ALTER TABLE "${schema}".students ADD COLUMN IF NOT EXISTS certificates_done TEXT[];
      ALTER TABLE "${schema}".students ADD COLUMN IF NOT EXISTS extracurricular TEXT[];`,
    );

    return schema;
  }

  /**
   * Submit a student credential (certificate, skill, extracurricular)
   * Initially saved with status 'pending'
   */
  async submitCredential(tenantSlug: string, dto: SubmitCredentialDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = await this.ensureTable(slug);

    const regNo = dto.student_reg_no || user?.registration_no || user?.rollno || user?.username || '2025107990';
    const studentName = dto.student_name || user?.name || user?.full_name || 'AAFREEN KHAN';

    if (!dto.file_url || !String(dto.file_url).trim()) {
      throw new BadRequestException('Verification proof (attached document, certificate photo, or verification URL) is strictly required.');
    }

    // Default points award upon faculty approval
    let points = dto.points;
    if (!points || points <= 0) {
      if (dto.type === 'certificate') points = 100;
      else if (dto.type === 'extracurricular') points = 50;
      else if (dto.type === 'skill') points = 25;
      else points = 40;
    }

    const result = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO "${schema}".student_credentials (
        student_reg_no, student_name, type, title, category, issuer, date, description, file_url, points, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())
      RETURNING *`,
      [
        regNo,
        studentName,
        dto.type,
        dto.title,
        dto.category || null,
        dto.issuer || null,
        dto.date || new Date().toISOString().slice(0, 10),
        dto.description || null,
        dto.file_url || null,
        points,
      ],
    );

    const credential = result[0];
    this.logger.log(`Student ${regNo} submitted ${dto.type} "${dto.title}" for faculty verification (id: ${credential.id})`);

    return {
      success: true,
      message: 'Credential submitted successfully. It will be credited to your profile once verified by faculty.',
      data: credential,
    };
  }

  /**
   * Get all credentials submitted by the current student (pending, approved, rejected)
   */
  async getMyCredentials(tenantSlug: string, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = await this.ensureTable(slug);

    const regNo = user?.registration_no || user?.rollno || user?.username || '';
    const userId = user?.id || user?.sub || '';

    const list = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".student_credentials
       WHERE student_reg_no = $1 OR student_reg_no = $2
       ORDER BY created_at DESC`,
      [regNo, userId],
    );

    const approved = list.filter((c: any) => c.status === 'approved');
    const pending = list.filter((c: any) => c.status === 'pending');
    const totalApprovedPoints = approved.reduce((acc: number, c: any) => acc + (Number(c.points) || 0), 0);

    return {
      success: true,
      data: list,
      counts: {
        total: list.length,
        approved: approved.length,
        pending: pending.length,
        totalApprovedPoints,
      },
    };
  }

  /**
   * Get pending submissions for faculty/teacher verification
   */
  async getPendingCredentials(tenantSlug: string, user?: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = await this.ensureTable(slug);

    const list = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".student_credentials
       WHERE status = 'pending'
       ORDER BY created_at ASC`,
    );

    return {
      success: true,
      data: list,
      count: list.length,
    };
  }

  /**
   * Review (approve / reject) a student credential by faculty
   */
  async reviewCredential(tenantSlug: string, id: number, dto: ReviewCredentialDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = await this.ensureTable(slug);

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".student_credentials WHERE id = $1`,
      [id],
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Credential #${id} not found`);
    }

    const cred = existing[0];
    const reviewerName = user?.name || user?.full_name || user?.emp_id || 'Faculty Reviewer';

    const updatedRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".student_credentials
       SET status = $1, reviewed_by = $2, reviewer_notes = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [dto.status, reviewerName, dto.reviewer_notes || null, id],
    );

    const updated = updatedRows[0];

    // If approved, update student social credits and arrays in the students table
    if (dto.status === 'approved') {
      const awardedPoints = Number(cred.points) || 50;

      // 1. Increment social credits in students table
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE "${schema}".students
         SET social_credits = COALESCE(social_credits, 0) + $1, updated_at = NOW()
         WHERE registration_no = $2 OR rollno = $2`,
        [awardedPoints, cred.student_reg_no],
      ).catch(e => this.logger.warn(`Could not update student social_credits: ${e.message}`));

      // 2. Append to certificates_done / current_skills if applicable
      if (cred.type === 'certificate') {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${schema}".students
           SET certificates_done = CASE 
             WHEN certificates_done IS NULL THEN ARRAY[$1]
             WHEN NOT ($1 = ANY(certificates_done)) THEN array_append(certificates_done, $1)
             ELSE certificates_done
           END,
           updated_at = NOW()
           WHERE registration_no = $2 OR rollno = $2`,
          [cred.title, cred.student_reg_no],
        ).catch(e => this.logger.warn(`Could not append certificate: ${e.message}`));
      } else if (cred.type === 'skill') {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${schema}".students
           SET current_skills = CASE 
             WHEN current_skills IS NULL THEN ARRAY[$1]
             WHEN NOT ($1 = ANY(current_skills)) THEN array_append(current_skills, $1)
             ELSE current_skills
           END,
           updated_at = NOW()
           WHERE registration_no = $2 OR rollno = $2`,
          [cred.title, cred.student_reg_no],
        ).catch(e => this.logger.warn(`Could not append skill: ${e.message}`));
      } else if (cred.type === 'extracurricular') {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${schema}".students
           SET extracurricular = CASE 
             WHEN extracurricular IS NULL THEN ARRAY[$1]
             WHEN NOT ($1 = ANY(extracurricular)) THEN array_append(extracurricular, $1)
             ELSE extracurricular
           END,
           updated_at = NOW()
           WHERE registration_no = $2 OR rollno = $2`,
          [cred.title, cred.student_reg_no],
        ).catch(e => this.logger.warn(`Could not append extracurricular: ${e.message}`));
      }

      // 3. Send congratulatory ERP Notification to the student
      const notifTitle = `🎉 Credential Verified: ${cred.title}`;
      const notifBody = `🌟 Congratulations ${cred.student_name}! Your ${cred.type} "${cred.title}" has been verified and approved by ${reviewerName}. +${awardedPoints} Social Credits and Hustle points have been added to your profile!`;
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO "${schema}".notifications (
          id, recipient_id, title, body, message, type, category, is_read, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $3, 'CREDENTIAL_APPROVED', 'CREDENTIALS', false, NOW()
        )`,
        [cred.student_reg_no, notifTitle, notifBody],
      ).catch(e => this.logger.warn(`Could not insert notification: ${e.message}`));
    }

    return {
      success: true,
      message: `Credential #${id} has been marked as ${dto.status}.`,
      data: updated,
    };
  }

  /**
   * Get approved credentials summary for student
   */
  async getApprovedCredentials(tenantSlug: string, regNo: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = await this.ensureTable(slug);

    const list = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".student_credentials
       WHERE (student_reg_no = $1) AND status = 'approved'
       ORDER BY reviewed_at DESC`,
      [regNo],
    );

    return {
      success: true,
      data: list,
      count: list.length,
      totalPoints: list.reduce((sum: number, c: any) => sum + (Number(c.points) || 0), 0),
    };
  }
}
