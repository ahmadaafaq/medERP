import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateProfessionalLinkerDto, UpdateProfessionalLinkerDto,
  CreateDepartmentMasterDto, UpdateDepartmentMasterDto,
  CreateSubjectMasterDto, UpdateSubjectMasterDto,
  CreateTopicMasterDto, UpdateTopicMasterDto,
  CreateCompetencyMasterDto, UpdateCompetencyMasterDto,
  CreateDeliveryTypeDto, UpdateDeliveryTypeDto,
  CreateSubjectOfferingDto, UpdateSubjectOfferingDto,
  LinkFacultySubjectDto,
  CreateUnitMasterDto, UpdateUnitMasterDto,
} from './dto/admin-master.dto';

@Injectable()
export class AdminMasterService {
  private readonly logger = new Logger(AdminMasterService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private async resolveTenantSlug(tenantSlugOrId?: string): Promise<string> {
    if (!tenantSlugOrId || tenantSlugOrId === 'all') return 'srms-ims';
    const clean = String(tenantSlugOrId).trim().toLowerCase();
    if (clean === 'srms') return 'srms-ims';
    try {
      const rows = await this.ds.query(
        `SELECT slug FROM public.tenants
         WHERE LOWER(slug) = LOWER($1) OR LOWER(code) = LOWER($1) OR id::text = $1
         LIMIT 1`,
        [clean],
      );
      if (rows.length > 0 && rows[0].slug) {
        return rows[0].slug;
      }
    } catch (e) {}
    return this.tenantSchemaService.resolveTenantSlug(clean);
  }

  private async listColleges(): Promise<any[]> {
    try {
      const rows = await this.ds.query(`
        SELECT id, code, name, slug, domain, plan, primary_color, is_active
        FROM public.tenants
        WHERE is_active = true
        ORDER BY code ASC NULLS LAST, name ASC
      `);
      return rows || [];
    } catch (err: any) {
      this.logger.warn(`Failed to list colleges from public.tenants: ${err.message}`);
      return [{ id: 'srms-ims', code: '11', name: 'SRMS Institute of Medical Sciences', slug: 'srms-ims', is_active: true }];
    }
  }

  // ─── 1. PROFESSIONAL LINKER ───────────────────────────────────────────────
  async listProfessionalLinkers(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM professional_linkers ORDER BY created_at DESC, code ASC`,
      ).catch(() => []);

      return rows.map(r => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    // List linkers across all colleges
    const allLinkers: any[] = [];
    for (const col of colleges) {
      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT * FROM professional_linkers ORDER BY created_at DESC, code ASC`,
        ).catch(() => []);

        allLinkers.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allLinkers;
  }

