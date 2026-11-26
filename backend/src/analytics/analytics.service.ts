import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) { }

  async resolveTenantSlug(tenantSlug?: string): Promise<string> {
    if (!tenantSlug) return '';
    const clean = tenantSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    const found = await this.ds.query(
      `SELECT slug FROM public.tenants WHERE LOWER(slug) = $1 OR id::text = $1 OR code = $1 LIMIT 1`,
      [clean],
    ).catch(() => []);
    return found[0]?.slug || clean;
  }

  async getCollegeKpis(tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    if (!slug) return { stats: [], totalStudents: 0, totalFaculty: 0, attendanceRate: 0 };
    const schema = `tenant_${slug}`;

    // 1. Tenant & College details
    const tenantInfo = await this.ds.query(
      `SELECT id, code, name, slug FROM public.tenants WHERE LOWER(slug) = $1 LIMIT 1`,
      [slug.toLowerCase()],
    ).catch(() => []);
    const college = tenantInfo[0] || { code: '1', name: slug.toUpperCase(), slug };

    // 2. Counts & Active percentages
    const [studentRes, totalStudentRes, facultyRes, deptRes, examRes] = await Promise.all([
      this.tenantSchemaService.queryInTenant(slug, `SELECT COUNT(*) as count FROM students WHERE is_active = true`).catch(() => [{ count: 0 }]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT COUNT(*) as count FROM students`).catch(() => [{ count: 0 }]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT COUNT(*) as count FROM faculty WHERE is_active = true`).catch(() => [{ count: 0 }]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT COUNT(*) as count FROM departments WHERE is_active = true`).catch(() => [{ count: 0 }]),
      this.tenantSchemaService.queryInTenant(slug, `SELECT COUNT(DISTINCT id) as count FROM examination_papers`).catch(() => [{ count: 0 }]),
    ]);

    const totalStudents = parseInt(studentRes[0]?.count || 0, 10);
    const totalAllStudents = parseInt(totalStudentRes[0]?.count || 0, 10);
    const totalFaculty = parseInt(facultyRes[0]?.count || 0, 10);
    const totalDepartments = parseInt(deptRes[0]?.count || 0, 10);
    const totalExams = parseInt(examRes[0]?.count || 0, 10);
    const activeStudentPercentage =
      totalAllStudents > 0
        ? `${((totalStudents / totalAllStudents) * 100).toFixed(1)}%`
        : '100%';

    // 3. Admin & Faculty Punch IN / OUT for Current Date
    const todayDate = new Date();
    const todayDateStr = todayDate.toISOString().split('T')[0];
    const todayDisplayDate = todayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const punchLogs = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT fp.id, fp.punch_time, fp.punch_type, fp.device_id,
              f.name as faculty_name, f.emp_id as faculty_code
       FROM faculty_punch_logs fp
       LEFT JOIN faculty f ON f.id::text = fp.faculty_id::text
       WHERE DATE(fp.punch_time) = CURRENT_DATE
       ORDER BY fp.punch_time ASC`
    ).catch(() => []);

    let punchInTime = '--';
    let punchOutTime = '--';
    let punchStatus = 'Ready';

    if (punchLogs.length > 0) {
      const inLog = punchLogs.find((p: any) => p.punch_type === 'IN');
      const outLog = punchLogs.filter((p: any) => p.punch_type === 'OUT').pop();
      if (inLog) {
        const d = new Date(inLog.punch_time);
        punchInTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        punchStatus = 'Present / On Duty';
      }
      if (outLog) {
        const d = new Date(outLog.punch_time);
        punchOutTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        punchStatus = 'Punched Out';
      }
    }

    // 4. Marks Results (Evaluated student assessment marks from PostgreSQL)
    const results = await this.ds.query(
      `SELECT sr.id, sr.marks_obtained, sr.practical_mark, sr.is_pass, sr.eval_status, sr.created_at,
              s.name as student_name, s.rollno as roll_no,
              ep.name as paper_name, ep.code as paper_code, COALESCE(ep.max_marks, 100) as max_marks
       FROM "${schema}".student_results sr
       LEFT JOIN "${schema}".students s ON s.id::text = sr.student_id::text
       LEFT JOIN "${schema}".examination_papers ep ON ep.id::text = sr.paper_id::text
       WHERE sr.eval_status = 'EVALUATED' OR sr.marks_obtained IS NOT NULL
       ORDER BY sr.created_at DESC
       LIMIT 10`
    ).catch((err) => {
      console.error('[Analytics] Results query error:', err.message);
      return [];
    });

    const totalEvaluated = results.length;
    let avgMarks = 0;
    let passRate = '0%';
    let maxMarks = 100;
    if (totalEvaluated > 0) {
      const sum = results.reduce((acc: number, curr: any) => acc + (parseFloat(curr.marks_obtained) || 0), 0);
      avgMarks = parseFloat((sum / totalEvaluated).toFixed(1));
      const passedCount = results.filter((r: any) => r.is_pass).length;
      passRate = `${Math.round((passedCount / totalEvaluated) * 100)}%`;
      maxMarks = Math.max(...results.map((r: any) => Number(r.max_marks) || 100));
    }

    // 5. Timetable Schedule for College & Departments
    const deptInfo = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT id, name, code FROM departments WHERE is_active = true ORDER BY name ASC LIMIT 1`
    ).catch(() => []);
    const departmentName = deptInfo[0]?.name || `${college.name} Academic Department`;

    const timetableRows = await this.ds.query(
      `SELECT DISTINCT ON (ts.day_of_week, ts.start_time, ts.subject_id, ts.faculty_id, ts.room)
              ts.id, ts.day_of_week, ts.start_time, ts.end_time, ts.room,
              s.name as subject_name, s.code as subject_code,
              f.name as faculty_name, f.emp_id as faculty_code,
              d.name as department_name
       FROM "${schema}".timetable_slots ts
       LEFT JOIN "${schema}".subjects s ON s.id::text = ts.subject_id::text
       LEFT JOIN "${schema}".faculty f ON f.id::text = ts.faculty_id::text
       LEFT JOIN "${schema}".departments d ON d.id::text = ts.department_id::text
       ORDER BY ts.day_of_week, ts.start_time, ts.subject_id, ts.faculty_id, ts.room, ts.id DESC
       LIMIT 20`
    ).catch(() => []);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const seenSlotKeys = new Set<string>();
    const formattedSlots: any[] = [];

    for (const r of timetableRows) {
      const dayName = dayNames[Number(r.day_of_week)] || `Day ${r.day_of_week}`;
      const timeRange = `${String(r.start_time || '09:00').slice(0, 5)} - ${String(r.end_time || '10:00').slice(0, 5)}`;
      const subjectName = r.subject_name || 'Subject Lecture';
      const facultyName = r.faculty_name || 'Faculty Member';
      const room = r.room || 'Lecture Hall';

      const slotKey = `${r.day_of_week}_${timeRange}_${subjectName}_${facultyName}_${room}`;
      if (seenSlotKeys.has(slotKey)) continue;
      seenSlotKeys.add(slotKey);

      formattedSlots.push({
        id: r.id,
        dayName,
        dayOfWeek: Number(r.day_of_week),
        startTime: String(r.start_time || '09:00').slice(0, 5),
        endTime: String(r.end_time || '10:00').slice(0, 5),
        timeRange,
        subjectName,
        subjectCode: r.subject_code || 'SUB',
        facultyName,
        facultyCode: r.faculty_code || 'FAC',
        room,
        departmentName: r.department_name || departmentName,
      });
    }

    return {
      success: true,
      college: {
        id: college.id,
        code: college.code,
        name: college.name,
        slug: college.slug,
        schema,
      },
      kpis: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalExams,
        activeStudentPercentage,
        monthlyFeeRevenue: '₹0',
      },
      adminPunch: {
        date: todayDateStr,
        displayDate: todayDisplayDate,
        punchIn: punchInTime,
        punchOut: punchOutTime,
        status: punchStatus,
        device: 'SRMS-BIOMETRIC-01',
      },
      marksResults: {
        totalEvaluated,
        averageMarks: avgMarks,
        maxMarks,
        passingRate: passRate,
        recentList: results.map((r: any) => ({
          id: r.id || r.roll_no,
          studentName: r.student_name || 'Student',
          rollNo: r.roll_no || 'N/A',
          paperName: r.paper_name || 'Assessment Paper',
          paperCode: r.paper_code || 'EXAM',
          marksObtained: String(r.marks_obtained || 0),
          maxMarks: String(r.max_marks || 100),
          percentage: `${((parseFloat(r.marks_obtained || 0) / (parseFloat(r.max_marks) || 100)) * 100).toFixed(1)}%`,
          status: r.eval_status || (r.is_pass ? 'EVALUATED' : 'PENDING'),
          evaluatedAt: r.created_at || new Date().toISOString(),
        })),
      },
      timetable: {
        hasSchedule: formattedSlots.length > 0,
        departmentExists: totalDepartments > 0,
        departmentName,
        totalSlots: formattedSlots.length,
        slots: formattedSlots,
      },
    };
  }

  async recordPunch(dto: { punchType: 'IN' | 'OUT'; facultyId?: string; time?: string }, tenantSlug?: string) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    const schema = `tenant_${slug}`;

    const faculty = await this.ds.query(`SELECT id FROM "${schema}".faculty LIMIT 1`).catch(() => []);
    const facultyId = dto.facultyId || faculty[0]?.id;

    if (!facultyId) {
      return { success: false, message: 'No faculty record found for punch logging' };
    }

    const punchTime = dto.time ? new Date(dto.time) : new Date();
    await this.ds.query(
      `INSERT INTO "${schema}".faculty_punch_logs (id, faculty_id, punch_time, punch_type, device_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'SRMS-PORTAL-WEB', NOW())`,
      [facultyId, punchTime, dto.punchType]
    );

    return {
      success: true,
      message: `Punch ${dto.punchType} recorded successfully at ${punchTime.toLocaleTimeString()}`,
      punchType: dto.punchType,
      punchTime: punchTime.toISOString(),
    };
  }

  /**
   * Compute multi-dimensional academic compliance report across 9 pillars:
   * 1. CO-PO Matrix Mapping compliance (Subject wise)
   * 2. Timetable Up-to-date
   * 3. Question Bank & Blooms taxonomy
   * 4. Question Design Paper
   * 5. Approvals (QP & Timetable)
   * 6. Lesson Plan Material Updating
   * 7. Academic Chats (optional)
   * 8. Academic Portfolio (Seminars, Tutorials, Mini Projects)
   * 9. Attendance
   *
   * Scoped globally for Admin, and scoped to linked courses/branches for HOD.
   */
  async getAcademicComplianceReport(
    tenantSlug?: string,
    filter?: {
      departmentId?: string;
      courseCd?: string;
      batchId?: string;
      semester?: string;
      section?: string;
      hodUserId?: string;
    },
  ) {
    const slug = await this.resolveTenantSlug(tenantSlug);
    if (!slug) {
      return {
        collegeName: 'Institution',
        collegeCode: '1',
        tenantSlug: '',
        generatedAt: new Date().toISOString(),
        overallScore: 0,
        overallStatus: 'NEEDS_ATTENTION',
        pillars: {
          copoMapping: { score: 0, label: 'CO-PO Mapping', total: 0, compliant: 0 },
          timetable: { score: 0, label: 'Timetable Up-to-date', total: 0, compliant: 0 },
          questionBank: { score: 0, label: 'Question Bank', total: 0, compliant: 0 },
          questionDesign: { score: 0, label: 'Question Design Papers', total: 0, compliant: 0 },
          approvals: { score: 0, label: 'Academic Approvals', total: 0, compliant: 0 },
          lessonPlan: { score: 0, label: 'Lesson Plan Materials', total: 0, compliant: 0 },
          chats: { score: 0, label: 'Academic Chats', total: 0, compliant: 0 },
          portfolio: { score: 0, label: 'Academic Portfolio', total: 0, compliant: 0 },
          attendance: { score: 0, label: 'Attendance', total: 0, compliant: 0 },
        },
        departments: [],
      };
    }

    const schema = `tenant_${slug}`;

    // 1. Institution details
    const tenantInfo = await this.ds.query(
      `SELECT id, code, name, slug FROM public.tenants WHERE LOWER(slug) = $1 LIMIT 1`,
      [slug.toLowerCase()],
    ).catch(() => []);
    const college = tenantInfo[0] || { code: '1', name: slug.toUpperCase(), slug };

    // 2. Fetch all academic departments and courses (exclude non-academic admin cells like SPORTS/SECURITY)
    let deptQuery = `
      SELECT d.id as department_id, d.code as department_code, d.name as department_name,
             COALESCE(d.branch_cd, d.code) as branch_cd,
             COALESCE(d.course_cd, c.course_cd, c.code) as course_cd,
             COALESCE(c.name, d.course_name, d.name) as course_name,
             d.hod_user_id, u.name as hod_name
      FROM "${schema}".departments d
      LEFT JOIN "${schema}".courses c ON (c.course_cd = d.course_cd OR c.code = d.course_cd OR c.id::text = d.course_cd)
      LEFT JOIN "${schema}".users u ON u.id::text = d.hod_user_id::text
      WHERE d.is_active = true AND (d.course_cd IS NOT NULL OR d.branch_cd IS NOT NULL)
    `;
    const deptsRaw = await this.ds.query(deptQuery).catch(() => []);

    let filteredDepts = Array.isArray(deptsRaw) ? deptsRaw : [];

    // Filter by HOD user ID if requested (scopes to HOD's linked departments/branches)
    if (filter?.hodUserId) {
      const hodIdStr = String(filter.hodUserId).trim().toLowerCase();
      const matchedByHod = filteredDepts.filter(d => 
        String(d.hod_user_id || '').toLowerCase() === hodIdStr ||
        String(d.hod_name || '').toLowerCase().includes(hodIdStr)
      );

      if (matchedByHod.length > 0) {
        filteredDepts = matchedByHod;
      } else {
        // Fallback: check if faculty table links this user/faculty to a department
        const facRes = await this.ds.query(
          `SELECT department_id FROM "${schema}".faculty WHERE id::text = $1 OR user_id::text = $1 OR emp_id = $1 LIMIT 1`,
          [filter.hodUserId],
        ).catch(() => []);
        if (facRes[0]?.department_id) {
          const matchedByFacDept = filteredDepts.filter(d => String(d.department_id) === String(facRes[0].department_id));
          if (matchedByFacDept.length > 0) {
            filteredDepts = matchedByFacDept;
          }
        }
      }
    }

    // Filter by course or department if specified
    if (filter?.courseCd) {
      filteredDepts = filteredDepts.filter(d => 
        String(d.course_cd).toLowerCase() === String(filter.courseCd).toLowerCase()
      );
    }
    if (filter?.departmentId) {
      filteredDepts = filteredDepts.filter(d => 
        String(d.department_id) === String(filter.departmentId) ||
        String(d.department_code) === String(filter.departmentId) ||
        String(d.branch_cd) === String(filter.departmentId)
      );
    }

    // If no active departments found, synthesize from matching course (or all courses if no course filter)
    if (filteredDepts.length === 0) {
      const coursesRes = filter?.courseCd
        ? await this.ds.query(`SELECT code, course_cd, name FROM "${schema}".courses WHERE is_active = true AND (LOWER(course_cd) = LOWER($1) OR LOWER(code) = LOWER($1)) LIMIT 1`, [filter.courseCd]).catch(() => [])
        : await this.ds.query(`SELECT code, course_cd, name FROM "${schema}".courses WHERE is_active = true LIMIT 10`).catch(() => []);
      if (coursesRes.length > 0) {
        filteredDepts = coursesRes.map((c: any) => ({
          department_id: c.code || '1',
          department_code: c.code || '1',
          department_name: `${c.name} Department`,
          branch_cd: c.course_cd || c.code || '1',
          course_cd: c.course_cd || c.code || '1',
          course_name: c.name,
          hod_user_id: null,
          hod_name: 'Head of Department',
        }));
      }
    }

    // 3. Pre-fetch dataset aggregates for fast computation
    const [
      rawSubjects,
      rawMatrices,
      rawSlots,
      rawDrafts,
      rawQuestions,
      rawPapers,
      rawLessons,
      chatGroupsCount,
      chatMessagesCount,
      seminarsCount,
      tutorialsCount,
      miniProjectsCount,
      rawAttendanceSessions,
      attendanceRecordsRaw,
      rawEvaluations,
    ] = await Promise.all([
      // Subjects
      this.ds.query(`SELECT id, code, name, course_cd, branch_cd, department_id, semester FROM "${schema}".subjects WHERE is_active = true`).catch(() =>
        this.ds.query(`SELECT id, code, name, course_cd, branch_cd, department_id FROM "${schema}".subjects WHERE is_active = true`).catch(() => [])
      ),
      // CO-PO Matrices
      this.ds.query(`SELECT id, subject_id, subject_code, course_cd, branch_cd, sem_cd, section, matrix_data FROM "${schema}".co_po_matrices`).catch(() => []),
      // Timetable Slots (supports both course_cd/branch_cd and course_id/branch_id schemas)
      this.ds.query(`SELECT id, course_cd, branch_cd, department_id, batch_id, batch_cd, semester, section FROM "${schema}".timetable_slots`).catch(() =>
        this.ds.query(`SELECT id, department_id, batch_id, semester, section FROM "${schema}".timetable_slots`).catch(() => [])
      ),
      // Timetable Drafts
      this.ds.query(`SELECT id, course_cd, branch_cd, department_id, batch_cd, semester, section, status FROM "${schema}".timetable_drafts`).catch(() => []),
      // Question Bank (use difficulty_level/mode; blooms_level may not exist in all tenant schemas)
      this.ds.query(`SELECT id, subject_id, course_cd, branch_cd, batch_cd, semester, sem_cd, section, difficulty_level, mode FROM "${schema}".question_bank WHERE is_active = true`).catch(() =>
        this.ds.query(`SELECT id, subject_id, course_cd, branch_cd, semester, section, difficulty_level FROM "${schema}".question_bank WHERE is_active = true`).catch(() => [])
      ),
      // Examination Papers
      this.ds.query(`SELECT id, name, code, subject_id, course_cd, branch_cd, department_id, batch_id, batch_cd, semester, sem_cd, section, status FROM "${schema}".examination_papers`).catch(() =>
        this.ds.query(`SELECT id, name, code, subject_id, course_cd, branch_cd, department_id, status FROM "${schema}".examination_papers`).catch(() => [])
      ),
      // Lessons
      this.ds.query(`SELECT id, course_cd, branch_cd, batch_cd, sem_cd, section, subject_id FROM "${schema}".lessons WHERE is_active = true`).catch(() => []),
      // Chat Groups
      this.ds.query(`SELECT count(*) as count FROM "${schema}".chat_groups WHERE is_active = true`).catch(() => [{ count: 0 }]),
      // Chat Messages
      this.ds.query(`SELECT count(*) as count FROM "${schema}".chat_messages`).catch(() => [{ count: 0 }]),
      // Logbook Seminars (with student course/dept join)
      this.ds.query(`
        SELECT sm.status, sm.verified_at, st.course_cd, st.branch_id as branch_cd, st.department_id
        FROM "${schema}".logbook_seminars sm
        LEFT JOIN "${schema}".students st ON st.id::text = sm.student_id::text
      `).catch(() => []),
      // Logbook Tutorials (with student course/dept join)
      this.ds.query(`
        SELECT lt.status, lt.verified_at, st.course_cd, st.branch_id as branch_cd, st.department_id
        FROM "${schema}".logbook_tutorials lt
        LEFT JOIN "${schema}".students st ON st.id::text = lt.student_id::text
      `).catch(() => []),
      // Logbook Mini Projects (with student course/dept join)
      this.ds.query(`
        SELECT mp.project_status as status, mp.approved_at as verified_at, st.course_cd, COALESCE(mp.branch_id::text, st.branch_id::text) as branch_cd, st.department_id
        FROM "${schema}".logbook_mini_projects mp
        LEFT JOIN "${schema}".students st ON st.id::text = mp.student_id::text
      `).catch(() => []),
      // Attendance Sessions (with subject/batch course/dept join)
      this.ds.query(`
        SELECT a.id, a.faculty_id, a.subject_id, a.batch_id, a.session_date,
               COALESCE(sub.course_cd, b.course_cd) as course_cd,
               sub.branch_cd as branch_cd,
               sub.department_id
        FROM "${schema}".attendance_sessions a
        LEFT JOIN "${schema}".subjects sub ON sub.id::text = a.subject_id::text
        LEFT JOIN "${schema}".batches b ON b.id::text = a.batch_id::text
      `).catch(() => []),
      // Attendance Records
      this.ds.query(`SELECT id, session_id, status FROM "${schema}".attendance_records`).catch(() => []),
      // Theory Evaluations (student_results joined with examination_papers)
      this.ds.query(`
        SELECT sr.id, sr.paper_id, sr.eval_status, sr.marks_obtained,
               ep.course_cd, ep.branch_cd, ep.department_id, ep.batch_cd, ep.semester, ep.sem_cd, ep.section
        FROM "${schema}".student_results sr
        LEFT JOIN "${schema}".examination_papers ep ON ep.id::text = sr.paper_id::text
        WHERE sr.eval_status = 'EVALUATED' OR sr.marks_obtained IS NOT NULL
      `).catch(() => []),
    ]);

    const semFilter = filter?.semester ? String(filter.semester).replace(/\D/g, '') : '';
    const batchFilterRaw = filter?.batchId ? String(filter.batchId).trim().toLowerCase() : '';
    const batchAliases = new Set<string>();
    if (batchFilterRaw) {
      batchAliases.add(batchFilterRaw);
      const batchRows = await this.ds.query(
        `SELECT id, code, batch_cd, year FROM "${schema}".batches WHERE id::text = $1 OR LOWER(code) = $1 OR LOWER(batch_cd) = $1 OR LOWER(year::text) = $1 LIMIT 3`,
        [batchFilterRaw],
      ).catch(() => []);
      for (const b of batchRows) {
        if (b.id) batchAliases.add(String(b.id).trim().toLowerCase());
        if (b.code) batchAliases.add(String(b.code).trim().toLowerCase());
        if (b.batch_cd) batchAliases.add(String(b.batch_cd).trim().toLowerCase());
        if (b.year) batchAliases.add(String(b.year).trim().toLowerCase());
      }
    }

    const normSec = (val: any): string => {
      const s = String(val || '').trim().toUpperCase();
      if (!s || s === 'ALL' || s === '0') return '';
      if (s === '1' || s === 'A' || s === 'SECTION A' || s === 'SECTION 1' || s === 'SEC A') return '1';
      if (s === '2' || s === 'B' || s === 'SECTION B' || s === 'SECTION 2' || s === 'SEC B') return '2';
      if (s === '3' || s === 'C' || s === 'SECTION C' || s === 'SECTION 3' || s === 'SEC C') return '3';
      if (s === '4' || s === 'D' || s === 'SECTION D' || s === 'SECTION 4' || s === 'SEC D') return '4';
      const num = s.match(/\d+/)?.[0];
      return num || s;
    };
    const secFilterNorm = filter?.section ? normSec(filter.section) : '';

    const matchSem = (val: any) => !semFilter || !val || String(val).replace(/\D/g, '') === semFilter;
    const matchBatch = (val: any) => batchAliases.size === 0 || !val || batchAliases.has(String(val).trim().toLowerCase());
    const matchSec = (val: any) => !secFilterNorm || !val || normSec(val) === secFilterNorm;

    const allSubjects = rawSubjects.filter((s: any) => matchSem(s.semester));
    const allMatrices = rawMatrices.filter((m: any) => matchSem(m.sem_cd) && matchSec(m.section));
    const allSlots = rawSlots.filter((s: any) => matchSem(s.semester) && matchBatch(s.batch_cd || s.batch_id) && matchSec(s.section));
    const allDrafts = rawDrafts.filter((d: any) => matchSem(d.semester) && matchBatch(d.batch_cd) && matchSec(d.section));
    const allQuestions = rawQuestions.filter((q: any) => matchSem(q.semester || q.sem_cd) && matchBatch(q.batch_cd) && matchSec(q.section));
    const allPapers = rawPapers.filter((p: any) => matchSem(p.semester || p.sem_cd) && matchBatch(p.batch_cd || p.batch_id) && matchSec(p.section));
    const allLessons = rawLessons.filter((l: any) => matchSem(l.sem_cd) && matchBatch(l.batch_cd) && matchSec(l.section));
    const attendanceSessionsRaw = rawAttendanceSessions.filter((a: any) => matchBatch(a.batch_id));
    const allEvaluations = (Array.isArray(rawEvaluations) ? rawEvaluations : []).filter((ev: any) =>
      matchSem(ev.semester || ev.sem_cd) && matchBatch(ev.batch_cd) && matchSec(ev.section)
    );

    const totalChatGroups = parseInt(chatGroupsCount[0]?.count || 0, 10);
    const totalChatMessages = parseInt(chatMessagesCount[0]?.count || 0, 10);

    const seminarsRows = Array.isArray(seminarsCount) ? seminarsCount : [];
    const tutorialsRows = Array.isArray(tutorialsCount) ? tutorialsCount : [];
    const miniProjectsRows = Array.isArray(miniProjectsCount) ? miniProjectsCount : [];

    // Helper to match a record strictly to a department/course/branch
    const matchesDept = (rec: any, crsCd: string, brCd: string, deptIdStr: string) => {
      const rCrs = String(rec.course_cd || rec.course_id || '').trim().toLowerCase();
      const rBr = String(rec.branch_cd || rec.branch_id || '').trim().toLowerCase();
      const rDept = String(rec.department_id || '').trim().toLowerCase();
      if (deptIdStr && rDept && rDept === deptIdStr) return true;
      if (crsCd && rCrs) {
        if (rCrs !== crsCd) return false;
        // If branch is also specified on the record and dept has a branch code, check branch match when distinct
        if (brCd && rBr && rBr !== brCd && rBr !== crsCd) return false;
        return true;
      }
      if (brCd && rBr && rBr === brCd) return true;
      return false;
    };

    // 4. Compute Department-wise Metrics
    const departmentResults = filteredDepts.map((dept: any) => {
      const crsCd = String(dept.course_cd || '').trim().toLowerCase();
      const brCd = String(dept.branch_cd || dept.department_code || '').trim().toLowerCase();
      const deptIdStr = String(dept.department_id || '').trim().toLowerCase();

      // Filter subjects for this department/branch
      const effectiveSubjects = allSubjects.filter((s: any) => matchesDept(s, crsCd, brCd, deptIdStr));

      // ── 1. CO-PO Matrix Mapping ──
      const subjectMappingList = effectiveSubjects.map((s: any) => {
        const subIdStr = String(s.id || '').trim().toLowerCase();
        const subCodeStr = String(s.code || '').trim().toLowerCase();
        const foundMatrix = allMatrices.find((m: any) => {
          const mSubId = String(m.subject_id || '').trim().toLowerCase();
          const mSubCode = String(m.subject_code || '').trim().toLowerCase();
          const hasData = m.matrix_data && typeof m.matrix_data === 'object' && Object.keys(m.matrix_data).length > 0;
          return hasData && (mSubId === subIdStr || mSubCode === subCodeStr || mSubId === subCodeStr);
        });
        return {
          code: s.code || 'SUBJ',
          name: s.name || 'Subject',
          isMapped: Boolean(foundMatrix),
        };
      });

      const totalDeptSubjects = subjectMappingList.length;
      const mappedDeptSubjects = subjectMappingList.filter((s: any) => s.isMapped).length;
      const copoScore = totalDeptSubjects > 0 ? Math.round((mappedDeptSubjects / totalDeptSubjects) * 100) : 0;
      const copoStatus: 'COMPLIANT' | 'PARTIAL' | 'PENDING' = copoScore >= 80 ? 'COMPLIANT' : copoScore >= 40 ? 'PARTIAL' : 'PENDING';

      // ── 2. Timetable Up-to-date ──
      const deptSlots = allSlots.filter((slot: any) => matchesDept(slot, crsCd, brCd, deptIdStr));
      const deptDrafts = allDrafts.filter((draft: any) => matchesDept(draft, crsCd, brCd, deptIdStr));

      const approvedDraftsCount = deptDrafts.filter((d: any) => d.status === 'HOD_APPROVED').length;
      const hasActiveSlots = deptSlots.length > 0;
      const timetableScore = hasActiveSlots || approvedDraftsCount > 0 ? 100 : (deptDrafts.length > 0 ? 60 : 0);
      const timetableStatus: 'UP_TO_DATE' | 'PARTIAL' | 'NEEDS_UPDATE' = timetableScore >= 80 ? 'UP_TO_DATE' : timetableScore >= 50 ? 'PARTIAL' : 'NEEDS_UPDATE';

      // ── 3. Question Bank & Blooms ──
      const deptQuestions = allQuestions.filter((q: any) => matchesDept(q, crsCd, brCd, deptIdStr));

      const blooms = {
        remembering: 0,
        understanding: 0,
        applying: 0,
        analyzing: 0,
        evaluating: 0,
        creating: 0,
      };

      for (const q of deptQuestions) {
        const lvl = String(q.blooms_level || q.difficulty_level || '').toLowerCase();
        if (lvl.includes('rememb') || lvl.includes('l1') || lvl === 'easy') blooms.remembering++;
        else if (lvl.includes('understand') || lvl.includes('l2')) blooms.understanding++;
        else if (lvl.includes('appl') || lvl.includes('l3') || lvl === 'medium') blooms.applying++;
        else if (lvl.includes('analy') || lvl.includes('l4') || lvl === 'hard') blooms.analyzing++;
        else if (lvl.includes('eval') || lvl.includes('l5')) blooms.evaluating++;
        else if (lvl.includes('creat') || lvl.includes('l6')) blooms.creating++;
        else blooms.understanding++;
      }

      const qbCount = deptQuestions.length;
      const qbScore = qbCount > 0 ? Math.min(100, Math.round((qbCount / 10) * 100)) : 0;
      const qbStatus: 'EXCELLENT' | 'ADEQUATE' | 'NEEDS_QUESTIONS' = qbScore >= 80 ? 'EXCELLENT' : qbScore >= 40 ? 'ADEQUATE' : 'NEEDS_QUESTIONS';

      // ── 4. Question Design Paper & Theory Evaluation ──
      const effectivePapers = allPapers.filter((p: any) => matchesDept(p, crsCd, brCd, deptIdStr));
      const deptEvaluations = allEvaluations.filter((ev: any) => matchesDept(ev, crsCd, brCd, deptIdStr));
      const evaluatedCount = deptEvaluations.length;
      const totalPapersCount = effectivePapers.length;
      const draftPapersCount = effectivePapers.filter((p: any) => p.status === 'DRAFT').length;
      const submittedPapersCount = effectivePapers.filter((p: any) => p.status === 'SUBMITTED' || p.status === 'PENDING_DQAC' || p.status === 'READY_HOD' || p.status === 'PENDING_HOD_APPROVAL').length;
      const approvedPapersCount = effectivePapers.filter((p: any) => p.status === 'APPROVED' || p.status === 'HOD_APPROVED' || p.status === 'DQAC_APPROVED' || p.status === 'PUBLISHED').length;
      const qpScore = totalPapersCount > 0 ? Math.min(100, totalPapersCount * 40 + (evaluatedCount > 0 ? 20 : 0)) : (evaluatedCount > 0 ? 50 : 0);
      const qpStatus: 'READY' | 'IN_PROGRESS' | 'PENDING' = qpScore >= 80 ? 'READY' : qpScore >= 40 ? 'IN_PROGRESS' : 'PENDING';

      // ── 5. Approvals (QP + Timetable) ──
      const totalItemsToApprove = totalPapersCount + deptDrafts.length;
      const totalApprovedItems = approvedPapersCount + approvedDraftsCount;
      const approvalRate = totalItemsToApprove > 0 ? Math.min(100, Math.round((totalApprovedItems / totalItemsToApprove) * 100)) : 0;
      const approvalStatus: 'APPROVED' | 'PARTIALLY_APPROVED' | 'PENDING' = approvalRate >= 70 ? 'APPROVED' : approvalRate >= 40 ? 'PARTIALLY_APPROVED' : 'PENDING';

      // ── 6. Lesson Plan Material Updating ──
      const effectiveLessons = allLessons.filter((l: any) => matchesDept(l, crsCd, brCd, deptIdStr));
      const lessonCount = effectiveLessons.length;
      const lessonScore = lessonCount > 0 ? Math.min(100, lessonCount * 50) : 0;
      const lessonStatus: 'UP_TO_DATE' | 'PARTIAL' | 'BEHIND' = lessonScore >= 70 ? 'UP_TO_DATE' : lessonScore >= 30 ? 'PARTIAL' : 'BEHIND';

      // ── 7. Academic Chats ──
      const chatScore = totalChatGroups > 0 && totalChatMessages > 0 ? 100 : (totalChatGroups > 0 ? 50 : 0);
      const chatStatus: 'ACTIVE' | 'QUIET' | 'INACTIVE' = totalChatMessages > 5 ? 'ACTIVE' : totalChatGroups > 0 ? 'QUIET' : 'INACTIVE';

      // ── 8. Academic Portfolio (Seminars | Tutorials | Mini Projects) ──
      const deptSeminars = seminarsRows.filter((r: any) => matchesDept(r, crsCd, brCd, deptIdStr));
      const deptTutorials = tutorialsRows.filter((r: any) => matchesDept(r, crsCd, brCd, deptIdStr));
      const deptMiniProjects = miniProjectsRows.filter((r: any) => matchesDept(r, crsCd, brCd, deptIdStr));

      const dSemCount = deptSeminars.length;
      const dSemVerified = deptSeminars.filter((r: any) => r.status === 'VERIFIED' || r.verified_at != null).length;
      const dTutCount = deptTutorials.length;
      const dTutVerified = deptTutorials.filter((r: any) => r.status === 'VERIFIED' || r.verified_at != null).length;
      const dProjCount = deptMiniProjects.length;
      const dProjVerified = deptMiniProjects.filter((r: any) => r.status === 'VERIFIED' || r.verified_at != null).length;

      const portfolioItems = dSemCount + dTutCount + dProjCount;
      const verifiedItems = dSemVerified + dTutVerified + dProjVerified;
      const portfolioScore = portfolioItems > 0 ? Math.min(100, Math.round((verifiedItems / portfolioItems) * 100) || 50) : 0;
      const portfolioStatus: 'ACTIVE' | 'IN_PROGRESS' | 'PENDING' = portfolioScore >= 70 ? 'ACTIVE' : portfolioScore >= 40 ? 'IN_PROGRESS' : 'PENDING';

      // ── 9. Attendance ──
      const deptAttSessions = attendanceSessionsRaw.filter((a: any) => matchesDept(a, crsCd, brCd, deptIdStr));
      const deptSessionIds = new Set(deptAttSessions.map((a: any) => String(a.id)));
      const deptAttRecords = attendanceRecordsRaw.filter((r: any) => deptSessionIds.has(String(r.session_id)));
      const dTotalAttRecords = deptAttRecords.length;
      const dPresentAttRecords = deptAttRecords.filter((r: any) => String(r.status).toUpperCase() === 'PRESENT').length;
      const attRate = dTotalAttRecords > 0 ? Math.round((dPresentAttRecords / dTotalAttRecords) * 100) : 0;
      const attStatus: 'HEALTHY' | 'MODERATE' | 'LOW' = attRate >= 75 ? 'HEALTHY' : attRate >= 50 ? 'MODERATE' : 'LOW';

      // Weighted Overall Score (100% max)
      // COPO (15%) + Timetable (15%) + QB (10%) + QP (10%) + Approvals (10%) + Lessons (10%) + Portfolio (10%) + Attendance (15%) + Chats (5%)
      const overallScore = Math.round(
        copoScore * 0.15 +
        timetableScore * 0.15 +
        qbScore * 0.10 +
        qpScore * 0.10 +
        approvalRate * 0.10 +
        lessonScore * 0.10 +
        portfolioScore * 0.10 +
        attRate * 0.15 +
        chatScore * 0.05
      );

      const overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' =
        overallScore >= 90 ? 'A+' :
        overallScore >= 80 ? 'A' :
        overallScore >= 65 ? 'B' :
        overallScore >= 50 ? 'C' : 'D';

      const overallStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' =
        overallScore >= 80 ? 'EXCELLENT' :
        overallScore >= 60 ? 'GOOD' : 'NEEDS_ATTENTION';

      return {
        departmentId: dept.department_id,
        departmentCode: dept.department_code || dept.branch_cd || 'DEPT',
        departmentName: dept.department_name || `${dept.course_name} Department`,
        courseCd: dept.course_cd,
        courseName: dept.course_name || dept.course_cd,
        hodName: dept.hod_name || 'Department Coordinator',
        hodUserId: dept.hod_user_id || '',

        copo: {
          totalSubjects: totalDeptSubjects,
          mappedSubjects: mappedDeptSubjects,
          percentage: copoScore,
          status: copoStatus,
          subjectList: subjectMappingList,
        },
        timetable: {
          activeSlotsCount: deptSlots.length,
          draftsCount: deptDrafts.length,
          approvedDraftsCount,
          isUpToDate: hasActiveSlots || approvedDraftsCount > 0,
          percentage: timetableScore,
          status: timetableStatus,
        },
        questionBank: {
          totalQuestions: qbCount,
          coveragePercentage: qbScore,
          bloomsBreakdown: blooms,
          status: qbStatus,
        },
        questionPapers: {
          totalPapers: totalPapersCount,
          draftCount: draftPapersCount,
          submittedCount: submittedPapersCount,
          approvedCount: approvedPapersCount,
          evaluatedCount,
          percentage: qpScore,
          status: qpStatus,
        },
        approvals: {
          approvedQPs: approvedPapersCount,
          totalQPs: totalPapersCount,
          approvedTimetables: approvedDraftsCount,
          totalTimetables: deptDrafts.length,
          approvalRate,
          status: approvalStatus,
        },
        lessons: {
          totalMaterials: lessonCount,
          subjectsWithMaterials: Math.min(totalDeptSubjects, lessonCount),
          totalSubjects: totalDeptSubjects,
          percentage: lessonScore,
          status: lessonStatus,
        },
        chats: {
          activeGroups: totalChatGroups,
          totalMessages: totalChatMessages,
          status: chatStatus,
        },
        portfolio: {
          seminarsCount: dSemCount,
          verifiedSeminars: dSemVerified,
          tutorialsCount: dTutCount,
          verifiedTutorials: dTutVerified,
          miniProjectsCount: dProjCount,
          verifiedMiniProjects: dProjVerified,
          overallScore: portfolioScore,
          status: portfolioStatus,
        },
        attendance: {
          totalSessions: deptAttSessions.length,
          totalRecords: dTotalAttRecords,
          presentRecords: dPresentAttRecords,
          attendanceRate: attRate,
          status: attStatus,
        },
        overallScore,
        overallGrade,
        overallStatus,
      };
    });

    // 5. Aggregate Macro Pillars
    const deptCount = departmentResults.length || 1;
    const avg = (fn: (d: any) => number) => Math.round(departmentResults.reduce((acc: number, d: any) => acc + fn(d), 0) / deptCount);

    const macroPillars = {
      copoMapping: {
        score: avg((d: any) => d.copo.percentage),
        label: '1. CO-PO Matrix Mapping',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.copo.totalSubjects, 0),
        compliant: departmentResults.reduce((acc: number, d: any) => acc + d.copo.mappedSubjects, 0),
      },
      timetable: {
        score: avg((d: any) => d.timetable.percentage),
        label: '2. Timetable Up-to-date',
        total: departmentResults.length,
        compliant: departmentResults.filter((d: any) => d.timetable.isUpToDate).length,
      },
      questionBank: {
        score: avg((d: any) => d.questionBank.coveragePercentage),
        label: '3. Question Bank',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.questionBank.totalQuestions, 0),
        compliant: departmentResults.filter((d: any) => d.questionBank.coveragePercentage >= 60).length,
      },
      questionDesign: {
        score: avg((d: any) => d.questionPapers.percentage),
        label: '4. Question Design Papers',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.questionPapers.totalPapers, 0),
        compliant: departmentResults.reduce((acc: number, d: any) => acc + d.questionPapers.approvedCount, 0),
      },
      approvals: {
        score: avg((d: any) => d.approvals.approvalRate),
        label: '5. Academic Approvals',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.approvals.totalQPs + d.approvals.totalTimetables, 0),
        compliant: departmentResults.reduce((acc: number, d: any) => acc + d.approvals.approvedQPs + d.approvals.approvedTimetables, 0),
      },
      lessonPlan: {
        score: avg((d: any) => d.lessons.percentage),
        label: '6. Lesson Plan Materials',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.lessons.totalMaterials, 0),
        compliant: departmentResults.reduce((acc: number, d: any) => acc + d.lessons.subjectsWithMaterials, 0),
      },
      chats: {
        score: totalChatGroups > 0 ? 100 : 0,
        label: '7. Academic Chats',
        total: totalChatGroups,
        compliant: totalChatMessages,
      },
      portfolio: {
        score: avg((d: any) => d.portfolio.overallScore),
        label: '8. Academic Portfolio (Seminars, Tutorials, Projects)',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.portfolio.seminarsCount + d.portfolio.tutorialsCount + d.portfolio.miniProjectsCount, 0),
        compliant: departmentResults.reduce((acc: number, d: any) => acc + d.portfolio.verifiedSeminars + d.portfolio.verifiedTutorials + d.portfolio.verifiedMiniProjects, 0),
      },
      attendance: {
        score: avg((d: any) => d.attendance.attendanceRate),
        label: '9. Attendance Compliance',
        total: departmentResults.reduce((acc: number, d: any) => acc + d.attendance.totalRecords, 0),
        compliant: departmentResults.reduce((acc: number, d: any) => acc + d.attendance.presentRecords, 0),
      },
    };

    const macroScore = Math.round(
      macroPillars.copoMapping.score * 0.15 +
      macroPillars.timetable.score * 0.15 +
      macroPillars.questionBank.score * 0.10 +
      macroPillars.questionDesign.score * 0.10 +
      macroPillars.approvals.score * 0.10 +
      macroPillars.lessonPlan.score * 0.10 +
      macroPillars.portfolio.score * 0.10 +
      macroPillars.attendance.score * 0.15 +
      macroPillars.chats.score * 0.05
    );

    const institutionStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' =
      macroScore >= 80 ? 'EXCELLENT' : macroScore >= 60 ? 'GOOD' : 'NEEDS_ATTENTION';

    return {
      collegeName: college.name || slug.toUpperCase(),
      collegeCode: college.code || '1',
      tenantSlug: slug,
      generatedAt: new Date().toISOString(),
      overallScore: macroScore,
      overallStatus: institutionStatus,
      pillars: macroPillars,
      departments: departmentResults,
    };
  }
}
