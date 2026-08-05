import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  CreateStudentDto, CreateFacultyDto,
  UpdateStudentDto, UpdateFacultyDto, BulkCreateStudentsDto,
} from './dto/user.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums/role.enum';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ═══════════════════════════════════════════════════════════════
  //  STUDENTS
  // ═══════════════════════════════════════════════════════════════

  async getStudents(tenantSlug: string, pagination: PaginationDto, filters: {
    search?: string; batchId?: string; departmentId?: string;
  } = {}) {
    const schema = `tenant_${tenantSlug}`;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['s.is_active = true'];
    const params: any[] = [];
    let i = 1;

    if (filters.search) {
      conditions.push(`(s.name ILIKE $${i} OR s.rollno ILIKE $${i})`);
      params.push(`%${filters.search}%`);
      i++;
    }
    if (filters.batchId) {
      conditions.push(`s.batch_id = $${i++}`);
      params.push(filters.batchId);
    }
    if (filters.departmentId) {
      conditions.push(`s.department_id = $${i++}`);
      params.push(filters.departmentId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT s.id, s.rollno, s.name, s.photo_url, s.batch_cd, s.course_cd,
                s.phone, s.admission_year, s.batch_id, s.department_id,
                u.email, u.is_active, u.created_at
         FROM "${schema}".students s
         JOIN "${schema}".users u ON u.id = s.user_id
         ${where}
         ORDER BY s.name ASC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      ),
      this.ds.query(
        `SELECT COUNT(*) FROM "${schema}".students s
         JOIN "${schema}".users u ON u.id = s.user_id
         ${where}`,
        params,
      ),
    ]);

    return paginate(rows, parseInt(countRows[0].count, 10), pagination);
  }

  async getStudentById(tenantSlug: string, id: string) {
    const schema = `tenant_${tenantSlug}`;
    const rows = await this.ds.query(
      `SELECT s.*, u.email, u.is_active, u.created_at,
              d.name AS department_name, b.code AS batch_code
       FROM "${schema}".students s
       JOIN "${schema}".users u ON u.id = s.user_id
       LEFT JOIN "${schema}".departments d ON d.id = s.department_id
       LEFT JOIN "${schema}".batches b ON b.id = s.batch_id
       WHERE s.id = $1`,
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
       FROM "${schema}".students s WHERE s.user_id = u.id AND s.id = $1`,
      [id],
    );
    await this.ds.query(
      `UPDATE "${schema}".students SET is_active = NOT is_active WHERE id=$1`,
      [id],
    );

    return { id, isActive: !student.is_active };
  }

  // ═══════════════════════════════════════════════════════════════
  //  FACULTY / HOD / CLERK
  // ═══════════════════════════════════════════════════════════════

  async getFaculty(tenantSlug: string, pagination: PaginationDto, filters: {
    search?: string; departmentId?: string; role?: UserRole; staffType?: string; isActive?: string;
  } = {}) {
    const schema = `tenant_${tenantSlug}`;
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
    if (filters.departmentId) {
      conditions.push(`f.department_id = $${i++}`);
      params.push(filters.departmentId);
    }
    if (filters.role) {
      conditions.push(`u.role = $${i++}`);
      params.push(filters.role);
    }
    if (filters.staffType) {
      conditions.push(`f.staff_type = $${i++}`);
      params.push(filters.staffType);
    }
    if (filters.isActive !== undefined) {
      conditions.push(`f.is_active = $${i++}`);
      params.push(filters.isActive === 'true');
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT f.id, f.emp_id, f.name, f.designation, f.photo_url,
                f.phone, f.department_id, f.subject_id, f.gender, f.experience, f.staff_type, f.is_active,
                u.email, u.role, u.is_active as user_active,
                d.name AS department_name, s.name AS subject_name
         FROM "${schema}".faculty f
         JOIN "${schema}".users u ON u.id = f.user_id
         LEFT JOIN "${schema}".departments d ON d.id = f.department_id
         LEFT JOIN "${schema}".subjects s ON s.id = f.subject_id
         ${where}
         ORDER BY f.name ASC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      ),
      this.ds.query(
        `SELECT COUNT(*) FROM "${schema}".faculty f
         JOIN "${schema}".users u ON u.id = f.user_id
         LEFT JOIN "${schema}".departments d ON d.id = f.department_id
         LEFT JOIN "${schema}".subjects s ON s.id = f.subject_id
         ${where}`,
        params,
      ),
    ]);

    return paginate(rows, parseInt(countRows[0].count, 10), pagination);
  }

  async getFacultyById(tenantSlug: string, id: string) {
    const schema = `tenant_${tenantSlug}`;
    const rows = await this.ds.query(
      `SELECT f.*, u.email, u.role, u.is_active as user_active, u.last_login_at,
              d.name AS department_name, s.name AS subject_name
       FROM "${schema}".faculty f
       JOIN "${schema}".users u ON u.id = f.user_id
       LEFT JOIN "${schema}".departments d ON d.id = f.department_id
       LEFT JOIN "${schema}".subjects s ON s.id = f.subject_id
       WHERE f.id = $1`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException('Faculty not found');
    return rows[0];
  }

  private isUUID(str?: string | null): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async createFaculty(tenantSlug: string, dto: CreateFacultyDto) {
    const schema = `tenant_${tenantSlug}`;

    const empCheck = await this.ds.query(
      `SELECT id FROM "${schema}".faculty WHERE emp_id = $1`,
      [dto.empId],
    );
    if (empCheck.length) throw new ConflictException(`Emp ID '${dto.empId}' already exists`);

    const emailCheck = await this.ds.query(
      `SELECT id FROM "${schema}".users WHERE email = $1`,
      [dto.email.toLowerCase()],
    );
    if (emailCheck.length) throw new ConflictException(`Email '${dto.email}' already in use`);

    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Map role safely (handle ADMIN alias -> COLLEGE_ADMIN)
    let role: UserRole = dto.role || UserRole.FACULTY;
    if ((dto.role as any) === 'ADMIN') role = UserRole.COLLEGE_ADMIN;

    const userRows = await this.ds.query(
      `INSERT INTO "${schema}".users (email, password_hash, role, must_change_password, is_active)
       VALUES ($1,$2,$3,true,COALESCE($4, true)) RETURNING id`,
      [dto.email.toLowerCase(), hash, role, dto.isActive ?? true],
    );
    const userId = userRows[0].id;

    const validDeptId = this.isUUID(dto.departmentId) ? dto.departmentId : null;
    const validSubjectId = this.isUUID(dto.subjectId) ? dto.subjectId : null;

    const facultyRows = await this.ds.query(
      `INSERT INTO "${schema}".faculty
         (user_id, emp_id, name, department_id, subject_id, designation, qualification, phone, gender, experience, staff_type, photo_url, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,COALESCE($13, true))
       RETURNING id, emp_id, name`,
      [
        userId, dto.empId, dto.name,
        validDeptId, validSubjectId, dto.designation || null,
        dto.qualification || null, dto.phone || null,
        dto.gender || null, dto.experience || null,
        dto.staffType || 'Faculty', dto.photoUrl || null,
        dto.isActive ?? true,
      ],
    );

    this.logger.log(`Faculty created: ${dto.empId} [${role}] in tenant ${tenantSlug}`);
    return { ...facultyRows[0], email: dto.email, role };
  }

  async updateFaculty(tenantSlug: string, id: string, dto: UpdateFacultyDto) {
    const schema = `tenant_${tenantSlug}`;
    const faculty = await this.getFacultyById(tenantSlug, id);

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

      if (userUpdates.length) {
        userParams.push(faculty.user_id);
        await this.ds.query(
          `UPDATE "${schema}".users SET ${userUpdates.join(', ')} WHERE id = $${uIdx}`,
          userParams,
        );
      }
    }

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    const validDeptId = dto.departmentId !== undefined ? (this.isUUID(dto.departmentId) ? dto.departmentId : null) : undefined;
    const validSubjectId = dto.subjectId !== undefined ? (this.isUUID(dto.subjectId) ? dto.subjectId : null) : undefined;

    const map: Record<string, any> = {
      name: dto.name, designation: dto.designation,
      qualification: dto.qualification, phone: dto.phone,
      departmentId: validDeptId, subjectId: validSubjectId,
      gender: dto.gender, experience: dto.experience,
      staffType: dto.staffType, photoUrl: dto.photoUrl,
    };
    const colMap: Record<string, string> = {
      name: 'name', designation: 'designation',
      qualification: 'qualification', phone: 'phone',
      departmentId: 'department_id', subjectId: 'subject_id',
      gender: 'gender', experience: 'experience',
      staffType: 'staff_type', photoUrl: 'photo_url',
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
         FROM "${schema}".faculty f WHERE f.user_id = u.id AND f.id = $2`,
        [dto.isActive, id],
      );
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

    return this.getFacultyById(tenantSlug, id);
  }

  async deleteFaculty(tenantSlug: string, id: string) {
    const schema = `tenant_${tenantSlug}`;
    const faculty = await this.getFacultyById(tenantSlug, id);

    // Delete user record (cascades to faculty due to ON DELETE CASCADE)
    await this.ds.query(
      `DELETE FROM "${schema}".users WHERE id = $1`,
      [faculty.user_id],
    );
    return { success: true, message: 'Faculty member deleted successfully' };
  }

  // ═══════════════════════════════════════════════════════════════
  //  DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════

  async getDepartments(tenantSlug: string) {
    const schema = `tenant_${tenantSlug}`;
    return this.ds.query(
      `SELECT d.*, f.name AS hod_name
       FROM "${schema}".departments d
       LEFT JOIN "${schema}".users u ON u.id = d.hod_user_id
       LEFT JOIN "${schema}".faculty f ON f.user_id = u.id
       WHERE d.is_active = true
       ORDER BY d.name ASC`,
    );
  }

  async createDepartment(tenantSlug: string, data: { code: string; name: string; type: string }) {
    const schema = `tenant_${tenantSlug}`;
    const rows = await this.ds.query(
      `INSERT INTO "${schema}".departments (code, name, type) VALUES ($1,$2,$3)
       ON CONFLICT (code) DO NOTHING RETURNING id, code, name`,
      [data.code, data.name, data.type],
    );
    if (!rows.length) throw new ConflictException(`Department code '${data.code}' already exists`);
    return rows[0];
  }

  // ═══════════════════════════════════════════════════════════════
  //  BATCHES
  // ═══════════════════════════════════════════════════════════════

  async getBatches(tenantSlug: string, departmentId?: string) {
    const schema = `tenant_${tenantSlug}`;
    const where = departmentId ? `WHERE b.department_id = $1` : '';
    return this.ds.query(
      `SELECT b.*, d.name AS department_name
       FROM "${schema}".batches b
       LEFT JOIN "${schema}".departments d ON d.id = b.department_id
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
}
