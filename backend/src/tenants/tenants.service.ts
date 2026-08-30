import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateTenantDto, UpdateTenantDto, TenantSettingsDto } from './dto/tenant.dto';
import { CleanTenantDto } from './dto/clean-tenant.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly authService: AuthService,
    private readonly schemaService: TenantSchemaService,
  ) {}

  // ─── LIST ─────────────────────────────────────────────────────────────────
  async findAll(pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const where = search
      ? `WHERE name ILIKE '%' || $3 || '%' OR slug ILIKE '%' || $3 || '%'`
      : '';

    const params = search ? [limit, offset, search] : [limit, offset];

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT id, name, slug, type, is_active, schema_provisioned,
                address, phone, website, settings, created_at, updated_at
         FROM public.tenants ${where}
         ORDER BY name ASC
         LIMIT $1 OFFSET $2`,
        params,
      ),
      this.ds.query(
        `SELECT COUNT(*) FROM public.tenants ${where}`,
        search ? [search] : [],
      ),
    ]);

    return paginate(rows, parseInt(countRows[0].count, 10), pagination);
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const rows = await this.ds.query(
      `SELECT id, name, slug, type, is_active, schema_provisioned,
              address, phone, website, settings, created_at, updated_at
       FROM public.tenants WHERE id=$1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException(`Tenant '${id}' not found`);
    return rows[0];
  }

  async findBySlug(slug: string) {
    const rows = await this.ds.query(
      `SELECT id, name, slug, type, is_active, schema_provisioned, settings
       FROM public.tenants WHERE slug=$1`,
      [slug],
    );
    if (!rows[0]) throw new NotFoundException(`Tenant '${slug}' not found`);
    return rows[0];
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: CreateTenantDto) {
    // Check slug uniqueness
    const existing = await this.ds.query(
      `SELECT id FROM public.tenants WHERE slug=$1`,
      [dto.slug],
    );
    if (existing.length) {
      throw new ConflictException(`Slug '${dto.slug}' is already in use`);
    }

    // Check email uniqueness across all tenants (advisory)
    const emailCheck = await this.ds.query(
      `SELECT id FROM public.tenants WHERE LOWER(settings->>'adminEmail') = $1`,
      [dto.adminEmail.toLowerCase()],
    );
    if (emailCheck.length) {
      throw new ConflictException('An admin with this email already exists in another institution');
    }

    // Hash admin password
    const passwordHash = await this.authService.hashPassword(dto.adminPassword);

    // Create tenant record
    const tenantRows = await this.ds.query(
      `INSERT INTO public.tenants
         (name, slug, type, is_active, address, phone, website, settings)
       VALUES ($1,$2,$3,true,$4,$5,$6,$7)
       RETURNING id, name, slug, type`,
      [
        dto.name,
        dto.slug.toLowerCase(),
        dto.type,
        dto.address ?? null,
        dto.phone ?? null,
        dto.website ?? null,
        JSON.stringify({ ...dto.settings, adminEmail: dto.adminEmail }),
      ],
    );

    const tenant = tenantRows[0];

    // Provision schema (async — creates all tables)
    await this.schemaService.provisionSchema(dto.slug);

    // Create the first ADMIN user inside the tenant schema
    const schema = `tenant_${dto.slug}`;
    await this.ds.query(
      `INSERT INTO "${schema}".users (email, password_hash, role, must_change_password, onboarding_completed)
       VALUES ($1,$2,$3,false,false)`,
      [dto.adminEmail.toLowerCase(), passwordHash, UserRole.ADMIN],
    );

    this.logger.log(`Tenant created: ${dto.slug} (${tenant.id})`);

    return {
      ...tenant,
      message: 'Tenant provisioned. Admin credentials are ready.',
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id); // throws if not found

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (dto.name !== undefined) { sets.push(`name=$${i++}`); params.push(dto.name); }
    if (dto.address !== undefined) { sets.push(`address=$${i++}`); params.push(dto.address); }
    if (dto.phone !== undefined) { sets.push(`phone=$${i++}`); params.push(dto.phone); }
    if (dto.website !== undefined) { sets.push(`website=$${i++}`); params.push(dto.website); }
    if (dto.type !== undefined) { sets.push(`type=$${i++}`); params.push(dto.type); }

    if (!sets.length) throw new BadRequestException('No fields to update');

    sets.push(`updated_at=NOW()`);
    params.push(id);

    await this.ds.query(
      `UPDATE public.tenants SET ${sets.join(', ')} WHERE id=$${i}`,
      params,
    );

    return this.findOne(id);
  }

  // ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────
  async toggleActive(id: string) {
    const tenant = await this.findOne(id);
    const newStatus = !tenant.is_active;
    await this.ds.query(
      `UPDATE public.tenants SET is_active=$1, updated_at=NOW() WHERE id=$2`,
      [newStatus, id],
    );
    await this.ds.query(
      `UPDATE public.firms SET status=$1, updated_at=NOW() WHERE LOWER(slug)=LOWER($2) OR id=$3`,
      [newStatus ? 'ACTIVE' : 'SUSPENDED', tenant.slug, id],
    ).catch(() => {});
    return { id, isActive: newStatus, status: newStatus ? 'ACTIVE' : 'SUSPENDED' };
  }

  // ─── SETTINGS ─────────────────────────────────────────────────────────────
  async updateSettings(id: string, dto: TenantSettingsDto) {
    const tenant = await this.findOne(id);
    const current = tenant.settings ?? {};
    const merged = { ...current, ...dto };

    await this.ds.query(
      `UPDATE public.tenants SET settings=$1, updated_at=NOW() WHERE id=$2`,
      [JSON.stringify(merged), id],
    );

    return merged;
  }

  // ─── STATS ────────────────────────────────────────────────────────────────
  async getTenantStats(rawSlug: string) {
    const cleanSlug = this.schemaService.resolveTenantSlug(rawSlug) || rawSlug;
    const schema = `tenant_${cleanSlug}`;

    const safeCount = async (tableName: string, whereClause: string = ''): Promise<number> => {
      try {
        const rows = await this.ds.query(`SELECT COUNT(*) FROM "${schema}"."${tableName}" ${whereClause}`);
        return parseInt(rows[0]?.count || '0', 10);
      } catch {
        return 0;
      }
    };

    const [
      students,
      faculty,
      departments,
      courses,
      batches,
      timetables,
      notices,
      projects,
      incubation,
      logbooks,
      exams,
      chats,
      attendances,
    ] = await Promise.all([
      safeCount('students'),
      safeCount('faculty'),
      safeCount('departments'),
      safeCount('courses'),
      safeCount('batches'),
      safeCount('timetables'),
      safeCount('notices'),
      safeCount('projects'),
      safeCount('incubation_applications'),
      safeCount('logbook_entries'),
      safeCount('examinations'),
      safeCount('chat_messages'),
      safeCount('attendance_records'),
    ]);

    return {
      success: true,
      tenantSlug: cleanSlug,
      schema,
      stats: {
        students,
        faculty,
        departments,
        courses,
        batches,
        timetables,
        notices,
        projects,
        incubation,
        logbooks,
        exams,
        chats,
        attendances,
      },
    };
  }

  // ─── CLEAN / RESET TENANT DATA ────────────────────────────────────────────
  async cleanTenantData(dto: CleanTenantDto) {
    const cleanSlug = this.schemaService.resolveTenantSlug(dto.tenantSlug) || dto.tenantSlug;
    if (!cleanSlug) {
      throw new BadRequestException('Invalid tenant slug specified');
    }

    const schema = `tenant_${cleanSlug}`;
    this.logger.warn(`Executing Data Purge on Tenant Schema "${schema}" for modules: ${JSON.stringify(dto.modules)}`);

    const runner = this.ds.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    const clearedBreakdown: Record<string, number> = {};

    try {
      // Check if schema exists
      const schemaCheck = await runner.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schema],
      );
      if (schemaCheck.length === 0) {
        throw new NotFoundException(`Tenant schema "${schema}" does not exist`);
      }

      const isAll = dto.modules.includes('ALL');
      const mods = new Set((dto.modules || []).map((m) => m.toUpperCase()));

      // Pre-fetch all actual table names present in this tenant schema
      const existingTablesRes = await runner.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
        [schema],
      );
      const existingTables = new Set(existingTablesRes.map((r: any) => String(r.table_name).toLowerCase()));

      const safeTruncateOrDelete = async (table: string, whereSql: string = ''): Promise<number> => {
        const lowerTbl = table.toLowerCase();
        if (!existingTables.has(lowerTbl)) {
          return 0;
        }

        try {
          const countRes = await runner.query(`SELECT COUNT(*) FROM "${schema}"."${table}" ${whereSql}`);
          const count = parseInt(countRes[0]?.count || '0', 10);
          if (count > 0) {
            if (whereSql) {
              await runner.query(`DELETE FROM "${schema}"."${table}" ${whereSql}`);
            } else {
              await runner.query(`TRUNCATE TABLE "${schema}"."${table}" CASCADE`);
            }
          }
          return count;
        } catch (err: any) {
          this.logger.warn(`Table "${schema}"."${table}" purge skipped: ${err.message}`);
          return 0;
        }
      };

      // 1. CHATS & NOTIFICATIONS
      if (isAll || mods.has('CHATS_NOTICES')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('chat_read_state');
        cnt += await safeTruncateOrDelete('chat_attachments');
        cnt += await safeTruncateOrDelete('chat_messages');
        cnt += await safeTruncateOrDelete('chat_group_members');
        cnt += await safeTruncateOrDelete('chat_groups');
        cnt += await safeTruncateOrDelete('notice_recipients');
        cnt += await safeTruncateOrDelete('notice_targets');
        cnt += await safeTruncateOrDelete('notice_attachments');
        cnt += await safeTruncateOrDelete('notice_reads');
        cnt += await safeTruncateOrDelete('notices');
        cnt += await safeTruncateOrDelete('notice_group_templates');
        cnt += await safeTruncateOrDelete('notifications');
        cnt += await safeTruncateOrDelete('campus_alerts');
        clearedBreakdown['Chats & Notifications'] = cnt;
      }

      // 2. LOGBOOK & CLINICAL
      if (isAll || mods.has('LOGBOOK')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('logbook_submissions');
        cnt += await safeTruncateOrDelete('logbook_entries');
        cnt += await safeTruncateOrDelete('posting_attendance');
        cnt += await safeTruncateOrDelete('clinical_postings');
        cnt += await safeTruncateOrDelete('posting_batches');
        cnt += await safeTruncateOrDelete('cbme_competencies');
        cnt += await safeTruncateOrDelete('cbme_curriculum');
        cnt += await safeTruncateOrDelete('competencies');
        cnt += await safeTruncateOrDelete('procedural_skills');
        clearedBreakdown['Logbook & Competencies'] = cnt;
      }

      // 3. TIMETABLE
      if (isAll || mods.has('TIMETABLE')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('timetable_slots');
        cnt += await safeTruncateOrDelete('timetables');
        cnt += await safeTruncateOrDelete('medical_timetable_slots');
        cnt += await safeTruncateOrDelete('medical_timetables');
        clearedBreakdown['Timetables & Slots'] = cnt;
      }

      // 4. INCUBATION & VENTURES
      if (isAll || mods.has('INCUBATION') || mods.has('INCUBATION_VENTURES')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('incubation_milestones');
        cnt += await safeTruncateOrDelete('incubation_funding');
        cnt += await safeTruncateOrDelete('incubation_applications');
        cnt += await safeTruncateOrDelete('incubation_startups');
        cnt += await safeTruncateOrDelete('incubation_mentors');
        cnt += await safeTruncateOrDelete('ventures');
        clearedBreakdown['Incubation & Ventures'] = cnt;
      }

      // 5. PROJECTS & MINI-PROJECTS
      if (isAll || mods.has('PROJECTS')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('project_evaluations');
        cnt += await safeTruncateOrDelete('project_submissions');
        cnt += await safeTruncateOrDelete('projects');
        cnt += await safeTruncateOrDelete('mini_project_submissions');
        cnt += await safeTruncateOrDelete('mini_projects');
        clearedBreakdown['Capstone & Mini-Projects'] = cnt;
      }

      // 6. EXAMS & QUESTION PAPERS
      if (isAll || mods.has('EXAMS_PAPERS')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('marks');
        cnt += await safeTruncateOrDelete('exam_results');
        cnt += await safeTruncateOrDelete('hall_tickets');
        cnt += await safeTruncateOrDelete('admit_cards');
        cnt += await safeTruncateOrDelete('grade_sheets');
        cnt += await safeTruncateOrDelete('exam_schedules');
        cnt += await safeTruncateOrDelete('examinations');
        cnt += await safeTruncateOrDelete('question_papers');
        cnt += await safeTruncateOrDelete('question_banks');
        cnt += await safeTruncateOrDelete('questions');
        clearedBreakdown['Exams & Question Papers'] = cnt;
      }

      // 7. REPOSITORIES & DOCUMENTS
      if (isAll || mods.has('REPOSITORIES')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('repository_files');
        cnt += await safeTruncateOrDelete('repositories');
        cnt += await safeTruncateOrDelete('documents');
        cnt += await safeTruncateOrDelete('learning_resources');
        clearedBreakdown['Repositories & Study Files'] = cnt;
      }

      // 8. ATTENDANCE & BIOMETRIC
      if (isAll || mods.has('ATTENDANCE')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('biometric_punches');
        cnt += await safeTruncateOrDelete('attendance_records');
        cnt += await safeTruncateOrDelete('attendance_sessions');
        cnt += await safeTruncateOrDelete('leave_applications');
        clearedBreakdown['Attendance & Punches'] = cnt;
      }

      // 9. STUDENTS & ADMISSIONS
      if (isAll || mods.has('STUDENTS')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('student_subject_enrollments');
        cnt += await safeTruncateOrDelete('student_batches');
        cnt += await safeTruncateOrDelete('student_admissions');
        cnt += await safeTruncateOrDelete('student_academic_details');
        cnt += await safeTruncateOrDelete('student_neet_details');
        cnt += await safeTruncateOrDelete('student_parents');
        cnt += await safeTruncateOrDelete('student_addresses');
        cnt += await safeTruncateOrDelete('student_documents');
        cnt += await safeTruncateOrDelete('student_fees');
        cnt += await safeTruncateOrDelete('student_hostel');
        cnt += await safeTruncateOrDelete('student_transport');
        cnt += await safeTruncateOrDelete('student_library');
        cnt += await safeTruncateOrDelete('student_medical');
        cnt += await safeTruncateOrDelete('students');
        cnt += await safeTruncateOrDelete('users', `WHERE role = 'STUDENT'`);
        clearedBreakdown['Students & Admissions'] = cnt;
      }

      // 10. FACULTY & STAFF
      if (isAll || mods.has('FACULTY')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('faculty');
        cnt += await safeTruncateOrDelete('staff');
        // Delete users with faculty, clerk, hod, staff, warden roles (preserve ADMIN)
        cnt += await safeTruncateOrDelete(
          'users',
          `WHERE role IN ('FACULTY', 'HOD', 'CLERK', 'STAFF', 'WARDEN', 'TUTOR', 'PG', 'EXECUTIVE')`,
        );
        clearedBreakdown['Faculty & Staff'] = cnt;
      }

      // 11. COLLEGE MASTER (Courses, Batches, Semesters, Sections, Subjects, Classrooms)
      if (isAll || mods.has('COLLEGE_MASTER')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('sections');
        cnt += await safeTruncateOrDelete('semesters');
        cnt += await safeTruncateOrDelete('batches');
        cnt += await safeTruncateOrDelete('subjects');
        cnt += await safeTruncateOrDelete('courses');
        cnt += await safeTruncateOrDelete('classrooms');
        cnt += await safeTruncateOrDelete('shifts');
        cnt += await safeTruncateOrDelete('degree_types');
        cnt += await safeTruncateOrDelete('grading_systems');
        cnt += await safeTruncateOrDelete('academic_calendars');
        cnt += await safeTruncateOrDelete('academic_sessions');
        cnt += await safeTruncateOrDelete('departments');
        clearedBreakdown['College Master Structures'] = cnt;
      }

      // 12. ADMIN MASTER (Leave types, fee heads, salary structures, etc.)
      if (isAll || mods.has('ADMIN_MASTER')) {
        let cnt = 0;
        cnt += await safeTruncateOrDelete('leave_types');
        cnt += await safeTruncateOrDelete('fee_heads');
        cnt += await safeTruncateOrDelete('fee_structures');
        cnt += await safeTruncateOrDelete('salary_heads');
        cnt += await safeTruncateOrDelete('salary_structures');
        cnt += await safeTruncateOrDelete('designations');
        cnt += await safeTruncateOrDelete('hostel_rooms');
        cnt += await safeTruncateOrDelete('hostel_blocks');
        cnt += await safeTruncateOrDelete('transport_vehicles');
        cnt += await safeTruncateOrDelete('transport_routes');
        clearedBreakdown['Admin Master Configurations'] = cnt;
      }

      // Ensure at least one active College Admin user exists so tenant can log in fresh
      if (existingTables.has('users')) {
        const adminUsers = await runner.query(
          `SELECT id FROM "${schema}".users WHERE role IN ('COLLEGE_ADMIN', 'ADMIN', 'SUPER_ADMIN') LIMIT 1`,
        );
        if (adminUsers.length === 0) {
          const defaultAdminHash = await this.authService.hashPassword('admin123');
          await runner.query(
            `INSERT INTO "${schema}".users (email, password_hash, role, is_active)
             VALUES ($1, $2, 'COLLEGE_ADMIN', true)`,
            [`admin@${cleanSlug}.mederp.app`, defaultAdminHash],
          );
        }
      }

      await runner.commitTransaction();
      this.logger.log(`Tenant schema "${schema}" successfully purged and prepared for live data.`);

      return {
        success: true,
        message: `Tenant "${cleanSlug}" data successfully cleaned and reset for fresh live entry.`,
        tenantSlug: cleanSlug,
        schema,
        clearedBreakdown,
      };
    } catch (err: any) {
      await runner.rollbackTransaction();
      this.logger.error(`Failed to clean tenant data for "${schema}": ${err.message}`, err.stack);
      throw new BadRequestException(`Clean Tenant Data failed: ${err.message}`);
    } finally {
      await runner.release();
    }
  }
}