  async createProfessionalLinker(dto: CreateProfessionalLinkerDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO professional_linkers (code, name, course_cd, professional_phase, academic_session, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.course_cd || null, dto.professional_phase || null, dto.academic_session || null, dto.description || null],
    );
    return rows[0];
  }

  async updateProfessionalLinker(id: string, dto: UpdateProfessionalLinkerDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE professional_linkers
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           course_cd = COALESCE($3, course_cd),
           professional_phase = COALESCE($4, professional_phase),
           academic_session = COALESCE($5, academic_session),
           description = COALESCE($6, description),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [dto.code?.toUpperCase(), dto.name, dto.course_cd, dto.professional_phase, dto.academic_session, dto.description, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Professional Linker not found');
    return rows[0];
  }

  async deleteProfessionalLinker(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM professional_linkers WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Professional Linker deleted successfully' };
  }

  // ─── 2. DEPARTMENT MASTER (COLLEGE-WISE & CROSS-COLLEGE) ────────────────────
  async listDepartments(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';
      const schema = `tenant_${slug}`;

      try {
        await this.tenantSchemaService.provisionSchema(slug).catch(() => {});
        await this.ds.query(`
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT d.*, 
                  COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                  d.course_cd AS course_code,
                  COALESCE(d.branch_cd, d.code) AS branch_cd,
                  u.email as hod_email 
           FROM departments d
           LEFT JOIN courses c ON c.course_cd = d.course_cd OR c.code = d.course_cd
           LEFT JOIN users u ON d.hod_user_id = u.id
           ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
        ).catch(() => []);

        return rows.map(r => ({
          ...r,
          college_id: collegeId,
          college_name: collegeName,
          college_code: collegeCode,
          college_slug: slug,
        }));
      } catch (err: any) {
        this.logger.warn(`Failed to list departments for ${slug}: ${err.message}`);
        return [];
      }
    }

    // List departments across all colleges
    const allDepartments: any[] = [];
    for (const col of colleges) {
      try {
        const schema = `tenant_${col.slug}`;
        await this.ds.query(`
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS course_name VARCHAR(200);
          ALTER TABLE "${schema}".departments ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
        `).catch(() => {});

        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT d.*, 
                  COALESCE(c.name, d.course_name, 'Course ' || d.course_cd) AS course_name,
                  d.course_cd AS course_code,
                  COALESCE(d.branch_cd, d.code) AS branch_cd,
                  u.email as hod_email 
           FROM departments d
           LEFT JOIN courses c ON c.course_cd = d.course_cd OR c.code = d.course_cd
           LEFT JOIN users u ON d.hod_user_id = u.id
           ORDER BY CAST(NULLIF(regexp_replace(COALESCE(d.branch_cd, d.code), '\\D', '', 'g'), '') AS INTEGER) ASC NULLS LAST, d.name ASC`,
        ).catch(() => []);

        allDepartments.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allDepartments;
  }

  async createDepartment(dto: CreateDepartmentMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.college_id || tenantSlug);
    const branchCdVal = String(dto.branch_cd || dto.code || '').trim() || '1';
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO departments (code, branch_cd, name, type, course_cd, course_name, colg_cd, hod_user_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [branchCdVal, branchCdVal, dto.name, dto.type || 'General', dto.course_cd || null, dto.course_name || null, dto.colg_cd || null, dto.hod_user_id || null],
    );
    return rows[0];
  }

  async updateDepartment(id: string, dto: UpdateDepartmentMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(dto.college_id || tenantSlug);
    const branchCdVal = dto.code || dto.branch_cd ? String(dto.code || dto.branch_cd).trim() : undefined;
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           branch_cd = COALESCE($1, branch_cd),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           course_cd = COALESCE($4, course_cd),
           hod_user_id = COALESCE($5, hod_user_id),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [branchCdVal, dto.name, dto.type, dto.course_cd, dto.hod_user_id, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Department not found');
    return rows[0];
  }

  async deleteDepartment(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    // Safely clear foreign key references in child tables before deleting department
    const tablesToNullify = ['batches', 'faculty', 'groups_master', 'students', 'subjects', 'question_bank', 'timetable_slots', 'chat_groups'];
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
    return { success: true, message: 'Department deleted successfully' };
  }

  // ─── 3. SUBJECT MASTER (COLLEGE-WISE & CROSS-COLLEGE) ───────────────────────
  async listSubjects(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT s.*, 
                COALESCE(s.course_cd, d.course_cd) as course_cd,
                COALESCE(s.course_name, d.course_name) as course_name,
                COALESCE(s.branch_cd, d.branch_cd, d.code) as branch_cd,
                d.name as department_name, 
                d.code as department_code, 
                b.code as batch_code
         FROM subjects s
         LEFT JOIN departments d ON s.department_id = d.id
         LEFT JOIN batches b ON s.batch_id = b.id
         ORDER BY s.code ASC, s.name ASC`,
      ).catch(() => []);

      return rows.map(r => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    // List subjects across all colleges
    const allSubjects: any[] = [];
    for (const col of colleges) {
      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT s.*, 
                  COALESCE(s.course_cd, d.course_cd) as course_cd,
                  COALESCE(s.course_name, d.course_name) as course_name,
                  COALESCE(s.branch_cd, d.branch_cd, d.code) as branch_cd,
                  d.name as department_name, 
                  d.code as department_code, 
                  b.code as batch_code
           FROM subjects s
           LEFT JOIN departments d ON s.department_id = d.id
           LEFT JOIN batches b ON s.batch_id = b.id
           ORDER BY s.code ASC, s.name ASC`,
        ).catch(() => []);

        allSubjects.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allSubjects;
  }

  async createSubject(dto: CreateSubjectMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM subjects WHERE code = $1`,
      [dto.code.toUpperCase()],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`Subject with code '${dto.code}' already exists in this tenant.`);
    }

    let deptId = dto.department_id || null;
    let courseCd = dto.course_cd || null;
    let courseName = dto.course_name || null;
    let branchCd = dto.branch_cd || null;

    if (deptId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deptId)) {
      const deptRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, course_cd, course_name, branch_cd FROM departments 
         WHERE (branch_cd = $1 OR code = $1) ${dto.course_cd ? 'AND (course_cd = $2 OR $2 IS NULL)' : ''} 
         LIMIT 1`,
        dto.course_cd ? [deptId, dto.course_cd] : [deptId],
      );
      if (deptRows.length > 0) {
        deptId = deptRows[0].id;
        courseCd = courseCd || deptRows[0].course_cd;
        courseName = courseName || deptRows[0].course_name;
        branchCd = branchCd || deptRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO subjects (code, name, department_id, batch_id, credits, type, is_longitudinal, is_active, course_cd, course_name, branch_cd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10)
       RETURNING *`,
      [
        dto.code.toUpperCase(),
        dto.name,
        deptId,
        dto.batch_id || null,
        dto.credits || 0,
        dto.type || 'Combined',
        dto.is_longitudinal || false,
        courseCd,
        courseName,
        branchCd,
      ],
    );
    return rows[0];
  }

  async updateSubject(id: string, dto: UpdateSubjectMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);

    let deptId = dto.department_id;
    let courseCd = dto.course_cd;
    let courseName = dto.course_name;
    let branchCd = dto.branch_cd;

    if (deptId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deptId)) {
      const deptRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, course_cd, course_name, branch_cd FROM departments 
         WHERE (branch_cd = $1 OR code = $1) ${dto.course_cd ? 'AND (course_cd = $2 OR $2 IS NULL)' : ''} 
         LIMIT 1`,
        dto.course_cd ? [deptId, dto.course_cd] : [deptId],
      );
      if (deptRows.length > 0) {
        deptId = deptRows[0].id;
        courseCd = courseCd || deptRows[0].course_cd;
        courseName = courseName || deptRows[0].course_name;
        branchCd = branchCd || deptRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE subjects
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           department_id = COALESCE($3, department_id),
           batch_id = COALESCE($4, batch_id),
           credits = COALESCE($5, credits),
           type = COALESCE($6, type),
           is_longitudinal = COALESCE($7, is_longitudinal),
           is_active = COALESCE($8, is_active),
           course_cd = COALESCE($9, course_cd),
           course_name = COALESCE($10, course_name),
           branch_cd = COALESCE($11, branch_cd)
       WHERE id = $12
       RETURNING *`,
      [
        dto.code?.toUpperCase(),
        dto.name,
        deptId,
        dto.batch_id,
        dto.credits,
        dto.type,
        dto.is_longitudinal,
        dto.is_active,
        courseCd,
        courseName,
        branchCd,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Subject not found');
    return rows[0];
  }

  async deleteSubject(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);

    // Safely clear/delete foreign key references in child tables before deleting subject
    const nullifyTables = ['attendance_sessions', 'logbook_activity_types', 'logbook_entries', 'timetable_slots', 'competencies', 'faculty', 'question_bank', 'examination_papers'];
    for (const table of nullifyTables) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `UPDATE "${table}" SET subject_id = NULL WHERE subject_id = $1`,
          [id],
        );
      } catch (e) {}
    }

    const deleteTables = ['topics', 'subject_offerings', 'faculty_subjects'];
    for (const table of deleteTables) {
      try {
        await this.tenantSchemaService.queryInTenant(
          slug,
          `DELETE FROM "${table}" WHERE subject_id = $1`,
          [id],
        );
      } catch (e) {}
    }

    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM subjects WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Subject deleted successfully' };
  }

  // ─── 4. TOPIC MASTER ───────────────────────────────────────────────────────
  async listTopics(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.listColleges();

    if (slug === 'all') {
      const activeTenants = colleges.filter((c: any) => c.slug);
      const allTopics: any[] = [];
      for (const col of activeTenants) {
        try {
          const rows = await this.tenantSchemaService.queryInTenant(
            col.slug,
            `SELECT t.*, 
                    s.name as subject_name,
                    COALESCE(t.subject_code::text, s.code::text) as subject_code,
                    COALESCE(t.subject_id::text, s.id::text) as subject_id,
                    u.name as unit_name,
                    COALESCE(t.unit_code::text, u.code::text) as unit_code,
                    COALESCE(t.unit_id::text, u.id::text) as unit_id,
                    u.bloom_level as unit_bloom_level,
                    l.code as cbme_code, l.name as cbme_name,
                    COALESCE(t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
                    COALESCE(t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
             FROM topics t
             LEFT JOIN subjects s ON (t.subject_id = s.id OR t.subject_code = s.code)
             LEFT JOIN units u ON (t.unit_id = u.id OR t.unit_code = u.code)
             LEFT JOIN professional_linkers l ON t.linker_id = l.id
             ORDER BY t.created_at DESC, t.code ASC`,
          );
          rows.forEach((r: any) => {
            allTopics.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (err) {
          // Schema might not exist yet
        }
      }
      return allTopics;
    }

    const currentCollege = colleges.find((c: any) => c.slug === slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, 
              s.name as subject_name,
              COALESCE(t.subject_code::text, s.code::text) as subject_code,
              COALESCE(t.subject_id::text, s.id::text) as subject_id,
              u.name as unit_name,
              COALESCE(t.unit_code::text, u.code::text) as unit_code,
              COALESCE(t.unit_id::text, u.id::text) as unit_id,
              u.bloom_level as unit_bloom_level,
              l.code as cbme_code, l.name as cbme_name,
              COALESCE(t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
              COALESCE(t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
       FROM topics t
       LEFT JOIN subjects s ON (t.subject_id = s.id OR t.subject_code = s.code)
       LEFT JOIN units u ON (t.unit_id = u.id OR t.unit_code = u.code)
       LEFT JOIN professional_linkers l ON t.linker_id = l.id
       ORDER BY t.created_at DESC, t.code ASC`,
    );

    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    }));
  }

  async createTopic(dto: CreateTopicMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id;
    let subjectCode = dto.subject_code;
    let courseCd = dto.course_cd;
    let branchCd = dto.branch_cd;
    const subSearch = dto.subject_code || dto.subject_id;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id;
    let unitCode = dto.unit_code;
    let bloomLevel = dto.bloom_level;
    const unitSearch = dto.unit_code || dto.unit_id;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        bloomLevel = bloomLevel || unitRows[0].bloom_level;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO topics (subject_id, subject_code, unit_id, unit_code, course_cd, branch_cd, batch_year, bloom_level, code, name, description, hours, is_active, linker_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13)
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || null,
        bloomLevel || 'KL-2 (Understand)',
        dto.code.trim().toUpperCase(),
        dto.name.trim(),
        dto.description?.trim() || null,
        dto.hours || 1,
        dto.linker_id || null,
      ],
    );

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, 
              s.name as subject_name, s.code as subject_code,
              u.name as unit_name, u.code as unit_code, u.bloom_level as unit_bloom_level,
              l.code as cbme_code, l.name as cbme_name
       FROM topics t
       LEFT JOIN subjects s ON (t.subject_id = s.id OR t.subject_code = s.code)
       LEFT JOIN units u ON (t.unit_id = u.id OR t.unit_code = u.code)
       LEFT JOIN professional_linkers l ON t.linker_id = l.id
       WHERE t.id = $1`,
      [rows[0].id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateTopic(id: string, dto: UpdateTopicMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id;
    let subjectCode = dto.subject_code;
    let courseCd = dto.course_cd;
    let branchCd = dto.branch_cd;
    const subSearch = dto.subject_code || dto.subject_id;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id;
    let unitCode = dto.unit_code;
    let bloomLevel = dto.bloom_level;
    const unitSearch = dto.unit_code || dto.unit_id;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        bloomLevel = bloomLevel || unitRows[0].bloom_level;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE topics
       SET subject_id = COALESCE($1, subject_id),
           subject_code = COALESCE($2, subject_code),
           unit_id = COALESCE($3, unit_id),
           unit_code = COALESCE($4, unit_code),
           course_cd = COALESCE($5, course_cd),
           branch_cd = COALESCE($6, branch_cd),
           batch_year = COALESCE($7, batch_year),
           bloom_level = COALESCE($8, bloom_level),
           code = COALESCE($9, code),
           name = COALESCE($10, name),
           description = COALESCE($11, description),
           hours = COALESCE($12, hours),
           is_active = COALESCE($13, is_active),
           linker_id = COALESCE($14, linker_id),
           updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || null,
        bloomLevel || null,
        dto.code ? dto.code.trim().toUpperCase() : null,
        dto.name ? dto.name.trim() : null,
        dto.description !== undefined ? dto.description : null,
        dto.hours || null,
        dto.is_active,
        dto.linker_id || null,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Topic not found');

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, 
              s.name as subject_name, s.code as subject_code,
              u.name as unit_name, u.code as unit_code, u.bloom_level as unit_bloom_level,
              l.code as cbme_code, l.name as cbme_name
       FROM topics t
       LEFT JOIN subjects s ON (t.subject_id = s.id OR t.subject_code = s.code)
       LEFT JOIN units u ON (t.unit_id = u.id OR t.unit_code = u.code)
       LEFT JOIN professional_linkers l ON t.linker_id = l.id
       WHERE t.id = $1`,
      [id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteTopic(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `UPDATE competencies SET topic_id = NULL WHERE topic_id = $1`,
        [id],
      );
    } catch (e) {}
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM topics WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Topic deleted successfully' };
  }

  // ─── 5. COMPETENCY / SUB-TOPIC MASTER ──────────────────────────────────────────
  async listCompetencies(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.listColleges();

    if (slug === 'all') {
      const activeTenants = colleges.filter((c: any) => c.slug);
      const allCompetencies: any[] = [];
      for (const col of activeTenants) {
        try {
          const rows = await this.tenantSchemaService.queryInTenant(
            col.slug,
            `SELECT c.*, 
                    s.name as subject_name,
                    COALESCE(c.subject_code::text, s.code::text, t.subject_code::text, u.subject_code::text) as subject_code,
                    COALESCE(c.subject_id::text, s.id::text, t.subject_id::text, u.subject_id::text) as subject_id,
                    u.name as unit_name,
                    COALESCE(c.unit_code::text, u.code::text, t.unit_code::text) as unit_code,
                    COALESCE(c.unit_id::text, u.id::text, t.unit_id::text) as unit_id,
                    u.description as unit_description,
                    t.name as topic_name,
                    COALESCE(c.topic_code::text, t.code::text) as topic_code,
                    COALESCE(c.topic_id::text, t.id::text) as topic_id,
                    t.description as topic_description,
                    l.code as cbme_code, l.name as cbme_name,
                    COALESCE(c.course_cd::text, t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
                    COALESCE(c.branch_cd::text, t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
             FROM competencies c
             LEFT JOIN subjects s ON (c.subject_id = s.id OR c.subject_code = s.code)
             LEFT JOIN units u ON (c.unit_id = u.id OR c.unit_code = u.code)
             LEFT JOIN topics t ON (c.topic_id = t.id OR c.topic_code = t.code)
             LEFT JOIN professional_linkers l ON c.linker_id = l.id
             ORDER BY c.created_at DESC, c.code ASC`,
          );
          rows.forEach((r: any) => {
            allCompetencies.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (err) {
          // Schema might not exist yet
        }
      }
      return allCompetencies;
    }

    const currentCollege = colleges.find((c: any) => c.slug === slug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT c.*, 
              s.name as subject_name,
              COALESCE(c.subject_code::text, s.code::text, t.subject_code::text, u.subject_code::text) as subject_code,
              COALESCE(c.subject_id::text, s.id::text, t.subject_id::text, u.subject_id::text) as subject_id,
              u.name as unit_name,
              COALESCE(c.unit_code::text, u.code::text, t.unit_code::text) as unit_code,
              COALESCE(c.unit_id::text, u.id::text, t.unit_id::text) as unit_id,
              u.description as unit_description,
              t.name as topic_name,
              COALESCE(c.topic_code::text, t.code::text) as topic_code,
              COALESCE(c.topic_id::text, t.id::text) as topic_id,
              t.description as topic_description,
              l.code as cbme_code, l.name as cbme_name,
              COALESCE(c.course_cd::text, t.course_cd::text, u.course_cd::text, s.course_cd::text) as course_cd,
              COALESCE(c.branch_cd::text, t.branch_cd::text, u.branch_cd::text, s.branch_cd::text) as branch_cd
       FROM competencies c
       LEFT JOIN subjects s ON (c.subject_id = s.id OR c.subject_code = s.code)
       LEFT JOIN units u ON (c.unit_id = u.id OR c.unit_code = u.code)
       LEFT JOIN topics t ON (c.topic_id = t.id OR c.topic_code = t.code)
       LEFT JOIN professional_linkers l ON c.linker_id = l.id
       ORDER BY c.created_at DESC, c.code ASC`,
    );

    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    }));
  }

  async createCompetency(dto: CreateCompetencyMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id;
    let subjectCode = dto.subject_code;
    let courseCd = dto.course_cd;
    let branchCd = dto.branch_cd;
    const subSearch = dto.subject_code || dto.subject_id;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id;
    let unitCode = dto.unit_code;
    const unitSearch = dto.unit_code || dto.unit_id;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    // Resolve topic if string code or UUID
    let topicId = dto.topic_id;
    let topicCode = dto.topic_code;
    let bloomLevel = dto.bloom_level;
    const topicSearch = dto.topic_code || dto.topic_id;
    if (topicSearch) {
      const topicRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, unit_id, unit_code, subject_id, subject_code, course_cd, branch_cd FROM topics WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [topicSearch],
      ).catch(() => []);
      if (topicRows.length > 0) {
        topicId = topicRows[0].id;
        topicCode = topicRows[0].code;
        bloomLevel = bloomLevel || topicRows[0].bloom_level;
        unitId = unitId || topicRows[0].unit_id;
        unitCode = unitCode || topicRows[0].unit_code;
        subjectId = subjectId || topicRows[0].subject_id;
        subjectCode = subjectCode || topicRows[0].subject_code;
        courseCd = courseCd || topicRows[0].course_cd;
        branchCd = branchCd || topicRows[0].branch_cd;
      }
    }

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    // If batch items provided
    if (dto.items && Array.isArray(dto.items) && dto.items.length > 0) {
      const insertedList: any[] = [];
      for (const item of dto.items) {
        const rows = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO competencies (subject_id, subject_code, unit_id, unit_code, topic_id, topic_code, course_cd, branch_cd, batch_year, code, name, description, domain, level, bloom_level, is_core, is_active, linker_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17)
           RETURNING *`,
          [
            subjectId || null,
            subjectCode || null,
            unitId || null,
            unitCode || null,
            topicId || null,
            topicCode || null,
            courseCd || null,
            branchCd || null,
            dto.batch_year || null,
            item.code.trim().toUpperCase(),
            item.name?.trim() || null,
            item.description.trim(),
            item.domain || dto.domain || 'Knowledge',
            item.level || dto.level || 'Knows How',
            item.bloom_level || bloomLevel || 'KL-2 (Understand)',
            item.is_core ?? true,
            dto.linker_id || null,
          ],
        );
        insertedList.push({
          ...rows[0],
          college_id: currentCollege?.id,
          college_name: currentCollege?.name,
          college_code: currentCollege?.code,
          college_slug: slug,
        });
      }
      return insertedList[0] || { success: true };
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO competencies (subject_id, subject_code, unit_id, unit_code, topic_id, topic_code, course_cd, branch_cd, batch_year, code, name, description, domain, level, bloom_level, is_core, is_active, linker_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17)
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        topicId || null,
        topicCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || null,
        (dto.code || '').trim().toUpperCase(),
        dto.name?.trim() || null,
        (dto.description || '').trim(),
        dto.domain || 'Knowledge',
        dto.level || 'Knows How',
        bloomLevel || 'KL-2 (Understand)',
        dto.is_core ?? true,
        dto.linker_id || null,
      ],
    );

    return {
      ...rows[0],
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateCompetency(id: string, dto: UpdateCompetencyMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // Resolve subject if string code or UUID
    let subjectId = dto.subject_id;
    let subjectCode = dto.subject_code;
    let courseCd = dto.course_cd;
    let branchCd = dto.branch_cd;
    const subSearch = dto.subject_code || dto.subject_id;
    if (subSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        subjectCode = subRows[0].code;
        courseCd = courseCd || subRows[0].course_cd;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // Resolve unit if string code or UUID
    let unitId = dto.unit_id;
    let unitCode = dto.unit_code;
    const unitSearch = dto.unit_code || dto.unit_id;
    if (unitSearch) {
      const unitRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, branch_cd FROM units WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [unitSearch],
      ).catch(() => []);
      if (unitRows.length > 0) {
        unitId = unitRows[0].id;
        unitCode = unitRows[0].code;
        courseCd = courseCd || unitRows[0].course_cd;
        branchCd = branchCd || unitRows[0].branch_cd;
      }
    }

    // Resolve topic if string code or UUID
    let topicId = dto.topic_id;
    let topicCode = dto.topic_code;
    let bloomLevel = dto.bloom_level;
    const topicSearch = dto.topic_code || dto.topic_id;
    if (topicSearch) {
      const topicRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, bloom_level, unit_id, unit_code, subject_id, subject_code, course_cd, branch_cd FROM topics WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [topicSearch],
      ).catch(() => []);
      if (topicRows.length > 0) {
        topicId = topicRows[0].id;
        topicCode = topicRows[0].code;
        bloomLevel = bloomLevel || topicRows[0].bloom_level;
        unitId = unitId || topicRows[0].unit_id;
        unitCode = unitCode || topicRows[0].unit_code;
        subjectId = subjectId || topicRows[0].subject_id;
        subjectCode = subjectCode || topicRows[0].subject_code;
        courseCd = courseCd || topicRows[0].course_cd;
        branchCd = branchCd || topicRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE competencies
       SET subject_id = COALESCE($1, subject_id),
           subject_code = COALESCE($2, subject_code),
           unit_id = COALESCE($3, unit_id),
           unit_code = COALESCE($4, unit_code),
           topic_id = COALESCE($5, topic_id),
           topic_code = COALESCE($6, topic_code),
           course_cd = COALESCE($7, course_cd),
           branch_cd = COALESCE($8, branch_cd),
           batch_year = COALESCE($9, batch_year),
           code = COALESCE($10, code),
           name = COALESCE($11, name),
           description = COALESCE($12, description),
           domain = COALESCE($13, domain),
           level = COALESCE($14, level),
           bloom_level = COALESCE($15, bloom_level),
           is_core = COALESCE($16, is_core),
           is_active = COALESCE($17, is_active),
           linker_id = COALESCE($18, linker_id),
           updated_at = NOW()
       WHERE id = $19
       RETURNING *`,
      [
        subjectId || null,
        subjectCode || null,
        unitId || null,
        unitCode || null,
        topicId || null,
        topicCode || null,
        courseCd || null,
        branchCd || null,
        dto.batch_year || null,
        dto.code ? dto.code.trim().toUpperCase() : null,
        dto.name ? dto.name.trim() : null,
        dto.description ? dto.description.trim() : null,
        dto.domain || null,
        dto.level || null,
        bloomLevel || null,
        dto.is_core,
        dto.is_active,
        dto.linker_id || null,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Competency not found');

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...rows[0],
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteCompetency(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM competencies WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Competency deleted successfully' };
  }

  // ─── 6. DELIVERY TYPES ─────────────────────────────────────────────────────
  async listDeliveryTypes(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM delivery_types ORDER BY code ASC`,
    );
  }

  async createDeliveryType(dto: CreateDeliveryTypeDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM delivery_types WHERE code = $1`,
      [dto.code.toUpperCase()],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`Delivery type with code '${dto.code}' already exists.`);
    }
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO delivery_types (code, name, is_active)
       VALUES ($1, $2, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name],
    );
    return rows[0];
  }

  async updateDeliveryType(id: string, dto: UpdateDeliveryTypeDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE delivery_types
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING *`,
      [dto.code?.toUpperCase(), dto.name, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Delivery type not found');
    return rows[0];
  }

  async deleteDeliveryType(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM delivery_types WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Delivery type deleted successfully' };
  }

  // ─── 7. SUBJECT OFFERINGS ──────────────────────────────────────────────────
  async listSubjectOfferings(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find(c => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT so.*, 
                s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
                p.name AS prof_name, p.phase_order, p.academic_year,
                dt.name AS dtype_name, dt.code AS dtype_code
         FROM subject_offerings so
         LEFT JOIN subjects s ON so.subject_id = s.id
         LEFT JOIN professional_phases p ON so.prof_id = p.id
         LEFT JOIN delivery_types dt ON so.dtype_id = dt.id
         ORDER BY s.name ASC, p.phase_order ASC, dt.code ASC`,
      ).catch(() => []);

      return rows.map(r => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    // List subject offerings across all colleges
    const allOfferings: any[] = [];
    for (const col of colleges) {
      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT so.*, 
                  s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
                  p.name AS prof_name, p.phase_order, p.academic_year,
                  dt.name AS dtype_name, dt.code AS dtype_code
           FROM subject_offerings so
           LEFT JOIN subjects s ON so.subject_id = s.id
           LEFT JOIN professional_phases p ON so.prof_id = p.id
           LEFT JOIN delivery_types dt ON so.dtype_id = dt.id
           ORDER BY s.name ASC, p.phase_order ASC, dt.code ASC`,
        ).catch(() => []);

        allOfferings.push(
          ...rows.map(r => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allOfferings;
  }

  async createSubjectOffering(dto: CreateSubjectOfferingDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // 1. Resolve Subject
    let subjectId = dto.subject_id;
    const subjectSearch = dto.subject_code || dto.subject_id;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) subjectId = subRows[0].id;
    }

    // 2. Resolve Professional Phase
    let profId = dto.prof_id;
    const profSearch = dto.phase_order !== undefined ? String(dto.phase_order) : dto.prof_id;
    if (profSearch) {
      const profRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM professional_phases WHERE id::text = $1 OR phase_order::text = $1 LIMIT 1`,
        [profSearch],
      ).catch(() => []);
      if (profRows.length > 0) profId = profRows[0].id;
    }

    // 3. Resolve (or auto-create) Delivery Type
    let dtypeId = dto.dtype_id;
    const dtypeSearch = dto.dtype_code || dto.dtype_id || 'TH';
    if (dtypeSearch) {
      let dtRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM delivery_types WHERE id::text = $1 OR code ILIKE $1 LIMIT 1`,
        [dtypeSearch],
      ).catch(() => []);
      if (dtRows.length === 0) {
        const inserted = await this.tenantSchemaService.queryInTenant(
          slug,
          `INSERT INTO delivery_types (code, name, is_active)
           VALUES ($1, $2, true)
           RETURNING id`,
          [dtypeSearch.toUpperCase(), dtypeSearch.toUpperCase() === 'TH' ? 'Theory' : (dtypeSearch.toUpperCase() === 'PR' ? 'Practical' : dtypeSearch)],
        ).catch(() => []);
        if (inserted.length > 0) dtypeId = inserted[0].id;
      } else {
        dtypeId = dtRows[0].id;
      }
    }

    if (!subjectId || !profId || !dtypeId) {
      throw new BadRequestException('Could not resolve valid Subject, Academic Phase, or Delivery Type in tenant schema.');
    }

    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM subject_offerings 
       WHERE subject_id = $1 AND prof_id = $2 AND dtype_id = $3 AND batch_year = $4`,
      [subjectId, profId, dtypeId, dto.batch_year],
    ).catch(() => []);

    if (existing && existing.length > 0) {
      throw new BadRequestException('This subject offering mapping already exists.');
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO subject_offerings (subject_id, prof_id, dtype_id, batch_year, hours_allotted, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [subjectId, profId, dtypeId, dto.batch_year, dto.hours_allotted ?? 0],
    );

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT so.*, 
              s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
              p.name AS prof_name, p.phase_order, p.academic_year,
              dt.name AS dtype_name, dt.code AS dtype_code
       FROM subject_offerings so
       LEFT JOIN subjects s ON so.subject_id = s.id
       LEFT JOIN professional_phases p ON so.prof_id = p.id
       LEFT JOIN delivery_types dt ON so.dtype_id = dt.id
       WHERE so.id = $1`,
      [rows[0].id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateSubjectOffering(id: string, dto: UpdateSubjectOfferingDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // 1. Resolve Subject if provided
    let subjectId = dto.subject_id;
    const subjectSearch = dto.subject_code || dto.subject_id;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) subjectId = subRows[0].id;
    }

    // 2. Resolve Professional Phase if provided
    let profId = dto.prof_id;
    const profSearch = dto.phase_order !== undefined ? String(dto.phase_order) : dto.prof_id;
    if (profSearch) {
      const profRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM professional_phases WHERE id::text = $1 OR phase_order::text = $1 LIMIT 1`,
        [profSearch],
      ).catch(() => []);
      if (profRows.length > 0) profId = profRows[0].id;
    }

    // 3. Resolve Delivery Type if provided
    let dtypeId = dto.dtype_id;
    const dtypeSearch = dto.dtype_code || dto.dtype_id;
    if (dtypeSearch) {
      const dtRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id FROM delivery_types WHERE id::text = $1 OR code ILIKE $1 LIMIT 1`,
        [dtypeSearch],
      ).catch(() => []);
      if (dtRows.length > 0) dtypeId = dtRows[0].id;
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE subject_offerings
       SET subject_id = COALESCE($1, subject_id),
           prof_id = COALESCE($2, prof_id),
           dtype_id = COALESCE($3, dtype_id),
           batch_year = COALESCE($4, batch_year),
           hours_allotted = COALESCE($5, hours_allotted),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [subjectId, profId, dtypeId, dto.batch_year, dto.hours_allotted, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Subject offering not found');

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT so.*, 
              s.name AS subject_name, s.code AS subject_code, s.course_cd, s.course_name, s.branch_cd,
              p.name AS prof_name, p.phase_order, p.academic_year,
              dt.name AS dtype_name, dt.code AS dtype_code
       FROM subject_offerings so
       LEFT JOIN subjects s ON so.subject_id = s.id
       LEFT JOIN professional_phases p ON so.prof_id = p.id
       LEFT JOIN delivery_types dt ON so.dtype_id = dt.id
       WHERE so.id = $1`,
      [id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteSubjectOffering(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM subject_offerings WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Subject offering deleted successfully' };
  }

  // ─── 8. FACULTY SUBJECT LINKER ─────────────────────────────────────────────
  async listFacultySubjects(query: { facultyId?: string; subjectId?: string; departmentId?: string }, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const params: any[] = [];
    let sql = `
      SELECT fs.id, fs.faculty_id, fs.subject_id, fs.is_active, fs.created_at,
             f.name AS faculty_name, f.emp_id AS faculty_code, f.designation AS faculty_designation,
             fd.name AS faculty_department_name,
             s.name AS subject_name, s.code AS subject_code,
             sd.name AS subject_department_name
      FROM faculty_subjects fs
      JOIN faculty f ON f.id = fs.faculty_id
      LEFT JOIN departments fd ON fd.id = f.department_id
      JOIN subjects s ON s.id = fs.subject_id
      LEFT JOIN departments sd ON sd.id = s.department_id
      WHERE 1=1
    `;
    if (query?.facultyId) {
      params.push(query.facultyId);
      sql += ` AND fs.faculty_id = $${params.length}`;
    }
    if (query?.subjectId) {
      params.push(query.subjectId);
      sql += ` AND fs.subject_id = $${params.length}`;
    }
    if (query?.departmentId) {
      params.push(query.departmentId);
      sql += ` AND (f.department_id = $${params.length} OR s.department_id = $${params.length})`;
    }
    sql += ` ORDER BY fs.created_at DESC`;
    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }

  async linkFacultySubject(dto: LinkFacultySubjectDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO faculty_subjects (faculty_id, subject_id)
       VALUES ($1, $2)
       ON CONFLICT (faculty_id, subject_id) DO UPDATE SET is_active = true
       RETURNING *`,
      [dto.facultyId, dto.subjectId]
    );
    return rows[0];
  }

  async updateFacultySubject(id: string, dto: LinkFacultySubjectDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE faculty_subjects
       SET faculty_id = $1, subject_id = $2
       WHERE id = $3
       RETURNING *`,
      [dto.facultyId, dto.subjectId, id]
    );
    return rows[0];
  }

  async unlinkFacultySubject(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM faculty_subjects WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Faculty subject link removed successfully' };
  }

  // ─── 9. UNIT MASTER ─────────────────────────────────────────────────────────
  async listUnits(tenantSlug?: string) {
    const colleges = await this.listColleges();

    if (tenantSlug && tenantSlug !== 'all') {
      const slug = await this.resolveTenantSlug(tenantSlug);
      const targetCollege = colleges.find((c: any) => c.slug === slug || c.code === slug || c.id === slug);
      const collegeId = targetCollege?.id || slug;
      const collegeName = targetCollege?.name || 'SRMS Institution';
      const collegeCode = targetCollege?.code || '';

      const rows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT u.*, 
                s.name AS subject_name, s.code AS subject_code,
                COALESCE(u.course_cd, s.course_cd) AS course_cd,
                COALESCE(u.course_name, s.course_name) AS course_name,
                COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
         FROM units u
         LEFT JOIN subjects s ON u.subject_id = s.id
         ORDER BY u.unit_order ASC, u.code ASC`,
      ).catch(() => []);

      return rows.map((r: any) => ({
        ...r,
        college_id: collegeId,
        college_name: collegeName,
        college_code: collegeCode,
        college_slug: slug,
      }));
    }

    const allUnits: any[] = [];
    for (const col of colleges) {
      try {
        const rows = await this.tenantSchemaService.queryInTenant(
          col.slug,
          `SELECT u.*, 
                  s.name AS subject_name, s.code AS subject_code,
                  COALESCE(u.course_cd, s.course_cd) AS course_cd,
                  COALESCE(u.course_name, s.course_name) AS course_name,
                  COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
           FROM units u
           LEFT JOIN subjects s ON u.subject_id = s.id
           ORDER BY u.unit_order ASC, u.code ASC`,
        ).catch(() => []);

        allUnits.push(
          ...rows.map((r: any) => ({
            ...r,
            college_id: col.id,
            college_name: col.name,
            college_code: col.code,
            college_slug: col.slug,
          })),
        );
      } catch (err) {}
    }
    return allUnits;
  }

  async createUnit(dto: CreateUnitMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    // 1. Resolve Subject
    let subjectId = dto.subject_id;
    let courseCd = dto.course_cd;
    let courseName = dto.course_name;
    let branchCd = dto.branch_cd;
    const subjectSearch = dto.subject_code || dto.subject_id;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, course_name, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        courseCd = courseCd || subRows[0].course_cd;
        courseName = courseName || subRows[0].course_name;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    // 2. Resolve Batch
    let batchId = dto.batch_id;
    let batchYear = dto.batch_year;
    if (dto.batch_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.batch_id)) {
      const bRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, year, batch_cd FROM batches WHERE id::text = $1 OR batch_cd = $1 OR code = $1 OR year::text = $1 LIMIT 1`,
        [dto.batch_id],
      ).catch(() => []);
      if (bRows.length > 0) {
        batchId = bRows[0].id;
        batchYear = batchYear || bRows[0].year;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO units (code, name, description, subject_id, subject_code, course_cd, course_name, branch_cd, batch_id, batch_year, bloom_level, unit_order, hours, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
       RETURNING *`,
      [
        dto.code.trim().toUpperCase(),
        dto.name?.trim() || dto.code.trim(),
        dto.description?.trim() || dto.name?.trim() || '',
        subjectId || null,
        dto.subject_code || null,
        courseCd || null,
        courseName || null,
        branchCd || null,
        batchId || null,
        batchYear || null,
        dto.bloom_level || 'KL-2 (Understand)',
        dto.unit_order || 1,
        dto.hours || 0,
      ],
    );

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT u.*, 
              s.name AS subject_name, s.code AS subject_code,
              COALESCE(u.course_cd, s.course_cd) AS course_cd,
              COALESCE(u.course_name, s.course_name) AS course_name,
              COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
       FROM units u
       LEFT JOIN subjects s ON u.subject_id = s.id
       WHERE u.id = $1`,
      [rows[0].id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async updateUnit(id: string, dto: UpdateUnitMasterDto, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug || dto.college_slug || dto.college_id);

    let subjectId = dto.subject_id;
    let courseCd = dto.course_cd;
    let courseName = dto.course_name;
    let branchCd = dto.branch_cd;
    const subjectSearch = dto.subject_code || dto.subject_id;
    if (subjectSearch) {
      const subRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT id, code, name, course_cd, course_name, branch_cd FROM subjects WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [subjectSearch],
      ).catch(() => []);
      if (subRows.length > 0) {
        subjectId = subRows[0].id;
        courseCd = courseCd || subRows[0].course_cd;
        courseName = courseName || subRows[0].course_name;
        branchCd = branchCd || subRows[0].branch_cd;
      }
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE units
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           subject_id = COALESCE($4, subject_id),
           subject_code = COALESCE($5, subject_code),
           course_cd = COALESCE($6, course_cd),
           course_name = COALESCE($7, course_name),
           branch_cd = COALESCE($8, branch_cd),
           batch_year = COALESCE($9, batch_year),
           bloom_level = COALESCE($10, bloom_level),
           unit_order = COALESCE($11, unit_order),
           hours = COALESCE($12, hours),
           is_active = COALESCE($13, is_active),
           updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        dto.code ? dto.code.trim().toUpperCase() : null,
        dto.name ? dto.name.trim() : null,
        dto.description ? dto.description.trim() : null,
        subjectId || null,
        dto.subject_code || null,
        courseCd || null,
        courseName || null,
        branchCd || null,
        dto.batch_year || null,
        dto.bloom_level || null,
        dto.unit_order || null,
        dto.hours || null,
        dto.is_active,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Unit not found');

    const resultRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT u.*, 
              s.name AS subject_name, s.code AS subject_code,
              COALESCE(u.course_cd, s.course_cd) AS course_cd,
              COALESCE(u.course_name, s.course_name) AS course_name,
              COALESCE(u.branch_cd, s.branch_cd) AS branch_cd
       FROM units u
       LEFT JOIN subjects s ON u.subject_id = s.id
       WHERE u.id = $1`,
      [id],
    ).catch(() => []);

    const colleges = await this.listColleges();
    const currentCollege = colleges.find((c: any) => c.slug === slug || c.id === dto.college_id || c.code === dto.college_id);

    return {
      ...(resultRows[0] || rows[0]),
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: slug,
    };
  }

  async deleteUnit(id: string, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM units WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Unit deleted successfully' };
  }
}
