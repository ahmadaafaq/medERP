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
  CreateResidencyDto, UpdateResidencyDto,
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
    const rawSlug = (dto.slug || dto.name || 'college').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const cleanSlug = rawSlug.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'college';

    const existing = await this.ds.query(
      `SELECT id FROM public.tenants WHERE slug = $1`,
      [cleanSlug],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`College with slug '${cleanSlug}' already exists.`);
    }

    const primaryColor = dto.primaryColor || dto.primary_color || '#5B4BFF';

    const rows = await this.ds.query(
      `INSERT INTO public.tenants (name, slug, domain, plan, primary_color, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [dto.name, cleanSlug, dto.domain || null, dto.plan || 'standard', primaryColor],
    );

    // Auto-provision isolated PostgreSQL schema for the new college
    try {
      await this.tenantSchemaService.provisionSchema(cleanSlug);
    } catch (schemaErr) {
      this.logger.error(`Error during tenant schema provisioning for '${cleanSlug}':`, schemaErr);
    }

    return rows[0];
  }

  async updateCollege(idOrSlug: string, dto: UpdateCollegeDto) {
    const rows = await this.ds.query(
      `SELECT * FROM public.tenants WHERE id::text = $1 OR slug = $1`,
      [idOrSlug],
    );
    if (rows.length === 0) throw new NotFoundException('College not found');

    const targetId = rows[0].id;
    const primaryColor = dto.primaryColor || dto.primary_color;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    const updated = await this.ds.query(
      `UPDATE public.tenants
       SET name = COALESCE($1, name),
           domain = COALESCE($2, domain),
           plan = COALESCE($3, plan),
           primary_color = COALESCE($4, primary_color),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [dto.name, dto.domain, dto.plan, primaryColor, isActive, targetId],
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
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM courses ORDER BY created_at DESC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createCourse(dto: CreateCourseDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const academicSystem = dto.academicSystem || dto.academic_system || 'professional';
    const degreeLevel = dto.degreeLevel || dto.degree_level || 'UG';
    const durationYears = dto.durationYears || dto.duration_years || 5;
    const professionalPhase = dto.professionalPhase || dto.professional_phase || '1st Professional (Phase I)';

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO courses (code, name, degree_level, duration_years, professional_phase, academic_system, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code.toUpperCase().trim(), dto.name.trim(), degreeLevel, durationYears, professionalPhase, academicSystem],
    );
    return rows[0];
  }

  async updateCourse(id: string, dto: UpdateCourseDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const academicSystem = dto.academicSystem || dto.academic_system;
    const degreeLevel = dto.degreeLevel || dto.degree_level;
    const durationYears = dto.durationYears || dto.duration_years;
    const professionalPhase = dto.professionalPhase || dto.professional_phase;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE courses
       SET name = COALESCE($1, name),
           degree_level = COALESCE($2, degree_level),
           duration_years = COALESCE($3, duration_years),
           professional_phase = COALESCE($4, professional_phase),
           academic_system = COALESCE($5, academic_system),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [dto.name ? dto.name.trim() : undefined, degreeLevel, durationYears, professionalPhase, academicSystem, isActive, id],
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
    const courseCd = dto.courseCd || dto.course_cd || dto.courseCode || dto.course_code || 'MBBS';
    const deptId = dto.departmentId || dto.department_id || null;
    const startDate = dto.startDate || dto.start_date || null;
    const endDate = dto.endDate || dto.end_date || null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO batches (code, year, course_cd, department_id, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code.trim(), dto.year, courseCd.trim(), deptId, startDate, endDate],
    );
    return rows[0];
  }

  async updateBatch(id: string, dto: UpdateBatchDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const courseCd = dto.courseCd || dto.course_cd || dto.courseCode || dto.course_code;
    const deptId = dto.departmentId !== undefined ? dto.departmentId : dto.department_id;
    const startDate = dto.startDate !== undefined ? dto.startDate : dto.start_date;
    const endDate = dto.endDate !== undefined ? dto.endDate : dto.end_date;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

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
      [dto.code ? dto.code.trim() : undefined, dto.year, courseCd, deptId, startDate, endDate, isActive, id],
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
      [dto.code.toUpperCase().trim(), dto.name.trim(), dto.type || 'Clinical'],
    );
    return rows[0];
  }

  async updateBranch(id: string, dto: UpdateBranchDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
      [dto.code ? dto.code.toUpperCase().trim() : undefined, dto.name ? dto.name.trim() : undefined, dto.type, isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Branch not found');
    return rows[0];
  }

  async deleteBranch(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const tablesToNullify = ['students', 'faculty', 'batches', 'subjects', 'groups_master', 'timetable_slots'];
    for (const table of tablesToNullify) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET department_id = NULL WHERE department_id = $1`,
          [id],
        );
      } catch (e) {}
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
    const isCurrent = dto.isCurrent ?? dto.is_current ?? false;
    const startDate = dto.startDate || dto.start_date || '';
    const endDate = dto.endDate || dto.end_date || '';

    if (isCurrent) {
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
      [dto.name.trim(), startDate, endDate, isCurrent],
    );
    return rows[0];
  }

  async updateSession(id: string, dto: UpdateSessionDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const isCurrent = dto.isCurrent !== undefined ? dto.isCurrent : dto.is_current;
    const startDate = dto.startDate || dto.start_date;
    const endDate = dto.endDate || dto.end_date;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    if (isCurrent) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE academic_sessions SET is_current = false WHERE id != $1`,
        [id],
      );
    }

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
      [dto.name ? dto.name.trim() : undefined, startDate, endDate, isCurrent, isActive, id],
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
    const collegeId = await this.getCollegeIdBySlug(slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id, name, phase_order, course_cd, academic_system, is_active, created_at
       FROM professional_phases
       ORDER BY phase_order ASC, created_at ASC`,
    );
    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createProfessional(dto: CreateProfessionalDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const phaseOrder = dto.phaseOrder || dto.phase_order || 1;
    const courseCd = dto.courseCd || dto.course_cd || dto.courseCode || dto.course_code || 'MBBS';
    const academicSystem = dto.academicSystem || dto.academic_system || 'professional';

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO professional_phases (name, phase_order, course_cd, academic_system, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [dto.name.trim(), phaseOrder, courseCd.trim(), academicSystem],
    );
    return rows[0];
  }

  async updateProfessional(id: string, dto: UpdateProfessionalDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const phaseOrder = dto.phaseOrder || dto.phase_order;
    const courseCd = dto.courseCd || dto.course_cd || dto.courseCode || dto.course_code;
    const academicSystem = dto.academicSystem || dto.academic_system;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

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
      [dto.name ? dto.name.trim() : undefined, phaseOrder, courseCd, academicSystem, isActive, id],
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

  // ─── 7. RESIDENCY CATEGORIES (Hostel / Resident / Day Scholar) ─────────────
  async listResidencies(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const collegeId = await this.getCollegeIdBySlug(slug);

    let rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM residency_categories ORDER BY created_at ASC`,
    );

    // Auto-seed default residency categories if table is empty
    if (rows.length === 0) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `INSERT INTO residency_categories (residency_type, category_name, block_wing, total_capacity, allocated_count, monthly_fee, is_active)
         VALUES 
          ('Resident', 'PG Resident Doctors Quarters', 'Block A - Clinical Wing', 80, 42, 0, true),
          ('Hosteller', 'Charak UG Boys Hostel', 'Floor 1-3 Wing B', 250, 185, 12000, true),
          ('Hosteller', 'Sushruta UG Girls Hostel', 'Wing C Main Block', 250, 210, 12000, true),
          ('Day Scholar', 'Day Scholar Transport Facility', 'Bus Routes 1-8', 500, 310, 3500, true)`,
      );
      rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM residency_categories ORDER BY created_at ASC`,
      );
    }

    return rows.map(r => ({ ...r, college_id: collegeId }));
  }

  async createResidency(dto: CreateResidencyDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const collegeId = await this.getCollegeIdBySlug(slug);
    const residencyType = dto.residencyType || dto.residency_type || 'Hosteller';
    const categoryName = dto.categoryName || dto.category_name || 'Hostel Block';
    const blockWing = dto.blockWing || dto.block_wing || 'General Wing';
    const totalCapacity = dto.totalCapacity !== undefined ? dto.totalCapacity : (dto.total_capacity || 100);
    const allocatedCount = dto.allocatedCount !== undefined ? dto.allocatedCount : (dto.allocated_count || 0);
    const monthlyFee = dto.monthlyFee !== undefined ? dto.monthlyFee : (dto.monthly_fee || 0);
    const courseCode = dto.courseCode || dto.course_code || 'ALL';

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO residency_categories 
        (college_id, course_code, residency_type, category_name, block_wing, total_capacity, allocated_count, monthly_fee, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [collegeId, courseCode, residencyType, categoryName.trim(), blockWing.trim(), totalCapacity, allocatedCount, monthlyFee],
    );
    return rows[0];
  }

  async updateResidency(id: string, dto: UpdateResidencyDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const residencyType = dto.residencyType || dto.residency_type;
    const categoryName = dto.categoryName || dto.category_name;
    const blockWing = dto.blockWing || dto.block_wing;
    const totalCapacity = dto.totalCapacity !== undefined ? dto.totalCapacity : dto.total_capacity;
    const allocatedCount = dto.allocatedCount !== undefined ? dto.allocatedCount : dto.allocated_count;
    const monthlyFee = dto.monthlyFee !== undefined ? dto.monthlyFee : dto.monthly_fee;
    const courseCode = dto.courseCode || dto.course_code;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE residency_categories
       SET residency_type = COALESCE($1, residency_type),
           category_name = COALESCE($2, category_name),
           block_wing = COALESCE($3, block_wing),
           total_capacity = COALESCE($4, total_capacity),
           allocated_count = COALESCE($5, allocated_count),
           monthly_fee = COALESCE($6, monthly_fee),
           course_code = COALESCE($7, course_code),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [residencyType, categoryName ? categoryName.trim() : undefined, blockWing ? blockWing.trim() : undefined, totalCapacity, allocatedCount, monthlyFee, courseCode, isActive, id],
    );
    if (rows.length === 0) throw new NotFoundException('Residency category not found');
    return rows[0];
  }

  async deleteResidency(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM residency_categories WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Residency category deleted successfully' };
  }

  // ─── 8. GROUPS MASTER (BATCH SUB-GROUPS: A, B, C, D) ─────────────────────
  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async listGroups(tenantSlug?: string, batchId?: string, departmentId?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
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
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const validBatchId = this.isUUID(dto.batchId || dto.batch_id) ? (dto.batchId || dto.batch_id) : null;
    const validDeptId = this.isUUID(dto.departmentId || dto.department_id) ? (dto.departmentId || dto.department_id) : null;
    const validCollegeId = this.isUUID(dto.collegeId || dto.college_id) ? (dto.collegeId || dto.college_id) : null;
    const validCourseId = this.isUUID(dto.courseId || dto.course_id) ? (dto.courseId || dto.course_id) : null;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO groups_master (code, name, college_id, course_id, batch_id, department_id, capacity, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [dto.code.toUpperCase().trim(), dto.name.trim(), validCollegeId, validCourseId, validBatchId, validDeptId, dto.capacity || 50],
    );
    return rows[0];
  }

  async updateGroup(id: string, dto: UpdateGroupDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const rawBatchId = dto.batchId !== undefined ? dto.batchId : dto.batch_id;
    const validBatchId = rawBatchId !== undefined ? (this.isUUID(rawBatchId) ? rawBatchId : null) : undefined;
    const rawDeptId = dto.departmentId !== undefined ? dto.departmentId : dto.department_id;
    const validDeptId = rawDeptId !== undefined ? (this.isUUID(rawDeptId) ? rawDeptId : null) : undefined;
    const isActive = dto.isActive !== undefined ? dto.isActive : dto.is_active;

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE groups_master
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           batch_id = COALESCE($3, batch_id),
           department_id = COALESCE($4, department_id),
           capacity = COALESCE($5, capacity),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [dto.code ? dto.code.toUpperCase().trim() : undefined, dto.name ? dto.name.trim() : undefined, validBatchId, validDeptId, dto.capacity, isActive, id],
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

