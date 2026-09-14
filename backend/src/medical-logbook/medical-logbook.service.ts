import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateActivityMasterDto,
  UpdateActivityMasterDto,
  CreateSeminarMasterDto,
  UpdateSeminarMasterDto,
  SaveLogbookSessionDto,
  VerifyLogbookRecordDto,
  CreatePGLogbookRecordDto,
} from './dto/medical-logbook.dto';

@Injectable()
export class MedicalLogbookService {
  private readonly logger = new Logger(MedicalLogbookService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveSchema(slug: string): string {
    const resolved = this.tenantSchemaService.resolveTenantSlug(slug);
    return `tenant_${resolved}`;
  }

  // ===========================================================================
  // 1. LOOKUP SERVICES (9-LEVEL CASCADING CHAIN & MASTER DATA)
  // ===========================================================================

  /**
   * 1. Professional Phases (1st Prof, 2nd Prof, 3rd Prof Part I, 3rd Prof Part II)
   */
  async getProfessionals(slug: string, courseCode: string = 'MBBS') {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const isBams = courseCode.toUpperCase().includes('BAMS');
    const normalizedCourse = isBams ? 'BAMS' : 'MBBS';

    const rows = await this.dataSource.query(
      `SELECT DISTINCT ON (phase_order) id, name, course_cd, phase_order, academic_system
       FROM "${schema}".professional_phases
       WHERE is_active = true AND (course_cd = $1 OR course_cd IS NULL)
       ORDER BY phase_order ASC, name ASC`,
      [normalizedCourse],
    ).catch(() => []);

    if (rows.length === 0) {
      if (isBams) {
        return [
          { id: 'bams-prof-1', name: '1st Professional BAMS', course_cd: 'BAMS', phase_order: 1 },
          { id: 'bams-prof-2', name: '2nd Professional BAMS', course_cd: 'BAMS', phase_order: 2 },
          { id: 'bams-prof-3', name: '3rd Professional BAMS', course_cd: 'BAMS', phase_order: 3 },
          { id: 'bams-prof-4', name: 'Final Professional BAMS', course_cd: 'BAMS', phase_order: 4 },
        ];
      }
      return [
        { id: 'mbbs-prof-1', name: '1st Professional MBBS', course_cd: 'MBBS', phase_order: 1 },
        { id: 'mbbs-prof-2', name: '2nd Professional MBBS', course_cd: 'MBBS', phase_order: 2 },
        { id: 'mbbs-prof-3', name: '3rd Professional MBBS (Part I)', course_cd: 'MBBS', phase_order: 3 },
        { id: 'mbbs-prof-4', name: '3rd Professional MBBS (Part II)', course_cd: 'MBBS', phase_order: 4 },
      ];
    }
    return rows;
  }

  /**
   * 2. Courses (MBBS, BAMS, MD, MS, etc.)
   */
  async getCourses(slug: string, programLevel: 'UG' | 'PG' = 'UG') {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let typeCondition = programLevel === 'PG'
      ? `(type IN ('POSTGRADUATE', 'HEALTHCARE') OR code IN ('MD', 'MS', 'MD-MED', 'MS-SUR', 'DNB'))`
      : `(type IN ('MEDICAL', 'AYUSH', 'UNDERGRADUATE') OR code IN ('MBBS', 'BAMS', 'BDS', 'BHMS'))`;

    const rows = await this.dataSource.query(`
      SELECT id, code, name, type, duration_years
      FROM "${schema}".courses
      WHERE is_active = true AND ${typeCondition}
      ORDER BY code ASC
    `).catch(() => []);

    if (rows.length === 0) {
      if (programLevel === 'PG') {
        return [
          { id: 'md-med', code: 'MD-MED', name: 'Doctor of Medicine (General Medicine)', type: 'POSTGRADUATE', duration_years: 3 },
          { id: 'ms-sur', code: 'MS-SUR', name: 'Master of Surgery (General Surgery)', type: 'POSTGRADUATE', duration_years: 3 },
          { id: 'md-ped', code: 'MD-PED', name: 'Doctor of Medicine (Pediatrics)', type: 'POSTGRADUATE', duration_years: 3 },
          { id: 'md-radio', code: 'MD-RD', name: 'Doctor of Medicine (Radio-Diagnosis)', type: 'POSTGRADUATE', duration_years: 3 },
        ];
      }
      return [
        { id: 'mbbs', code: 'MBBS', name: 'Bachelor of Medicine and Bachelor of Surgery', type: 'MEDICAL', duration_years: 5 },
        { id: 'bams', code: 'BAMS', name: 'Bachelor of Ayurvedic Medicine and Surgery', type: 'AYUSH', duration_years: 5 },
      ];
    }
    return rows;
  }

  /**
   * 3. Branches / Departments
   */
  async getBranches(slug: string, courseId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, name, code, type, is_active
      FROM "${schema}".departments
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (courseId && courseId.toUpperCase().includes('BAMS')) {
      query += ` AND (type = 'AYUSH' OR code IN ('RAC', 'KRI', 'DRA', 'SAM', 'ANA', 'PHY'))`;
    }

    query += ` ORDER BY name ASC`;
    const rows = await this.dataSource.query(query, params).catch(() => []);
    if (rows.length === 0) {
      return [
        { id: 'dept-ana', code: 'ANAT', name: 'Department of Anatomy' },
        { id: 'dept-phy', code: 'PHYS', name: 'Department of Physiology' },
        { id: 'dept-bio', code: 'BIOC', name: 'Department of Biochemistry' },
        { id: 'dept-pat', code: 'PATH', name: 'Department of Pathology' },
        { id: 'dept-mic', code: 'MICR', name: 'Department of Microbiology' },
        { id: 'dept-pha', code: 'PHAR', name: 'Department of Pharmacology' },
        { id: 'dept-fsm', code: 'FSM',  name: 'Department of Forensic Medicine' },
        { id: 'dept-cm',  code: 'CM',   name: 'Department of Community Medicine' },
        { id: 'dept-med', code: 'MED',  name: 'Department of General Medicine' },
        { id: 'dept-sur', code: 'SURG', name: 'Department of General Surgery' },
        { id: 'dept-obg', code: 'OBG',  name: 'Department of Obstetrics & Gynecology' },
        { id: 'dept-ped', code: 'PED',  name: 'Department of Pediatrics' },
      ];
    }
    return rows;
  }

  /**
   * 4. Batches
   */
  async getBatches(slug: string, branchId?: string, courseId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, code, year, course_cd, department_id, is_active
      FROM "${schema}".batches
      WHERE is_active = true
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (courseId) {
      query += ` AND (course_cd ILIKE $${pIdx} OR course_cd IS NULL)`;
      params.push(`%${courseId}%`);
      pIdx++;
    }

    query += ` ORDER BY year DESC, code ASC`;
    const rows = await this.dataSource.query(query, params).catch(() => []);
    if (rows.length === 0) {
      const currentYear = new Date().getFullYear();
      return [
        { id: 'batch-2024', code: 'MBBS-2024', year: currentYear, course_cd: 'MBBS' },
        { id: 'batch-2023', code: 'MBBS-2023', year: currentYear - 1, course_cd: 'MBBS' },
        { id: 'batch-2022', code: 'MBBS-2022', year: currentYear - 2, course_cd: 'MBBS' },
        { id: 'batch-2021', code: 'MBBS-2021', year: currentYear - 3, course_cd: 'MBBS' },
      ];
    }
    return rows;
  }

  /**
   * 5. CBME Years (from professional_linkers)
   */
  async getCbmeYears(slug: string, professionalYearId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const rows = await this.dataSource.query(`
      SELECT id, code, name, academic_session, professional_phase
      FROM "${schema}".professional_linkers
      WHERE is_active = true
      ORDER BY name ASC
    `).catch(() => []);

    if (rows.length > 0) {
      return rows.map((l: any) => ({
        id: l.id,
        code: l.code || l.academic_session || 'CBME',
        name: l.name ? `${l.name} (${l.academic_session || l.code})` : (l.academic_session || l.code),
        academic_session: l.academic_session || l.code,
      }));
    }

    return [
      { id: 'cbme-2024', code: 'CBME-2024', name: 'CBME Curriculum 2024-25', academic_session: '2024-25' },
      { id: 'cbme-2023', code: 'CBME-2023', name: 'CBME Curriculum 2023-24', academic_session: '2023-24' },
      { id: 'cbme-2022', code: 'CBME-2022', name: 'CBME Curriculum 2022-23', academic_session: '2022-23' },
      { id: 'cbme-2021', code: 'CBME-2021', name: 'CBME Curriculum 2021-22', academic_session: '2021-22' },
    ];
  }

  /**
   * 6. Subjects (scoped to Professional Year or Department)
   */
  async getSubjects(slug: string, professionalYearId?: string, departmentId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, name, code, department_id, type
      FROM "${schema}".subjects
      WHERE is_active = true
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (departmentId) {
      query += ` AND (department_id = $${pIdx} OR department_id IS NULL)`;
      params.push(departmentId);
      pIdx++;
    }

    query += ` ORDER BY name ASC`;
    let rows = await this.dataSource.query(query, params).catch(() => []);

    // Filter by professional phase if professionalYearId is supplied
    if (professionalYearId && rows.length > 0) {
      const profStr = professionalYearId.toLowerCase();
      if (profStr.includes('1') || profStr.includes('first')) {
        const filtered = rows.filter((s: any) =>
          ['ANAT', 'PHYS', 'BIOC', 'ANA', 'PHY', 'BIO'].some(c => s.code?.toUpperCase().includes(c)) ||
          ['anatomy', 'physiology', 'biochemistry'].some(n => s.name?.toLowerCase().includes(n))
        );
        if (filtered.length > 0) return filtered;
      } else if (profStr.includes('2') || profStr.includes('second')) {
        const filtered = rows.filter((s: any) =>
          ['PATH', 'MICR', 'PHAR', 'PAT', 'MIC', 'PHA'].some(c => s.code?.toUpperCase().includes(c)) ||
          ['pathology', 'microbiology', 'pharmacology'].some(n => s.name?.toLowerCase().includes(n))
        );
        if (filtered.length > 0) return filtered;
      } else if (profStr.includes('part i') || profStr.includes('3-1') || profStr.includes('part-1')) {
        const filtered = rows.filter((s: any) =>
          ['CM', 'FSM', 'ENT', 'OPHTH', 'COMMUNITY', 'FORENSIC'].some(c => s.code?.toUpperCase().includes(c)) ||
          ['community medicine', 'forensic medicine', 'ophthalmology', 'ent'].some(n => s.name?.toLowerCase().includes(n))
        );
        if (filtered.length > 0) return filtered;
      }
    }

    if (rows.length === 0) {
      return [
        { id: 'sub-anat', code: 'ANAT', name: 'Anatomy' },
        { id: 'sub-phys', code: 'PHYS', name: 'Physiology' },
        { id: 'sub-bioc', code: 'BIOC', name: 'Biochemistry' },
        { id: 'sub-path', code: 'PATH', name: 'Pathology' },
        { id: 'sub-micr', code: 'MICR', name: 'Microbiology' },
        { id: 'sub-phar', code: 'PHAR', name: 'Pharmacology' },
        { id: 'sub-cm',   code: 'CM',   name: 'Community Medicine' },
        { id: 'sub-fsm',  code: 'FSM',  name: 'Forensic Medicine & Toxicology' },
        { id: 'sub-med',  code: 'MED',  name: 'General Medicine' },
        { id: 'sub-surg', code: 'SURG', name: 'General Surgery' },
        { id: 'sub-obg',  code: 'OBG',  name: 'Obstetrics & Gynaecology' },
        { id: 'sub-ped',  code: 'PED',  name: 'Paediatrics' },
      ];
    }
    return rows;
  }

  /**
   * 7. Units (scoped to Subject)
   */
  async getUnits(slug: string, subjectId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, subject_id,
             COALESCE(unit_number, 1) as unit_number,
             COALESCE(name, unit_name, code, 'Unit') as name,
             COALESCE(code, unit_code, '') as code,
             description
      FROM "${schema}".units
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (subjectId) {
      query += ` AND subject_id = $1`;
      params.push(subjectId);
    }

    query += ` ORDER BY unit_number ASC, name ASC`;
    const rows = await this.dataSource.query(query, params).catch(() => []);
    if (rows.length === 0 && subjectId) {
      return [
        { id: `${subjectId}-u1`, subject_id: subjectId, unit_number: 1, code: 'U1', name: 'Unit 1: General Principles & Fundamentals' },
        { id: `${subjectId}-u2`, subject_id: subjectId, unit_number: 2, code: 'U2', name: 'Unit 2: Systemic Studies & Organ Systems' },
        { id: `${subjectId}-u3`, subject_id: subjectId, unit_number: 3, code: 'U3', name: 'Unit 3: Clinical Applications & Pathology' },
      ];
    }
    return rows;
  }

  /**
   * 8. Topics (scoped to Unit or Subject)
   */
  async getTopics(slug: string, unitId?: string, subjectId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, subject_id, unit_id,
             COALESCE(code, '') as code,
             COALESCE(name, description, 'Topic') as name,
             description, hours
      FROM "${schema}".topics
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (unitId) {
      query += ` AND unit_id = $1`;
      params.push(unitId);
    } else if (subjectId) {
      query += ` AND subject_id = $1`;
      params.push(subjectId);
    }

    query += ` ORDER BY code ASC, name ASC`;
    const rows = await this.dataSource.query(query, params).catch(() => []);
    if (rows.length === 0 && (unitId || subjectId)) {
      const parentId = unitId || subjectId;
      return [
        { id: `${parentId}-t1`, unit_id: unitId, subject_id: subjectId, code: 'T1', name: 'Core Foundations & Mechanism' },
        { id: `${parentId}-t2`, unit_id: unitId, subject_id: subjectId, code: 'T2', name: 'Clinical Demonstration & Assessment' },
        { id: `${parentId}-t3`, unit_id: unitId, subject_id: subjectId, code: 'T3', name: 'Practical Procedures & Skill Station' },
      ];
    }
    return rows;
  }

  /**
   * 9. Competencies (Display: code — title/name)
   */
  async getCompetencies(slug: string, topicId?: string, subjectId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, subject_id, topic_id,
             COALESCE(code, '') as code,
             COALESCE(description, name, code) as description,
             COALESCE(name, description, code) as name,
             domain, level, is_core
      FROM "${schema}".competencies
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (topicId) {
      query += ` AND topic_id = $1`;
      params.push(topicId);
    } else if (subjectId) {
      query += ` AND subject_id = $1`;
      params.push(subjectId);
    }

    query += ` ORDER BY code ASC`;
    const rows = await this.dataSource.query(query, params).catch(() => []);

    if (rows.length > 0) {
      return rows.map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.name || c.description,
        name: c.name || c.description,
        description: c.description,
        displayText: `${c.code} — ${c.name || c.description}`,
      }));
    }

    return [
      { id: 'comp-1', code: 'PY1.1', title: 'Describe cell membrane structure, transport mechanisms and membrane potential', displayText: 'PY1.1 — Describe cell membrane structure, transport mechanisms and membrane potential' },
      { id: 'comp-2', code: 'PY1.2', title: 'Describe and demonstrate intercellular communication and secondary messengers', displayText: 'PY1.2 — Describe and demonstrate intercellular communication and secondary messengers' },
      { id: 'comp-3', code: 'AN1.1', title: 'Demonstrate normal anatomical position, planes, and general terms of direction', displayText: 'AN1.1 — Demonstrate normal anatomical position, planes, and general terms of direction' },
      { id: 'comp-4', code: 'BI1.1', title: 'Describe molecular structure of carbohydrates and their physiological roles', displayText: 'BI1.1 — Describe molecular structure of carbohydrates and their physiological roles' },
    ];
  }

  /**
   * Activity Types Master Lookup (Practical, Lab, Certificate, Skills, AETCOM, Vertical Integration, Orientation)
   */
  async getActivityTypes(slug: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    return await this.dataSource.query(
      `SELECT id, code, name, description, sort_order
       FROM "${schema}".medical_activity_types
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    ).catch(() => [
      { id: '1', code: 'PRACTICAL', name: 'Practical' },
      { id: '2', code: 'LAB', name: 'Lab' },
      { id: '3', code: 'CERTIFICATE', name: 'Certificate' },
      { id: '4', code: 'SKILLS', name: 'Skills' },
      { id: '5', code: 'AETCOM', name: 'AETCOM' },
      { id: '6', code: 'VERTICAL_INT', name: 'Vertical Integration' },
      { id: '7', code: 'ORIENTATION', name: 'Orientation' },
    ]);
  }

  /**
   * Status Rubrics Master Lookup (F, M, C)
   */
  async getStatusRubrics(slug: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    return await this.dataSource.query(
      `SELECT id, code, label, description, sort_order
       FROM "${schema}".medical_logbook_status_rubrics
       WHERE is_active = true
       ORDER BY sort_order ASC, code ASC`
    ).catch(() => [
      { id: 'c', code: 'C', label: 'Competent / Completed', description: 'Student has achieved competency' },
      { id: 'm', code: 'M', label: 'Meets Expectations / Moderate', description: 'Student is progressing satisfactorily' },
      { id: 'f', code: 'F', label: 'Follow-up Needed / Facilitated', description: 'Student requires repeat demonstration' },
    ]);
  }

  /**
   * Resolve Student Roster Group-Wise (Groups A, B, C, D)
   * Reuses existing groups_master, students, and student_admissions tables
   */
  async getStudentsByGroup(slug: string, groupId?: string, batchId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    // 1. Get all active groups for batch or college
    const groups = await this.dataSource.query(
      `SELECT id, code, name, capacity FROM "${schema}".groups_master WHERE is_active = true ORDER BY code ASC`
    ).catch(() => []);

    const effectiveGroups = groups.length > 0 ? groups : [
      { id: 'grp-a', code: 'A', name: 'Group A' },
      { id: 'grp-b', code: 'B', name: 'Group B' },
      { id: 'grp-c', code: 'C', name: 'Group C' },
      { id: 'grp-d', code: 'D', name: 'Group D' },
    ];

    const selectedGroupId = groupId || effectiveGroups[0]?.id;

    // 2. Query students linked to this group
    let studentRows = await this.dataSource.query(
      `SELECT s.id, s.rollno, s.registration_no, s.name, s.batch_cd,
              COALESCE(sa.group_code, g.code, 'A') as group_code,
              COALESCE(sa.group_name, g.name, 'Group A') as group_name
       FROM "${schema}".students s
       LEFT JOIN "${schema}".student_admissions sa ON sa.student_id = s.id
       LEFT JOIN "${schema}".groups_master g ON (g.id = s.group_id OR g.id = sa.group_id)
       WHERE (s.group_id::text = $1 OR sa.group_id::text = $1 OR g.code = $1 OR g.name = $1)
       ORDER BY s.rollno ASC, s.name ASC`,
      [String(selectedGroupId)],
    ).catch(() => []);

    // Fallback: If no group assignment yet, return sample or general students with default group assignment
    if (studentRows.length === 0) {
      const generalStudents = await this.dataSource.query(
        `SELECT id, rollno, registration_no, name, batch_cd FROM "${schema}".students ORDER BY rollno ASC LIMIT 30`
      ).catch(() => []);

      if (generalStudents.length > 0) {
        studentRows = generalStudents.map((st: any, idx: number) => ({
          ...st,
          group_code: effectiveGroups[idx % effectiveGroups.length]?.code || 'A',
          group_name: effectiveGroups[idx % effectiveGroups.length]?.name || 'Group A',
        }));
      } else {
        // Mock fallback for empty fresh database
        studentRows = [
          { id: 'stu-1', rollno: 'MBBS-001', registration_no: 'REG-2024-001', name: 'Aarav Sharma', group_code: 'A', group_name: 'Group A' },
          { id: 'stu-2', rollno: 'MBBS-002', registration_no: 'REG-2024-002', name: 'Diya Patel', group_code: 'A', group_name: 'Group A' },
          { id: 'stu-3', rollno: 'MBBS-003', registration_no: 'REG-2024-003', name: 'Rohan Verma', group_code: 'A', group_name: 'Group A' },
          { id: 'stu-4', rollno: 'MBBS-004', registration_no: 'REG-2024-004', name: 'Ananya Gupta', group_code: 'A', group_name: 'Group A' },
          { id: 'stu-5', rollno: 'MBBS-005', registration_no: 'REG-2024-005', name: 'Kabir Singh', group_code: 'A', group_name: 'Group A' },
        ];
      }
    }

    return {
      groups: effectiveGroups,
      selectedGroupId,
      students: studentRows,
    };
  }

  // ===========================================================================
  // 2. DATA DIRECTORY → ACTIVITY MASTER (CRUD + FILTERING)
  // ===========================================================================

  async createActivityMaster(slug: string, dto: CreateActivityMasterDto, user: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const userName = user?.name || user?.username || user?.email || 'Faculty';

    const rows = await this.dataSource.query(
      `INSERT INTO "${schema}".medical_activity_master (
        course_id, branch_id, batch_id, professional_year_id, cbme_year_id,
        subject_id, unit_id, topic_id, competency_id,
        activity_name, activity_type_id, activity_type_code, is_active,
        created_by, created_at, updated_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, NOW(), $13, NOW())
      RETURNING *`,
      [
        dto.course_id || null,
        dto.branch_id || null,
        dto.batch_id || null,
        dto.professional_year_id || null,
        dto.cbme_year_id || null,
        dto.subject_id || null,
        dto.unit_id || null,
        dto.topic_id || null,
        dto.competency_id || null,
        dto.activity_name.trim(),
        dto.activity_type_id || null,
        dto.activity_type_code || null,
        userName,
      ],
    );

    return rows[0];
  }

  async listActivityMaster(slug: string, query: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT am.*,
             COALESCE(at.name, am.activity_type_code, 'Practical') as activity_type_name,
             COALESCE(s.name, am.subject_id) as subject_name,
             COALESCE(c.code, am.competency_id) as competency_code,
             COALESCE(c.name, c.description, '') as competency_title,
             COALESCE(pp.name, am.professional_year_id) as professional_year_name
      FROM "${schema}".medical_activity_master am
      LEFT JOIN "${schema}".medical_activity_types at ON at.id = am.activity_type_id
      LEFT JOIN "${schema}".subjects s ON s.id::text = am.subject_id
      LEFT JOIN "${schema}".competencies c ON c.id::text = am.competency_id
      LEFT JOIN "${schema}".professional_phases pp ON pp.id::text = am.professional_year_id
      WHERE am.is_active = true
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (query.professionalYearId) {
      sql += ` AND am.professional_year_id = $${pIdx++}`;
      params.push(query.professionalYearId);
    }
    if (query.subjectId) {
      sql += ` AND am.subject_id = $${pIdx++}`;
      params.push(query.subjectId);
    }
    if (query.competencyId) {
      sql += ` AND am.competency_id = $${pIdx++}`;
      params.push(query.competencyId);
    }
    if (query.activityTypeId) {
      sql += ` AND (am.activity_type_id::text = $${pIdx} OR am.activity_type_code = $${pIdx})`;
      params.push(query.activityTypeId);
      pIdx++;
    }
    if (query.search && query.search.trim()) {
      sql += ` AND (am.activity_name ILIKE $${pIdx} OR c.code ILIKE $${pIdx})`;
      params.push(`%${query.search.trim()}%`);
      pIdx++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) sub`;
    const countRes = await this.dataSource.query(countSql, params);
    const total = parseInt(countRes[0]?.total, 10) || 0;

    sql += ` ORDER BY am.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(limit, offset);

    const items = await this.dataSource.query(sql, params);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateActivityMaster(slug: string, id: string, dto: UpdateActivityMasterDto, user: any) {
    const schema = this.resolveSchema(slug);
    const userName = user?.name || user?.username || 'Faculty';

    const updates: string[] = [];
    const params: any[] = [id];
    let pIdx = 2;

    if (dto.activity_name !== undefined) {
      updates.push(`activity_name = $${pIdx++}`);
      params.push(dto.activity_name.trim());
    }
    if (dto.activity_type_id !== undefined) {
      updates.push(`activity_type_id = $${pIdx++}`);
      params.push(dto.activity_type_id);
    }
    if (dto.activity_type_code !== undefined) {
      updates.push(`activity_type_code = $${pIdx++}`);
      params.push(dto.activity_type_code);
    }
    if (dto.is_active !== undefined) {
      updates.push(`is_active = $${pIdx++}`);
      params.push(dto.is_active);
    }

    if (updates.length === 0) {
      return { message: 'No changes supplied.' };
    }

    updates.push(`updated_by = $${pIdx++}`, `updated_at = NOW()`);
    params.push(userName);

    const rows = await this.dataSource.query(
      `UPDATE "${schema}".medical_activity_master SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params,
    );

    if (rows.length === 0) {
      throw new NotFoundException(`Activity Master with ID '${id}' not found.`);
    }
    return rows[0];
  }

  async deleteActivityMaster(slug: string, id: string) {
    const schema = this.resolveSchema(slug);
    const rows = await this.dataSource.query(
      `UPDATE "${schema}".medical_activity_master SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Activity Master with ID '${id}' not found.`);
    }
    return { success: true, message: 'Activity Master deleted successfully.' };
  }

  // ===========================================================================
  // 3. DATA DIRECTORY → SEMINAR MASTER (CRUD + FILTERING)
  // ===========================================================================

  async createSeminarMaster(slug: string, dto: CreateSeminarMasterDto, user: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const userName = user?.name || user?.username || 'Faculty';

    const rows = await this.dataSource.query(
      `INSERT INTO "${schema}".medical_seminar_master (
        course_id, branch_id, batch_id, professional_year_id, cbme_year_id,
        subject_id, unit_id, topic_id, competency_id,
        category, title, seminar_date, venue, presenter_name, remarks,
        is_active, created_by, created_at, updated_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, NOW(), $16, NOW())
      RETURNING *`,
      [
        dto.course_id || null,
        dto.branch_id || null,
        dto.batch_id || null,
        dto.professional_year_id || null,
        dto.cbme_year_id || null,
        dto.subject_id || null,
        dto.unit_id || null,
        dto.topic_id || null,
        dto.competency_id || null,
        dto.category.trim(),
        dto.title.trim(),
        dto.seminar_date || null,
        dto.venue || null,
        dto.presenter_name || null,
        dto.remarks || null,
        userName,
      ],
    );

    return rows[0];
  }

  async listSeminarMaster(slug: string, query: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT sm.*,
             COALESCE(s.name, sm.subject_id) as subject_name,
             COALESCE(c.code, sm.competency_id) as competency_code,
             COALESCE(pp.name, sm.professional_year_id) as professional_year_name
      FROM "${schema}".medical_seminar_master sm
      LEFT JOIN "${schema}".subjects s ON s.id::text = sm.subject_id
      LEFT JOIN "${schema}".competencies c ON c.id::text = sm.competency_id
      LEFT JOIN "${schema}".professional_phases pp ON pp.id::text = sm.professional_year_id
      WHERE sm.is_active = true
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (query.category) {
      sql += ` AND sm.category = $${pIdx++}`;
      params.push(query.category);
    }
    if (query.professionalYearId) {
      sql += ` AND sm.professional_year_id = $${pIdx++}`;
      params.push(query.professionalYearId);
    }
    if (query.search && query.search.trim()) {
      sql += ` AND (sm.title ILIKE $${pIdx} OR sm.presenter_name ILIKE $${pIdx})`;
      params.push(`%${query.search.trim()}%`);
      pIdx++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) sub`;
    const countRes = await this.dataSource.query(countSql, params);
    const total = parseInt(countRes[0]?.total, 10) || 0;

    sql += ` ORDER BY sm.seminar_date DESC NULLS LAST, sm.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(limit, offset);

    const items = await this.dataSource.query(sql, params);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateSeminarMaster(slug: string, id: string, dto: UpdateSeminarMasterDto, user: any) {
    const schema = this.resolveSchema(slug);
    const userName = user?.name || user?.username || 'Faculty';

    const updates: string[] = [];
    const params: any[] = [id];
    let pIdx = 2;

    if (dto.category !== undefined) { updates.push(`category = $${pIdx++}`); params.push(dto.category); }
    if (dto.title !== undefined) { updates.push(`title = $${pIdx++}`); params.push(dto.title); }
    if (dto.seminar_date !== undefined) { updates.push(`seminar_date = $${pIdx++}`); params.push(dto.seminar_date); }
    if (dto.venue !== undefined) { updates.push(`venue = $${pIdx++}`); params.push(dto.venue); }
    if (dto.presenter_name !== undefined) { updates.push(`presenter_name = $${pIdx++}`); params.push(dto.presenter_name); }
    if (dto.remarks !== undefined) { updates.push(`remarks = $${pIdx++}`); params.push(dto.remarks); }
    if (dto.is_active !== undefined) { updates.push(`is_active = $${pIdx++}`); params.push(dto.is_active); }

    if (updates.length === 0) return { message: 'No changes provided.' };

    updates.push(`updated_by = $${pIdx++}`, `updated_at = NOW()`);
    params.push(userName);

    const rows = await this.dataSource.query(
      `UPDATE "${schema}".medical_seminar_master SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params,
    );

    if (rows.length === 0) throw new NotFoundException(`Seminar Master with ID '${id}' not found.`);
    return rows[0];
  }

  async deleteSeminarMaster(slug: string, id: string) {
    const schema = this.resolveSchema(slug);
    const rows = await this.dataSource.query(
      `UPDATE "${schema}".medical_seminar_master SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException(`Seminar Master with ID '${id}' not found.`);
    return { success: true, message: 'Seminar Master deleted successfully.' };
  }

  // ===========================================================================
  // 4. UG LOGBOOK ENGINE (SESSION CREATION & IDEMPOTENT BULK UPSERT)
  // ===========================================================================

  /**
   * Populate step 4: Activity list based on Competency + Activity Type
   */
  async getActivitiesForLogbook(slug: string, competencyId?: string, activityTypeId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let sql = `
      SELECT am.id, am.activity_name, am.activity_type_id, am.competency_id,
             COALESCE(at.name, am.activity_type_code, 'Practical') as activity_type_name,
             c.code as competency_code, c.name as competency_title
      FROM "${schema}".medical_activity_master am
      LEFT JOIN "${schema}".medical_activity_types at ON at.id = am.activity_type_id
      LEFT JOIN "${schema}".competencies c ON c.id::text = am.competency_id
      WHERE am.is_active = true
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (competencyId) {
      sql += ` AND am.competency_id = $${pIdx++}`;
      params.push(competencyId);
    }
    if (activityTypeId) {
      sql += ` AND (am.activity_type_id::text = $${pIdx} OR am.activity_type_code = $${pIdx})`;
      params.push(activityTypeId);
      pIdx++;
    }

    sql += ` ORDER BY am.created_at DESC`;
    const rows = await this.dataSource.query(sql, params).catch(() => []);

    if (rows.length === 0) {
      return [
        { id: 'act-sample-1', activity_name: 'Staining and Microscopic Examination of Peripheral Blood Smear', activity_type_name: 'Practical' },
        { id: 'act-sample-2', activity_name: 'Determination of Blood Pressure by Palpatory and Auscultatory Methods', activity_type_name: 'Practical' },
        { id: 'act-sample-3', activity_name: 'Recording of 12-Lead Electrocardiogram (ECG) and Interpretation', activity_type_name: 'Skills' },
      ];
    }
    return rows;
  }

  /**
   * Atomic Idempotent Bulk Save: Saves session and all student records
   */
  async saveLogbookSession(slug: string, dto: SaveLogbookSessionDto, user: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const userName = user?.name || user?.username || 'Faculty';
    const runner: QueryRunner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      let sessionId = dto.session_id;

      // 1. Create or update session
      if (sessionId) {
        await runner.query(
          `UPDATE "${schema}".medical_logbook_sessions
           SET session_date = $1, group_id = $2, group_name = $3,
               activity_master_id = $4, activity_type_id = $5,
               professional_year_id = $6, subject_id = $7, program_level = $8,
               updated_at = NOW()
           WHERE id = $9`,
          [
            dto.session_date,
            dto.group_id,
            dto.group_name || `Group ${dto.group_id}`,
            dto.activity_master_id || null,
            dto.activity_type_id || null,
            dto.professional_year_id || null,
            dto.subject_id || null,
            dto.program_level || 'UG',
            sessionId,
          ],
        );
      } else {
        const sessionRows = await runner.query(
          `INSERT INTO "${schema}".medical_logbook_sessions (
             session_date, group_id, group_name, activity_master_id, activity_type_id,
             professional_year_id, subject_id, program_level, created_by, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           RETURNING id`,
          [
            dto.session_date,
            dto.group_id,
            dto.group_name || `Group ${dto.group_id}`,
            dto.activity_master_id || null,
            dto.activity_type_id || null,
            dto.professional_year_id || null,
            dto.subject_id || null,
            dto.program_level || 'UG',
            userName,
          ],
        );
        sessionId = sessionRows[0].id;
      }

      // 2. Bulk upsert per student row
      for (const st of dto.students) {
        const recordStatus = st.record_status || 'Pending';
        await runner.query(
          `INSERT INTO "${schema}".medical_logbook_student_records (
             session_id, student_id, rollno, student_name,
             status_code, remarks, score, record_status, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT (session_id, student_id) DO UPDATE SET
             rollno = COALESCE(EXCLUDED.rollno, "${schema}".medical_logbook_student_records.rollno),
             student_name = COALESCE(EXCLUDED.student_name, "${schema}".medical_logbook_student_records.student_name),
             status_code = EXCLUDED.status_code,
             remarks = EXCLUDED.remarks,
             score = EXCLUDED.score,
             record_status = EXCLUDED.record_status,
             updated_at = NOW()`,
          [
            sessionId,
            st.student_id,
            st.rollno || null,
            st.student_name || null,
            st.status_code || 'C',
            st.remarks || null,
            st.score !== undefined ? st.score : null,
            recordStatus,
          ],
        );
      }

      await runner.commitTransaction();

      this.logger.log(`Saved logbook session ${sessionId} with ${dto.students.length} student records for tenant ${slug}`);

      return {
        success: true,
        sessionId,
        savedCount: dto.students.length,
        message: 'Logbook session and student evaluations saved successfully.',
      };
    } catch (err: any) {
      await runner.rollbackTransaction();
      this.logger.error(`Failed to save logbook session for ${slug}: ${err.message}`, err.stack);
      throw err;
    } finally {
      await runner.release();
    }
  }

  // ===========================================================================
  // 5. PENDING / VERIFIED / ABSENT FILTER TABLE & VERIFICATION
  // ===========================================================================

  /**
   * Filter table backed by medical_logbook_student_records + medical_logbook_sessions
   */
  async listLogbookRecords(slug: string, query: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    let whereClause = `WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (query.status && query.status !== 'ALL') {
      whereClause += ` AND sr.record_status = $${pIdx++}`;
      params.push(query.status);
    }
    if (query.professionalYearId) {
      whereClause += ` AND ls.professional_year_id = $${pIdx++}`;
      params.push(query.professionalYearId);
    }
    if (query.subjectId) {
      whereClause += ` AND ls.subject_id = $${pIdx++}`;
      params.push(query.subjectId);
    }
    if (query.groupId) {
      whereClause += ` AND ls.group_id = $${pIdx++}`;
      params.push(query.groupId);
    }
    if (query.fromDate) {
      whereClause += ` AND ls.session_date >= $${pIdx++}`;
      params.push(query.fromDate);
    }
    if (query.toDate) {
      whereClause += ` AND ls.session_date <= $${pIdx++}`;
      params.push(query.toDate);
    }
    if (query.search && query.search.trim()) {
      whereClause += ` AND (sr.student_name ILIKE $${pIdx} OR sr.rollno ILIKE $${pIdx} OR am.activity_name ILIKE $${pIdx})`;
      params.push(`%${query.search.trim()}%`);
      pIdx++;
    }

    const baseSql = `
      FROM "${schema}".medical_logbook_student_records sr
      JOIN "${schema}".medical_logbook_sessions ls ON ls.id = sr.session_id
      LEFT JOIN "${schema}".medical_activity_master am ON am.id = ls.activity_master_id
      LEFT JOIN "${schema}".medical_activity_types at ON at.id = ls.activity_type_id
      LEFT JOIN "${schema}".subjects s ON s.id::text = ls.subject_id
      LEFT JOIN "${schema}".competencies c ON c.id::text = am.competency_id
      LEFT JOIN "${schema}".professional_phases pp ON pp.id::text = ls.professional_year_id
      ${whereClause}
    `;

    // Counts by status badge
    const countsSql = `
      SELECT
        COUNT(*) FILTER (WHERE sr.record_status = 'Pending') as pending_count,
        COUNT(*) FILTER (WHERE sr.record_status = 'Verified') as verified_count,
        COUNT(*) FILTER (WHERE sr.record_status = 'Absent') as absent_count,
        COUNT(*) as total_count
      FROM "${schema}".medical_logbook_student_records sr
      JOIN "${schema}".medical_logbook_sessions ls ON ls.id = sr.session_id
      LEFT JOIN "${schema}".medical_activity_master am ON am.id = ls.activity_master_id
      ${query.professionalYearId ? `WHERE ls.professional_year_id = '${query.professionalYearId}'` : ''}
    `;

    const [countData] = await this.dataSource.query(countsSql).catch(() => [{
      pending_count: 0, verified_count: 0, absent_count: 0, total_count: 0,
    }]);

    const totalFiltered = parseInt(
      (await this.dataSource.query(`SELECT COUNT(*) as cnt ${baseSql}`, params))[0]?.cnt,
      10,
    ) || 0;

    const selectSql = `
      SELECT sr.id as record_id, sr.session_id, sr.student_id, sr.rollno, sr.student_name,
             sr.status_code, sr.remarks, sr.score, sr.record_status, sr.verified_by, sr.verified_at,
             sr.created_at,
             ls.session_date, ls.group_id, ls.group_name,
             COALESCE(am.activity_name, 'Clinical Evaluation') as activity_name,
             COALESCE(at.name, 'Practical') as activity_type_name,
             COALESCE(s.name, ls.subject_id) as subject_name,
             COALESCE(c.code, '') as competency_code,
             COALESCE(c.name, c.description, '') as competency_title,
             COALESCE(pp.name, ls.professional_year_id) as professional_year_name
      ${baseSql}
      ORDER BY ls.session_date DESC, sr.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;
    params.push(limit, offset);

    const items = await this.dataSource.query(selectSql, params);

    return {
      items,
      total: totalFiltered,
      page,
      limit,
      totalPages: Math.ceil(totalFiltered / limit),
      counts: {
        pending: parseInt(countData.pending_count, 10) || 0,
        verified: parseInt(countData.verified_count, 10) || 0,
        absent: parseInt(countData.absent_count, 10) || 0,
        total: parseInt(countData.total_count, 10) || 0,
      },
    };
  }

  /**
   * Faculty/Admin action to verify a student record
   */
  async verifyStudentRecord(slug: string, recordId: string, dto: VerifyLogbookRecordDto, user: any) {
    const schema = this.resolveSchema(slug);
    const userName = user?.name || user?.username || 'Faculty Admin';
    const targetStatus = dto.record_status || 'Verified';

    const rows = await this.dataSource.query(
      `UPDATE "${schema}".medical_logbook_student_records
       SET record_status = $1,
           verified_by = $2,
           verified_at = NOW(),
           remarks = COALESCE($3, remarks),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [targetStatus, userName, dto.remarks || null, recordId],
    );

    if (rows.length === 0) {
      throw new NotFoundException(`Logbook student record '${recordId}' not found.`);
    }

    return {
      success: true,
      record: rows[0],
      message: `Record successfully updated to '${targetStatus}'.`,
    };
  }

  // ===========================================================================
  // 6. PG LOGBOOK (STANDALONE POST-GRADUATE ENGINE)
  // ===========================================================================

  async createPGLogRecord(slug: string, dto: CreatePGLogbookRecordDto, user: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const userName = user?.name || user?.username || 'PG Faculty';

    const rows = await this.dataSource.query(
      `INSERT INTO "${schema}".medical_pg_logbook_records (
        student_id, student_name, rollno, pg_year, department_id,
        category, title, case_date, patient_details, procedure_type,
        faculty_id, faculty_name, score, remarks, record_status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Pending', NOW(), NOW())
      RETURNING *`,
      [
        dto.student_id || user?.id || null,
        dto.student_name || user?.name || 'PG Resident',
        dto.rollno || null,
        dto.pg_year,
        dto.department_id || null,
        dto.category,
        dto.title.trim(),
        dto.case_date,
        dto.patient_details || null,
        dto.procedure_type || 'Performed Under Supervision',
        dto.faculty_id || null,
        dto.faculty_name || userName,
        dto.score !== undefined ? dto.score : null,
        dto.remarks || null,
      ],
    );

    return rows[0];
  }

  async listPGLogRecords(slug: string, query: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT pg.*,
             COALESCE(d.name, pg.department_id) as department_name
      FROM "${schema}".medical_pg_logbook_records pg
      LEFT JOIN "${schema}".departments d ON d.id::text = pg.department_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIdx = 1;

    if (query.pgYear) {
      sql += ` AND pg.pg_year = $${pIdx++}`;
      params.push(query.pgYear);
    }
    if (query.category) {
      sql += ` AND pg.category = $${pIdx++}`;
      params.push(query.category);
    }
    if (query.recordStatus) {
      sql += ` AND pg.record_status = $${pIdx++}`;
      params.push(query.recordStatus);
    }
    if (query.search && query.search.trim()) {
      sql += ` AND (pg.title ILIKE $${pIdx} OR pg.student_name ILIKE $${pIdx} OR pg.rollno ILIKE $${pIdx})`;
      params.push(`%${query.search.trim()}%`);
      pIdx++;
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) sub`;
    const countRes = await this.dataSource.query(countSql, params);
    const total = parseInt(countRes[0]?.total, 10) || 0;

    sql += ` ORDER BY pg.case_date DESC, pg.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(limit, offset);

    const items = await this.dataSource.query(sql, params);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async verifyPGLogRecord(slug: string, recordId: string, user: any) {
    const schema = this.resolveSchema(slug);
    const userName = user?.name || user?.username || 'HOD / Guide';

    const rows = await this.dataSource.query(
      `UPDATE "${schema}".medical_pg_logbook_records
       SET record_status = 'Verified',
           verified_by = $1,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [userName, recordId],
    );

    if (rows.length === 0) {
      throw new NotFoundException(`PG logbook record '${recordId}' not found.`);
    }

    return {
      success: true,
      record: rows[0],
      message: 'PG logbook record successfully verified.',
    };
  }
}
