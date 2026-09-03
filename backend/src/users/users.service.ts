import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  CreateStudentDto, CreateFacultyDto,
  UpdateStudentDto, UpdateFacultyDto, BulkCreateStudentsDto, BulkCreateFacultyDto,
} from './dto/user.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums/role.enum';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) { }

  // ═══════════════════════════════════════════════════════════════
  //  STUDENTS
  // ═══════════════════════════════════════════════════════════════

  async getStudents(tenantSlug: string, pagination: PaginationDto, filters: {
    search?: string; batchId?: string; departmentId?: string; courseCd?: string;
  } = {}) {
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);

    if (resolvedSlug === 'all') {
      const allStudents: any[] = [];
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(
            `SELECT s.id, s.rollno, s.registration_no, s.name, s.photo_url,
                    COALESCE(b.code, s.batch_cd, '2025-MBBS') AS batch_cd,
                    s.course_cd, s.phone, s.admission_year, s.batch_id, s.department_id, s.branch_id,
                    u.email, COALESCE(u.is_active, s.is_active, true) as is_active, s.created_at,
                    d.name as department_name, d.code as department_code
             FROM "${s}".students s
             LEFT JOIN "${s}".users u ON u.id::text = s.user_id::text
             LEFT JOIN "${s}".batches b ON b.id::text = s.batch_id::text
             LEFT JOIN "${s}".departments d ON (d.id::text = s.department_id::text OR d.code = s.branch_id OR d.code = s.department_id::text)
             ORDER BY s.name ASC`
          );
          rows.forEach((r: any) => {
            allStudents.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (e) { }
      }
      return paginate(allStudents, allStudents.length, pagination);
    }

    const currentCollege = colleges.find((c: any) => c.slug === resolvedSlug || c.id === resolvedSlug || c.code === resolvedSlug);
    const schema = `tenant_${currentCollege?.slug || resolvedSlug}`;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['(s.is_active = true OR s.is_active IS NULL)'];
    const params: any[] = [];
    let i = 1;

    if (filters.search) {
      conditions.push(`(s.name ILIKE $${i} OR s.rollno ILIKE $${i} OR s.registration_no ILIKE $${i})`);
      params.push(`%${filters.search}%`);
      i++;
    }
    if (filters.courseCd && filters.courseCd !== 'all' && filters.courseCd !== 'ALL') {
      conditions.push(`(s.course_cd = $${i})`);
      params.push(filters.courseCd);
      i++;
    }
    if (filters.batchId && filters.batchId !== 'all' && filters.batchId !== 'ALL') {
      conditions.push(`(s.batch_id::text = $${i} OR s.batch_cd = $${i})`);
      params.push(filters.batchId);
      i++;
    }
    if (filters.departmentId && filters.departmentId !== 'all' && filters.departmentId !== 'ALL') {
      conditions.push(`(s.department_id::text = $${i} OR s.branch_id = $${i} OR d.code = $${i})`);
      params.push(filters.departmentId);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const needsDeptJoin = !!(filters.departmentId && filters.departmentId !== 'all' && filters.departmentId !== 'ALL');
    const countSql = needsDeptJoin
      ? `SELECT COUNT(s.id) as count FROM "${schema}".students s
         LEFT JOIN LATERAL (
           SELECT code FROM "${schema}".departments
           WHERE (id::text = s.department_id::text OR code = s.branch_id OR code = s.department_id::text)
           LIMIT 1
         ) d ON true
         ${where}`
      : `SELECT COUNT(s.id) as count FROM "${schema}".students s ${where}`;

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT s.id, s.rollno, s.registration_no, s.name, s.photo_url,
                COALESCE(b.code, s.batch_cd, '2025') AS batch_cd,
                s.course_cd, s.phone, s.admission_year, s.batch_id, s.department_id, s.branch_id,
                u.email, COALESCE(u.is_active, s.is_active, true) as is_active, s.created_at,
                d.name as department_name, d.code as department_code
         FROM "${schema}".students s
         LEFT JOIN "${schema}".users u ON u.id::text = s.user_id::text
         LEFT JOIN "${schema}".batches b ON b.id::text = s.batch_id::text
         LEFT JOIN LATERAL (
           SELECT name, code FROM "${schema}".departments
           WHERE (id::text = s.department_id::text OR code = s.branch_id OR code = s.department_id::text)
           LIMIT 1
         ) d ON true
         ${where}
         ORDER BY s.rollno ASC, s.name ASC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      ),
      this.ds.query(countSql, params),
    ]);

    return paginate(rows, parseInt(countRows[0]?.count || '0', 10), pagination);
  }

  async getAcademicFilters(tenantSlug: string) {
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${resolvedSlug}`;

    const [courses, branches, batches, stuBatches] = await Promise.all([
      this.ds.query(
        `SELECT DISTINCT id, code, name, course_cd
         FROM "${schema}".courses
         WHERE name IS NOT NULL AND code IS NOT NULL
         ORDER BY name ASC`
      ).catch(() => []),
      this.ds.query(
        `SELECT DISTINCT d.id, d.code, d.name, d.course_cd, d.branch_cd
         FROM "${schema}".departments d
         WHERE d.name IS NOT NULL
           AND d.name NOT ILIKE '%TRANSPORT%'
           AND d.name NOT ILIKE '%SECURITY%'
           AND d.name NOT ILIKE '%ACCOUNT%'
           AND d.name NOT ILIKE '%MESS%'
           AND d.name NOT ILIKE '%STORE%'
           AND d.name NOT ILIKE '%MAINTENANCE%'
           AND d.name NOT ILIKE '%HOSTEL%'
         ORDER BY d.course_cd, d.name ASC`
      ).catch(() => []),
      this.ds.query(
        `SELECT DISTINCT id, code, name, year, course_cd
         FROM "${schema}".batches
         WHERE (year::text >= '2020' OR year IS NULL)
         ORDER BY year DESC NULLS LAST, name ASC`
      ).catch(() => []),
      this.ds.query(
        `SELECT DISTINCT s.batch_cd, s.course_cd
         FROM "${schema}".students s
         WHERE s.batch_cd IS NOT NULL`
      ).catch(() => []),
    ]);

    const batchMap = new Map<string, { code: string; name: string; year?: string; course_cd?: string }>();
    batches.forEach((b: any) => {
      const year = b.year ? String(b.year) : b.code;
      if (year && !batchMap.has(year)) {
        batchMap.set(year, {
          code: year,
          name: `Batch ${year}`,
          year: year,
          course_cd: b.course_cd,
        });
      }
    });

    stuBatches.forEach((sb: any) => {
      const bCode = String(sb.batch_cd);
      if (bCode && !batchMap.has(bCode) && (bCode.startsWith('20') || ['1', '2', '15', '16', '17', '18', '19'].includes(bCode))) {
        const yr = bCode.startsWith('20') ? bCode : bCode === '2' ? '2025' : bCode === '1' ? '2024' : `Batch ${bCode}`;
        batchMap.set(bCode, {
          code: bCode,
          name: bCode.startsWith('20') ? `Batch ${bCode}` : `Batch ${yr} (${bCode})`,
          year: yr,
          course_cd: sb.course_cd,
        });
      }
    });

    return {
      courses,
      branches,
      batches: Array.from(batchMap.values()),
    };
  }

  async getStudentById(tenantSlug: string, id: string) {
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${resolvedSlug}`;
    const rows = await this.ds.query(
      `SELECT s.*, u.email, COALESCE(u.is_active, s.is_active, true) as is_active, u.created_at as user_created_at,
              d.name AS department_name, b.code AS batch_code
       FROM "${schema}".students s
       LEFT JOIN "${schema}".users u ON u.id::text = s.user_id::text
       LEFT JOIN LATERAL (
         SELECT name, code FROM "${schema}".departments
         WHERE (id::text = s.department_id::text OR code = s.branch_id OR code = s.department_id::text)
         LIMIT 1
       ) d ON true
       LEFT JOIN "${schema}".batches b ON b.id::text = s.batch_id::text
       WHERE s.id::text = $1::text OR s.rollno = $1 OR s.registration_no = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Student not found');
    return rows[0];
  }

  async createStudent(tenantSlug: string, dto: CreateStudentDto, createdBy?: string) {
    const schema = `tenant_${tenantSlug}`;

    // Check rollno uniqueness
    const existing = await this.ds.query(
      `SELECT id FROM "${schema}".students WHERE rollno = $1`,
      [dto.rollno],
    );
    if (existing.length) throw new ConflictException(`Roll number '${dto.rollno}' already exists`);

    const emailCheck = await this.ds.query(
      `SELECT id FROM "${schema}".users WHERE email = $1`,
      [dto.email.toLowerCase()],
    );
    if (emailCheck.length) throw new ConflictException(`Email '${dto.email}' already in use`);

    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user
    const userRows = await this.ds.query(
      `INSERT INTO "${schema}".users (email, password_hash, role, must_change_password)
       VALUES ($1,$2,$3,true) RETURNING id`,
      [dto.email.toLowerCase(), hash, UserRole.STUDENT],
    );
    const userId = userRows[0].id;

    // Create student profile
    const studentRows = await this.ds.query(
      `INSERT INTO "${schema}".students
         (user_id, rollno, name, department_id, batch_id, batch_cd, course_cd, phone, admission_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, rollno, name`,
      [
        userId, dto.rollno, dto.name,
        dto.departmentId ?? null, dto.batchId ?? null,
        dto.batchCd ?? null, dto.courseCd ?? null,
        dto.phone ?? null, dto.admissionYear ?? null,
      ],
    );

    this.logger.log(`Student created: ${dto.rollno} in tenant ${tenantSlug}`);
    return { ...studentRows[0], email: dto.email };
  }

  async bulkCreateStudents(tenantSlug: string, dto: BulkCreateStudentsDto) {
    const results = { created: [] as any[], failed: [] as any[] };

    for (const student of dto.students) {
      try {
        const s = await this.createStudent(tenantSlug, student);
        results.created.push(s);
      } catch (e: any) {
        results.failed.push({ rollno: student.rollno, error: e.message });
      }
    }

    return results;
  }

  async updateStudent(tenantSlug: string, id: string, dto: UpdateStudentDto) {
    const schema = `tenant_${tenantSlug}`;
    await this.getStudentById(tenantSlug, id); // throws if not found

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    const map: Record<string, any> = {
      name: dto.name, phone: dto.phone, batchId: dto.batchId,
      departmentId: dto.departmentId, batchCd: dto.batchCd, courseCd: dto.courseCd,
    };
    const colMap: Record<string, string> = {
      name: 'name', phone: 'phone', batchId: 'batch_id',
      departmentId: 'department_id', batchCd: 'batch_cd', courseCd: 'course_cd',
    };

    for (const [key, val] of Object.entries(map)) {
      if (val !== undefined) {
        sets.push(`${colMap[key]}=$${i++}`);
        params.push(val);
      }
    }

    if (!sets.length) throw new BadRequestException('No fields to update');

    sets.push(`updated_at=NOW()`);
    params.push(id);

    await this.ds.query(
      `UPDATE "${schema}".students SET ${sets.join(', ')} WHERE id=$${i}`,
      params,
    );

    return this.getStudentById(tenantSlug, id);
  }

  async toggleStudentActive(tenantSlug: string, id: string) {
    const schema = `tenant_${tenantSlug}`;
    const student = await this.getStudentById(tenantSlug, id);

    // Toggle via the users table (is_active drives login access)
    await this.ds.query(
      `UPDATE "${schema}".users u SET is_active = NOT u.is_active
       FROM "${schema}".students s WHERE s.user_id::text = u.id::text AND s.id = $1`,
      [id],
    );
    await this.ds.query(
      `UPDATE "${schema}".students SET is_active = NOT is_active WHERE id=$1`,
      [id],
    );

    return { id, isActive: !student.is_active };
  }

  // ═══════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════
  //  FACULTY / HOD / CLERK
  // ═══════════════════════════════════════════════════════════════

  private async resolveTenantSlug(tenantSlugOrCollege?: string): Promise<string> {
    if (!tenantSlugOrCollege || tenantSlugOrCollege === 'all') return 'all';
    const cleaned = tenantSlugOrCollege.replace(/^tenant_/, '').replace(/^tenant-/, '').trim().toLowerCase();
    if (cleaned === 'srms-cet' || cleaned === 'srms_cet' || cleaned === 'cet' || cleaned === '7' || cleaned === '1') {
      return 'srms-cet-bareilly';
    }
    if (cleaned === 'srms-cetr' || cleaned === 'srms_cetr' || cleaned === 'cetr' || cleaned === '8' || cleaned === '2') {
      return 'srms-cetr-bareilly';
    }
    try {
      const rows = await this.ds.query(
        `SELECT slug, code, id FROM public.tenants WHERE LOWER(slug) = $1 OR code = $1 OR id::text = $1 LIMIT 1`,
        [cleaned],
      );
      if (rows.length > 0) return rows[0].slug;
    } catch (e) { }
    return cleaned;
  }

  async getFaculty(tenantSlug: string, pagination: PaginationDto, filters: {
    search?: string; departmentId?: string; role?: UserRole; staffType?: string; isActive?: string;
  } = {}) {
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);

    if (resolvedSlug === 'all') {
      const allFaculty: any[] = [];
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(
            `SELECT f.id, f.emp_id, f.name, f.designation,
                    COALESCE(NULLIF(f.photo_url, ''), CASE WHEN f.emp_id IS NOT NULL THEN CONCAT('https://myportal.srms.ac.in/HR/HR/', f.emp_id, '/', f.emp_id, '.jpg') ELSE NULL END) AS photo_url,
                    f.phone, f.department_id, f.subject_id, f.gender, f.experience, f.staff_type, f.is_active,
                    f.qualification, f.date_of_joining, f.date_of_birth, f.date_of_leaving, f.blood_group,
                    f.caste, f.pan_no, f.aadhaar_no, f.uan, f.bank_ac_no, f.current_basic, f.device_cd,
                    f.salgrade, f.father_name, f.spouse_name, f.address, f.city, f.state, f.perm_addr,
                    f.perm_city, f.perm_state, f.homephone, f.permanent_tel_no, f.highest_education,
                    f.category, f.payroll_category, f.employment_status,
                    u.email, u.role, u.is_active as user_active,
                    d.name AS department_name, d.code AS department_code,
                    s.name AS subject_name, s.code AS subject_code
             FROM "${s}".faculty f
             LEFT JOIN "${s}".users u ON u.id::text = f.user_id::text
             LEFT JOIN "${s}".departments d ON (d.id::text = f.department_id::text OR d.code = f.department_id::text)
             LEFT JOIN "${s}".subjects s ON (s.id::text = f.subject_id::text OR s.code = f.subject_id::text)
             ORDER BY f.name ASC`
          );
          rows.forEach((r: any) => {
            allFaculty.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
            });
          });
        } catch (e) { }
      }
      return paginate(allFaculty, allFaculty.length, pagination);
    }

    const currentCollege = colleges.find((c: any) => c.slug === resolvedSlug || c.id === resolvedSlug || c.code === resolvedSlug);
    const schema = `tenant_${currentCollege?.slug || resolvedSlug}`;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let i = 1;

    if (filters.search) {
      conditions.push(`(f.name ILIKE $${i} OR f.emp_id ILIKE $${i})`);
      params.push(`%${filters.search}%`);
      i++;
    }
    if (filters.departmentId && filters.departmentId !== 'all') {
      conditions.push(`(f.department_id::text = $${i} OR d.code = $${i})`);
      params.push(filters.departmentId);
      i++;
    }
    if (filters.role) {
      conditions.push(`u.role = $${i++}`);
      params.push(filters.role);
    }
    if (filters.staffType && filters.staffType !== 'all') {
      conditions.push(`LOWER(f.staff_type) = LOWER($${i++})`);
      params.push(filters.staffType);
    }
    if (filters.isActive !== undefined) {
      conditions.push(`f.is_active = $${i++}`);
      params.push(filters.isActive === 'true');
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT DISTINCT ON (f.id) f.id, f.emp_id, f.name, f.designation,
                COALESCE(NULLIF(f.photo_url, ''), CASE WHEN f.emp_id IS NOT NULL THEN CONCAT('https://myportal.srms.ac.in/HR/HR/', f.emp_id, '/', f.emp_id, '.jpg') ELSE NULL END) AS photo_url,
                f.phone, f.department_id, f.subject_id, f.gender, f.experience, f.staff_type, f.is_active,
                f.qualification, f.date_of_joining, f.date_of_birth, f.date_of_leaving, f.blood_group,
                f.caste, f.pan_no, f.aadhaar_no, f.uan, f.bank_ac_no, f.current_basic, f.device_cd,
                f.salgrade, f.father_name, f.spouse_name, f.address, f.city, f.state, f.perm_addr,
                f.perm_city, f.perm_state, f.homephone, f.permanent_tel_no, f.highest_education,
                f.category, f.payroll_category, f.employment_status,
                u.email, u.role, u.is_active as user_active,
                d.name AS department_name, d.code AS department_code,
                s.name AS subject_name, s.code AS subject_code
         FROM "${schema}".faculty f
         LEFT JOIN "${schema}".users u ON u.id::text = f.user_id::text
         LEFT JOIN "${schema}".departments d ON (d.id::text = f.department_id::text OR (f.department_id IS NOT NULL AND d.code = f.department_id::text))
         LEFT JOIN "${schema}".subjects s ON (s.id::text = f.subject_id::text OR (f.subject_id IS NOT NULL AND s.code = f.subject_id::text))
         ${where}
         ORDER BY f.id, f.name ASC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      ).catch(() => []),
      this.ds.query(
        `SELECT COUNT(DISTINCT f.id) FROM "${schema}".faculty f
         LEFT JOIN "${schema}".users u ON u.id::text = f.user_id::text
         LEFT JOIN "${schema}".departments d ON (d.id::text = f.department_id::text OR (f.department_id IS NOT NULL AND d.code = f.department_id::text))
         LEFT JOIN "${schema}".subjects s ON (s.id::text = f.subject_id::text OR (f.subject_id IS NOT NULL AND s.code = f.subject_id::text))
         ${where}`,
        params,
      ).catch(() => [{ count: '0' }]),
    ]);

    const mappedRows = rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: currentCollege?.slug || resolvedSlug,
    }));

    return paginate(mappedRows, parseInt(countRows[0].count, 10), pagination);
  }

  async getFacultyById(tenantSlug: string, id: string) {
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);

    const fetchFromSchema = async (s: string) => {
      return this.ds.query(
        `SELECT f.*,
                COALESCE(NULLIF(f.photo_url, ''), CASE WHEN f.emp_id IS NOT NULL THEN CONCAT('https://myportal.srms.ac.in/HR/HR/', f.emp_id, '/', f.emp_id, '.jpg') ELSE NULL END) AS photo_url,
                u.email, u.role, u.is_active as user_active, u.last_login_at,
                d.name AS department_name, d.code AS department_code,
                s.name AS subject_name, s.code AS subject_code
         FROM "${s}".faculty f
         LEFT JOIN "${s}".users u ON u.id::text = f.user_id::text
         LEFT JOIN "${s}".departments d ON (d.id::text = f.department_id::text OR d.code = f.department_id::text)
         LEFT JOIN "${s}".subjects s ON (s.id::text = f.subject_id::text OR s.code = f.subject_id::text)
         WHERE f.id::text = $1::text OR f.emp_id = $1`,
        [id],
      ).catch(() => []);
    };

    if (resolvedSlug && resolvedSlug !== 'all') {
      const primarySchema = `tenant_${resolvedSlug}`;
      const rows = await fetchFromSchema(primarySchema);
      if (rows && rows[0]) return { ...rows[0], _schema: primarySchema, _tenantSlug: resolvedSlug };
    }

    // Fallback across all schemas if not found in primary
    for (const col of colleges) {
      if (!col.slug || col.slug === resolvedSlug) continue;
      const s = `tenant_${col.slug}`;
      const rows = await fetchFromSchema(s);
      if (rows && rows[0]) return { ...rows[0], _schema: s, _tenantSlug: col.slug };
    }

    throw new NotFoundException('Faculty not found');
  }

  private isUUID(str?: string | null): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async createFaculty(tenantSlug: string, dto: CreateFacultyDto) {
    const resolvedSlug = await this.resolveTenantSlug(dto.college_slug || dto.college_id || tenantSlug);
    const schema = `tenant_${resolvedSlug}`;

    // 1. Check if employee already exists by emp_id in this tenant schema
    const empCheck = await this.ds.query(
      `SELECT id, user_id FROM "${schema}".faculty WHERE emp_id = $1`,
      [dto.empId],
    ).catch(() => []);

    if (empCheck.length > 0) {
      // Upsert: update existing faculty
      const fId = empCheck[0].id;
      return await this.updateFaculty(resolvedSlug, fId, dto);
    }

    const emailStr = (dto.email || `${dto.empId.toLowerCase()}@srms.ac.in`).toLowerCase().trim();
    const plainPassword = dto.password || 'Temp@1234';
    const hash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

    // Map role safely
    let role: UserRole = UserRole.FACULTY;
    if (dto.role) {
      const r = String(dto.role).toUpperCase().trim();
      if (r === 'HOD') role = UserRole.HOD;
      else if (r === 'CLERK') role = UserRole.CLERK;
      else if (r === 'ADMIN' || r === 'COLLEGE_ADMIN') role = UserRole.COLLEGE_ADMIN;
      else if (r === 'STAFF') role = UserRole.STAFF;
      else role = UserRole.FACULTY;
    } else if (dto.staffType && (dto.staffType.toUpperCase().includes('CLERK') || dto.staffType.toUpperCase().includes('ADMIN'))) {
      role = dto.staffType.toUpperCase().includes('CLERK') ? UserRole.CLERK : UserRole.FACULTY;
    }

    // 2. Check if email already exists in users table
    const emailCheck = await this.ds.query(
      `SELECT id FROM "${schema}".users WHERE email = $1`,
      [emailStr],
    ).catch(() => []);

    let userId: string;
    if (emailCheck.length > 0) {
      userId = emailCheck[0].id;
      // Update role and status if needed
      await this.ds.query(
        `UPDATE "${schema}".users SET role = $1, is_active = COALESCE($2, true) WHERE id = $3`,
        [role, dto.isActive ?? true, userId],
      ).catch(() => { });
    } else {
      const userRows = await this.ds.query(
        `INSERT INTO "${schema}".users (email, password_hash, role, must_change_password, is_active)
         VALUES ($1,$2,$3,true,COALESCE($4, true)) RETURNING id`,
        [emailStr, hash, role, dto.isActive ?? true],
      );
      userId = userRows[0].id;
    }

    let validDeptId = this.isUUID(dto.departmentId) ? dto.departmentId : null;
    if (!validDeptId && dto.departmentId) {
      const dRows = await this.ds.query(
        `SELECT id FROM "${schema}".departments WHERE code = $1 OR id::text = $1 OR name ILIKE $1 LIMIT 1`,
        [dto.departmentId],
      ).catch(() => []);
      if (dRows.length) validDeptId = dRows[0].id;
    }

    let validSubjectId = this.isUUID(dto.subjectId) ? dto.subjectId : null;
    if (!validSubjectId && dto.subjectId) {
      const sRows = await this.ds.query(
        `SELECT id FROM "${schema}".subjects WHERE code = $1 OR id::text = $1 OR name ILIKE $1 LIMIT 1`,
        [dto.subjectId],
      ).catch(() => []);
      if (sRows.length) validSubjectId = sRows[0].id;
    }

    // Check if faculty row already exists for this userId
    const existingFacultyByUserId = await this.ds.query(
      `SELECT id FROM "${schema}".faculty WHERE user_id = $1`,
      [userId],
    ).catch(() => []);

    if (existingFacultyByUserId.length > 0) {
      return await this.updateFaculty(resolvedSlug, existingFacultyByUserId[0].id, dto);
    }

    const facultyRows = await this.ds.query(
      `INSERT INTO "${schema}".faculty
         (user_id, emp_id, name, department_id, subject_id, designation, qualification, phone, gender, experience, staff_type, photo_url, is_active, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13, true),$14)
       RETURNING id, emp_id, name`,
      [
        userId, dto.empId, dto.name,
        validDeptId, validSubjectId, dto.designation || null,
        dto.qualification || null, dto.phone || null,
        dto.gender || null, dto.experience || null,
        dto.staffType || 'Faculty', dto.photoUrl || null,
        dto.isActive ?? true,
        emailStr,
      ],
    );

    this.logger.log(`Faculty created/upserted: ${dto.empId} [${role}] in tenant ${resolvedSlug}`);
    return { ...facultyRows[0], email: emailStr, role };
  }

  async bulkCreateFaculty(tenantSlug: string, dto: BulkCreateFacultyDto) {
    const results = { created: [] as any[], failed: [] as any[], updated: [] as any[] };
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);

    for (const faculty of (dto.faculty || [])) {
      try {
        const targetSlug = faculty.college_slug || faculty.college_id ? await this.resolveTenantSlug(faculty.college_slug || faculty.college_id) : resolvedSlug;
        const schema = `tenant_${targetSlug}`;

        // Check if employee already exists in tenant schema by empId or email
        const existingFaculty = await this.ds.query(
          `SELECT f.id, f.user_id FROM "${schema}".faculty f WHERE f.emp_id = $1 OR (f.email IS NOT NULL AND f.email = $2)`,
          [faculty.empId, faculty.email ? faculty.email.toLowerCase().trim() : ''],
        ).catch(() => []);

        if (existingFaculty.length > 0) {
          // Update existing
          const fId = existingFaculty[0].id;
          await this.updateFaculty(targetSlug, fId, faculty);
          results.updated.push({ empId: faculty.empId, name: faculty.name, college: targetSlug });
        } else {
          // Create new
          const created = await this.createFaculty(targetSlug, faculty);
          results.created.push(created);
        }
      } catch (e: any) {
        results.failed.push({ empId: faculty.empId, name: faculty.name, error: e.message });
      }
    }

    return results;
  }

  async updateFaculty(tenantSlug: string, id: string, dto: UpdateFacultyDto) {
    const faculty = await this.getFacultyById(dto.college_slug || dto.college_id || tenantSlug, id);
    const resolvedSlug = faculty._tenantSlug || await this.resolveTenantSlug(dto.college_slug || dto.college_id || tenantSlug);
    const schema = `tenant_${resolvedSlug}`;

    // Update user record if email, role or password provided
    if (dto.email || dto.role) {
      const userUpdates: string[] = [];
      const userParams: any[] = [];
      let uIdx = 1;

      if (dto.email) {
        userUpdates.push(`email = $${uIdx++}`);
        userParams.push(dto.email.toLowerCase());
      }
      if (dto.role) {
        let roleVal: any = dto.role;
        if (roleVal === 'ADMIN') roleVal = UserRole.COLLEGE_ADMIN;
        userUpdates.push(`role = $${uIdx++}`);
        userParams.push(roleVal);
      }

      if (userUpdates.length && faculty.user_id) {
        userParams.push(faculty.user_id);
        await this.ds.query(
          `UPDATE "${schema}".users SET ${userUpdates.join(', ')} WHERE id = $${uIdx}`,
          userParams,
        ).catch(() => { });
      }
    }

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    let validDeptId = dto.departmentId !== undefined ? (this.isUUID(dto.departmentId) ? dto.departmentId : null) : undefined;
    if (validDeptId === null && dto.departmentId) {
      const dRows = await this.ds.query(
        `SELECT id FROM "${schema}".departments WHERE code = $1 OR id::text = $1 LIMIT 1`,
        [dto.departmentId],
      ).catch(() => []);
      if (dRows.length) validDeptId = dRows[0].id;
    }

    let validSubjectId = dto.subjectId !== undefined ? (this.isUUID(dto.subjectId) ? dto.subjectId : null) : undefined;
    if (validSubjectId === null && dto.subjectId) {
      const sRows = await this.ds.query(
        `SELECT id FROM "${schema}".subjects WHERE code = $1 OR id::text = $1 LIMIT 1`,
        [dto.subjectId],
      ).catch(() => []);
      if (sRows.length) validSubjectId = sRows[0].id;
    }

    const parseDateOrNull = (val?: string | null) => {
      if (!val || typeof val !== 'string' || !val.trim()) return null;
      try {
        const parsed = new Date(val);
        return isNaN(parsed.getTime()) ? null : val.trim().split('T')[0];
      } catch {
        return null;
      }
    };

    const parseNumberOrNull = (val?: any) => {
      if (val === undefined || val === null || val === '') return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const map: Record<string, any> = {
      name: dto.name, designation: dto.designation,
      email: dto.email ? dto.email.toLowerCase().trim() : undefined,
      qualification: dto.qualification, phone: dto.phone,
      departmentId: validDeptId, subjectId: validSubjectId,
      gender: dto.gender, experience: dto.experience,
      staffType: dto.staffType,
      photoUrl: dto.photoUrl !== undefined ? dto.photoUrl : (dto as any).photo_url,
      coverUrl: (dto as any).cover_url || (dto as any).coverUrl,
      bio: (dto as any).bio,
      linkedinUrl: (dto as any).linkedin_url || (dto as any).linkedinUrl,
      linkedinConnections: (dto as any).linkedin_connections || (dto as any).linkedinConnections,
      repositoryEvaluatedCount: (dto as any).repository_evaluated_count || (dto as any).repositoryEvaluatedCount,
      followersCount: (dto as any).followers_count || (dto as any).followersCount,
      bloodGroup: dto.bloodGroup, fatherName: dto.fatherName,
      spouseName: dto.spouseName, address: dto.address,
      city: dto.city, state: dto.state,
      caste: dto.caste,
      specialization: dto.specialization,
      panNo: dto.panNo, aadhaarNo: dto.aadhaarNo,
      salgrade: dto.salgrade,
      highestEducation: dto.highestEducation,
      category: dto.category,
      payrollCategory: dto.payrollCategory,
      employmentStatus: dto.employmentStatus,
      bankAcNo: dto.bankAcNo,
      uan: dto.uan,
      deviceCd: dto.deviceCd,
      permAddr: dto.permAddr,
      permCity: dto.permCity,
      permState: dto.permState,
      homephone: dto.homephone,
      permanentTelNo: dto.permanentTelNo,
      currentBasic: dto.currentBasic !== undefined ? parseNumberOrNull(dto.currentBasic) : undefined,
      dateOfBirth: dto.dateOfBirth !== undefined ? parseDateOrNull(dto.dateOfBirth) : undefined,
      dateOfJoining: dto.dateOfJoining !== undefined ? parseDateOrNull(dto.dateOfJoining) : undefined,
    };
    const colMap: Record<string, string> = {
      name: 'name', designation: 'designation',
      email: 'email',
      qualification: 'qualification', phone: 'phone',
      departmentId: 'department_id', subjectId: 'subject_id',
      gender: 'gender', experience: 'experience',
      staffType: 'staff_type', photoUrl: 'photo_url',
      coverUrl: 'cover_url', bio: 'bio',
      linkedinUrl: 'linkedin_url', linkedinConnections: 'linkedin_connections',
      repositoryEvaluatedCount: 'repository_evaluated_count', followersCount: 'followers_count',
      bloodGroup: 'blood_group', fatherName: 'father_name',
      spouseName: 'spouse_name', address: 'address',
      city: 'city', state: 'state',
      caste: 'caste',
      specialization: 'specialization',
      panNo: 'pan_no', aadhaarNo: 'aadhaar_no',
      salgrade: 'salgrade',
      highestEducation: 'highest_education',
      category: 'category',
      payrollCategory: 'payroll_category',
      employmentStatus: 'employment_status',
      bankAcNo: 'bank_ac_no',
      uan: 'uan',
      deviceCd: 'device_cd',
      permAddr: 'perm_addr',
      permCity: 'perm_city',
      permState: 'perm_state',
      homephone: 'homephone',
      permanentTelNo: 'permanent_tel_no',
      currentBasic: 'current_basic',
      dateOfBirth: 'date_of_birth', dateOfJoining: 'date_of_joining',
    };

    for (const [key, val] of Object.entries(map)) {
      if (val !== undefined) {
        sets.push(`${colMap[key]}=$${i++}`);
        params.push(val);
      }
    }

    if (dto.isActive !== undefined) {
      sets.push(`is_active=$${i++}`);
      params.push(dto.isActive);

      await this.ds.query(
        `UPDATE "${schema}".users u SET is_active = $1
         FROM "${schema}".faculty f WHERE f.user_id::text = u.id::text AND f.id = $2`,
        [dto.isActive, id],
      ).catch(() => { });
    }

    if (!sets.length && dto.isActive === undefined && !dto.email && !dto.role) {
      throw new BadRequestException('No fields to update');
    }

    if (sets.length) {
      sets.push(`updated_at=NOW()`);
      params.push(id);

      await this.ds.query(
        `UPDATE "${schema}".faculty SET ${sets.join(', ')} WHERE id=$${i}`,
        params,
      );
    }

    return this.getFacultyById(resolvedSlug, id);
  }

  private async executeFacultyCascadeDelete(schema: string, facultyId: string, userId?: string | null) {
    // 1. Unlink nullable references
    await this.ds.query(`UPDATE "${schema}".timetable_slots SET faculty_id = NULL WHERE faculty_id = $1`, [facultyId]).catch(() => { });
    if (userId) {
      await this.ds.query(`UPDATE "${schema}".departments SET hod_user_id = NULL WHERE hod_user_id = $1`, [userId]).catch(() => { });
      await this.ds.query(`UPDATE "${schema}".hostel_blocks SET warden_id = NULL WHERE warden_id = $1`, [userId]).catch(() => { });
    }

    // 2. Delete child records
    await this.ds.query(`DELETE FROM "${schema}".faculty_punch_logs WHERE faculty_id = $1`, [facultyId]).catch(() => { });
    await this.ds.query(`DELETE FROM "${schema}".attendance_sessions WHERE faculty_id = $1`, [facultyId]).catch(() => { });
    await this.ds.query(`DELETE FROM "${schema}".leave_applications WHERE faculty_id = $1`, [facultyId]).catch(() => { });
    await this.ds.query(`DELETE FROM "${schema}".logbook_entries WHERE faculty_id = $1`, [facultyId]).catch(() => { });
    await this.ds.query(`DELETE FROM "${schema}".salary_records WHERE faculty_id = $1`, [facultyId]).catch(() => { });
    await this.ds.query(`DELETE FROM "${schema}".faculty_subjects WHERE faculty_id = $1`, [facultyId]).catch(() => { });

    // 3. Delete faculty and user account
    await this.ds.query(`DELETE FROM "${schema}".faculty WHERE id = $1`, [facultyId]);
    if (userId) {
      await this.ds.query(`DELETE FROM "${schema}".users WHERE id = $1`, [userId]).catch(() => { });
    }
  }

  async deleteFaculty(tenantSlug: string, id: string) {
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);

    if (resolvedSlug === 'all' || !resolvedSlug) {
      // Find which tenant schema has this faculty member by querying all schemas
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(`SELECT id, user_id FROM "${s}".faculty WHERE id = $1`, [id]);
          if (rows.length > 0) {
            await this.executeFacultyCascadeDelete(s, id, rows[0].user_id);
            return { success: true, message: 'Faculty member deleted successfully' };
          }
        } catch (e) { }
      }
      throw new NotFoundException('Faculty member not found in any institution');
    }

    const currentCollege = colleges.find((c: any) => c.slug === resolvedSlug || c.id === resolvedSlug || c.code === resolvedSlug);
    const targetSlug = currentCollege?.slug || resolvedSlug;
    const schema = `tenant_${targetSlug}`;

    let facultyRows = await this.ds.query(
      `SELECT id, user_id FROM "${schema}".faculty WHERE id = $1`,
      [id],
    ).catch(() => []);

    // If not found in specified schema, fallback search in all schemas
    if (!facultyRows.length) {
      for (const col of colleges) {
        if (!col.slug || col.slug === targetSlug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(`SELECT id, user_id FROM "${s}".faculty WHERE id = $1`, [id]);
          if (rows.length > 0) {
            await this.executeFacultyCascadeDelete(s, id, rows[0].user_id);
            return { success: true, message: 'Faculty member deleted successfully' };
          }
        } catch (e) { }
      }
      throw new NotFoundException('Faculty member not found');
    }

    await this.executeFacultyCascadeDelete(schema, id, facultyRows[0].user_id);
    return { success: true, message: 'Faculty member deleted successfully' };
  }

  // ═══════════════════════════════════════════════════════════════
  //  DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════

  async getDepartments(tenantSlug: string) {
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);

    if (resolvedSlug === 'all') {
      const allDepts: any[] = [];
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(
            `SELECT d.*, f.name AS hod_name
             FROM "${s}".departments d
             LEFT JOIN "${s}".users u ON u.id::text = d.hod_user_id::text
             LEFT JOIN "${s}".faculty f ON f.user_id::text = u.id::text
             WHERE d.is_active = true
             ORDER BY d.name ASC`
          );
          rows.forEach((r: any) => {
            allDepts.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
              colg_cd: col.code || col.id,
            });
          });
        } catch (e) { }
      }
      return allDepts;
    }

    const currentCollege = colleges.find((c: any) => c.slug === resolvedSlug || c.id === resolvedSlug || c.code === resolvedSlug);
    const schema = `tenant_${currentCollege?.slug || resolvedSlug}`;
    const rows = await this.ds.query(
      `SELECT d.*, f.name AS hod_name
       FROM "${schema}".departments d
       LEFT JOIN "${schema}".users u ON u.id::text = d.hod_user_id::text
       LEFT JOIN "${schema}".faculty f ON f.user_id::text = u.id::text
       WHERE d.is_active = true
       ORDER BY d.name ASC`,
    ).catch(() => []);

    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: currentCollege?.slug || resolvedSlug,
      colg_cd: currentCollege?.code || currentCollege?.id,
    }));
  }

  async createDepartment(tenantSlug: string, data: { code: string; name: string; type: string }) {
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${resolvedSlug}`;
    const rows = await this.ds.query(
      `INSERT INTO "${schema}".departments (code, name, type) VALUES ($1,$2,$3)
       ON CONFLICT (code) DO NOTHING RETURNING id, code, name`,
      [data.code, data.name, data.type],
    );
    if (!rows.length) throw new ConflictException(`Department code '${data.code}' already exists`);
    return rows[0];
  }

  // ═══════════════════════════════════════════════════════════════
  //  SUBJECTS
  // ═══════════════════════════════════════════════════════════════

  async getSubjects(tenantSlug: string, departmentId?: string) {
    const colleges = await this.ds.query(`SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    const resolvedSlug = await this.resolveTenantSlug(tenantSlug);

    if (resolvedSlug === 'all') {
      const allSubjects: any[] = [];
      for (const col of colleges) {
        if (!col.slug) continue;
        const s = `tenant_${col.slug}`;
        try {
          const rows = await this.ds.query(
            `SELECT s.*, d.name AS department_name, d.code AS department_code
             FROM "${s}".subjects s
             LEFT JOIN "${s}".departments d ON (d.id = s.department_id OR d.code = s.department_id::text)
             WHERE s.is_active = true
             ORDER BY s.code ASC`
          );
          rows.forEach((r: any) => {
            allSubjects.push({
              ...r,
              college_id: col.id,
              college_name: col.name,
              college_code: col.code,
              college_slug: col.slug,
              colg_cd: col.code || col.id,
            });
          });
        } catch (e) { }
      }
      return allSubjects;
    }

    const currentCollege = colleges.find((c: any) => c.slug === resolvedSlug || c.id === resolvedSlug || c.code === resolvedSlug);
    const schema = `tenant_${currentCollege?.slug || resolvedSlug}`;
    const where = departmentId
      ? `WHERE (s.department_id::text = $1 OR d.code = $1 OR LOWER(d.name) LIKE LOWER('%' || $1 || '%')) AND s.is_active = true`
      : `WHERE s.is_active = true`;
    const rows = await this.ds.query(
      `SELECT s.*, d.name AS department_name, d.code AS department_code
       FROM "${schema}".subjects s
       LEFT JOIN "${schema}".departments d ON (d.id = s.department_id OR d.code = s.department_id::text)
       ${where}
       ORDER BY s.code ASC`,
      departmentId ? [departmentId] : [],
    ).catch(() => []);

    return rows.map((r: any) => ({
      ...r,
      college_id: currentCollege?.id,
      college_name: currentCollege?.name,
      college_code: currentCollege?.code,
      college_slug: currentCollege?.slug || resolvedSlug,
      colg_cd: currentCollege?.code || currentCollege?.id,
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  //  BATCHES
  // ═══════════════════════════════════════════════════════════════

  async getBatches(tenantSlug: string, departmentId?: string) {
    const schema = `tenant_${tenantSlug}`;
    const where = departmentId ? `WHERE (b.department_id::text = $1::text)` : '';
    return this.ds.query(
      `SELECT b.*, d.name AS department_name
       FROM "${schema}".batches b
       LEFT JOIN "${schema}".departments d ON d.id::text = b.department_id::text
       ${where}
       ORDER BY b.year DESC, b.code ASC`,
      departmentId ? [departmentId] : [],
    );
  }

  async createBatch(tenantSlug: string, data: {
    code: string; year: number; courseCd: string;
    departmentId?: string; startDate?: string; endDate?: string;
  }) {
    const schema = `tenant_${tenantSlug}`;
    const rows = await this.ds.query(
      `INSERT INTO "${schema}".batches (code, year, course_cd, department_id, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, code, year`,
      [data.code, data.year, data.courseCd,
      data.departmentId ?? null, data.startDate ?? null, data.endDate ?? null],
    );
    return rows[0];
  }

  /**
   * Grant Administrator rights to any staff member / faculty
   */
  async grantAdminRights(tenantSlug: string, facultyOrUserId: string, adminRole: string = 'COLLEGE_ADMIN') {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    let targetRole = UserRole.COLLEGE_ADMIN;
    if (adminRole === 'SUPER_ADMIN') targetRole = UserRole.SUPER_ADMIN;

    // Check if facultyOrUserId matches faculty id, user id, or emp_id
    const facRows = await this.ds.query(
      `SELECT f.id, f.user_id, f.emp_id, f.name, u.email 
       FROM "${schema}".faculty f
       JOIN "${schema}".users u ON u.id = f.user_id
       WHERE f.id::text = $1 OR f.user_id::text = $1 OR LOWER(COALESCE(f.emp_id, '')) = LOWER($1) OR LOWER(COALESCE(f.usr_id, '')) = LOWER($1)
       LIMIT 1`,
      [facultyOrUserId],
    );

    let userId: string;
    let userName: string = 'Staff Admin';
    let userEmail: string = '';

    if (facRows.length > 0) {
      userId = facRows[0].user_id;
      userName = facRows[0].name;
      userEmail = facRows[0].email;

      // Update faculty designation
      await this.ds.query(
        `UPDATE "${schema}".faculty 
         SET designation = CASE 
           WHEN designation ILIKE '%Admin%' THEN designation 
           ELSE COALESCE(designation, 'Faculty') || ' (Admin)' 
         END, 
         updated_at = NOW() 
         WHERE id = $1`,
        [facRows[0].id],
      );
    } else {
      const uRows = await this.ds.query(
        `SELECT id, email, role FROM "${schema}".users WHERE id::text = $1 OR LOWER(email) = LOWER($1) LIMIT 1`,
        [facultyOrUserId],
      );
      if (uRows.length === 0) throw new NotFoundException('User / Staff not found in this institution');
      userId = uRows[0].id;
      userEmail = uRows[0].email;
    }

    // Elevate user role to COLLEGE_ADMIN
    await this.ds.query(
      `UPDATE "${schema}".users SET role = $1, is_active = true, updated_at = NOW() WHERE id = $2`,
      [targetRole, userId],
    );

    this.logger.log(`Granted Admin rights [${targetRole}] to user ${userId} (${userName}) in ${slug}`);

    return {
      success: true,
      message: `Admin rights (${targetRole}) successfully granted to ${userName || userEmail}`,
      userId,
      role: targetRole,
      tenantSlug: slug,
    };
  }

  /**
   * Revoke Administrator rights and revert staff back to default FACULTY role
   */
  async revokeAdminRights(tenantSlug: string, facultyOrUserId: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const facRows = await this.ds.query(
      `SELECT f.id, f.user_id, f.emp_id, f.name, f.designation, u.email 
       FROM "${schema}".faculty f
       JOIN "${schema}".users u ON u.id = f.user_id
       WHERE f.id::text = $1 OR f.user_id::text = $1 OR LOWER(COALESCE(f.emp_id, '')) = LOWER($1) OR LOWER(COALESCE(f.usr_id, '')) = LOWER($1)
       LIMIT 1`,
      [facultyOrUserId],
    );

    let userId: string;
    let userName: string = 'Staff Member';
    let userEmail: string = '';

    if (facRows.length > 0) {
      userId = facRows[0].user_id;
      userName = facRows[0].name;
      userEmail = facRows[0].email;

      // Clean (Admin) suffix from designation
      const cleanedDesignation = (facRows[0].designation || 'Faculty')
        .replace(/\s*\(\s*Admin\s*\)/gi, '')
        .trim() || 'Faculty';

      await this.ds.query(
        `UPDATE "${schema}".faculty 
         SET designation = $1, updated_at = NOW() 
         WHERE id = $2`,
        [cleanedDesignation, facRows[0].id],
      );
    } else {
      const uRows = await this.ds.query(
        `SELECT id, email, role FROM "${schema}".users WHERE id::text = $1 OR LOWER(email) = LOWER($1) LIMIT 1`,
        [facultyOrUserId],
      );
      if (uRows.length === 0) throw new NotFoundException('User / Staff not found in this institution');
      userId = uRows[0].id;
      userEmail = uRows[0].email;
    }

    // Revert user role to default FACULTY
    await this.ds.query(
      `UPDATE "${schema}".users SET role = $1, is_active = true, updated_at = NOW() WHERE id = $2`,
      [UserRole.FACULTY, userId],
    );

    this.logger.log(`Revoked Admin rights from user ${userId} (${userName}), reverted to FACULTY in ${slug}`);

    return {
      success: true,
      message: `Admin rights removed. ${userName || userEmail} reverted to default Faculty role.`,
      userId,
      role: UserRole.FACULTY,
      tenantSlug: slug,
    };
  }
}
