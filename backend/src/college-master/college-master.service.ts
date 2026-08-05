import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateCollegeDto, UpdateCollegeDto,
  CreateCourseDto, UpdateCourseDto,
  CreateBatchDto, UpdateBatchDto,
  CreateBranchDto, UpdateBranchDto,
  CreateSessionDto, UpdateSessionDto,
  CreateProfessionalDto, UpdateProfessionalDto,
  CreateGroupDto, UpdateGroupDto,
} from './dto/college-master.dto';

@Injectable()
export class CollegeMasterService {
  private readonly logger = new Logger(CollegeMasterService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveTenantSlug(collegeIdOrSlug?: string): string {
    return collegeIdOrSlug || 'srms-ims';
  }

  private async getCollegeIdBySlug(slug: string): Promise<string | null> {
    const rows = await this.ds.query(`SELECT id FROM public.tenants WHERE slug = $1`, [slug]);
    return rows.length > 0 ? rows[0].id : null;
  }

  // ─── 1. COLLEGES (PUBLIC.TENANTS) ─────────────────────────────────────────
  async listColleges() {
    return this.ds.query(
      `SELECT id, name, slug, domain, plan, primary_color, is_active, schema_provisioned, created_at
       FROM public.tenants ORDER BY created_at DESC`,
    );
  }

  async createCollege(dto: CreateCollegeDto) {
    const existing = await this.ds.query(
      `SELECT id FROM public.tenants WHERE slug = $1`,
      [dto.slug.toLowerCase()],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`College with slug '${dto.slug}' already exists.`);
    }

    const rows = await this.ds.query(
      `INSERT INTO public.tenants (name, slug, domain, plan, primary_color, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [dto.name, dto.slug.toLowerCase(), dto.domain || null, dto.plan || 'standard', dto.primaryColor || '#6366F1'],
    );

    // Auto-provision schema for new college
    await this.tenantSchemaService.provisionSchema(dto.slug.toLowerCase());

    return rows[0];
  }

  async updateCollege(idOrSlug: string, dto: UpdateCollegeDto) {
    const rows = await this.ds.query(
      `SELECT * FROM public.tenants WHERE id::text = $1 OR slug = $1`,
      [idOrSlug],
    );
    if (rows.length === 0) throw new NotFoundException('College not found');

    const targetId = rows[0].id;

    const updated = await this.ds.query(
      `UPDATE public.tenants
       SET name = COALESCE($1, name),
           domain = COALESCE($2, domain),
           plan = COALESCE($3, plan),
           primary_color = COALESCE($4, primary_color),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.domain, dto.plan, dto.primaryColor, dto.isActive, targetId],
    );

