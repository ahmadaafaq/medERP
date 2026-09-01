import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateStudentDto, UpdateStudentDto, BulkLinkProfessionalDto, BulkLinkGroupDto, BulkCreateStudentsDto,
} from './dto/student-master.dto';

@Injectable()
export class StudentMasterService {
  private readonly logger = new Logger(StudentMasterService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private async resolveTenantSlug(tenantSlugOrCollege?: string): Promise<string> {
    if (!tenantSlugOrCollege) {
      return '';
    }
    if (tenantSlugOrCollege === 'srms') {
      return 'srms-cet-bareilly';
    }
    if (tenantSlugOrCollege === 'all') {
      return 'all';
    }
    const input = tenantSlugOrCollege.toLowerCase().trim();
    try {
      const tenants = await this.dataSource.query(
        `SELECT slug, code, id FROM public.tenants WHERE is_active = true`
      );
      const match = tenants.find(
        (t: any) =>
          t.slug.toLowerCase() === input ||
          t.id.toLowerCase() === input ||
          (t.code && t.code.toLowerCase() === input)
      );
      if (match) return match.slug;
    } catch (e) {}
    return input;
  }

  async listStudents(
    tenantSlug: string,
    query: {
      search?: string;
      collegeId?: string;
      courseId?: string;
      batchId?: string;
      branchId?: string;
      sessionId?: string;
      residencyType?: string;
      professionalPhase?: string;
      groupId?: string;
      linkedOnly?: string;
    },
    user?: any,
  ) {
    const colleges = await this.dataSource.query(
      `SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`
    ).catch(() => []);

    let targetSlugs: string[] = [];
    if (user && user.role && user.role !== 'SUPER_ADMIN' && user.tenantSlug) {
      targetSlugs = [user.tenantSlug];
    } else {
      const rawSlug = query.collegeId && query.collegeId !== 'all' ? query.collegeId : tenantSlug;
      const resolvedSlug = await this.resolveTenantSlug(rawSlug);

      targetSlugs = resolvedSlug === 'all'
        ? colleges.map((c: any) => c.slug).filter(Boolean)
        : [colleges.find((c: any) => c.slug === resolvedSlug || c.id === resolvedSlug || c.code === resolvedSlug)?.slug || resolvedSlug];
    }

    const allResults: any[] = [];

    for (const slug of targetSlugs) {
      if (!slug) continue;
      try {
        const params: any[] = [];
        let sql = `
          SELECT DISTINCT ON (s.id) s.id, s.name, s.rollno, s.registration_no, s.is_active, s.created_at, s.photo_url,
                 sa.college_name,
                 COALESCE(sa.course_code, s.course_cd) AS course_code,
                 sa.academic_session,
                 COALESCE(sa.batch_code, s.batch_cd) AS batch_code,
                 COALESCE(sa.batch_id, s.batch_id) AS batch_id,
                 sa.residency_type, sa.admission_type, sa.professional_id, sa.professional_phase,
                 COALESCE(sa.group_id, s.group_id) AS group_id, sa.group_code, sa.group_name,
                 sa.branch_id, sa.branch_code
          FROM students s
          LEFT JOIN student_admissions sa ON sa.student_id::text = s.id::text
          WHERE 1=1
        `;

        if (query.search) {
          params.push(`%${query.search}%`);
          sql += ` AND (s.name ILIKE $${params.length} OR s.rollno ILIKE $${params.length} OR s.registration_no ILIKE $${params.length})`;
        }
        if (query.courseId && query.courseId !== 'all') {
          params.push(query.courseId);
          const p1 = params.length;
          params.push(`%${query.courseId}%`);
          const p2 = params.length;
          sql += ` AND (sa.course_id::text = $${p1}::text OR sa.course_code::text = $${p1}::text OR sa.course_code ILIKE $${p2} OR s.course_cd::text = $${p1}::text)`;
        }
        if (query.batchId && query.batchId !== 'all') {
          params.push(query.batchId);
          const p1 = params.length;
          params.push(`%${query.batchId}%`);
          const p2 = params.length;
          sql += ` AND (sa.batch_id::text = $${p1}::text OR sa.batch_code::text = $${p1}::text OR sa.batch_code ILIKE $${p2} OR s.batch_cd::text = $${p1}::text OR s.admission_year::text = $${p1}::text)`;
        }
        if (query.branchId && query.branchId !== 'all') {
          params.push(query.branchId);
          const p1 = params.length;
          params.push(`%${query.branchId}%`);
          const p2 = params.length;
          sql += ` AND (sa.branch_id::text = $${p1} OR sa.branch_code = $${p1} OR sa.branch_name ILIKE $${p2} OR s.branch_id::text = $${p1} OR s.department_id::text = $${p1})`;
        }
        if (query.sessionId && query.sessionId !== 'all') {
          params.push(query.sessionId);
          const p1 = params.length;
          params.push(`%${query.sessionId}%`);
          const p2 = params.length;
          sql += ` AND (sa.session_id::text = $${p1} OR sa.academic_session ILIKE $${p2})`;
        }
        if (query.residencyType && query.residencyType !== 'all') {
          params.push(query.residencyType);
          sql += ` AND sa.residency_type = $${params.length}`;
        }
        if (query.groupId && query.groupId !== 'all') {
          params.push(query.groupId);
          sql += ` AND (sa.group_id::text = $${params.length} OR s.group_id::text = $${params.length} OR sa.group_code = $${params.length})`;
        }
        if (query.professionalPhase && query.professionalPhase !== 'all') {
          params.push(`%${query.professionalPhase}%`);
          sql += ` AND (sa.professional_phase ILIKE $${params.length} OR sa.professional_id::text ILIKE $${params.length})`;
          sql += ` AND sa.professional_id IS NOT NULL`;
        } else if (query.linkedOnly === 'true') {
          sql += ` AND sa.professional_id IS NOT NULL AND sa.professional_phase IS NOT NULL`;
        }

        sql += ` ORDER BY s.id, s.created_at DESC`;

        const rows = await this.tenantSchemaService.queryInTenant(slug, sql, params);
        const col = colleges.find((c: any) => c.slug === slug);
        rows.forEach((r: any) => {
          allResults.push({
            ...r,
            college_name: r.college_name || col?.name,
            college_slug: slug,
          });
        });
      } catch (e) {
        this.logger.warn(`Failed querying students in tenant ${slug}: ${e.message}`);
      }
    }

    allResults.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return allResults;
  }

  async getStudent(tenantSlug: string, id: string) {
    const rawSlug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.dataSource.query(
      `SELECT id, code, name, slug FROM public.tenants WHERE is_active = true`
    ).catch(() => []);

    let slug = rawSlug;
    if (rawSlug === 'all' || !rawSlug) {
      for (const col of colleges) {
        if (!col.slug) continue;
        try {
          const check = await this.tenantSchemaService.queryInTenant(
            col.slug,
            `SELECT id FROM students WHERE id = $1`,
            [id],
          );
          if (check.length > 0) {
            slug = col.slug;
            break;
          }
        } catch (e) {}
      }
    }

    if (!slug) throw new NotFoundException('Student not found (tenant not resolved)');
    const studentRows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM students WHERE id = $1`,
      [id],
    );
    if (!studentRows.length) throw new NotFoundException('Student not found');
    const student = studentRows[0];

    const [admissions, academics, neet, parents, addresses, documents, fees, hostel, transport, library, medical, bank, emergency] = await Promise.all([
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_admissions WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_academic_details WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_neet_details WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_parents WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_addresses WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_documents WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_fees WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_hostel WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_transport WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_library WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_medical WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_bank_accounts WHERE student_id = $1`, [id]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT * FROM student_emergency_contacts WHERE student_id = $1`, [id]),
    ]);

    // Unpack fields to match CreateStudentDto style for the React wizard edit mode
    const adm = admissions[0] || {};
    const aca = academics[0] || {};
    const nt = neet[0] || {};
    const par = parents[0] || {};
    const addr = addresses[0] || {};
    const hst = hostel[0] || {};
    const bnk = bank[0] || {};
    const lib = library[0] || {};
    const med = medical[0] || {};

    const nameParts = student.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    return {
      id: student.id,
      // Step 1: Academic & College Enrollment
      collegeId: adm.college_id,
      collegeName: adm.college_name,
      courseId: adm.course_id,
      courseCode: adm.course_code,
      professionalId: adm.professional_id,
      professionalPhase: adm.professional_phase,
      sessionId: adm.session_id,
      academicSession: adm.academic_session,
      batchId: adm.batch_id,
      batchCode: adm.batch_code,
      branchId: adm.branch_id,
      residencyType: adm.residency_type,
      admissionType: adm.admission_type,
      registrationNo: student.registration_no,
      rollNo: student.rollno || '',
      admissionDate: adm.admission_date,
      photoUrl: student.photo_url || '',
      // Step 2: Personal Information
      firstName,
      middleName,
      lastName,
      gender: 'Male', // Default or fetch if stored
      dob: '2002-05-15', // Default or fetch if stored
      bloodGroup: student.blood_group,
      nationality: 'Indian',
      religion: 'Hinduism',
      category: 'General',
      caste: '',
      aadhaarNo: '',
      panNo: '',
      passportNo: '',
      maritalStatus: 'Single',
      mobileNumber: student.phone,
      emailAddress: student.email || '',
      // Step 3: Parents & Addresses
      fatherName: par.father_name,
      fatherOccupation: par.father_occupation,
      fatherMobile: par.father_mobile,
      motherName: par.mother_name,
      motherOccupation: par.mother_occupation,
      motherMobile: par.mother_mobile,
      annualIncome: par.annual_income,
      permanentAddress1: addr.permanent_address_1,
      permanentAddress2: addr.permanent_address_2,
      permanentCity: addr.permanent_city,
      permanentDistrict: addr.permanent_district,
      permanentState: addr.permanent_state,
      permanentPincode: addr.permanent_pincode,
      sameAsPermanent: addr.same_as_permanent,
      // Step 4: Academic History & NEET
      class10Board: aca.class_10_board,
      class10Pct: aca.class_10_percentage,
      class12Board: aca.class_12_board,
      class12Physics: aca.class_12_physics,
      class12Chemistry: aca.class_12_chemistry,
      class12Biology: aca.class_12_biology,
      class12English: aca.class_12_english,
      class12Pct: aca.class_12_percentage,
      neetRollNo: nt.neet_roll_no,
      neetScore: nt.neet_score,
      neetPercentile: nt.neet_percentile,
      neetAirRank: nt.neet_air_rank,
      // Step 5: Hostel, Transport & Banking
      hostelRequired: hst.hostel_required,
      hostelName: hst.hostel_name,
      roomNumber: hst.room_number,
      busRequired: false,
      libraryCardNo: lib.library_card_no,
      bankName: bnk.bank_name,
      accountNumber: bnk.account_number,
      ifscCode: bnk.ifsc_code,
      // Step 6: Medical & Status
      vaccinationStatus: med.vaccination_status,
      admissionStatus: adm.status,
    };
  }

  async generateNextRegistrationNo(tenantSlug: string, sessionYear: string): Promise<string> {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const yearStr = sessionYear || new Date().getFullYear().toString();
    const pattern = `${yearStr}%`;
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT registration_no FROM students 
       WHERE registration_no LIKE $1 OR registration_no ~ '^[0-9]+$'
       ORDER BY registration_no DESC LIMIT 20`,
      [pattern],
    );

    let maxSuffix = 0;
    for (const r of rows) {
      if (r.registration_no && typeof r.registration_no === 'string') {
        const cleaned = r.registration_no.replace(/^[^\d]+/, '');
        if (cleaned.startsWith(yearStr)) {
          const num = parseInt(cleaned.slice(yearStr.length), 10);
          if (!isNaN(num) && num > maxSuffix) {
            maxSuffix = num;
          }
        } else {
          // If 8-digit numeric registration_no (e.g. 20260003)
          const match = r.registration_no.match(/^\d{4}(\d{4})$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSuffix) {
              maxSuffix = num;
            }
          }
        }
      }
    }

