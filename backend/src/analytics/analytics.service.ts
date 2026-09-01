import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

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
}