    return updated[0];
  }

  async deleteCollege(idOrSlug: string) {
    const rows = await this.ds.query(
      `SELECT id, slug FROM public.tenants WHERE id::text = $1 OR slug = $1`,
      [idOrSlug],
    );
    if (rows.length === 0) throw new NotFoundException('College not found');

    await this.ds.query(`DELETE FROM public.tenants WHERE id = $1`, [rows[0].id]);
    return { success: true, message: `College deleted successfully.` };
  }

  // ─── 2. COURSES ────────────────────────────────────────────────────────────
  async listCourses(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM courses ORDER BY created_at DESC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createCourse(dto: CreateCourseDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO courses (code, name, degree_level, duration_years, professional_phase, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.degreeLevel || 'UG', dto.durationYears || 5, dto.professionalPhase || '1st Professional (Phase I)'],
    );
    return rows[0];
  }

  async updateCourse(id: string, dto: UpdateCourseDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE courses
       SET name = COALESCE($1, name),
           degree_level = COALESCE($2, degree_level),
           duration_years = COALESCE($3, duration_years),
           professional_phase = COALESCE($4, professional_phase),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.degreeLevel, dto.durationYears, dto.professionalPhase, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Course not found');
    return rows[0];
  }

  async deleteCourse(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM courses WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Course deleted successfully' };
  }

  // ─── 3. BATCHES ────────────────────────────────────────────────────────────
  async listBatches(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT *, course_cd AS course_code FROM batches ORDER BY year DESC, code ASC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createBatch(dto: CreateBatchDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO batches (code, year, course_cd, department_id, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code, dto.year, dto.courseCd, dto.departmentId || null, dto.startDate || null, dto.endDate || null],
    );
    return rows[0];
  }

  async updateBatch(id: string, dto: UpdateBatchDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE batches
       SET code = COALESCE($1, code),
           year = COALESCE($2, year),
           course_cd = COALESCE($3, course_cd),
           department_id = COALESCE($4, department_id),
           start_date = COALESCE($5, start_date),
           end_date = COALESCE($6, end_date),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [dto.code, dto.year, dto.courseCd, dto.departmentId, dto.startDate, dto.endDate, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Batch not found');
    return rows[0];
  }

  async deleteBatch(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const tablesToNullify = ['students', 'groups_master', 'attendance_sessions', 'timetable_slots'];
    for (const table of tablesToNullify) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET batch_id = NULL WHERE batch_id = $1`,
          [id],
        );
      } catch (e) {}
    }
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM batches WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Batch deleted successfully' };
  }

  // ─── 4. BRANCHES / DEPARTMENTS ─────────────────────────────────────────────
  async listBranches(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM departments ORDER BY code ASC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createBranch(dto: CreateBranchDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO departments (code, name, type, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.type],
    );
    return rows[0];
  }

  async updateBranch(id: string, dto: UpdateBranchDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [dto.code ? dto.code.toUpperCase() : null, dto.name, dto.type, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Branch not found');
    return rows[0];
  }

  async deleteBranch(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    // Safely clear foreign key references in child tables before deleting department/branch
    const tablesToNullify = ['students', 'faculty', 'batches', 'subjects', 'groups_master', 'timetable_slots'];
    for (const table of tablesToNullify) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET department_id = NULL WHERE department_id = $1`,
          [id],
        );
      } catch (e) {
        // Silently skip if table or column doesn't exist
      }
    }

    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM departments WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Branch deleted successfully' };
  }

  // ─── 5. ACADEMIC SESSIONS ──────────────────────────────────────────────────
  async listSessions(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM academic_sessions ORDER BY start_date DESC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createSession(dto: CreateSessionDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);

    // If this session is marked as current, unset any previous current session first
    if (dto.isCurrent) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE academic_sessions SET is_current = false WHERE is_current = true`,
      );
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO academic_sessions (name, start_date, end_date, is_current, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [dto.name, dto.startDate, dto.endDate, dto.isCurrent ?? false],
    );
    return rows[0];
  }

  async updateSession(id: string, dto: UpdateSessionDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE academic_sessions
       SET name = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           is_current = COALESCE($4, is_current),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.startDate, dto.endDate, dto.isCurrent, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Academic Session not found');
    return rows[0];
  }

  async deleteSession(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM academic_sessions WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Academic session deleted successfully' };
  }

  // ─── 6. PROFESSIONAL PHASES ───────────────────────────────────────────────
  async listProfessionals(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id, name, phase_order, course_cd, academic_system, is_active, created_at
       FROM professional_phases
       ORDER BY phase_order ASC, created_at ASC`,
    );
  }

  async createProfessional(dto: CreateProfessionalDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO professional_phases (name, phase_order, course_cd, academic_system, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [dto.name, dto.phaseOrder || 1, dto.courseCd || 'MBBS', dto.academicSystem || 'professional'],
    );
    return rows[0];
  }

  async updateProfessional(id: string, dto: UpdateProfessionalDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE professional_phases
       SET name = COALESCE($1, name),
           phase_order = COALESCE($2, phase_order),
           course_cd = COALESCE($3, course_cd),
           academic_system = COALESCE($4, academic_system),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.phaseOrder, dto.courseCd, dto.academicSystem, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Professional phase not found');
    return rows[0];
  }

  async deleteProfessional(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM professional_phases WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Professional phase deleted successfully' };
  }

  // ─── 8. GROUPS MASTER (BATCH SUB-GROUPS: A, B, C, D) ─────────────────────
  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async listGroups(tenantSlug?: string, batchId?: string, departmentId?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const params: any[] = [];
    let sql = `
      SELECT g.*, 
             b.code AS batch_code, b.year AS batch_year,
             d.name AS department_name, d.code AS department_code
      FROM groups_master g
      LEFT JOIN batches b ON b.id = g.batch_id
      LEFT JOIN departments d ON d.id = g.department_id
      WHERE 1=1
    `;
    if (batchId && this.isUUID(batchId)) {
      params.push(batchId);
      sql += ` AND g.batch_id = $${params.length}`;
    }
    if (departmentId && this.isUUID(departmentId)) {
      params.push(departmentId);
      sql += ` AND g.department_id = $${params.length}`;
    }
    sql += ` ORDER BY g.code ASC, g.name ASC`;

    const rows = await this.tenantSchemaService.queryInTenant(slug, sql, params);
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createGroup(dto: CreateGroupDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const validBatchId = this.isUUID(dto.batchId) ? dto.batchId : null;
    const validDeptId = this.isUUID(dto.departmentId) ? dto.departmentId : null;
    const validCollegeId = this.isUUID(dto.collegeId) ? dto.collegeId : null;
    const validCourseId = this.isUUID(dto.courseId) ? dto.courseId : null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO groups_master (code, name, college_id, course_id, batch_id, department_id, capacity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, validCollegeId, validCourseId, validBatchId, validDeptId, dto.capacity || 50],
    );
    return rows[0];
  }

  async updateGroup(id: string, dto: UpdateGroupDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const validBatchId = dto.batchId !== undefined ? (this.isUUID(dto.batchId) ? dto.batchId : null) : undefined;
    const validDeptId = dto.departmentId !== undefined ? (this.isUUID(dto.departmentId) ? dto.departmentId : null) : undefined;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE groups_master
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           batch_id = COALESCE($3, batch_id),
           department_id = COALESCE($4, department_id),
           capacity = COALESCE($5, capacity),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [dto.code ? dto.code.toUpperCase() : undefined, dto.name, validBatchId, validDeptId, dto.capacity, dto.isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Group not found');
    return rows[0];
  }

  async deleteGroup(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM groups_master WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Group deleted successfully' };
  }
}