    const nextNum = maxSuffix + 1;
    const nextSuffix = nextNum.toString().padStart(4, '0');
    return `${yearStr}${nextSuffix}`;
  }

  async createStudent(tenantSlug: string, dto: CreateStudentDto) {
    const rawSlug = dto.collegeId || tenantSlug;
    let slug = await this.resolveTenantSlug(rawSlug);
    if (!slug || slug === 'all') throw new BadRequestException('Valid tenant identifier required for student creation');

    await this.tenantSchemaService.ensureLatestSchema(slug);
    const runner = await this.tenantSchemaService.getTenantRunner(slug);
    await runner.startTransaction();

    try {
      // 1. Generate Registration Number if not provided
      let regNo = dto.registrationNo;
      if (!regNo) {
        let yearStr = new Date().getFullYear().toString();
        if (dto.academicSession) {
          const match = dto.academicSession.match(/\d{4}/);
          if (match) yearStr = match[0];
        }
        regNo = await this.generateNextRegistrationNo(slug, yearStr);
      }

      // Check if registration number already exists
      const existingReg = await runner.query(`SELECT id FROM students WHERE registration_no = $1`, [regNo]);
      if (existingReg.length) {
        throw new BadRequestException(`Registration number ${regNo} already exists.`);
      }

      // 2. Create matching user record in users table for student login
      const studentEmail = dto.emailAddress?.trim() || `${regNo.toLowerCase()}@srms.ac.in`;
      const defaultHash = '$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX.'; // Hash for Password@123 / regNo
      const userRows = await runner.query(
        `INSERT INTO users (email, password_hash, role, onboarding_completed, must_change_password)
         VALUES ($1, $2, 'STUDENT', true, false)
         ON CONFLICT (email) DO UPDATE SET is_active = true
         RETURNING id`,
        [studentEmail.toLowerCase(), defaultHash],
      );
      const userId = userRows[0]?.id;

      // 3. Insert into students table with linked user_id
      const name = `${dto.firstName} ${dto.middleName ? dto.middleName + ' ' : ''}${dto.lastName}`.trim();
      const studentRows = await runner.query(
        `INSERT INTO students (
           user_id, name, rollno, registration_no, is_active, phone, blood_group, photo_url
         ) VALUES ($1, $2, $3, $4, true, $5, $6, $7) RETURNING id`,
        [
          userId || null,
          name,
          dto.rollNo || null,
          regNo,
          dto.mobileNumber || null,
          dto.bloodGroup || null,
          dto.photoUrl || null,
        ],
      );
      const studentId = studentRows[0].id;

      // 3. Insert into student_admissions
      await runner.query(
        `INSERT INTO student_admissions (
           student_id, college_id, college_name, course_id, course_code, professional_id, professional_phase,
           session_id, academic_session, batch_id, batch_code, branch_id, residency_type, admission_type, admission_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          studentId,
          dto.collegeId,
          dto.collegeName,
          dto.courseId,
          dto.courseCode,
          dto.professionalId || null,
          dto.professionalPhase || null,
          dto.sessionId || null,
          dto.academicSession || null,
          dto.batchId || null,
          dto.batchCode || null,
          dto.branchId || null,
          dto.residencyType || null,
          dto.admissionType || null,
          dto.admissionDate ? new Date(dto.admissionDate) : null,
        ],
      );

      // 4. Insert into student_academic_details
      await runner.query(
        `INSERT INTO student_academic_details (
           student_id, class_10_board, class_10_percentage, class_12_board,
           class_12_physics, class_12_chemistry, class_12_biology, class_12_english, class_12_percentage
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          studentId,
          dto.class10Board || null,
          dto.class10Pct || null,
          dto.class12Board || null,
          dto.class12Physics || null,
          dto.class12Chemistry || null,
          dto.class12Biology || null,
          dto.class12English || null,
          dto.class12Pct || null,
        ],
      );

      // 5. Insert into student_neet_details
      await runner.query(
        `INSERT INTO student_neet_details (
           student_id, neet_roll_no, neet_score, neet_percentile, neet_air_rank, neet_category_rank
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          studentId,
          dto.neetRollNo || null,
          dto.neetScore || null,
          dto.neetPercentile || null,
          dto.neetAirRank || null,
          null, // category rank
        ],
      );

      // 6. Insert into student_parents
      await runner.query(
        `INSERT INTO student_parents (
           student_id, father_name, father_occupation, father_mobile, mother_name, mother_occupation, mother_mobile, annual_income
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          studentId,
          dto.fatherName || null,
          dto.fatherOccupation || null,
          dto.fatherMobile || null,
          dto.motherName || null,
          dto.motherOccupation || null,
          dto.motherMobile || null,
          dto.annualIncome || null,
        ],
      );

      // 7. Insert into student_addresses
      await runner.query(
        `INSERT INTO student_addresses (
           student_id, permanent_address_1, permanent_address_2, permanent_city, permanent_district, permanent_state, permanent_pincode, same_as_permanent
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          studentId,
          dto.permanentAddress1 || null,
          dto.permanentAddress2 || null,
          dto.permanentCity || null,
          dto.permanentDistrict || null,
          dto.permanentState || null,
          dto.permanentPincode || null,
          dto.sameAsPermanent ?? false,
        ],
      );

      // 8. Insert into student_documents
      await runner.query(
        `INSERT INTO student_documents (
           student_id, passport_photo_url, student_signature_url, parent_signature_url,
           aadhaar_card_url, class_10_marksheet_url, class_12_marksheet_url, neet_score_card_url
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          studentId,
          dto.photoUrl || null,
          null,
          null,
          dto.aadhaarCardUrl || null,
          dto.class10MarksheetUrl || null,
          dto.class12MarksheetUrl || null,
          dto.neetScoreCardUrl || null,
        ],
      );

      // 9. Insert into student_fees
      await runner.query(
        `INSERT INTO student_fees (
           student_id, paid_fees, pending_fees, total_fees
         ) VALUES ($1, $2, $3, $4)`,
        [
          studentId,
          dto.paidFees || 0,
          (dto.totalFees || 0) - (dto.paidFees || 0),
          dto.totalFees || 0,
        ],
      );

      // 10. Insert into student_hostel
      await runner.query(
        `INSERT INTO student_hostel (
           student_id, hostel_required, hostel_name, room_number
         ) VALUES ($1, $2, $3, $4)`,
        [
          studentId,
          dto.hostelRequired ?? false,
          dto.hostelName || null,
          dto.roomNumber || null,
        ],
      );

      // 11. Insert into student_transport
      await runner.query(
        `INSERT INTO student_transport (
           student_id, bus_required, transport_route
         ) VALUES ($1, $2, $3)`,
        [
          studentId,
          dto.busRequired ?? false,
          dto.busRoute || null,
        ],
      );

      // 12. Insert into student_library
      await runner.query(
        `INSERT INTO student_library (
           student_id, library_card_no, rfid_tag
         ) VALUES ($1, $2, $3)`,
        [
          studentId,
          dto.libraryCardNo || null,
          null,
        ],
      );

      // 13. Insert into student_medical
      await runner.query(
        `INSERT INTO student_medical (
           student_id, medical_history, blood_group, allergies, emergency_medical_notes, vaccination_status
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          studentId,
          dto.medicalConditions || null,
          dto.bloodGroup || null,
          null,
          null,
          dto.vaccinationStatus || null,
        ],
      );

      // 14. Insert into student_bank_accounts
      await runner.query(
        `INSERT INTO student_bank_accounts (
           student_id, bank_name, account_number, ifsc_code, branch_name
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          studentId,
          dto.bankName || null,
          dto.accountNumber || null,
          dto.ifscCode || null,
          null,
        ],
      );

      // 15. Insert into student_emergency_contacts
      await runner.query(
        `INSERT INTO student_emergency_contacts (
           student_id, contact_name, relationship, phone_number, alternate_phone
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          studentId,
          dto.emergencyContactName || dto.fatherName || null,
          dto.emergencyRelationship || 'Parent',
          dto.emergencyContactMobile || dto.fatherMobile || null,
          null,
        ],
      );

      await runner.commitTransaction();
      this.logger.log(`[StudentMaster] Successfully created student: ${name} (${regNo}) in tenant ${slug}`);
      return {
        id: studentId,
        registrationNo: regNo,
        name,
        rollNo: dto.rollNo,
        collegeName: dto.collegeName,
        courseCode: dto.courseCode,
      };
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error(`[StudentMaster] Create student failed:`, err);
      throw err;
    } finally {
      await runner.release();
    }
  }

  async updateStudent(tenantSlug: string, id: string, dto: UpdateStudentDto) {
    const rawSlug = dto.collegeId || tenantSlug;
    let slug = await this.resolveTenantSlug(rawSlug);
    const colleges = await this.dataSource.query(`SELECT slug FROM public.tenants WHERE is_active = true`).catch(() => []);

    if (slug === 'all' || !slug) {
      for (const col of colleges) {
        if (!col.slug) continue;
        try {
          const check = await this.tenantSchemaService.queryInTenant(col.slug, `SELECT id FROM students WHERE id = $1`, [id]);
          if (check.length > 0) {
            slug = col.slug;
            break;
          }
        } catch (e) {}
      }
    }

    if (!slug) throw new NotFoundException('Tenant not resolved for student update');
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const runner = await this.tenantSchemaService.getTenantRunner(slug);
    await runner.startTransaction();

    try {
      const existing = await runner.query(`SELECT id FROM students WHERE id = $1`, [id]);
      if (!existing.length) {
        throw new NotFoundException('Student not found');
      }

      // 1. Update core students table
      const name = `${dto.firstName} ${dto.middleName ? dto.middleName + ' ' : ''}${dto.lastName}`.trim();
      await runner.query(
        `UPDATE students
         SET name = $1, rollno = $2, phone = $3, blood_group = $4,
             photo_url = COALESCE($5, photo_url),
             email = COALESCE($6, email),
             course_cd = COALESCE($7, course_cd),
             batch_cd = COALESCE($8, batch_cd),
             updated_at = NOW()
         WHERE id = $9`,
        [
          name,
          dto.rollNo || null,
          dto.mobileNumber || null,
          dto.bloodGroup || null,
          dto.photoUrl || null,
          dto.emailAddress || null,
          dto.courseCode || dto.courseId || null,
          dto.batchCode || dto.batchId || null,
          id,
        ],
      );

      // Also update linked user email if exists
      if (dto.emailAddress) {
        await runner.query(
          `UPDATE users u
           SET email = $1, updated_at = NOW()
           FROM students s
           WHERE s.id = $2 AND s.user_id = u.id`,
          [dto.emailAddress.toLowerCase().trim(), id],
        ).catch(() => {});
      }

      // 2. Upsert student_admissions
      await runner.query(
        `INSERT INTO student_admissions (
           student_id, college_id, college_name, course_id, course_code, professional_id, professional_phase,
           session_id, academic_session, batch_id, batch_code, branch_id, residency_type, admission_type, admission_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (student_id) DO UPDATE SET
           college_id = EXCLUDED.college_id,
           college_name = EXCLUDED.college_name,
           course_id = EXCLUDED.course_id,
           course_code = EXCLUDED.course_code,
           professional_id = EXCLUDED.professional_id,
           professional_phase = EXCLUDED.professional_phase,
           session_id = EXCLUDED.session_id,
           academic_session = EXCLUDED.academic_session,
           batch_id = EXCLUDED.batch_id,
           batch_code = EXCLUDED.batch_code,
           branch_id = EXCLUDED.branch_id,
           residency_type = EXCLUDED.residency_type,
           admission_type = EXCLUDED.admission_type,
           admission_date = EXCLUDED.admission_date`,
        [
          id,
          dto.collegeId || null,
          dto.collegeName || null,
          dto.courseId || null,
          dto.courseCode || null,
          dto.professionalId || null,
          dto.professionalPhase || null,
          dto.sessionId || null,
          dto.academicSession || null,
          dto.batchId || null,
          dto.batchCode || null,
          dto.branchId || null,
          dto.residencyType || null,
          dto.admissionType || null,
          dto.admissionDate ? new Date(dto.admissionDate) : null,
        ],
      );

      // 3. Upsert student_academic_details
      await runner.query(
        `INSERT INTO student_academic_details (
           student_id, class_10_board, class_10_percentage, class_12_board,
           class_12_physics, class_12_chemistry, class_12_biology, class_12_english, class_12_percentage
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (student_id) DO UPDATE SET
           class_10_board = EXCLUDED.class_10_board,
           class_10_percentage = EXCLUDED.class_10_percentage,
           class_12_board = EXCLUDED.class_12_board,
           class_12_physics = EXCLUDED.class_12_physics,
           class_12_chemistry = EXCLUDED.class_12_chemistry,
           class_12_biology = EXCLUDED.class_12_biology,
           class_12_english = EXCLUDED.class_12_english,
           class_12_percentage = EXCLUDED.class_12_percentage`,
        [
          id,
          dto.class10Board || null,
          dto.class10Pct || null,
          dto.class12Board || null,
          dto.class12Physics || null,
          dto.class12Chemistry || null,
          dto.class12Biology || null,
          dto.class12English || null,
          dto.class12Pct || null,
        ],
      );

      // 4. Upsert student_neet_details
      await runner.query(
        `INSERT INTO student_neet_details (
           student_id, neet_roll_no, neet_score, neet_percentile, neet_air_rank
         ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id) DO UPDATE SET
           neet_roll_no = EXCLUDED.neet_roll_no,
           neet_score = EXCLUDED.neet_score,
           neet_percentile = EXCLUDED.neet_percentile,
           neet_air_rank = EXCLUDED.neet_air_rank`,
        [
          id,
          dto.neetRollNo || null,
          dto.neetScore || null,
          dto.neetPercentile || null,
          dto.neetAirRank || null,
        ],
      );

      // 5. Upsert student_parents
      await runner.query(
        `INSERT INTO student_parents (
           student_id, father_name, father_occupation, father_mobile,
           mother_name, mother_occupation, mother_mobile, annual_income
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_id) DO UPDATE SET
           father_name = EXCLUDED.father_name,
           father_occupation = EXCLUDED.father_occupation,
           father_mobile = EXCLUDED.father_mobile,
           mother_name = EXCLUDED.mother_name,
           mother_occupation = EXCLUDED.mother_occupation,
           mother_mobile = EXCLUDED.mother_mobile,
           annual_income = EXCLUDED.annual_income`,
        [
          id,
          dto.fatherName || null,
          dto.fatherOccupation || null,
          dto.fatherMobile || null,
          dto.motherName || null,
          dto.motherOccupation || null,
          dto.motherMobile || null,
          dto.annualIncome || null,
        ],
      );

      // 6. Upsert student_addresses
      await runner.query(
        `INSERT INTO student_addresses (
           student_id, permanent_address_1, permanent_address_2, permanent_city,
           permanent_district, permanent_state, permanent_pincode, same_as_permanent
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_id) DO UPDATE SET
           permanent_address_1 = EXCLUDED.permanent_address_1,
           permanent_address_2 = EXCLUDED.permanent_address_2,
           permanent_city = EXCLUDED.permanent_city,
           permanent_district = EXCLUDED.permanent_district,
           permanent_state = EXCLUDED.permanent_state,
           permanent_pincode = EXCLUDED.permanent_pincode,
           same_as_permanent = EXCLUDED.same_as_permanent`,
        [
          id,
          dto.permanentAddress1 || null,
          dto.permanentAddress2 || null,
          dto.permanentCity || null,
          dto.permanentDistrict || null,
          dto.permanentState || null,
          dto.permanentPincode || null,
          dto.sameAsPermanent ?? false,
        ],
      );

      // 7. Upsert student_fees
      await runner.query(
        `INSERT INTO student_fees (
           student_id, paid_fees, pending_fees, total_fees
         ) VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id) DO UPDATE SET
           paid_fees = EXCLUDED.paid_fees,
           total_fees = EXCLUDED.total_fees,
           pending_fees = EXCLUDED.pending_fees`,
        [
          id,
          dto.paidFees || 0,
          (dto.totalFees || 0) - (dto.paidFees || 0),
          dto.totalFees || 0,
        ],
      );

      // 8. Upsert student_hostel
      await runner.query(
        `INSERT INTO student_hostel (
           student_id, hostel_required, hostel_name, room_number
         ) VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id) DO UPDATE SET
           hostel_required = EXCLUDED.hostel_required,
           hostel_name = EXCLUDED.hostel_name,
           room_number = EXCLUDED.room_number`,
        [dto.hostelRequired ?? false, dto.hostelName || null, dto.roomNumber || null, id],
      );

      // 9. Upsert student_emergency_contacts
      await runner.query(
        `INSERT INTO student_emergency_contacts (
           student_id, contact_name, relationship, phone_number
         ) VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id) DO UPDATE SET
           contact_name = EXCLUDED.contact_name,
           relationship = EXCLUDED.relationship,
           phone_number = EXCLUDED.phone_number`,
        [
          id,
          dto.emergencyContactName || dto.fatherName || null,
          dto.emergencyRelationship || 'Parent',
          dto.emergencyContactMobile || dto.fatherMobile || null,
        ],
      );

      // 10. Upsert student_bank_accounts
      await runner.query(
        `INSERT INTO student_bank_accounts (
           student_id, bank_name, account_number, ifsc_code
         ) VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id) DO UPDATE SET
           bank_name = EXCLUDED.bank_name,
           account_number = EXCLUDED.account_number,
           ifsc_code = EXCLUDED.ifsc_code`,
        [id, dto.bankName || null, dto.accountNumber || null, dto.ifscCode || null],
      );

      // 11. Upsert student_library
      await runner.query(
        `INSERT INTO student_library (
           student_id, library_card_no
         ) VALUES ($1, $2)
         ON CONFLICT (student_id) DO UPDATE SET
           library_card_no = EXCLUDED.library_card_no`,
        [id, dto.libraryCardNo || null],
      );

      // 12. Upsert student_medical
      await runner.query(
        `INSERT INTO student_medical (
           student_id, vaccination_status, blood_group
         ) VALUES ($1, $2, $3)
         ON CONFLICT (student_id) DO UPDATE SET
           vaccination_status = EXCLUDED.vaccination_status,
           blood_group = EXCLUDED.blood_group`,
        [id, dto.vaccinationStatus || null, dto.bloodGroup || null],
      );

      // 13. Upsert student_documents
      await runner.query(
        `INSERT INTO student_documents (
           student_id, passport_photo_url
         ) VALUES ($1, $2)
         ON CONFLICT (student_id) DO UPDATE SET
           passport_photo_url = COALESCE(EXCLUDED.passport_photo_url, passport_photo_url)`,
        [id, dto.photoUrl || null],
      );

      await runner.commitTransaction();
      return { success: true };
    } catch (err) {
      await runner.rollbackTransaction();
      throw err;
    } finally {
      await runner.release();
    }
  }

  async deleteStudent(tenantSlug: string, id: string) {
    let slug = await this.resolveTenantSlug(tenantSlug);
    const colleges = await this.dataSource.query(`SELECT slug FROM public.tenants WHERE is_active = true`).catch(() => []);
    if (slug === 'all' || !slug) {
      for (const col of colleges) {
        if (!col.slug) continue;
        try {
          const check = await this.tenantSchemaService.queryInTenant(col.slug, `SELECT id FROM students WHERE id = $1`, [id]);
          if (check.length > 0) {
            slug = col.slug;
            break;
          }
        } catch (e) {}
      }
    }
    if (!slug) throw new NotFoundException('Tenant not resolved for student delete');
    const schema = `tenant_${slug}`;
    const runner = await this.tenantSchemaService.getTenantRunner(slug);
    await runner.startTransaction();

    try {
      const studentRows = await runner.query(`SELECT user_id FROM students WHERE id = $1`, [id]);
      if (!studentRows.length) {
        throw new NotFoundException(`Student with ID ${id} not found.`);
      }
      const userId = studentRows[0].user_id;

      // 0. Clean up 2nd-level child tables (tables referencing logbook_entries, fee_records, etc.)
      const subChildQueries = [
        `DELETE FROM logbook_sign_offs WHERE entry_id IN (SELECT id FROM logbook_entries WHERE student_id = $1)`,
        `DELETE FROM logbook_comments WHERE entry_id IN (SELECT id FROM logbook_entries WHERE student_id = $1)`,
        `DELETE FROM logbook_evaluations WHERE entry_id IN (SELECT id FROM logbook_entries WHERE student_id = $1)`,
        `DELETE FROM logbook_attachments WHERE entry_id IN (SELECT id FROM logbook_entries WHERE student_id = $1)`,
        `DELETE FROM fee_payments WHERE student_id = $1 OR fee_record_id IN (SELECT id FROM student_fee_records WHERE student_id = $1)`,
        `DELETE FROM fee_receipts WHERE student_id = $1`,
        `DELETE FROM student_competency_results WHERE student_id = $1`,
      ];

      for (const q of subChildQueries) {
        try {
          await runner.query(`SAVEPOINT sp_sub`);
          await runner.query(q, [id]);
          await runner.query(`RELEASE SAVEPOINT sp_sub`);
        } catch (e) {
          try {
            await runner.query(`ROLLBACK TO SAVEPOINT sp_sub`);
          } catch (rErr) {}
        }
      }

      // Dynamically clean up ALL child tables referencing students(id) in this schema
      const fkTables = await runner.query(
        `SELECT tc.table_name, kcu.column_name 
         FROM information_schema.table_constraints AS tc 
         JOIN information_schema.key_column_usage AS kcu 
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema 
         JOIN information_schema.constraint_column_usage AS ccu 
           ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema 
         WHERE tc.constraint_type = 'FOREIGN KEY' 
           AND ccu.table_name = 'students' 
           AND tc.table_schema = $1`,
        [schema],
      );

      for (const fk of fkTables) {
        const tName = fk.table_name;
        const cName = fk.column_name;
        const spName = `sp_${tName.replace(/[^a-z0-9_]/gi, '')}`;
        try {
          await runner.query(`SAVEPOINT ${spName}`);
          await runner.query(`DELETE FROM "${tName}" WHERE "${cName}" = $1`, [id]);
          await runner.query(`RELEASE SAVEPOINT ${spName}`);
        } catch (e) {
          try {
            await runner.query(`ROLLBACK TO SAVEPOINT ${spName}`);
          } catch (rErr) {}
        }
      }

      await runner.query(`DELETE FROM students WHERE id = $1`, [id]);

      if (userId) {
        try {
          await runner.query(`SAVEPOINT sp_user`);
          await runner.query(`DELETE FROM users WHERE id = $1`, [userId]);
          await runner.query(`RELEASE SAVEPOINT sp_user`);
        } catch (e) {
          try {
            await runner.query(`ROLLBACK TO SAVEPOINT sp_user`);
          } catch (rErr) {}
        }
      }

      await runner.commitTransaction();
      this.logger.log(`[StudentMaster] Deleted student record ID: ${id} in tenant ${slug}`);
      return { success: true, message: 'Student profile deleted successfully' };
    } catch (err: any) {
      await runner.rollbackTransaction();
      this.logger.error(`[StudentMaster] Delete student failed:`, err);
      throw new BadRequestException(`Delete failed: ${err?.message || err}`);
    } finally {
      await runner.release();
    }
  }

  async bulkLinkProfessional(tenantSlug: string, dto: BulkLinkProfessionalDto) {
    let slug = await this.resolveTenantSlug(tenantSlug);
    if (!slug || slug === 'all') throw new BadRequestException('Valid tenant identifier required for bulk link');
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const runner = await this.tenantSchemaService.getTenantRunner(slug);
    await runner.startTransaction();

    try {
      if (!dto.studentIds || !dto.studentIds.length) {
        throw new BadRequestException('No student IDs provided for professional phase linking');
      }

      for (const studentId of dto.studentIds) {
        await runner.query(
          `UPDATE student_phase_progressions SET is_active = false WHERE student_id = $1`,
          [studentId],
        );

        const admRows = await runner.query(
          `SELECT professional_id, professional_phase, batch_id FROM student_admissions WHERE student_id = $1`,
          [studentId],
        );
        const currentAdm = admRows[0] || {};

        await runner.query(
          `INSERT INTO student_phase_progressions (
             student_id, batch_id, from_phase_id, from_phase_name, to_phase_id, to_phase_name, academic_year, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            studentId,
            dto.batchId || currentAdm.batch_id || null,
            currentAdm.professional_id || null,
            currentAdm.professional_phase || null,
            dto.professionalId,
            dto.professionalPhase,
            dto.academicYear || new Date().getFullYear().toString(),
          ],
        );
      }

      await runner.query(
        `UPDATE student_admissions
         SET professional_id = $1, professional_phase = $2
         WHERE student_id = ANY($3)`,
        [dto.professionalId, dto.professionalPhase, dto.studentIds],
      );

      await runner.commitTransaction();
      this.logger.log(`[StudentMaster] Promoted and linked ${dto.studentIds.length} students to phase: ${dto.professionalPhase} in tenant ${slug}`);
      return { success: true, count: dto.studentIds.length, activePhase: dto.professionalPhase };
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error(`[StudentMaster] Bulk link professional failed:`, err);
      throw err;
    } finally {
      await runner.release();
    }
  }

  async bulkLinkGroup(tenantSlug: string, dto: BulkLinkGroupDto) {
    let slug = await this.resolveTenantSlug(tenantSlug);
    if (!slug || slug === 'all') throw new BadRequestException('Valid tenant identifier required for bulk link');
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const runner = await this.tenantSchemaService.getTenantRunner(slug);
    await runner.startTransaction();

    try {
      if (!dto.studentIds || !dto.studentIds.length) {
        throw new BadRequestException('No student IDs provided for group allocation');
      }

      await runner.query(`
        ALTER TABLE student_admissions 
        ADD COLUMN IF NOT EXISTS group_id UUID,
        ADD COLUMN IF NOT EXISTS group_code VARCHAR(50),
        ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
      `);

      await runner.query(`
        ALTER TABLE students 
        ADD COLUMN IF NOT EXISTS group_id UUID;
      `);

      let gCode = dto.groupCode;
      let gName = dto.groupName;
      if (!gCode || !gName) {
        const grpRows = await runner.query(`SELECT code, name FROM groups_master WHERE id = $1`, [dto.groupId]);
        if (grpRows.length > 0) {
          gCode = gCode || grpRows[0].code;
          gName = gName || grpRows[0].name;
        }
      }

      await runner.query(
        `UPDATE student_admissions
         SET group_id = $1, group_code = $2, group_name = $3
         WHERE student_id = ANY($4)`,
        [dto.groupId, gCode || 'A', gName || 'Group A', dto.studentIds],
      );

      await runner.query(
        `UPDATE students
         SET group_id = $1
         WHERE id = ANY($2)`,
        [dto.groupId, dto.studentIds],
      );

      await runner.commitTransaction();
      this.logger.log(`[StudentMaster] Linked ${dto.studentIds.length} students to group: ${gName || gCode} in tenant ${slug}`);
      return { success: true, count: dto.studentIds.length, activeGroup: gName || gCode };
    } catch (err) {
      await runner.rollbackTransaction();
      this.logger.error(`[StudentMaster] Bulk link group failed:`, err);
      throw err;
    } finally {
      await runner.release();
    }
  }

  /**
   * Sync and upsert live student records from SRMS into tenant schema
   */
  async syncLiveStudents(tenantSlug: string, students: any[]): Promise<{ syncedCount: number }> {
    const slug = await this.resolveTenantSlug(tenantSlug);
    if (!students || !students.length) return { syncedCount: 0 };

    const schema = `tenant_${slug}`;
    let syncedCount = 0;

    for (const s of students) {
      try {
        const regNo = String(s.registration_no || '').trim();
        const rollNo = String(s.rollno || '').trim();
        const name = String(s.name || '').trim();
        const photoUrl = s.photo_url || null;
        const gender = String(s.gender || 'Male').toUpperCase();
        const mobile = String(s.mobile_number || s.mobile || '').trim();
        if (!regNo && !rollNo && !name) continue;

        const check = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id FROM "${schema}".students WHERE registration_no = $1 OR rollno = $2 LIMIT 1`,
          [regNo, rollNo],
        ).catch(() => []);

        let studentId: string;
        if (check.length > 0) {
          studentId = check[0].id;
          await this.tenantSchemaService.queryInTenant(
            slug,
            `UPDATE "${schema}".students 
             SET name = $1, photo_url = COALESCE($2, photo_url), rollno = $3, registration_no = $4, 
                 gender = COALESCE($5, gender), mobile_number = COALESCE($6, mobile_number),
                 course_cd = $7, batch_cd = $8, is_active = true, updated_at = NOW() 
             WHERE id = $9`,
            [name, photoUrl, rollNo, regNo, gender, mobile || null, s.course_cd || '2', s.batch_name || s.batch_id || '2025', studentId],
          ).catch(() => null);
        } else {
          const ins = await this.tenantSchemaService.queryInTenant(
            slug,
            `INSERT INTO "${schema}".students (name, registration_no, rollno, photo_url, gender, mobile_number, course_cd, batch_cd, branch_id, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
            [name, regNo, rollNo, photoUrl, gender, mobile || null, s.course_cd || '2', s.batch_name || s.batch_id || '2025', s.branch_id || '1'],
          ).catch(() => []);
          studentId = ins[0]?.id;
        }

        if (studentId) {
          // 1. Admissions Table
          const admCheck = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT student_id FROM "${schema}".student_admissions WHERE student_id = $1 LIMIT 1`,
            [studentId],
          ).catch(() => []);

          if (admCheck.length > 0) {
            await this.tenantSchemaService.queryInTenant(
              slug,
              `UPDATE "${schema}".student_admissions 
               SET college_name = $1, course_code = $2, academic_session = $3, batch_code = $4, batch_id = $5,
                   branch_id = $6, branch_code = $7, residency_type = COALESCE($8, residency_type), admission_type = COALESCE($9, admission_type)
               WHERE student_id = $10`,
              [
                s.college_name || 'SRMS CET, BAREILLY',
                s.course_code || 'B.Tech',
                s.academic_session || '2025-2026',
                s.batch_code || '2025 Batch',
                s.batch_id || '18',
                s.branch_id || '1',
                s.branch_code || '1',
                s.residency_type || 'Hosteller',
                s.admission_type || 'Regular Admission',
                studentId,
              ],
            ).catch(() => null);
          } else {
            await this.tenantSchemaService.queryInTenant(
              slug,
              `INSERT INTO "${schema}".student_admissions (
                student_id, college_name, course_code, academic_session, batch_code, batch_id, residency_type, admission_type, branch_id, branch_code
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                studentId,
                s.college_name || 'SRMS CET, BAREILLY',
                s.course_code || 'B.Tech',
                s.academic_session || '2025-2026',
                s.batch_code || '2025 Batch',
                s.batch_id || '18',
                s.residency_type || 'Hosteller',
                s.admission_type || 'Regular Admission',
                s.branch_id || '1',
                s.branch_code || '1',
              ],
            ).catch(() => null);
          }

          // 2. Parents Table
          if (s.father_name || s.mother_name) {
            const pCheck = await this.tenantSchemaService.queryInTenant(
              slug,
              `SELECT student_id FROM "${schema}".student_parents WHERE student_id = $1 LIMIT 1`,
              [studentId],
            ).catch(() => []);
            if (pCheck.length > 0) {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `UPDATE "${schema}".student_parents SET father_name = COALESCE($1, father_name), mother_name = COALESCE($2, mother_name) WHERE student_id = $3`,
                [s.father_name || null, s.mother_name || null, studentId],
              ).catch(() => null);
            } else {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `INSERT INTO "${schema}".student_parents (student_id, father_name, mother_name) VALUES ($1, $2, $3)`,
                [studentId, s.father_name || null, s.mother_name || null],
              ).catch(() => null);
            }
          }

          // 3. Addresses Table
          if (s.city || s.state || s.address) {
            const aCheck = await this.tenantSchemaService.queryInTenant(
              slug,
              `SELECT student_id FROM "${schema}".student_addresses WHERE student_id = $1 LIMIT 1`,
              [studentId],
            ).catch(() => []);
            if (aCheck.length > 0) {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `UPDATE "${schema}".student_addresses SET permanent_city = COALESCE($1, permanent_city), permanent_state = COALESCE($2, permanent_state), permanent_address_1 = COALESCE($3, permanent_address_1) WHERE student_id = $4`,
                [s.city || 'Bareilly', s.state || 'Uttar Pradesh', s.address || null, studentId],
              ).catch(() => null);
            } else {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `INSERT INTO "${schema}".student_addresses (student_id, permanent_city, permanent_state, permanent_address_1) VALUES ($1, $2, $3, $4)`,
                [studentId, s.city || 'Bareilly', s.state || 'Uttar Pradesh', s.address || null],
              ).catch(() => null);
            }
          }

          // 4. Documents Table (Photo URL)
          if (photoUrl) {
            const dCheck = await this.tenantSchemaService.queryInTenant(
              slug,
              `SELECT student_id FROM "${schema}".student_documents WHERE student_id = $1 LIMIT 1`,
              [studentId],
            ).catch(() => []);
            if (dCheck.length > 0) {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `UPDATE "${schema}".student_documents SET passport_photo_url = $1 WHERE student_id = $2`,
                [photoUrl, studentId],
              ).catch(() => null);
            } else {
              await this.tenantSchemaService.queryInTenant(
                slug,
                `INSERT INTO "${schema}".student_documents (student_id, passport_photo_url) VALUES ($1, $2)`,
                [studentId, photoUrl],
              ).catch(() => null);
            }
          }

          syncedCount++;
        }
      } catch (err) {
        this.logger.warn(`Error syncing live student ${s.name}: ${err?.message}`);
      }
    }

    return { syncedCount };
  }

  async getHustleBoard(tenantSlug: string, query: { filterMode?: string; departmentId?: string; limit?: number } = {}) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;
    const limit = Math.min(Number(query.limit) || 200, 500);

    try {
      const rawQuery = `
        WITH student_base AS (
          SELECT DISTINCT ON (COALESCE(s.registration_no, s.rollno, s.id::text))
                 s.id, s.name, s.rollno, s.registration_no, s.course_cd, s.batch_cd, s.photo_url, s.user_id::text AS user_id,
                 0 AS srms_attd_pct,
                 c.name AS course_name,
                 COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, 'Batch ' || s.batch_cd, s.batch_cd) AS batch_name
          FROM "${schema}".students s
          LEFT JOIN "${schema}".courses c ON (c.course_cd::text = s.course_cd::text OR c.id::text = s.course_cd::text)
          LEFT JOIN "${schema}".batches b ON (b.id::text = s.batch_id::text OR (b.batch_cd::text = s.batch_cd::text AND b.course_cd::text = s.course_cd::text))
          ORDER BY COALESCE(s.registration_no, s.rollno, s.id::text), s.id DESC
        ),
        repo_metrics AS (
          SELECT DISTINCT ON (COALESCE(r.student_reg_no, r.student_name))
                 COALESCE(r.student_reg_no, r.student_name) AS match_key,
                 r.student_reg_no,
                 r.student_name,
                 r.title AS project_title,
                 COALESCE(NULLIF(regexp_replace(r.score::text, '[^0-9.]', '', 'g'), '')::numeric, 0) AS project_score,
                 COALESCE(r.grade, 'N/A') AS project_grade,
                 r.incubation_status,
                 COALESCE(NULLIF(regexp_replace(r.funding_amount::text, '[^0-9.]', '', 'g'), '')::numeric, 0) AS funding_amount,
                 (r.incubation_status IN ('Incubated', 'Selected', 'Funded')) AS is_incubated
          FROM "${schema}".repositories r
          ORDER BY COALESCE(r.student_reg_no, r.student_name), NULLIF(regexp_replace(r.score::text, '[^0-9.]', '', 'g'), '')::numeric DESC NULLS LAST
        ),
        exam_metrics AS (
          SELECT sr.student_id,
                 MAX(ep.name) AS exam_name,
                 ROUND(AVG((NULLIF(regexp_replace(sr.marks_obtained::text, '[^0-9.]', '', 'g'), '')::numeric / NULLIF(NULLIF(regexp_replace(ep.max_marks::text, '[^0-9.]', '', 'g'), '')::numeric, 0)) * 100), 1) AS theory_pct
          FROM "${schema}".student_results sr
          JOIN "${schema}".examination_papers ep ON ep.id::text = sr.paper_id::text
          GROUP BY sr.student_id
        ),
        att_metrics AS (
          SELECT ar.student_id,
                 COUNT(ar.id) AS total_classes,
                 COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT', 'LATE', 'P', 'L')) AS attended_classes,
                 ROUND((COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT', 'LATE', 'P', 'L')) * 100.0) / NULLIF(COUNT(ar.id), 0), 1) AS attendance_pct
          FROM "${schema}".attendance_records ar
          GROUP BY ar.student_id
        ),
        chat_metrics AS (
          SELECT cm.sender_id::text AS sender_id, COUNT(cm.id) AS chat_count
          FROM "${schema}".chat_messages cm
          GROUP BY cm.sender_id::text
        ),
        mini_project_metrics AS (
          SELECT 
            p.student_id,
            COUNT(p.id) AS mini_projects_count,
            MAX(p.title) AS mini_project_title,
            MAX(COALESCE(NULLIF(regexp_replace(p.final_percentage::text, '[^0-9.]', '', 'g'), '')::numeric, NULLIF(regexp_replace(p.guide_marks::text, '[^0-9.]', '', 'g'), '')::numeric, 0)) AS mini_project_score,
            MAX(COALESCE(p.final_grade, 'A')) AS mini_project_grade,
            MAX(COALESCE(p.project_status, 'IN_PROGRESS')) AS mini_project_status,
            COALESCE(MAX(wl.logs_count), 0) AS mini_project_logs_count,
            true AS has_mini_project
          FROM "${schema}".logbook_mini_projects p
          LEFT JOIN (
            SELECT student_id, COUNT(*) AS logs_count
            FROM "${schema}".logbook_weekly_logs
            GROUP BY student_id
          ) wl ON (wl.student_id::text = p.student_id::text)
          GROUP BY p.student_id
        )
        SELECT sb.id, sb.name, sb.rollno, sb.registration_no, sb.course_name, sb.batch_name, sb.photo_url,
               rm.project_title,
               COALESCE(rm.project_score, 0) AS project_score,
               COALESCE(rm.project_grade, 'N/A') AS project_grade,
               rm.incubation_status,
               rm.funding_amount,
               COALESCE(rm.is_incubated, false) AS is_incubated,
               COALESCE(mpm.mini_projects_count, 0) AS mini_projects_covered,
               mpm.mini_project_title,
               COALESCE(mpm.mini_project_score, 0) AS mini_project_score,
               COALESCE(mpm.mini_project_grade, 'N/A') AS mini_project_grade,
               COALESCE(mpm.mini_project_status, 'IN_PROGRESS') AS mini_project_status,
               COALESCE(mpm.mini_project_logs_count, 0) AS mini_project_logs_count,
               COALESCE(mpm.has_mini_project, false) AS has_mini_project,
               em.theory_pct,
               em.exam_name,
               ROUND(COALESCE(am.attendance_pct, sb.srms_attd_pct::numeric, 0), 1) AS attendance_pct,
               COALESCE(am.total_classes, CASE WHEN sb.srms_attd_pct::numeric > 0 THEN 1 ELSE 0 END) AS total_classes,
               COALESCE(cm.chat_count, 0) AS chat_count,
               (COALESCE(cm.chat_count, 0) > 0) AS is_chat_active,
               ROUND(
                 (
                   COALESCE(rm.project_score * 0.35, 0) +
                   COALESCE(mpm.mini_project_score * 0.15, 0) +
                   COALESCE(em.theory_pct * 0.35, 0) +
                   COALESCE(COALESCE(am.attendance_pct, sb.srms_attd_pct::numeric, 0) * 0.10, 0) +
                   CASE WHEN rm.incubation_status = 'Incubated' THEN 10
                        WHEN rm.incubation_status IN ('Selected', 'Funded') THEN 8
                        WHEN rm.incubation_status = 'Under Review' THEN 4
                        ELSE 0 END +
                   CASE WHEN COALESCE(cm.chat_count, 0) > 0 THEN 5 ELSE 0 END
                 )::numeric, 1
               ) AS composite_score
        FROM student_base sb
        LEFT JOIN repo_metrics rm ON (rm.student_reg_no = sb.registration_no OR rm.student_reg_no = sb.rollno OR rm.student_name ILIKE sb.name)
        LEFT JOIN mini_project_metrics mpm ON (mpm.student_id::text = sb.id::text OR mpm.student_id::text = sb.registration_no OR mpm.student_id::text = sb.rollno)
        LEFT JOIN exam_metrics em ON em.student_id::text = sb.id::text
        LEFT JOIN att_metrics am ON am.student_id::text = sb.id::text
        LEFT JOIN chat_metrics cm ON cm.sender_id::text = sb.user_id::text
        WHERE (rm.project_score > 0 OR em.theory_pct > 0 OR sb.srms_attd_pct::numeric > 0 OR am.total_classes > 0 OR rm.incubation_status IS NOT NULL OR mpm.has_mini_project = true)
        ORDER BY composite_score DESC, rm.project_score DESC NULLS LAST, em.theory_pct DESC NULLS LAST
        LIMIT $1
      `;

      const rows = await this.dataSource.query(rawQuery, [limit]);

      return {
        success: true,
        data: rows.map((r: any, idx: number) => {
          const logsCount = Number(r.mini_project_logs_count || 0);
          const miniStatus = r.mini_project_status || 'IN_PROGRESS';
          const miniCoveredCount = Number(r.mini_projects_covered || (r.has_mini_project ? 1 : 0));
          let miniProgressText = '0 Logs';
          if (miniStatus === 'APPROVED' || miniStatus === 'COMPLETED' || Number(r.mini_project_score) >= 80) {
            miniProgressText = 'Approved (100%)';
          } else if (logsCount > 0) {
            miniProgressText = `${logsCount}/4 Weekly Logs`;
          } else if (miniCoveredCount > 0) {
            miniProgressText = 'Logbook In Progress';
          } else {
            miniProgressText = '0 Covered';
          }

          return {
            rank: idx + 1,
            id: r.id,
            name: r.name,
            rollNo: r.rollno || r.registration_no,
            regNo: r.registration_no || r.rollno,
            course: r.course_name || 'College Program',
            batch: r.batch_name || 'Batch 2025',
            photoUrl: r.photo_url,
            attendancePct: Number(r.attendance_pct || 0),
            totalClasses: Number(r.total_classes || 0),
            theoryScore: r.theory_pct !== null && r.theory_pct !== undefined ? Number(r.theory_pct) : null,
            examName: r.exam_name || null,
            projectTitle: r.project_title || null,
            projectGrade: r.project_grade || 'N/A',
            projectScorePct: Number(r.project_score || 0),
            isIncubationSelected: Boolean(r.is_incubated),
            incubationStatus: r.incubation_status || null,
            fundingAmount: Number(r.funding_amount || 0),
            hasMiniProject: Boolean(miniCoveredCount > 0 && r.has_mini_project),
            miniProjectsCovered: miniCoveredCount,
            miniProjectTitle: r.mini_project_title || null,
            miniProjectStatus: miniStatus,
            miniProjectGrade: r.mini_project_grade || 'A',
            miniProjectScore: Number(r.mini_project_score || 0),
            miniProjectProgress: miniProgressText,
            isChatActive: Boolean(r.is_chat_active),
            compositeScore: Number(r.composite_score || 0),
            tier: idx === 0 ? 'Tier S' : idx < 3 ? 'Tier A+' : 'Tier A',
            tierColor: idx === 0 ? 'from-amber-400 to-yellow-600' : 'from-indigo-500 to-purple-600',
            hustleTag: idx === 0 ? '👑 High Academic Scorer & Innovator' : '🎖️ Active College Contributor',
          };
        }),
      };
    } catch (err: any) {
      this.logger.error(`Failed to fetch authentic hustle board: ${err.message}`);
      return { success: false, data: [] };
    }
  }

  async bulkCreateStudents(tenantSlug: string, dto: BulkCreateStudentsDto) {
    const rawList = Array.isArray(dto.students) ? dto.students : [];
    if (!rawList.length) {
      throw new BadRequestException('No student records provided in payload');
    }

    const results = {
      success: true,
      total: rawList.length,
      createdCount: 0,
      updatedCount: 0,
      failedCount: 0,
      created: [] as any[],
      failed: [] as any[],
    };

    for (let index = 0; index < rawList.length; index++) {
      const row = rawList[index];
      const rawCollege = row.collegeId || row.college_id || row.college_slug || row.collegeCode || row.colg_cd || tenantSlug || 'srms-cet-bareilly';
      const slug = await this.resolveTenantSlug(rawCollege);
      if (!slug || slug === 'all') {
        results.failed.push({
          row: index + 1,
          name: row.name || `${row.firstName || ''} ${row.lastName || ''}`,
          rollno: row.rollno || row.roll_no,
          error: 'Could not resolve valid tenant college',
        });
        results.failedCount++;
        continue;
      }

      await this.tenantSchemaService.ensureLatestSchema(slug);
      const runner = await this.tenantSchemaService.getTenantRunner(slug);
      await runner.startTransaction();

      try {
        const rollNo = String(row.rollno || row.roll_no || row.rollNo || '').trim() || null;
        let regNo = String(row.registration_no || row.registrationNo || row.regNo || '').trim();
        const firstName = String(row.firstName || row.first_name || '').trim();
        const middleName = String(row.middleName || row.middle_name || '').trim();
        const lastName = String(row.lastName || row.last_name || '').trim();
        let name = String(row.name || '').trim();
        if (!name && (firstName || lastName)) {
          name = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();
        }
        if (!name) {
          name = rollNo ? `Student ${rollNo}` : `Student ${index + 1}`;
        }

        const email = String(row.email || row.emailAddress || row.email_address || '').trim().toLowerCase();
        const phone = String(row.phone || row.mobileNumber || row.mobile_number || '').trim() || null;
        const bloodGroup = String(row.bloodGroup || row.blood_group || '').trim() || null;
        const gender = String(row.gender || 'Male').trim();
        const dob = row.dob || row.dateOfBirth || row.date_of_birth || null;
        const courseCd = String(row.courseCode || row.course_code || row.courseId || row.course_cd || '2').trim();
        const branchId = row.branchId || row.branch_id || row.branchCode || row.branch_cd || null;
        const batchCd = String(row.batchCode || row.batch_code || row.batchId || row.batch_cd || row.batch_year || "'18'").trim();
        const residencyType = String(row.residencyType || row.residency_type || 'Day Scholar').trim();
        const collegeName = String(row.collegeName || row.college_name || 'SRMS CET Bareilly').trim();
        const photoUrl = row.photoUrl || row.photo_url || null;

        // Auto-generate regNo if missing
        if (!regNo) {
          const yearStr = new Date().getFullYear().toString();
          regNo = await this.generateNextRegistrationNo(slug, yearStr);
        }

        const studentEmail = email || `${regNo.toLowerCase()}@srms.ac.in`;
        const defaultHash = '$2b$12$eImiTXuWVxfM37uY4JANjO5e.eZ.W8h8W/2i.tE8v9jX.'; // Default Password@123

        // Upsert User
        const userRows = await runner.query(
          `INSERT INTO users (email, password_hash, role, onboarding_completed, must_change_password)
           VALUES ($1, $2, 'STUDENT', true, false)
           ON CONFLICT (email) DO UPDATE SET is_active = true
           RETURNING id`,
          [studentEmail, defaultHash],
        );
        const userId = userRows[0]?.id;

        // Check if student already exists by registration_no or rollno
        let studentId: string | null = null;
        let isUpdate = false;

        const existRows = await runner.query(
          `SELECT id FROM students WHERE registration_no = $1 OR (rollno IS NOT NULL AND rollno = $2)`,
          [regNo, rollNo],
        );

        if (existRows.length > 0) {
          studentId = existRows[0].id;
          isUpdate = true;
          await runner.query(
            `UPDATE students
             SET name = $1, rollno = COALESCE($2, rollno), phone = COALESCE($3, phone),
                 blood_group = COALESCE($4, blood_group), photo_url = COALESCE($5, photo_url),
                 course_cd = $6, batch_cd = $7, updated_at = NOW()
             WHERE id = $8`,
            [name, rollNo, phone, bloodGroup, photoUrl, courseCd, batchCd, studentId],
          );
        } else {
          const insertStudent = await runner.query(
            `INSERT INTO students (
               user_id, name, rollno, registration_no, is_active, phone, blood_group, photo_url, course_cd, batch_cd
             ) VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, $9) RETURNING id`,
            [userId || null, name, rollNo, regNo, phone, bloodGroup, photoUrl, courseCd, batchCd],
          );
          studentId = insertStudent[0].id;
        }

        // Upsert child tables
        // 1. student_admissions
        await runner.query(
          `INSERT INTO student_admissions (
             student_id, college_id, college_name, course_id, course_code,
             batch_id, batch_code, branch_id, residency_type, admission_date
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (student_id) DO UPDATE SET
             college_id = EXCLUDED.college_id,
             college_name = EXCLUDED.college_name,
             course_id = EXCLUDED.course_id,
             course_code = EXCLUDED.course_code,
             batch_id = EXCLUDED.batch_id,
             batch_code = EXCLUDED.batch_code,
             branch_id = EXCLUDED.branch_id,
             residency_type = EXCLUDED.residency_type`,
          [
            studentId,
            rawCollege,
            collegeName,
            courseCd,
            courseCd,
            batchCd,
            batchCd,
            branchId ? String(branchId) : null,
            residencyType,
            dob ? new Date(dob) : new Date(),
          ],
        );

        // 2. student_parents
        const fatherName = row.fatherName || row.father_name || null;
        const fatherMobile = row.fatherMobile || row.father_mobile || null;
        const motherName = row.motherName || row.mother_name || null;
        if (fatherName || motherName || fatherMobile) {
          await runner.query(
            `INSERT INTO student_parents (
               student_id, father_name, father_mobile, mother_name
             ) VALUES ($1, $2, $3, $4)
             ON CONFLICT (student_id) DO UPDATE SET
               father_name = COALESCE(EXCLUDED.father_name, student_parents.father_name),
               father_mobile = COALESCE(EXCLUDED.father_mobile, student_parents.father_mobile),
               mother_name = COALESCE(EXCLUDED.mother_name, student_parents.mother_name)`,
            [studentId, fatherName, fatherMobile, motherName],
          );
        }

        // 3. student_addresses
        const address1 = row.address || row.permanentAddress || row.permanent_address || row.permanent_address_1 || null;
        const city = row.city || row.permanentCity || row.permanent_city || null;
        const state = row.state || row.permanentState || row.permanent_state || null;
        const pincode = row.pincode || row.permanentPincode || row.permanent_pincode || null;
        if (address1 || city || state || pincode) {
          await runner.query(
            `INSERT INTO student_addresses (
               student_id, permanent_address_1, permanent_city, permanent_state, permanent_pincode, same_as_permanent
             ) VALUES ($1, $2, $3, $4, $5, true)
             ON CONFLICT (student_id) DO UPDATE SET
               permanent_address_1 = COALESCE(EXCLUDED.permanent_address_1, student_addresses.permanent_address_1),
               permanent_city = COALESCE(EXCLUDED.permanent_city, student_addresses.permanent_city),
               permanent_state = COALESCE(EXCLUDED.permanent_state, student_addresses.permanent_state),
               permanent_pincode = COALESCE(EXCLUDED.permanent_pincode, student_addresses.permanent_pincode)`,
            [studentId, address1, city, state, pincode],
          );
        }

        // 4. student_documents
        if (photoUrl) {
          await runner.query(
            `INSERT INTO student_documents (
               student_id, passport_photo_url
             ) VALUES ($1, $2)
             ON CONFLICT (student_id) DO UPDATE SET
               passport_photo_url = COALESCE(EXCLUDED.passport_photo_url, student_documents.passport_photo_url)`,
            [studentId, photoUrl],
          );
        }

        await runner.commitTransaction();

        if (isUpdate) {
          results.updatedCount++;
        } else {
          results.createdCount++;
        }
        results.created.push({ id: studentId, rollno: rollNo, registration_no: regNo, name });
      } catch (err: any) {
        await runner.rollbackTransaction();
        this.logger.error(`[StudentMaster] Bulk row ${index + 1} failed: ${err.message}`);
        results.failed.push({
          row: index + 1,
          name: row.name || `${row.firstName || ''} ${row.lastName || ''}`,
          rollno: row.rollno || row.roll_no,
          error: err.message,
        });
        results.failedCount++;
      } finally {
        await runner.release();
      }
    }

    return results;
  }
}

