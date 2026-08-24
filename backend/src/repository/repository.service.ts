import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateRepositoryDto, UpdateRepositoryDto, ReviewRepositoryDto, QueryRepositoryDto } from './dto/repository.dto';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  /**
   * Submit a new student repository project
   */
  async submitRepository(tenantSlug: string, dto: CreateRepositoryDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    let regNo = dto.student_reg_no || user?.registration_no || user?.username || user?.rollno || '2025107990';
    let studentName = dto.student_name || user?.name || user?.username || 'AAFREEN KHAN';
    let courseCd = dto.course_cd || '13'; // BCA default
    let branchCd = dto.branch_cd || '1301';
    let batchCd = dto.batch_cd || '2025';
    let semCd = dto.sem_cd || '1';
    let colgCd = dto.colg_cd || '1';

    // Lookup student enrollment from student_admissions / students table if available
    try {
      const studentRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT s.registration_no, s.name, s.course_cd, s.batch_cd, sa.branch_code, sa.branch_id, sa.professional_phase
         FROM "${schema}".students s
         LEFT JOIN "${schema}".student_admissions sa ON s.id = sa.student_id
         WHERE s.registration_no = $1 OR s.rollno = $1 OR s.user_id = $2
         LIMIT 1`,
        [regNo, user?.id || '00000000-0000-0000-0000-000000000000'],
      );

      if (studentRows && studentRows.length > 0) {
        const s = studentRows[0];
        regNo = dto.student_reg_no || s.registration_no || regNo;
        studentName = dto.student_name || s.name || studentName;
        courseCd = dto.course_cd || s.course_cd || courseCd;
        batchCd = dto.batch_cd || s.batch_cd || batchCd;
        branchCd = dto.branch_cd || s.branch_code || branchCd;
      }
    } catch (e) {
      this.logger.warn(`Student resolution fallback used for ${regNo}`);
    }

    // Insert repository record
    const insertResult = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO "${schema}".repositories (
        colg_cd, course_cd, branch_cd, batch_cd, sem_cd,
        student_reg_no, student_name, title, description, repo_link, tech_stack, screenshots,
        status, is_placement_eligible, submitted_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending Review', false, NOW(), NOW())
      RETURNING *`,
      [
        colgCd,
        courseCd,
        branchCd,
        batchCd,
        semCd,
        regNo,
        studentName,
        dto.title,
        dto.description,
        dto.repo_link,
        dto.tech_stack || [],
        dto.screenshots || [],
      ],
    );

    return {
      message: 'Repository project submitted successfully',
      repository: insertResult[0],
    };
  }

  /**
   * List repositories with filters (Faculty / Admin view)
   */
  async listRepositories(tenantSlug: string, query: QueryRepositoryDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const params: any[] = [];
    let whereConditions: string[] = ['1=1'];

    // Scope to student's own submissions if user is a student or if student_reg_no is explicitly provided
    if (query.student_reg_no) {
      params.push(query.student_reg_no);
      whereConditions.push(`r.student_reg_no = $${params.length}`);
    } else if (user?.role === 'STUDENT') {
      const regNo = user?.registration_no || user?.username || user?.rollno;
      if (regNo) {
        params.push(regNo);
        whereConditions.push(`r.student_reg_no = $${params.length}`);
      }
    }

    if (query.course_cd) {
      params.push(query.course_cd);
      whereConditions.push(`r.course_cd = $${params.length}`);
    }

    if (query.branch_cd) {
      params.push(query.branch_cd);
      whereConditions.push(`r.branch_cd = $${params.length}`);
    }

    if (query.batch_cd) {
      params.push(query.batch_cd);
      whereConditions.push(`r.batch_cd = $${params.length}`);
    }

    if (query.sem_cd) {
      params.push(query.sem_cd);
      whereConditions.push(`r.sem_cd = $${params.length}`);
    }

    if (query.status) {
      params.push(query.status);
      whereConditions.push(`r.status = $${params.length}`);
    }

    if (query.search) {
      params.push(`%${query.search}%`);
      whereConditions.push(`(r.title ILIKE $${params.length} OR r.student_name ILIKE $${params.length} OR r.student_reg_no ILIKE $${params.length})`);
    }

    const sql = `
      SELECT r.*,
             COALESCE(s.photo_url, '') AS student_photo,
             COALESCE(s.rollno, r.student_reg_no) AS rollno,
             COALESCE(crs.name, r.course_cd, 'B.Tech.') AS course_name,
             COALESCE(dep.name, r.branch_cd, 'Computer Science & Engineering') AS branch_name,
             COALESCE(bth.name, r.batch_cd, 'Batch 2022-26') AS batch_name,
             rev.faculty_name,
             rev.faculty_empid,
             rev.faculty_photo,
             rev.faculty_designation,
             rev.remarks AS faculty_remarks,
             rev.reviewed_at AS faculty_reviewed_at,
             (SELECT COUNT(*) FROM "${schema}".repository_reviews rev2 WHERE rev2.repo_id = r.repo_id)::int AS review_count
      FROM "${schema}".repositories r
      LEFT JOIN "${schema}".students s ON (r.student_reg_no = s.registration_no OR r.student_reg_no = s.rollno)
      LEFT JOIN "${schema}".courses crs ON (r.course_cd = crs.code OR r.course_cd = crs.course_cd OR r.course_cd = crs.id::text)
      LEFT JOIN "${schema}".departments dep ON (r.branch_cd = dep.code OR r.branch_cd = dep.id::text)
      LEFT JOIN "${schema}".batches bth ON (r.batch_cd = bth.code OR r.batch_cd = bth.id::text)
      LEFT JOIN LATERAL (
        SELECT rw.faculty_name, 
               rw.faculty_empid, 
               rw.remarks, 
               rw.reviewed_at,
               f.photo_url AS faculty_photo,
               f.designation AS faculty_designation
        FROM "${schema}".repository_reviews rw
        LEFT JOIN "${schema}".faculty f ON (rw.faculty_empid = f.emp_id OR rw.faculty_name = f.name)
        WHERE rw.repo_id = r.repo_id 
        ORDER BY rw.reviewed_at DESC 
        LIMIT 1
      ) rev ON true
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.submitted_at DESC
    `;

    const repositories = await this.tenantSchemaService.queryInTenant(slug, sql, params);
    return { data: repositories, count: repositories.length };
  }

  /**
   * Get single repository details with reviews
   */
  async getRepositoryById(tenantSlug: string, repoId: number) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const repos = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".repositories WHERE repo_id = $1`,
      [repoId],
    );

    if (!repos || repos.length === 0) {
      throw new NotFoundException(`Repository with ID ${repoId} not found`);
    }

    const reviews = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".repository_reviews WHERE repo_id = $1 ORDER BY reviewed_at DESC`,
      [repoId],
    );

    return {
      repository: repos[0],
      reviews,
    };
  }

  /**
   * Update student repository project (Only allowed while status is 'Pending Review' or 'Pending')
   */
  async updateRepository(tenantSlug: string, repoId: number, dto: UpdateRepositoryDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".repositories WHERE repo_id = $1`,
      [repoId],
    );

    if (!existing || existing.length === 0) {
      throw new NotFoundException(`Repository with ID ${repoId} not found`);
    }

    const repo = existing[0];

    // Rule: Can only edit while status is Pending
    const isPending = repo.status === 'Pending Review' || repo.status === 'Pending';
    if (!isPending) {
      throw new BadRequestException(
        `Repository cannot be edited because its status is '${repo.status}'. Only pending projects can be modified.`,
      );
    }

    // Ensure student only edits their own project
    if (user?.role === 'STUDENT') {
      const regNo = user?.registration_no || user?.username || user?.rollno;
      if (regNo && repo.student_reg_no && repo.student_reg_no !== regNo) {
        throw new ForbiddenException('You are only authorized to edit your own repository');
      }
    }

    const updatedTitle = dto.title !== undefined ? dto.title : repo.title;
    const updatedDesc = dto.description !== undefined ? dto.description : repo.description;
    const updatedLink = dto.repo_link !== undefined ? dto.repo_link : repo.repo_link;
    const updatedTech = dto.tech_stack !== undefined ? dto.tech_stack : repo.tech_stack;
    const updatedScreenshots = dto.screenshots !== undefined ? dto.screenshots : repo.screenshots;

    const updated = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".repositories 
       SET title = $1, description = $2, repo_link = $3, tech_stack = $4, screenshots = $5, updated_at = NOW()
       WHERE repo_id = $6
       RETURNING *`,
      [updatedTitle, updatedDesc, updatedLink, updatedTech, updatedScreenshots, repoId],
    );

    return {
      message: 'Repository updated successfully',
      repository: updated[0],
    };
  }

  /**
   * Faculty Review Panel: Add review, score, remarks, and update placement eligibility
   */
  async reviewRepository(tenantSlug: string, repoId: number, dto: ReviewRepositoryDto, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const facultyEmpId = user?.emp_id || user?.username || 'FAC001';
    const facultyName = user?.name || user?.username || 'Faculty Evaluator';

    // Verify repo exists
    const repos = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM "${schema}".repositories WHERE repo_id = $1`,
      [repoId],
    );

    if (!repos || repos.length === 0) {
      throw new NotFoundException(`Repository with ID ${repoId} not found`);
    }

    // Determine letter grade if not provided
    let grade = dto.grade;
    if (!grade) {
      if (dto.score >= 90) grade = 'A+';
      else if (dto.score >= 80) grade = 'A';
      else if (dto.score >= 70) grade = 'B';
      else if (dto.score >= 60) grade = 'C';
      else grade = 'D';
    }

    const isPlacementEligible = dto.is_placement_eligible ?? (dto.score >= 75);

    // Insert review record
    await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO "${schema}".repository_reviews (
        repo_id, faculty_empid, faculty_name, remarks, score, grade, reviewed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [repoId, facultyEmpId, facultyName, dto.remarks, dto.score, grade],
    );

    // Update parent repository status and score
    const updatedRepo = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE "${schema}".repositories 
       SET status = 'Reviewed',
           score = $1,
           grade = $2,
           is_placement_eligible = $3,
           updated_at = NOW()
       WHERE repo_id = $4
       RETURNING *`,
      [dto.score, grade, isPlacementEligible, repoId],
    );

    return {
      message: 'Repository review saved successfully',
      repository: updatedRepo[0],
    };
  }

  /**
   * Admin & Faculty Dashboard Widgets
   */
  async getTopRatedProjects(tenantSlug: string, limit = 5) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const projects = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT r.repo_id, r.title, r.student_name, r.student_reg_no, r.tech_stack, r.score, r.grade, r.is_placement_eligible, r.submitted_at
       FROM "${schema}".repositories r
       WHERE r.status = 'Reviewed' AND r.score IS NOT NULL
       ORDER BY r.score DESC, r.submitted_at DESC
       LIMIT $1`,
      [limit],
    );

    return projects;
  }

  async getFacultyPendingReviewCount(tenantSlug: string, user: any) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const countRes = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT COUNT(*)::int AS pending_count FROM "${schema}".repositories WHERE status = 'Pending Review'`,
    );

    return { pendingCount: countRes[0]?.pending_count || 0 };
  }
}
