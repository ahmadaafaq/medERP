import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
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
} from './dto/admin-master.dto';

@Injectable()
export class AdminMasterService {
  private readonly logger = new Logger(AdminMasterService.name);

  constructor(
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveTenantSlug(tenantSlug?: string): string {
    return this.tenantSchemaService.resolveTenantSlug(tenantSlug);
  }

  // ─── 1. PROFESSIONAL LINKER ───────────────────────────────────────────────
  async listProfessionalLinkers(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM professional_linkers ORDER BY created_at DESC`,
    );
  }

  async createProfessionalLinker(dto: CreateProfessionalLinkerDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM professional_linkers WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Professional Linker deleted successfully' };
  }

  // ─── 2. DEPARTMENT MASTER ──────────────────────────────────────────────────
  async listDepartments(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT d.*, u.email as hod_email 
       FROM departments d
       LEFT JOIN users u ON d.hod_user_id = u.id
       ORDER BY d.code ASC`,
    );
  }

  async createDepartment(dto: CreateDepartmentMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM departments WHERE code = $1`,
      [dto.code.toUpperCase()],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`Department with code '${dto.code}' already exists in this tenant.`);
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO departments (code, name, type, hod_user_id, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.type, dto.hod_user_id || null],
    );
    return rows[0];
  }

  async updateDepartment(id: string, dto: UpdateDepartmentMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE departments
       SET code = COALESCE($1, code),
           name = COALESCE($2, name),
           type = COALESCE($3, type),
           hod_user_id = COALESCE($4, hod_user_id),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [dto.code?.toUpperCase(), dto.name, dto.type, dto.hod_user_id, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Department not found');
    return rows[0];
  }

  async deleteDepartment(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM departments WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Department deleted successfully' };
  }

  // ─── 3. SUBJECT MASTER ─────────────────────────────────────────────────────
  async listSubjects(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT s.*, d.name as department_name, b.code as batch_code
       FROM subjects s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN batches b ON s.batch_id = b.id
       ORDER BY s.code ASC`,
    );
  }

  async createSubject(dto: CreateSubjectMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM subjects WHERE code = $1`,
      [dto.code.toUpperCase()],
    );
    if (existing.length > 0) {
      throw new BadRequestException(`Subject with code '${dto.code}' already exists in this tenant.`);
    }

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO subjects (code, name, department_id, batch_id, credits, type, is_longitudinal, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [dto.code.toUpperCase(), dto.name, dto.department_id || null, dto.batch_id || null, dto.credits || 0, dto.type || 'Combined', dto.is_longitudinal || false],
    );
    return rows[0];
  }

  async updateSubject(id: string, dto: UpdateSubjectMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
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
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [dto.code?.toUpperCase(), dto.name, dto.department_id, dto.batch_id, dto.credits, dto.type, dto.is_longitudinal, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Subject not found');
    return rows[0];
  }

  async deleteSubject(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);

    // Safely clear/delete foreign key references in child tables before deleting subject
    const nullifyTables = ['attendance_sessions', 'logbook_activity_types', 'logbook_entries', 'timetable_slots', 'competencies', 'faculty'];
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
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT t.*, s.name as subject_name, s.code as subject_code, l.code as cbme_code, l.name as cbme_name
       FROM topics t
       LEFT JOIN subjects s ON t.subject_id = s.id
       LEFT JOIN professional_linkers l ON t.linker_id = l.id
       ORDER BY t.created_at DESC, t.code ASC`,
    );
  }

  async createTopic(dto: CreateTopicMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO topics (subject_id, code, name, description, hours, is_active, linker_id)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING *`,
      [dto.subject_id || null, dto.code.toUpperCase(), dto.name, dto.description || null, dto.hours || 1, dto.linker_id || null],
    );
    return rows[0];
  }

  async updateTopic(id: string, dto: UpdateTopicMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE topics
       SET subject_id = COALESCE($1, subject_id),
           code = COALESCE($2, code),
           name = COALESCE($3, name),
           description = COALESCE($4, description),
           hours = COALESCE($5, hours),
           is_active = COALESCE($6, is_active),
           linker_id = COALESCE($7, linker_id)
       WHERE id = $8
       RETURNING *`,
      [dto.subject_id, dto.code?.toUpperCase(), dto.name, dto.description, dto.hours, dto.is_active, dto.linker_id, id],
    );
    if (rows.length === 0) throw new NotFoundException('Topic not found');
    return rows[0];
  }

  async deleteTopic(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
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

  // ─── 5. COMPETENCY MASTER ──────────────────────────────────────────────────
  async listCompetencies(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT c.*, s.name as subject_name, s.code as subject_code, t.name as topic_name, t.code as topic_code, l.code as cbme_code, l.name as cbme_name
       FROM competencies c
       LEFT JOIN subjects s ON c.subject_id = s.id
       LEFT JOIN topics t ON c.topic_id = t.id
       LEFT JOIN professional_linkers l ON c.linker_id = l.id
       ORDER BY c.created_at DESC, c.code ASC`,
    );
  }

  async createCompetency(dto: CreateCompetencyMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO competencies (subject_id, topic_id, code, description, domain, level, is_core, is_active, linker_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING *`,
      [
        dto.subject_id || null,
        dto.topic_id || null,
        dto.code.toUpperCase(),
        dto.description,
        dto.domain || 'Knowledge',
        dto.level || 'Knows How',
        dto.is_core ?? true,
        dto.linker_id || null,
      ],
    );
    return rows[0];
  }

  async updateCompetency(id: string, dto: UpdateCompetencyMasterDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE competencies
       SET subject_id = COALESCE($1, subject_id),
           topic_id = COALESCE($2, topic_id),
           code = COALESCE($3, code),
           description = COALESCE($4, description),
           domain = COALESCE($5, domain),
           level = COALESCE($6, level),
           is_core = COALESCE($7, is_core),
           is_active = COALESCE($8, is_active),
           linker_id = COALESCE($9, linker_id)
       WHERE id = $10
       RETURNING *`,
      [
        dto.subject_id,
        dto.topic_id,
        dto.code?.toUpperCase(),
        dto.description,
        dto.domain,
        dto.level,
        dto.is_core,
        dto.is_active,
        dto.linker_id,
        id,
      ],
    );
    if (rows.length === 0) throw new NotFoundException('Competency not found');
    return rows[0];
  }

  async deleteCompetency(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM competencies WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Competency deleted successfully' };
  }

  // ─── 6. DELIVERY TYPES ─────────────────────────────────────────────────────
  async listDeliveryTypes(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM delivery_types ORDER BY code ASC`,
    );
  }

  async createDeliveryType(dto: CreateDeliveryTypeDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM delivery_types WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Delivery type deleted successfully' };
  }

  // ─── 7. SUBJECT OFFERINGS ──────────────────────────────────────────────────
  async listSubjectOfferings(tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    return this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT so.*, 
              s.name AS subject_name, s.code AS subject_code,
              p.name AS prof_name,
              dt.name AS dtype_name, dt.code AS dtype_code
       FROM subject_offerings so
       JOIN subjects s ON so.subject_id = s.id
       JOIN professional_phases p ON so.prof_id = p.id
       JOIN delivery_types dt ON so.dtype_id = dt.id
       ORDER BY s.name ASC, p.phase_order ASC, dt.code ASC`,
    );
  }

  async createSubjectOffering(dto: CreateSubjectOfferingDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    const existing = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id FROM subject_offerings 
       WHERE subject_id = $1 AND prof_id = $2 AND dtype_id = $3 AND batch_year = $4`,
      [dto.subject_id, dto.prof_id, dto.dtype_id, dto.batch_year],
    );
    if (existing.length > 0) {
      throw new BadRequestException('This subject offering mapping already exists.');
    }
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO subject_offerings (subject_id, prof_id, dtype_id, batch_year, hours_allotted, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [dto.subject_id, dto.prof_id, dto.dtype_id, dto.batch_year, dto.hours_allotted ?? 0],
    );
    return rows[0];
  }

  async updateSubjectOffering(id: string, dto: UpdateSubjectOfferingDto, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
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
      [dto.subject_id, dto.prof_id, dto.dtype_id, dto.batch_year, dto.hours_allotted, dto.is_active, id],
    );
    if (rows.length === 0) throw new NotFoundException('Subject offering not found');
    return rows[0];
  }

  async deleteSubjectOffering(id: string, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM subject_offerings WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Subject offering deleted successfully' };
  }

  // ─── 8. FACULTY SUBJECT LINKER ─────────────────────────────────────────────
  async listFacultySubjects(query: { facultyId?: string; subjectId?: string; departmentId?: string }, tenantSlug?: string) {
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
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
    const slug = this.resolveTenantSlug(tenantSlug);
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM faculty_subjects WHERE id = $1`,
      [id]
    );
    return { success: true, message: 'Faculty subject link removed successfully' };
  }
}
