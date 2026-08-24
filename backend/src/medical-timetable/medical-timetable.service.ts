import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateMedicalScheduleDto, UpdateMedicalScheduleDto } from './dto/medical-timetable.dto';

@Injectable()
export class MedicalTimetableService {
  private readonly logger = new Logger(MedicalTimetableService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private resolveSchema(slug: string): string {
    const resolved = this.tenantSchemaService.resolveTenantSlug(slug);
    return `tenant_${resolved}`;
  }

  /**
   * Validate that the requested tenant is authorized for Medical Timetable module
   */
  async validateTenantMedicalAccess(slug: string): Promise<void> {
    const resolved = this.tenantSchemaService.resolveTenantSlug(slug);
    const firm = await this.dataSource.query(
      `SELECT firm_mode, timetable_module_type FROM public.firms WHERE LOWER(slug) = $1 LIMIT 1`,
      [resolved.toLowerCase()],
    );

    if (firm.length > 0) {
      const mode = firm[0].firm_mode;
      const ttModule = firm[0].timetable_module_type;
      if (ttModule === 'ENGINEERING' && mode !== 'MED' && !resolved.includes('ims') && !resolved.includes('med')) {
        throw new ForbiddenException(
          `Tenant '${resolved}' is configured for the Engineering Timetable module. Medical Timetable is disabled for this institution.`,
        );
      }
    }
  }

  /**
   * 1. Cascading Hierarchy: Courses (MBBS, BAMS, MD, MS)
   */
  async getCourses(slug: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const rows = await this.dataSource.query(`
      SELECT id, code, name, type, duration_years
      FROM "${schema}".courses
      WHERE is_active = true AND (type IN ('MEDICAL', 'AYUSH', 'POSTGRADUATE', 'HEALTHCARE') OR code IN ('MBBS', 'BAMS', 'MD-MED', 'MS-SUR'))
      ORDER BY code ASC
    `);

    if (rows.length === 0) {
      return [
        { id: 'mbbs', code: 'MBBS', name: 'Bachelor of Medicine and Bachelor of Surgery', type: 'MEDICAL', duration_years: 5 },
        { id: 'bams', code: 'BAMS', name: 'Bachelor of Ayurvedic Medicine and Surgery', type: 'AYUSH', duration_years: 5 },
        { id: 'md-med', code: 'MD-MED', name: 'Doctor of Medicine (General Medicine)', type: 'POSTGRADUATE', duration_years: 3 },
      ];
    }
    return rows;
  }

  /**
   * 2. Cascading Hierarchy: Departments (scoped to course or medical hierarchy)
   */
  async getDepartments(slug: string, courseId?: string) {
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
    const rows = await this.dataSource.query(query, params);
    return rows;
  }

  /**
   * 3. Cascading Hierarchy: Professional Years (1st Prof, 2nd Prof, Final Prof)
   */
  async getProfessionalYears(slug: string, courseCode: string = 'MBBS', departmentId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const normalizedCourse = courseCode.toUpperCase().includes('BAMS') ? 'BAMS' : 'MBBS';

    const rows = await this.dataSource.query(
      `SELECT id, name, course_cd, phase_order, academic_system
       FROM "${schema}".professional_phases
       WHERE is_active = true AND (course_cd = $1 OR course_cd IS NULL)
       ORDER BY phase_order ASC`,
      [normalizedCourse],
    );

    if (rows.length === 0) {
      if (normalizedCourse === 'BAMS') {
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
   * 4. Cascading Hierarchy: Subjects & Linked Subjects (scoped to department)
   */
  async getSubjects(slug: string, departmentId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `SELECT id, name, code, department_id, type FROM "${schema}".subjects WHERE is_active = true`;
    const params: any[] = [];

    if (departmentId) {
      query += ` AND (department_id = $1 OR department_id IS NULL)`;
      params.push(departmentId);
    }

    query += ` ORDER BY name ASC`;
    const rows = await this.dataSource.query(query, params);
    return rows;
  }

  /**
   * 5. Cascading Hierarchy: Units (scoped to Subject)
   */
  async getUnits(slug: string, subjectId?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, subject_id, COALESCE(unit_number, 1) as unit_number,
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
    return await this.dataSource.query(query, params);
  }

  /**
   * 6. Cascading Hierarchy: Topics (scoped to Unit or Subject)
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
    return await this.dataSource.query(query, params);
  }

  /**
   * 7. Cascading Hierarchy: Competencies (scoped to Topic or Subject)
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
    return await this.dataSource.query(query, params);
  }

  /**
   * 8. Department-wise Faculty Autocomplete List
   */
  async getFaculty(slug: string, departmentId?: string, search?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT id, name, emp_id, email, designation, department_id, qualification, phone
      FROM "${schema}".faculty
      WHERE is_active = true
    `;
    const params: any[] = [];
    let pIndex = 1;

    if (departmentId) {
      query += ` AND (department_id = $${pIndex} OR department_id IS NULL)`;
      params.push(departmentId);
      pIndex++;
    }

    if (search && search.trim()) {
      query += ` AND (name ILIKE $${pIndex} OR emp_id ILIKE $${pIndex} OR email ILIKE $${pIndex})`;
      params.push(`%${search.trim()}%`);
      pIndex++;
    }

    query += ` ORDER BY name ASC LIMIT 50`;
    return await this.dataSource.query(query, params);
  }

  /**
   * Helper: Convert "08:30" or "08:30:00" to minutes from midnight
   */
  private timeToMinutes(t: string): number {
    if (!t) return 0;
    const parts = t.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  /**
   * Server-Side Atomic Faculty Conflict Validator
   * Checks whether a faculty member is already scheduled in ANY department, ANY timetable module at overlapping time
   */
  async checkFacultyConflict(
    slug: string,
    facultyId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeEntryId?: string,
  ): Promise<{ hasConflict: boolean; conflictMessage?: string }> {
    if (!facultyId) return { hasConflict: false };

    const schema = this.resolveSchema(slug);
    const startMin = this.timeToMinutes(startTime);
    const endMin = this.timeToMinutes(endTime);

    // 1. Check in medical_schedule_entries
    let medQuery = `
      SELECT id, department_name, professional_year_name, subject_name, day_of_week, start_time, end_time, faculty_name
      FROM "${schema}".medical_schedule_entries
      WHERE faculty_id = $1 AND day_of_week = $2
    `;
    const medParams: any[] = [facultyId, dayOfWeek];

    if (excludeEntryId) {
      medQuery += ` AND id != $3`;
      medParams.push(excludeEntryId);
    }

    const medEntries = await this.dataSource.query(medQuery, medParams);
    for (const entry of medEntries) {
      const eStart = this.timeToMinutes(entry.start_time);
      const eEnd = this.timeToMinutes(entry.end_time);

      // Overlap condition: start < eEnd && end > eStart
      if (startMin < eEnd && endMin > eStart) {
        const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dName = dayNames[dayOfWeek] || `Day ${dayOfWeek}`;
        return {
          hasConflict: true,
          conflictMessage: `Faculty ${entry.faculty_name || 'Dr.'} is already scheduled for ${entry.subject_name || 'Class'} (${entry.department_name || 'Department'}, ${entry.professional_year_name || 'Batch'}) on ${dName} from ${entry.start_time} to ${entry.end_time}.`,
        };
      }
    }

    // 2. Check in legacy / engineering timetable_slots for cross-module double-booking
    try {
      const legacyQuery = `
        SELECT ts.id, ts.day_of_week, ts.start_time, ts.end_time, s.name as subject_name, d.name as department_name, f.name as faculty_name
        FROM "${schema}".timetable_slots ts
        LEFT JOIN "${schema}".subjects s ON s.id = ts.subject_id
        LEFT JOIN "${schema}".departments d ON d.id = ts.department_id
        LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
        WHERE ts.faculty_id = $1 AND ts.day_of_week = $2
      `;
      const legacyEntries = await this.dataSource.query(legacyQuery, [facultyId, dayOfWeek]);
      for (const entry of legacyEntries) {
        const eStart = this.timeToMinutes(String(entry.start_time));
        const eEnd = this.timeToMinutes(String(entry.end_time));

        if (startMin < eEnd && endMin > eStart) {
          const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const dName = dayNames[dayOfWeek] || `Day ${dayOfWeek}`;
          return {
            hasConflict: true,
            conflictMessage: `Faculty ${entry.faculty_name || 'Dr.'} is already booked in Engineering/Core module for ${entry.subject_name || 'Session'} on ${dName} from ${entry.start_time} to ${entry.end_time}.`,
          };
        }
      }
    } catch {
      // Ignore if table missing
    }

    return { hasConflict: false };
  }

  /**
   * 9. Fetch Medical Schedule for specific Department & Professional Year
   */
  async getSchedule(slug: string, departmentId?: string, professionalYearId?: string, date?: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let query = `
      SELECT 
        id, course_id, course_name, department_id, department_name,
        professional_year_id, professional_year_name,
        subject_id, subject_name, linked_subject_id, linked_subject_name,
        faculty_id, faculty_name, faculty_emp_id,
        unit_id, unit_name, topic_id, topic_name,
        competency_ids, competency_codes, room,
        day_of_week, start_time, end_time, session_type, delivery_type_id,
        notes, created_at, updated_at
      FROM "${schema}".medical_schedule_entries
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIndex = 1;

    if (departmentId) {
      query += ` AND department_id = $${pIndex}`;
      params.push(departmentId);
      pIndex++;
    }

    if (professionalYearId) {
      query += ` AND professional_year_id = $${pIndex}`;
      params.push(professionalYearId);
      pIndex++;
    }

    query += ` ORDER BY day_of_week ASC, start_time ASC`;
    return await this.dataSource.query(query, params);
  }

  /**
   * 10. Admin "Monitor All Departments" View
   */
  async getAllDepartmentsSchedule(slug: string) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const rows = await this.dataSource.query(`
      SELECT 
        id, course_id, course_name, department_id, department_name,
        professional_year_id, professional_year_name,
        subject_id, subject_name, linked_subject_id, linked_subject_name,
        faculty_id, faculty_name, faculty_emp_id,
        unit_id, unit_name, topic_id, topic_name,
        competency_ids, competency_codes, room,
        day_of_week, start_time, end_time, session_type, delivery_type_id,
        notes, created_at, updated_at
      FROM "${schema}".medical_schedule_entries
      ORDER BY department_name ASC, day_of_week ASC, start_time ASC
    `);

    return rows;
  }

  /**
   * 11. Faculty Schedule View ("My Schedule")
   */
  async getMySchedule(slug: string, user: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const facultyId = user.faculty_id || user.id;
    const empId = user.emp_id || user.username;
    const userName = user.name || user.username || '';

    const rows = await this.dataSource.query(
      `SELECT 
        id, course_id, course_name, department_id, department_name,
        professional_year_id, professional_year_name,
        subject_id, subject_name, linked_subject_id, linked_subject_name,
        faculty_id, faculty_name, faculty_emp_id,
        unit_id, unit_name, topic_id, topic_name,
        competency_ids, competency_codes, room,
        day_of_week, start_time, end_time, session_type, delivery_type_id,
        notes, created_at, updated_at
      FROM "${schema}".medical_schedule_entries
      WHERE faculty_id = $1 OR faculty_emp_id = $2 OR faculty_name ILIKE $3
      ORDER BY day_of_week ASC, start_time ASC`,
      [facultyId, empId, `%${userName}%`],
    );

    return rows;
  }

  /**
   * 12. Student Schedule View (Auto-scoped to Department + Professional Year)
   */
  async getStudentSchedule(slug: string, user: any) {
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    let departmentId = user.department_id;
    let profYearId = user.professional_phase_id || user.batch_id;

    // Try finding student's department and phase from student admission records if not in token
    if (!departmentId || !profYearId) {
      try {
        const studentInfo = await this.dataSource.query(
          `SELECT sa.branch_id, sa.professional_id, sa.course_code 
           FROM "${schema}".student_admissions sa 
           JOIN "${schema}".students s ON s.id = sa.student_id 
           WHERE s.user_id = $1 OR s.rollno = $2 OR s.registration_no = $2
           LIMIT 1`,
          [user.id, user.username],
        );
        if (studentInfo.length > 0) {
          departmentId = departmentId || studentInfo[0].branch_id;
          profYearId = profYearId || studentInfo[0].professional_id;
        }
      } catch {}
    }

    let query = `
      SELECT 
        id, course_id, course_name, department_id, department_name,
        professional_year_id, professional_year_name,
        subject_id, subject_name, linked_subject_id, linked_subject_name,
        faculty_id, faculty_name, faculty_emp_id,
        unit_id, unit_name, topic_id, topic_name,
        competency_ids, competency_codes, room,
        day_of_week, start_time, end_time, session_type, delivery_type_id,
        notes, created_at, updated_at
      FROM "${schema}".medical_schedule_entries
      WHERE 1=1
    `;
    const params: any[] = [];
    let pIndex = 1;

    if (departmentId) {
      query += ` AND (department_id = $${pIndex} OR department_id IS NULL)`;
      params.push(departmentId);
      pIndex++;
    }

    if (profYearId) {
      query += ` AND (professional_year_id = $${pIndex} OR professional_year_id IS NULL)`;
      params.push(profYearId);
      pIndex++;
    }

    query += ` ORDER BY day_of_week ASC, start_time ASC`;
    return await this.dataSource.query(query, params);
  }

  /**
   * 13. Create Medical Schedule Entry
   */
  async createSchedule(slug: string, dto: CreateMedicalScheduleDto, user: any) {
    await this.validateTenantMedicalAccess(slug);
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    // 1. Conflict check
    if (dto.facultyId) {
      const conflict = await this.checkFacultyConflict(
        slug,
        dto.facultyId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
      );
      if (conflict.hasConflict) {
        throw new ConflictException(conflict.conflictMessage);
      }
    }

    // 2. Resolve Names if not provided in DTO
    let departmentName = dto.departmentName;
    if (!departmentName && dto.departmentId) {
      const dept = await this.dataSource.query(
        `SELECT name FROM "${schema}".departments WHERE id = $1 LIMIT 1`,
        [dto.departmentId],
      );
      departmentName = dept[0]?.name || 'Medical Department';
    }

    let profName = dto.professionalYearName;
    if (!profName && dto.professionalYearId) {
      const prof = await this.dataSource.query(
        `SELECT name FROM "${schema}".professional_phases WHERE id = $1 LIMIT 1`,
        [dto.professionalYearId],
      );
      profName = prof[0]?.name || '1st Professional MBBS';
    }

    let subjectName = dto.subjectName;
    if (!subjectName && dto.subjectId) {
      const sub = await this.dataSource.query(
        `SELECT name FROM "${schema}".subjects WHERE id = $1 LIMIT 1`,
        [dto.subjectId],
      );
      subjectName = sub[0]?.name || 'Medical Subject';
    }

    let linkedSubjectName = dto.linkedSubjectName;
    if (!linkedSubjectName && dto.linkedSubjectId) {
      const lsub = await this.dataSource.query(
        `SELECT name FROM "${schema}".subjects WHERE id = $1 LIMIT 1`,
        [dto.linkedSubjectId],
      );
      linkedSubjectName = lsub[0]?.name;
    }

    let facultyName = dto.facultyName;
    let facultyEmpId = dto.facultyEmpId;
    if ((!facultyName || !facultyEmpId) && dto.facultyId) {
      const fac = await this.dataSource.query(
        `SELECT name, emp_id FROM "${schema}".faculty WHERE id = $1 LIMIT 1`,
        [dto.facultyId],
      );
      facultyName = facultyName || fac[0]?.name;
      facultyEmpId = facultyEmpId || fac[0]?.emp_id;
    }

    let unitName = dto.unitName;
    if (!unitName && dto.unitId) {
      const u = await this.dataSource.query(
        `SELECT name FROM "${schema}".units WHERE id = $1 LIMIT 1`,
        [dto.unitId],
      );
      unitName = u[0]?.name;
    }

    let topicName = dto.topicName;
    if (!topicName && dto.topicId) {
      const t = await this.dataSource.query(
        `SELECT name FROM "${schema}".topics WHERE id = $1 LIMIT 1`,
        [dto.topicId],
      );
      topicName = t[0]?.name;
    }

    // Insert entry
    const insertRes = await this.dataSource.query(
      `INSERT INTO "${schema}".medical_schedule_entries (
        course_id, course_name, department_id, department_name,
        professional_year_id, professional_year_name,
        subject_id, subject_name, linked_subject_id, linked_subject_name,
        faculty_id, faculty_name, faculty_emp_id,
        unit_id, unit_name, topic_id, topic_name,
        competency_ids, competency_codes, room,
        day_of_week, start_time, end_time, session_type, delivery_type_id,
        notes, created_by, updated_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $27, NOW(), NOW()
      ) RETURNING *`,
      [
        dto.courseId || 'MBBS',
        dto.courseName || 'MBBS',
        dto.departmentId,
        departmentName,
        dto.professionalYearId,
        profName,
        dto.subjectId,
        subjectName,
        dto.linkedSubjectId || null,
        linkedSubjectName || null,
        dto.facultyId || null,
        facultyName || null,
        facultyEmpId || null,
        dto.unitId || null,
        unitName || null,
        dto.topicId || null,
        topicName || null,
        JSON.stringify(dto.competencyIds || []),
        dto.competencyCodes || null,
        dto.room || 'LH-1',
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
        dto.sessionType || 'Lecture',
        dto.deliveryTypeId || null,
        dto.notes || null,
        user.id || null,
      ],
    );

    return insertRes[0];
  }

  /**
   * 14. Update Medical Schedule Entry
   */
  async updateSchedule(slug: string, id: string, dto: UpdateMedicalScheduleDto, user: any) {
    await this.validateTenantMedicalAccess(slug);
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const existing = await this.dataSource.query(
      `SELECT * FROM "${schema}".medical_schedule_entries WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (existing.length === 0) {
      throw new NotFoundException(`Schedule entry with ID '${id}' not found.`);
    }

    // Conflict check (excluding current entry id)
    if (dto.facultyId) {
      const conflict = await this.checkFacultyConflict(
        slug,
        dto.facultyId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
        id,
      );
      if (conflict.hasConflict) {
        throw new ConflictException(conflict.conflictMessage);
      }
    }

    // Resolve Names if not provided in DTO
    let departmentName = dto.departmentName;
    if (!departmentName && dto.departmentId) {
      const dept = await this.dataSource.query(
        `SELECT name FROM "${schema}".departments WHERE id = $1 LIMIT 1`,
        [dto.departmentId],
      );
      departmentName = dept[0]?.name || existing[0].department_name;
    }

    let profName = dto.professionalYearName;
    if (!profName && dto.professionalYearId) {
      const prof = await this.dataSource.query(
        `SELECT name FROM "${schema}".professional_phases WHERE id = $1 LIMIT 1`,
        [dto.professionalYearId],
      );
      profName = prof[0]?.name || existing[0].professional_year_name;
    }

    let subjectName = dto.subjectName;
    if (!subjectName && dto.subjectId) {
      const sub = await this.dataSource.query(
        `SELECT name FROM "${schema}".subjects WHERE id = $1 LIMIT 1`,
        [dto.subjectId],
      );
      subjectName = sub[0]?.name || existing[0].subject_name;
    }

    let linkedSubjectName = dto.linkedSubjectName;
    if (!linkedSubjectName && dto.linkedSubjectId) {
      const lsub = await this.dataSource.query(
        `SELECT name FROM "${schema}".subjects WHERE id = $1 LIMIT 1`,
        [dto.linkedSubjectId],
      );
      linkedSubjectName = lsub[0]?.name;
    }

    let facultyName = dto.facultyName;
    let facultyEmpId = dto.facultyEmpId;
    if ((!facultyName || !facultyEmpId) && dto.facultyId) {
      const fac = await this.dataSource.query(
        `SELECT name, emp_id FROM "${schema}".faculty WHERE id = $1 LIMIT 1`,
        [dto.facultyId],
      );
      facultyName = facultyName || fac[0]?.name;
      facultyEmpId = facultyEmpId || fac[0]?.emp_id;
    }

    let unitName = dto.unitName;
    if (!unitName && dto.unitId) {
      const u = await this.dataSource.query(
        `SELECT name FROM "${schema}".units WHERE id = $1 LIMIT 1`,
        [dto.unitId],
      );
      unitName = u[0]?.name;
    }

    let topicName = dto.topicName;
    if (!topicName && dto.topicId) {
      const t = await this.dataSource.query(
        `SELECT name FROM "${schema}".topics WHERE id = $1 LIMIT 1`,
        [dto.topicId],
      );
      topicName = t[0]?.name;
    }

    const updateRes = await this.dataSource.query(
      `UPDATE "${schema}".medical_schedule_entries SET
        course_id = $1, course_name = $2, department_id = $3, department_name = $4,
        professional_year_id = $5, professional_year_name = $6,
        subject_id = $7, subject_name = $8, linked_subject_id = $9, linked_subject_name = $10,
        faculty_id = $11, faculty_name = $12, faculty_emp_id = $13,
        unit_id = $14, unit_name = $15, topic_id = $16, topic_name = $17,
        competency_ids = $18, competency_codes = $19, room = $20,
        day_of_week = $21, start_time = $22, end_time = $23, session_type = $24, delivery_type_id = $25,
        notes = $26, updated_by = $27, updated_at = NOW()
      WHERE id = $28 RETURNING *`,
      [
        dto.courseId || existing[0].course_id,
        dto.courseName || existing[0].course_name,
        dto.departmentId || existing[0].department_id,
        departmentName || existing[0].department_name,
        dto.professionalYearId || existing[0].professional_year_id,
        profName || existing[0].professional_year_name,
        dto.subjectId || existing[0].subject_id,
        subjectName || existing[0].subject_name,
        dto.linkedSubjectId !== undefined ? dto.linkedSubjectId : existing[0].linked_subject_id,
        dto.linkedSubjectId ? linkedSubjectName : null,
        dto.facultyId !== undefined ? dto.facultyId : existing[0].faculty_id,
        dto.facultyId ? facultyName : null,
        dto.facultyId ? facultyEmpId : null,
        dto.unitId !== undefined ? dto.unitId : existing[0].unit_id,
        dto.unitId ? unitName : null,
        dto.topicId !== undefined ? dto.topicId : existing[0].topic_id,
        dto.topicId ? topicName : null,
        JSON.stringify(dto.competencyIds || existing[0].competency_ids || []),
        dto.competencyCodes !== undefined ? dto.competencyCodes : existing[0].competency_codes,
        dto.room || existing[0].room,
        dto.dayOfWeek || existing[0].day_of_week,
        dto.startTime || existing[0].start_time,
        dto.endTime || existing[0].end_time,
        dto.sessionType || existing[0].session_type,
        dto.deliveryTypeId || existing[0].delivery_type_id,
        dto.notes !== undefined ? dto.notes : existing[0].notes,
        user.id || null,
        id,
      ],
    );

    return updateRes[0];
  }

  /**
   * 15. Delete Medical Schedule Entry
   */
  async deleteSchedule(slug: string, id: string) {
    await this.validateTenantMedicalAccess(slug);
    const schema = this.resolveSchema(slug);
    await this.tenantSchemaService.ensureLatestSchema(slug);

    const res = await this.dataSource.query(
      `DELETE FROM "${schema}".medical_schedule_entries WHERE id = $1 RETURNING id`,
      [id],
    );
    if (res.length === 0) {
      throw new NotFoundException(`Schedule entry with ID '${id}' not found.`);
    }
    return { success: true, message: `Schedule entry deleted successfully.` };
  }
}
