import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateSessionDto, UpdateRecordDto, AttendanceQueryDto,
} from './dto/attendance.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/enums/role.enum';

import { TenantSchemaService } from '../database/tenant-schema.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  private getSchema(tenantSlug: string): string {
    const resolved = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    return `tenant_${resolved}`;
  }

  // ─── Create Session + Mark Attendance (CLERK / FACULTY) ────────────────────
  private async ensureAttendanceColumns(schema: string) {
    try {
      await this.ds.query(`ALTER TABLE "${schema}".attendance_sessions ADD COLUMN IF NOT EXISTS topic_covered VARCHAR(500)`);
      await this.ds.query(`ALTER TABLE "${schema}".attendance_sessions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false`);
      await this.ds.query(`ALTER TABLE "${schema}".attendance_sessions ADD COLUMN IF NOT EXISTS timetable_slot_id UUID`);
      await this.ds.query(`ALTER TABLE "${schema}".attendance_records ADD COLUMN IF NOT EXISTS remarks VARCHAR(500)`);
      await this.ds.query(`ALTER TABLE "${schema}".attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    } catch (e) {
      // Ignore if columns already exist
    }
  }

  async createSession(
    tenantSlug: string,
    dto: CreateSessionDto,
    markedByUserId?: string | null,
    markerRole?: UserRole,
  ) {
    const schema = this.getSchema(tenantSlug);
    await this.ensureAttendanceColumns(schema);

    const isUUID = (str?: string | null) => str ? /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str) : false;
    const validUserId = isUUID(markedByUserId) ? markedByUserId : null;

    let offeringId: string | null = isUUID(dto.offeringId) ? dto.offeringId! : null;
    let subjectId = dto.subjectId;
    let batchId = dto.batchId;
    let sessionType = dto.sessionType ?? 'THEORY';

    try {
      if (offeringId) {
        const offeringRows = await this.ds.query(
          `SELECT so.subject_id, dt.code AS dt_code 
           FROM "${schema}".subject_offerings so
           JOIN "${schema}".delivery_types dt ON so.dtype_id = dt.id
           WHERE so.id = $1`,
          [offeringId],
        );
        if (offeringRows.length) {
          subjectId = offeringRows[0].subject_id;
          sessionType = offeringRows[0].dt_code;
        }
      }

      // Validate subject + batch exist
      const [subjectRows, batchRows] = await Promise.all([
        this.ds.query(`SELECT id, department_id FROM "${schema}".subjects WHERE id=$1`, [subjectId]),
        this.ds.query(`SELECT id FROM "${schema}".batches WHERE id=$1`, [batchId]),
      ]);
      if (!subjectRows.length) throw new NotFoundException('Subject not found');
      if (!batchRows.length) throw new NotFoundException('Batch not found');

      // Department & Subject Scope Enforcement for Clerks / Faculty / HODs
      if (validUserId && markerRole && ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(markerRole)) {
        const userScope = await this.getUserScope(tenantSlug, validUserId, markerRole);
        const subjDeptId = subjectRows[0].department_id;
        const isSubjectAssigned = userScope.assignedSubjectIds.includes(subjectId);
        const isDeptMatched = userScope.departmentId && subjDeptId && userScope.departmentId === subjDeptId;

        if (subjDeptId && !isDeptMatched && !isSubjectAssigned) {
          throw new ForbiddenException(
            `Access Denied: As a ${markerRole} in ${userScope.departmentName || 'your department'}, you can only mark attendance for your department's subjects.`,
          );
        }
      }

      // Prevent duplicate session same day + offering (or subject) + batch
      let dupCheck;
      if (offeringId) {
        dupCheck = await this.ds.query(
          `SELECT id FROM "${schema}".attendance_sessions WHERE offering_id=$1 AND batch_id=$2 AND session_date=$3`,
          [offeringId, batchId, dto.sessionDate],
        );
      } else {
        dupCheck = await this.ds.query(
          `SELECT id FROM "${schema}".attendance_sessions WHERE subject_id=$1 AND batch_id=$2 AND session_date=$3 AND session_type=$4`,
          [subjectId, batchId, dto.sessionDate, sessionType],
        );
      }

      // If duplicate session exists, update attendance records on that existing session
      if (dupCheck.length) {
        const existingSessionId = dupCheck[0].id;
        if (dto.records.length > 0) {
          const values = dto.records
            .map((_, idx) => {
              const base = idx * 3;
              return `($${base + 1},$${base + 2},$${base + 3},$${dto.records.length * 3 + 1})`;
            })
            .join(',');

          const params: any[] = [];
          dto.records.forEach(r => {
            params.push(existingSessionId, r.studentId, r.status);
          });
          params.push(validUserId);

          await this.ds.query(
            `INSERT INTO "${schema}".attendance_records
               (session_id, student_id, status, marked_by)
             VALUES ${values}
             ON CONFLICT (session_id, student_id) DO UPDATE
               SET status=EXCLUDED.status, marked_by=EXCLUDED.marked_by, updated_at=NOW()`,
            params,
          );
        }
        return { sessionId: existingSessionId, recordsMarked: dto.records.length, updated: true };
      }

      // Get faculty_id if marker is a faculty member
      let facultyId: string | null = null;
      if (validUserId && markerRole && [UserRole.FACULTY, UserRole.HOD].includes(markerRole)) {
        const fRows = await this.ds.query(
          `SELECT id FROM "${schema}".faculty WHERE user_id=$1`,
          [validUserId],
        );
        facultyId = fRows[0]?.id ?? null;
      }

      // Create the session
      const sessionRows = await this.ds.query(
        `INSERT INTO "${schema}".attendance_sessions
           (subject_id, batch_id, faculty_id, session_date, session_type,
            topic_covered, timetable_slot_id, created_by, offering_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [
          subjectId, batchId, facultyId,
          dto.sessionDate, sessionType,
          dto.topicCovered ?? null,
          isUUID(dto.timetableSlotId) ? dto.timetableSlotId : null,
          validUserId,
          offeringId,
        ],
      );
      const sessionId = sessionRows[0].id;

      // Bulk-insert attendance records
      if (dto.records.length > 0) {
        const values = dto.records
          .map((_, idx) => {
            const base = idx * 3;
            return `($${base + 1},$${base + 2},$${base + 3},$${dto.records.length * 3 + 1})`;
          })
          .join(',');

        const params: any[] = [];
        dto.records.forEach(r => {
          params.push(sessionId, r.studentId, r.status);
        });
        params.push(validUserId);

        await this.ds.query(
          `INSERT INTO "${schema}".attendance_records
             (session_id, student_id, status, marked_by)
           VALUES ${values}
           ON CONFLICT (session_id, student_id) DO UPDATE
             SET status=EXCLUDED.status, marked_by=EXCLUDED.marked_by, updated_at=NOW()`,
          params,
        );
      }

      this.logger.log(
        `Attendance session created: ${sessionId} by ${validUserId} [${markerRole}]`,
      );

      return { sessionId, recordsMarked: dto.records.length };
    } catch (err: any) {
      this.logger.error(`Failed to create attendance session in schema ${schema}: ${err.message}`, err.stack);
      throw new BadRequestException(err.message || 'Failed to submit attendance session.');
    }
  }

  // ─── Find existing session with records for subject + batch + date + type ──
  async findExistingSessionWithRecords(
    tenantSlug: string,
    subjectId: string,
    batchId: string,
    sessionDate: string,
    sessionType: string = 'THEORY',
  ) {
    const schema = this.getSchema(tenantSlug);
    await this.ensureAttendanceColumns(schema);

    const sessionRows = await this.ds.query(
      `SELECT s.* FROM "${schema}".attendance_sessions s
       WHERE s.subject_id=$1 AND s.batch_id=$2 AND s.session_date=$3 AND s.session_type=$4
       LIMIT 1`,
      [subjectId, batchId, sessionDate, sessionType],
    );

    if (!sessionRows.length) {
      return { found: false, session: null, records: [] };
    }

    const session = sessionRows[0];
    const records = await this.ds.query(
      `SELECT ar.student_id, ar.status, ar.remarks
       FROM "${schema}".attendance_records ar
       WHERE ar.session_id=$1`,
      [session.id],
    );

    return { found: true, session, records };
  }

  // ─── Get Weekly Attendance Sessions & Lecture Conducted Counters ─────────
  async getWeeklySessions(
    tenantSlug: string,
    batchId: string,
    fromDate: string,
    toDate: string,
    subjectId?: string,
  ) {
    const schema = this.getSchema(tenantSlug);
    await this.ensureAttendanceColumns(schema);

    const params: any[] = [batchId, fromDate, toDate];
    let subjectCondition = '';
    if (subjectId) {
      params.push(subjectId);
      subjectCondition = ` AND s.subject_id = $4`;
    }

    // 1. Fetch sessions conducted within date range
    const sessions = await this.ds.query(
      `SELECT s.id, s.session_date, s.session_type, s.topic_covered,
              s.created_at, s.is_cancelled, s.subject_id,
              sub.name AS subject_name, sub.code AS subject_code,
              b.code AS batch_code, f.name AS faculty_name,
              COUNT(ar.id) AS total_records,
              COUNT(ar.id) FILTER (WHERE ar.status='PRESENT') AS present_count
       FROM "${schema}".attendance_sessions s
       LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       LEFT JOIN "${schema}".batches b ON b.id = s.batch_id
       LEFT JOIN "${schema}".faculty f ON f.id = s.faculty_id
       LEFT JOIN "${schema}".attendance_records ar ON ar.session_id = s.id
       WHERE s.batch_id = $1 AND s.session_date >= $2 AND s.session_date <= $3
         AND s.is_cancelled = false ${subjectCondition}
       GROUP BY s.id, sub.name, sub.code, b.code, f.name
       ORDER BY s.session_date DESC, s.created_at DESC`,
      params,
    );

    // 2. Fetch overall lecture & practical counters (total completed for batch/subject)
    const counterParams: any[] = [batchId];
    let counterSubjectCond = '';
    if (subjectId) {
      counterParams.push(subjectId);
      counterSubjectCond = ` AND subject_id = $2`;
    }

    const countersRows = await this.ds.query(
      `SELECT
          COUNT(*) FILTER (WHERE session_type IN ('THEORY', 'LECTURE')) AS total_lectures,
          COUNT(*) FILTER (WHERE session_type = 'PRACTICAL') AS total_practicals,
          COUNT(*) FILTER (WHERE session_type = 'CLINICAL_POSTING') AS total_clinical,
          COUNT(*) FILTER (WHERE session_type IN ('SGT', 'DOAP', 'TUTORIAL', 'SDL')) AS total_sgt,
          COUNT(*) AS total_sessions
       FROM "${schema}".attendance_sessions
       WHERE batch_id = $1 AND is_cancelled = false ${counterSubjectCond}`,
      counterParams,
    );

    const counters = countersRows[0] || {
      total_lectures: 0,
      total_practicals: 0,
      total_clinical: 0,
      total_sgt: 0,
      total_sessions: 0,
    };

    return {
      sessions,
      counters: {
        totalLectures: parseInt(counters.total_lectures || '0', 10),
        totalPracticals: parseInt(counters.total_practicals || '0', 10),
        totalClinical: parseInt(counters.total_clinical || '0', 10),
        totalSgt: parseInt(counters.total_sgt || '0', 10),
        totalSessions: parseInt(counters.total_sessions || '0', 10),
      },
    };
  }

  // ─── Get Sessions (paginated list) ─────────────────────────────────────────
  async getSessions(
    tenantSlug: string,
    pagination: PaginationDto,
    filters: AttendanceQueryDto = {},
  ) {
    const schema = this.getSchema(tenantSlug);
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filters.subjectId) { conditions.push(`s.subject_id=$${i++}`); params.push(filters.subjectId); }
    if (filters.batchId) { conditions.push(`s.batch_id=$${i++}`); params.push(filters.batchId); }
    if (filters.fromDate) { conditions.push(`s.session_date>=$${i++}`); params.push(filters.fromDate); }
    if (filters.toDate) { conditions.push(`s.session_date<=$${i++}`); params.push(filters.toDate); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      this.ds.query(
        `SELECT s.id, s.session_date, s.session_type, s.topic_covered,
                s.created_at, s.is_cancelled,
                sub.name AS subject_name, sub.code AS subject_code,
                b.code AS batch_code,
                f.name AS faculty_name,
                COUNT(ar.id) AS total_records,
                COUNT(ar.id) FILTER (WHERE ar.status='PRESENT') AS present_count
         FROM "${schema}".attendance_sessions s
         LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
         LEFT JOIN "${schema}".batches b ON b.id = s.batch_id
         LEFT JOIN "${schema}".faculty f ON f.id = s.faculty_id
         LEFT JOIN "${schema}".attendance_records ar ON ar.session_id = s.id
         ${where}
         GROUP BY s.id, sub.name, sub.code, b.code, f.name
         ORDER BY s.session_date DESC, s.created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limit, offset],
      ),
      this.ds.query(
        `SELECT COUNT(*) FROM "${schema}".attendance_sessions s ${where}`,
        params,
      ),
    ]);

    return paginate(rows, parseInt(countRows[0].count, 10), pagination);
  }

  // ─── Get single session with all records ───────────────────────────────────
  async getSessionDetail(tenantSlug: string, sessionId: string) {
    const schema = this.getSchema(tenantSlug);

    const sessionRows = await this.ds.query(
      `SELECT s.*, sub.name AS subject_name, sub.code AS subject_code,
              b.code AS batch_code, f.name AS faculty_name
       FROM "${schema}".attendance_sessions s
       LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       LEFT JOIN "${schema}".batches b ON b.id = s.batch_id
       LEFT JOIN "${schema}".faculty f ON f.id = s.faculty_id
       WHERE s.id=$1`,
      [sessionId],
    );
    if (!sessionRows.length) throw new NotFoundException('Session not found');

    const records = await this.ds.query(
      `SELECT ar.id, ar.status, ar.remarks, ar.marked_at,
              st.name AS student_name, st.rollno, st.id AS student_id
       FROM "${schema}".attendance_records ar
       JOIN "${schema}".students st ON st.id = ar.student_id
       WHERE ar.session_id=$1
       ORDER BY st.rollno ASC`,
      [sessionId],
    );

    return { ...sessionRows[0], records };
  }

  // ─── Update individual record ──────────────────────────────────────────────
  async updateRecord(
    tenantSlug: string,
    recordId: string,
    dto: UpdateRecordDto,
    updaterId: string,
    updaterRole: UserRole,
  ) {
    const schema = this.getSchema(tenantSlug);

    const rows = await this.ds.query(
      `SELECT ar.id, s.created_by, s.faculty_id, s.is_cancelled
       FROM "${schema}".attendance_records ar
       JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
       WHERE ar.id=$1`,
      [recordId],
    );
    if (!rows.length) throw new NotFoundException('Attendance record not found');

    const rec = rows[0];
    if (rec.is_cancelled) throw new BadRequestException('Cannot modify cancelled session records');

    // Clerks and admins can always edit; faculty can only edit their own sessions
    if (updaterRole === UserRole.FACULTY) {
      if (rec.created_by !== updaterId) {
        throw new ForbiddenException('You can only modify your own session records');
      }
    }

    await this.ds.query(
      `UPDATE "${schema}".attendance_records
       SET status=$1, remarks=$2, updated_at=NOW()
       WHERE id=$3`,
      [dto.status, dto.remarks ?? null, recordId],
    );

    return { id: recordId, status: dto.status };
  }

  // ─── Get student attendance summary ───────────────────────────────────────
  async getStudentAttendanceSummary(tenantSlug: string, studentId: string, filters: {
    subjectId?: string; fromDate?: string; toDate?: string;
  } = {}) {
    const schema = this.getSchema(tenantSlug);

    const conditions = [
      `(ar.student_id = (SELECT id FROM "${schema}".students WHERE id::text = $1 OR LOWER(COALESCE(rollno,'')) = LOWER($1) OR LOWER(COALESCE(registration_no,'')) = LOWER($1) LIMIT 1) OR ar.student_id::text = $1)`
    ];
    const params: any[] = [studentId];
    let i = 2;

    if (filters.subjectId) { conditions.push(`s.subject_id=$${i++}`); params.push(filters.subjectId); }
    if (filters.fromDate) { conditions.push(`s.session_date>=$${i++}`); params.push(filters.fromDate); }
    if (filters.toDate) { conditions.push(`s.session_date<=$${i++}`); params.push(filters.toDate); }

    const rows = await this.ds.query(
      `SELECT
          sub.id AS subject_id,
          sub.name AS subject_name,
          sub.code AS subject_code,
          COALESCE(prof.name, 'General Phase') AS prof_name,
          COALESCE(dt.name, s.session_type) AS delivery_type_name,
          COALESCE(dt.code, s.session_type) AS delivery_type_code,
          COUNT(ar.id) AS total_classes,
          COUNT(ar.id) FILTER (WHERE ar.status = 'PRESENT') AS present,
          COUNT(ar.id) FILTER (WHERE ar.status = 'ABSENT') AS absent,
          COUNT(ar.id) FILTER (WHERE ar.status = 'LATE') AS late,
          COUNT(ar.id) FILTER (WHERE ar.status = 'EXCUSED') AS excused,
          ROUND(
            (COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT','LATE')) * 100.0)
            / NULLIF(COUNT(ar.id), 0), 2
          ) AS attendance_percentage
       FROM "${schema}".attendance_records ar
       JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
       JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       LEFT JOIN "${schema}".subject_offerings so ON so.id = s.offering_id
       LEFT JOIN "${schema}".professional_phases prof ON prof.id = so.prof_id
       LEFT JOIN "${schema}".delivery_types dt ON dt.id = so.dtype_id
       WHERE ${conditions.join(' AND ')}
         AND s.is_cancelled = false
       GROUP BY sub.id, sub.name, sub.code, prof.name, dt.name, dt.code, s.session_type
       ORDER BY sub.name ASC, prof_name ASC, delivery_type_code ASC`,
      params,
    );

    const totalClasses = rows.reduce((acc: number, r: any) => acc + parseInt(r.total_classes), 0);
    const totalPresent = rows.reduce((acc: number, r: any) => acc + parseInt(r.present), 0);

    return {
      subjects: rows,
      overall: {
        totalClasses,
        totalPresent,
        percentage:
          totalClasses > 0
            ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(2))
            : 0,
      },
    };
  }

  // ─── Get student day-to-day attendance logs ────────────────────────────────
  async getStudentAttendanceLogs(
    tenantSlug: string,
    studentId: string,
    filters: { subjectId?: string; fromDate?: string; toDate?: string; status?: string } = {},
  ) {
    const schema = this.getSchema(tenantSlug);
    const conditions = [
      `(ar.student_id = (SELECT id FROM "${schema}".students WHERE id::text = $1 OR LOWER(COALESCE(rollno,'')) = LOWER($1) OR LOWER(COALESCE(registration_no,'')) = LOWER($1) LIMIT 1) OR ar.student_id::text = $1)`,
      `s.is_cancelled = false`
    ];
    const params: any[] = [studentId];
    let i = 2;

    if (filters.subjectId && filters.subjectId !== 'all') {
      conditions.push(`s.subject_id = $${i++}`);
      params.push(filters.subjectId);
    }
    if (filters.fromDate) {
      conditions.push(`s.session_date >= $${i++}`);
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      conditions.push(`s.session_date <= $${i++}`);
      params.push(filters.toDate);
    }
    if (filters.status && filters.status !== 'all') {
      conditions.push(`ar.status = $${i++}`);
      params.push(filters.status);
    }

    return this.ds.query(
      `SELECT
          ar.id AS record_id,
          ar.status,
          ar.remarks,
          ar.marked_at,
          s.id AS session_id,
          s.session_date,
          s.start_time,
          s.end_time,
          s.session_type,
          s.topic,
          sub.id AS subject_id,
          sub.name AS subject_name,
          sub.code AS subject_code,
          COALESCE(f.name, 'Assigned Faculty') AS faculty_name
       FROM "${schema}".attendance_records ar
       JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
       JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       LEFT JOIN "${schema}".faculty f ON f.id = s.faculty_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY s.session_date DESC, s.start_time DESC`,
      params,
    );
  }

  // ─── Batch-wise attendance report ─────────────────────────────────────────
  async getBatchAttendanceReport(
    tenantSlug: string,
    batchId: string,
    subjectId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const schema = this.getSchema(tenantSlug);

    const conditions = [`s.batch_id=$1`, `s.is_cancelled=false`];
    const params: any[] = [batchId];
    let i = 2;

    if (subjectId && subjectId !== 'all') {
      conditions.push(`s.subject_id=$${i++}`);
      params.push(subjectId);
    }
    if (fromDate) {
      conditions.push(`s.session_date::text >= $${i++}`);
      params.push(fromDate);
    }
    if (toDate) {
      conditions.push(`s.session_date::text <= $${i++}`);
      params.push(toDate);
    }

    return this.ds.query(
      `SELECT
          st.id AS student_id,
          COALESCE(st.registration_no, st.rollno, '—') AS rollno,
          COALESCE(st.name, 'Student') AS name,
          COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END) AS total_classes,
          COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.id END) AS present,
          COUNT(DISTINCT CASE WHEN ar.status='ABSENT' THEN s.id END) AS absent,
          COUNT(DISTINCT CASE WHEN ar.status='LATE' THEN s.id END) AS late,
          COUNT(DISTINCT CASE WHEN ar.status='EXCUSED' THEN s.id END) AS excused,
          COALESCE(
            ROUND(
              (COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.id END) * 100.0)
              / NULLIF(COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END), 0), 2
            ), 0
          ) AS attendance_pct,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'subject_id', s.subject_id,
                'subject_code', sub.code,
                'status', ar.status
              )
            ) FILTER (WHERE s.id IS NOT NULL AND ar.id IS NOT NULL AND ar.status IS NOT NULL), '[]'
          ) AS subject_sessions
       FROM "${schema}".students st
       LEFT JOIN "${schema}".attendance_sessions s ON ${conditions.join(' AND ')}
       LEFT JOIN "${schema}".attendance_records ar ON ar.session_id = s.id AND ar.student_id = st.id
       LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       WHERE (st.batch_id = $1 OR ar.id IS NOT NULL)
       GROUP BY st.id, st.registration_no, st.rollno, st.name
       HAVING COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END) > 0 OR st.batch_id = $1
       ORDER BY COALESCE(st.registration_no, st.rollno) ASC, st.name ASC`,
      params,
    );
  }

  // ─── Batch-wise multi-subject attendance matrix report ─────────────────────
  async getBatchMatrixReport(
    tenantSlug: string,
    batchId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const schema = this.getSchema(tenantSlug);

    const subjects = await this.ds.query(
      `SELECT id, name, code FROM "${schema}".subjects ORDER BY code ASC`,
    );

    const sessConditions = [`s.batch_id = $1`, `s.is_cancelled = false`];
    const params: any[] = [batchId];
    let i = 2;

    if (fromDate) {
      sessConditions.push(`s.session_date::text >= $${i++}`);
      params.push(fromDate);
    }
    if (toDate) {
      sessConditions.push(`s.session_date::text <= $${i++}`);
      params.push(toDate);
    }

    const rows = await this.ds.query(
      `SELECT
          st.id AS student_id,
          COALESCE(st.registration_no, st.rollno, '—') AS rollno,
          COALESCE(st.name, 'Student') AS name,
          s.subject_id,
          sub.code AS subject_code,
          COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END) AS total_classes,
          COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.id END) AS present,
          ROUND(
            (COUNT(DISTINCT CASE WHEN ar.status IN ('PRESENT','LATE') THEN s.id END) * 100.0)
            / NULLIF(COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END), 0), 2
          ) AS attendance_pct
       FROM "${schema}".students st
       LEFT JOIN "${schema}".attendance_sessions s ON ${sessConditions.join(' AND ')}
       LEFT JOIN "${schema}".attendance_records ar ON ar.session_id = s.id AND ar.student_id = st.id
       LEFT JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       WHERE (st.batch_id = $1 OR ar.id IS NOT NULL)
       GROUP BY st.id, st.registration_no, st.rollno, st.name, s.subject_id, sub.code
       HAVING COUNT(DISTINCT CASE WHEN ar.id IS NOT NULL THEN s.id END) > 0 OR st.batch_id = $1
       ORDER BY COALESCE(st.registration_no, st.rollno) ASC, st.name ASC`,
      params,
    );

    const studentMap = new Map<string, any>();

    for (const r of rows) {
      if (!studentMap.has(r.student_id)) {
        studentMap.set(r.student_id, {
          student_id: r.student_id,
          rollno: r.rollno,
          name: r.name,
          subjects: {},
          totalClasses: 0,
          totalPresent: 0,
        });
      }

      const stObj = studentMap.get(r.student_id);
      if (r.subject_id) {
        const total = parseInt(r.total_classes || 0);
        const present = parseInt(r.present || 0);
        const pct = parseFloat(r.attendance_pct || 0);

        stObj.subjects[r.subject_id] = { total, present, pct };
        stObj.totalClasses += total;
        stObj.totalPresent += present;
      }
    }

    const studentList = Array.from(studentMap.values()).map(st => {
      const overallPct = st.totalClasses > 0
        ? parseFloat(((st.totalPresent / st.totalClasses) * 100).toFixed(2))
        : 0;
      return { ...st, overallPct };
    });

    return {
      subjects,
      students: studentList,
    };
  }

  // ─── Cancel a session ──────────────────────────────────────────────────────
  async cancelSession(tenantSlug: string, sessionId: string, userId: string) {
    const schema = this.getSchema(tenantSlug);
    await this.ds.query(
      `UPDATE "${schema}".attendance_sessions
       SET is_cancelled=true, updated_at=NOW()
       WHERE id=$1`,
      [sessionId],
    );
    return { sessionId, cancelled: true };
  }

  // ─── Get User Role & Department Scope ─────────────────────────────────────
  async getUserScope(tenantSlug: string, userId: string, role: UserRole) {
    const schema = this.getSchema(tenantSlug);
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role);

    if (isAdmin) {
      return {
        role,
        isAdmin: true,
        departmentId: null,
        departmentName: null,
        departmentCode: null,
        assignedSubjectIds: [],
      };
    }

    const fRows = await this.ds.query(
      `SELECT f.id AS faculty_id, f.department_id, f.subject_id,
              d.name AS department_name, d.code AS department_code
       FROM "${schema}".faculty f
       LEFT JOIN "${schema}".departments d ON d.id = f.department_id
       WHERE f.user_id = $1`,
      [userId],
    );

    let departmentId = fRows[0]?.department_id ?? null;
    let departmentName = fRows[0]?.department_name ?? null;
    let departmentCode = fRows[0]?.department_code ?? null;
    const facultyId = fRows[0]?.faculty_id ?? null;

    if (!departmentId) {
      const dRows = await this.ds.query(
        `SELECT id, name, code FROM "${schema}".departments WHERE hod_user_id = $1 LIMIT 1`,
        [userId],
      );
      if (dRows.length) {
        departmentId = dRows[0].id;
        departmentName = dRows[0].name;
        departmentCode = dRows[0].code;
      }
    }

    const assignedSubjectIds: string[] = [];
    if (fRows[0]?.subject_id) {
      assignedSubjectIds.push(fRows[0].subject_id);
    }

    if (facultyId) {
      const fsRows = await this.ds.query(
        `SELECT subject_id FROM "${schema}".faculty_subjects WHERE faculty_id = $1 AND is_active = true`,
        [facultyId],
      );
      fsRows.forEach((r: any) => {
        if (r.subject_id && !assignedSubjectIds.includes(r.subject_id)) {
          assignedSubjectIds.push(r.subject_id);
        }
      });
    }

    return {
      role,
      isAdmin: false,
      departmentId,
      departmentName,
      departmentCode,
      assignedSubjectIds,
    };
  }

  // ─── Get Scheduled Timetable Slots for Date & Batch ────────────────────────
  async getTimetableSlotsForDate(
    tenantSlug: string,
    batchId?: string,
    sessionDateStr?: string,
    departmentId?: string,
    userId?: string,
    role?: UserRole,
  ) {
    const schema = this.getSchema(tenantSlug);
    await this.ensureAttendanceColumns(schema);

    const targetDate = sessionDateStr ? new Date(sessionDateStr) : new Date();
    const dayOfWeek = targetDate.getDay();
    const formattedDate = sessionDateStr || targetDate.toISOString().split('T')[0];

    let effectiveDeptId = departmentId;

    if (userId && role && ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role)) {
      const scope = await this.getUserScope(tenantSlug, userId, role);
      if (scope.departmentId) {
        effectiveDeptId = scope.departmentId;
      }
    }

    const params: any[] = [dayOfWeek, formattedDate];
    let sql = `
      SELECT ts.id, ts.faculty_id, ts.subject_id, ts.department_id, ts.batch_id,
             ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
             ts.group_name, ts.topic, ts.competency_codes,
             f.name AS faculty_name,
             s.name AS subject_name, s.code AS subject_code,
             d.name AS department_name, d.code AS department_code,
             b.code AS batch_code,
             sess.id AS session_id,
             (sess.id IS NOT NULL) AS is_attendance_marked
      FROM "${schema}".timetable_slots ts
      LEFT JOIN "${schema}".faculty f ON f.id = ts.faculty_id
      LEFT JOIN "${schema}".subjects s ON s.id = ts.subject_id
      LEFT JOIN "${schema}".departments d ON d.id = ts.department_id
      LEFT JOIN "${schema}".batches b ON b.id = ts.batch_id
      LEFT JOIN "${schema}".attendance_sessions sess
        ON (sess.timetable_slot_id = ts.id OR (sess.subject_id = ts.subject_id AND sess.session_type = ts.slot_type))
       AND sess.batch_id = ts.batch_id
       AND sess.session_date = $2
       AND sess.is_cancelled = false
      WHERE ts.day_of_week = $1
    `;

    if (batchId) {
      params.push(batchId);
      sql += ` AND ts.batch_id = $${params.length}`;
    }

    if (effectiveDeptId) {
      params.push(effectiveDeptId);
      sql += ` AND (ts.department_id = $${params.length} OR s.department_id = $${params.length})`;
    }

    sql += ` ORDER BY ts.start_time ASC`;

    const slots = await this.ds.query(sql, params);
    return { date: formattedDate, dayOfWeek, slots };
  }
}
