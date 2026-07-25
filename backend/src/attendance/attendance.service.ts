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

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ─── Create Session + Mark Attendance (CLERK / FACULTY) ────────────────────
  async createSession(
    tenantSlug: string,
    dto: CreateSessionDto,
    markedByUserId: string,
    markerRole: UserRole,
  ) {
    const schema = `tenant_${tenantSlug}`;

    // Validate subject + batch exist
    const [subjectRows, batchRows] = await Promise.all([
      this.ds.query(`SELECT id FROM "${schema}".subjects WHERE id=$1`, [dto.subjectId]),
      this.ds.query(`SELECT id FROM "${schema}".batches WHERE id=$1`, [dto.batchId]),
    ]);
    if (!subjectRows.length) throw new NotFoundException('Subject not found');
    if (!batchRows.length) throw new NotFoundException('Batch not found');

    // Prevent duplicate session same day+subject+batch
    const dupCheck = await this.ds.query(
      `SELECT id FROM "${schema}".attendance_sessions
       WHERE subject_id=$1 AND batch_id=$2 AND session_date=$3 AND session_type=$4`,
      [dto.subjectId, dto.batchId, dto.sessionDate, dto.sessionType ?? 'THEORY'],
    );
    if (dupCheck.length) {
      throw new ConflictException(
        'An attendance session already exists for this subject, batch, date, and type',
      );
    }

    // Get faculty_id if marker is a faculty member
    let facultyId: string | null = null;
    if ([UserRole.FACULTY, UserRole.HOD].includes(markerRole)) {
      const fRows = await this.ds.query(
        `SELECT id FROM "${schema}".faculty WHERE user_id=$1`,
        [markedByUserId],
      );
      facultyId = fRows[0]?.id ?? null;
    }

    // Create the session
    const sessionRows = await this.ds.query(
      `INSERT INTO "${schema}".attendance_sessions
         (subject_id, batch_id, faculty_id, session_date, session_type,
          topic_covered, timetable_slot_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        dto.subjectId, dto.batchId, facultyId,
        dto.sessionDate, dto.sessionType ?? 'THEORY',
        dto.topicCovered ?? null,
        dto.timetableSlotId ?? null,
        markedByUserId,
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
      params.push(markedByUserId);

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
      `Attendance session created: ${sessionId} by ${markedByUserId} [${markerRole}]`,
    );

    return { sessionId, recordsMarked: dto.records.length };
  }

  // ─── Get Sessions (paginated list) ─────────────────────────────────────────
  async getSessions(
    tenantSlug: string,
    pagination: PaginationDto,
    filters: AttendanceQueryDto = {},
  ) {
    const schema = `tenant_${tenantSlug}`;
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
    const schema = `tenant_${tenantSlug}`;

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
    const schema = `tenant_${tenantSlug}`;

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
    const schema = `tenant_${tenantSlug}`;

    const conditions = [`ar.student_id=$1`];
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
          COUNT(*) AS total_classes,
          COUNT(*) FILTER (WHERE ar.status = 'PRESENT') AS present,
          COUNT(*) FILTER (WHERE ar.status = 'ABSENT') AS absent,
          COUNT(*) FILTER (WHERE ar.status = 'LATE') AS late,
          COUNT(*) FILTER (WHERE ar.status = 'EXCUSED') AS excused,
          ROUND(
            (COUNT(*) FILTER (WHERE ar.status IN ('PRESENT','LATE')) * 100.0)
            / NULLIF(COUNT(*), 0), 2
          ) AS attendance_percentage
       FROM "${schema}".attendance_records ar
       JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
       JOIN "${schema}".subjects sub ON sub.id = s.subject_id
       WHERE ${conditions.join(' AND ')}
         AND s.is_cancelled = false
       GROUP BY sub.id, sub.name, sub.code
       ORDER BY sub.name ASC`,
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

  // ─── Batch-wise attendance report ─────────────────────────────────────────
  async getBatchAttendanceReport(tenantSlug: string, batchId: string, subjectId?: string) {
    const schema = `tenant_${tenantSlug}`;

    const conditions = [`s.batch_id=$1`, `s.is_cancelled=false`];
    const params: any[] = [batchId];
    if (subjectId) { conditions.push(`s.subject_id=$2`); params.push(subjectId); }

    return this.ds.query(
      `SELECT
          st.id AS student_id, st.rollno, st.name,
          COUNT(ar.id) AS total_classes,
          COUNT(ar.id) FILTER (WHERE ar.status='PRESENT') AS present,
          ROUND(
            (COUNT(ar.id) FILTER (WHERE ar.status IN ('PRESENT','LATE')) * 100.0)
            / NULLIF(COUNT(ar.id),0), 2
          ) AS attendance_pct,
          COUNT(ar.id) FILTER (WHERE ar.status='ABSENT') AS absent
       FROM "${schema}".students st
       LEFT JOIN "${schema}".attendance_records ar ON ar.student_id = st.id
       LEFT JOIN "${schema}".attendance_sessions s ON s.id = ar.session_id
         AND ${conditions.join(' AND ')}
       WHERE st.batch_id = $1 AND st.is_active = true
       GROUP BY st.id, st.rollno, st.name
       ORDER BY st.rollno ASC`,
      params,
    );
  }

  // ─── Cancel a session ──────────────────────────────────────────────────────
  async cancelSession(tenantSlug: string, sessionId: string, userId: string) {
    const schema = `tenant_${tenantSlug}`;
    await this.ds.query(
      `UPDATE "${schema}".attendance_sessions
       SET is_cancelled=true, updated_at=NOW()
       WHERE id=$1`,
      [sessionId],
    );
    return { sessionId, cancelled: true };
  }
}
