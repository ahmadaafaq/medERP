import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateStudentDto, UpdateStudentDto, BulkLinkProfessionalDto, BulkLinkGroupDto } from './dto/student-master.dto';

@Injectable()
export class StudentMasterService {
  private readonly logger = new Logger(StudentMasterService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private async resolveTenantSlug(tenantSlugOrCollege?: string): Promise<string> {
    if (!tenantSlugOrCollege || tenantSlugOrCollege === 'srms') {
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
          LEFT JOIN student_admissions sa ON sa.student_id = s.id
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
          sql += ` AND (sa.course_id::text = $${p1} OR sa.course_code = $${p1} OR sa.course_code ILIKE $${p2} OR s.course_cd = $${p1})`;
        }
        if (query.batchId && query.batchId !== 'all') {
          params.push(query.batchId);
          const p1 = params.length;
          params.push(`%${query.batchId}%`);
          const p2 = params.length;
          sql += ` AND (sa.batch_id::text = $${p1} OR sa.batch_code = $${p1} OR sa.batch_code ILIKE $${p2} OR s.batch_cd = $${p1} OR s.admission_year::text = $${p1})`;
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

    slug = slug || 'srms-cet-bareilly';
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
    if (slug === 'all') slug = 'srms-cet-bareilly';

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

    slug = slug || 'srms-cet-bareilly';
    await this.tenantSchemaService.ensureLatestSchema(slug);
    const runner = await this.tenantSchemaService.getTenantRunner(slug);
    await runner.startTransaction();

    try {
      const existing = await runner.query(`SELECT id FROM students WHERE id = $1`, [id]);
      if (!existing.length) {
        throw new NotFoundException('Student not found');
      }

      // Update core students table
      const name = `${dto.firstName} ${dto.middleName ? dto.middleName + ' ' : ''}${dto.lastName}`.trim();
      await runner.query(
        `UPDATE students
         SET name = $1, rollno = $2, phone = $3, blood_group = $4, photo_url = $5, updated_at = NOW()
         WHERE id = $6`,
        [name, dto.rollNo || null, dto.mobileNumber || null, dto.bloodGroup || null, dto.photoUrl || null, id],
      );

      // Update student_admissions
      await runner.query(
        `UPDATE student_admissions
         SET college_id = $1, college_name = $2, course_id = $3, course_code = $4, professional_id = $5, professional_phase = $6,
             session_id = $7, academic_session = $8, batch_id = $9, batch_code = $10, branch_id = $11, residency_type = $12, admission_type = $13, admission_date = $14
         WHERE student_id = $15`,
        [
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
          id,
        ],
      );

      // Update student_academic_details
      await runner.query(
        `UPDATE student_academic_details
         SET class_10_board = $1, class_10_percentage = $2, class_12_board = $3,
             class_12_physics = $4, class_12_chemistry = $5, class_12_biology = $6, class_12_english = $7, class_12_percentage = $8
         WHERE student_id = $9`,
        [
          dto.class10Board || null,
          dto.class10Pct || null,
          dto.class12Board || null,
          dto.class12Physics || null,
          dto.class12Chemistry || null,
          dto.class12Biology || null,
          dto.class12English || null,
          dto.class12Pct || null,
          id,
        ],
      );

      // Update student_neet_details
      await runner.query(
        `UPDATE student_neet_details
         SET neet_roll_no = $1, neet_score = $2, neet_percentile = $3, neet_air_rank = $4
         WHERE student_id = $5`,
        [
          dto.neetRollNo || null,
          dto.neetScore || null,
          dto.neetPercentile || null,
          dto.neetAirRank || null,
          id,
        ],
      );

      // Update student_parents
      await runner.query(
        `UPDATE student_parents
         SET father_name = $1, father_occupation = $2, father_mobile = $3, mother_name = $4, mother_occupation = $5, mother_mobile = $6, annual_income = $7
         WHERE student_id = $8`,
        [
          dto.fatherName || null,
          dto.fatherOccupation || null,
          dto.fatherMobile || null,
          dto.motherName || null,
          dto.motherOccupation || null,
          dto.motherMobile || null,
          dto.annualIncome || null,
          id,
        ],
      );

      // Update student_addresses
      await runner.query(
        `UPDATE student_addresses
         SET permanent_address_1 = $1, permanent_address_2 = $2, permanent_city = $3, permanent_district = $4, permanent_state = $5, permanent_pincode = $6, same_as_permanent = $7
         WHERE student_id = $8`,
        [
          dto.permanentAddress1 || null,
          dto.permanentAddress2 || null,
          dto.permanentCity || null,
          dto.permanentDistrict || null,
          dto.permanentState || null,
          dto.permanentPincode || null,
          dto.sameAsPermanent ?? false,
          id,
        ],
      );

      // Update student_fees
      await runner.query(
        `UPDATE student_fees
         SET paid_fees = $1, total_fees = $2, pending_fees = $3
         WHERE student_id = $4`,
        [
          dto.paidFees || 0,
          dto.totalFees || 0,
          (dto.totalFees || 0) - (dto.paidFees || 0),
          id,
        ],
      );

      // Update student_hostel
      await runner.query(
        `UPDATE student_hostel
         SET hostel_required = $1, hostel_name = $2, room_number = $3
         WHERE student_id = $4`,
        [dto.hostelRequired ?? false, dto.hostelName || null, dto.roomNumber || null, id],
      );

      // Update student_emergency_contacts
      await runner.query(
        `UPDATE student_emergency_contacts
         SET contact_name = $1, relationship = $2, phone_number = $3
         WHERE student_id = $4`,
        [
          dto.emergencyContactName || dto.fatherName || null,
          dto.emergencyRelationship || 'Parent',
          dto.emergencyContactMobile || dto.fatherMobile || null,
          id,
        ],
      );

      // Update student_bank_accounts
      await runner.query(
        `UPDATE student_bank_accounts
         SET bank_name = $1, account_number = $2, ifsc_code = $3
         WHERE student_id = $4`,
        [dto.bankName || null, dto.accountNumber || null, dto.ifscCode || null, id],
      );

      // Update student_library
      await runner.query(
        `UPDATE student_library
         SET library_card_no = $1
         WHERE student_id = $2`,
        [dto.libraryCardNo || null, id],
      );

      // Update student_medical
      await runner.query(
        `UPDATE student_medical
         SET vaccination_status = $1
         WHERE student_id = $2`,
        [dto.vaccinationStatus || null, id],
      );

      // Update student_documents
      await runner.query(
        `UPDATE student_documents
         SET passport_photo_url = COALESCE($1, passport_photo_url)
         WHERE student_id = $2`,
        [dto.photoUrl || null, id],
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
    slug = slug || 'srms-cet-bareilly';
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
    if (slug === 'all') slug = 'srms-cet-bareilly';
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
    if (slug === 'all') slug = 'srms-cet-bareilly';
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
}

