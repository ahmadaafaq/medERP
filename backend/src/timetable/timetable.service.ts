import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateTimetableSlotDto, UpdateTimetableSlotDto } from './dto/timetable.dto';

@Injectable()
export class TimetableService implements OnModuleInit {
  private readonly logger = new Logger(TimetableService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly tenantSchemaService: TenantSchemaService,
  ) {}

  async onModuleInit() {
    try {
      const schemasRes = await this.dataSource.query(`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
      `);
      if (Array.isArray(schemasRes)) {
        for (const row of schemasRes) {
          const schemaName = row.schema_name;
          await this.dataSource.query(`
            ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
            ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
            ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
          `);
        }
        this.logger.log('Auto-migrated timetable_slots columns across all tenant schemas.');
      }
    } catch (err) {
      this.logger.error('Error auto-migrating timetable_slots columns:', err);
    }
  }

  async listSlots(tenantSlug: string, query: { departmentId?: string; batchId?: string; dayOfWeek?: number }) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const params: any[] = [];
    let sql = `
      SELECT ts.id, ts.faculty_id, ts.subject_id, ts.department_id, ts.batch_id,
             ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
             ts.effective_from, ts.effective_until, ts.group_name, ts.topic, ts.competency_codes,
             f.name AS faculty_name, f.emp_id AS faculty_code,
             s.name AS subject_name, s.code AS subject_code,
             d.name AS department_name,
             b.code AS batch_code, b.year AS batch_year
      FROM timetable_slots ts
      LEFT JOIN faculty f ON f.id = ts.faculty_id
      LEFT JOIN subjects s ON s.id = ts.subject_id
      LEFT JOIN departments d ON d.id = ts.department_id
      LEFT JOIN batches b ON b.id = ts.batch_id
      WHERE 1=1
    `;
    if (query.departmentId) {
      params.push(query.departmentId);
      sql += ` AND ts.department_id = $${params.length}`;
    }
    if (query.batchId) {
      params.push(query.batchId);
      sql += ` AND ts.batch_id = $${params.length}`;
    }
    if (query.dayOfWeek !== undefined) {
      params.push(Number(query.dayOfWeek));
      sql += ` AND ts.day_of_week = $${params.length}`;
    }
    sql += ` ORDER BY ts.day_of_week ASC, ts.start_time ASC`;
    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }

  async getStudentSchedule(tenantSlug: string, batchId?: string) {
    const slots = await this.listSlots(tenantSlug, { batchId });
    const now = new Date();
    const jsDay = now.getDay();
    const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;
    const currentTimeStr = now.toTimeString().split(' ')[0];

    const todaysSlots = slots.filter((s: any) => Number(s.day_of_week) === currentDayOfWeek);
    let currentLecture = todaysSlots.find((s: any) => {
      const start = String(s.start_time);
      const end = String(s.end_time);
      return start <= currentTimeStr && currentTimeStr <= end;
    });

    if (!currentLecture && todaysSlots.length > 0) {
      currentLecture = todaysSlots.find((s: any) => String(s.start_time) > currentTimeStr) || todaysSlots[0];
    }

    return {
      currentDayOfWeek,
      currentLecture: currentLecture || (slots.length > 0 ? slots[0] : null),
      todaysSlots,
      weeklySlots: slots,
    };
  }

  async getSlotById(tenantSlug: string, id: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM timetable_slots WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('Timetable slot not found');
    return rows[0];
  }

  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  async createSlot(tenantSlug: string, dto: CreateTimetableSlotDto) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);

    // Overlap validation
    await this.checkOverlap(slug, dto);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO timetable_slots (
         faculty_id, subject_id, department_id, batch_id, day_of_week,
         start_time, end_time, room, slot_type, effective_from, effective_until,
         group_name, topic, competency_codes
       ) VALUES ($1, $2, $3, $4, $5, $6::TIME, $7::TIME, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        this.isUUID(dto.facultyId) ? dto.facultyId : null,
        this.isUUID(dto.subjectId) ? dto.subjectId : null,
        this.isUUID(dto.departmentId) ? dto.departmentId : null,
        this.isUUID(dto.batchId) ? dto.batchId : null,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
        dto.room || null,
        dto.slotType,
        dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
        dto.groupName || null,
        dto.topic || null,
        dto.competencyCodes || null,
      ],
    );
    return rows[0];
  }

  async updateSlot(tenantSlug: string, id: string, dto: UpdateTimetableSlotDto) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const current = await this.getSlotById(tenantSlug, id);

    // Merge current and update details to perform proper conflict check
    const merged = {
      facultyId: dto.facultyId !== undefined ? dto.facultyId : current.faculty_id,
      subjectId: dto.subjectId !== undefined ? dto.subjectId : current.subject_id,
      departmentId: dto.departmentId !== undefined ? dto.departmentId : current.department_id,
      batchId: dto.batchId !== undefined ? dto.batchId : current.batch_id,
      dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : current.day_of_week,
      startTime: dto.startTime !== undefined ? dto.startTime : current.start_time,
      endTime: dto.endTime !== undefined ? dto.endTime : current.end_time,
      room: dto.room !== undefined ? dto.room : current.room,
      slotType: dto.slotType !== undefined ? dto.slotType : current.slot_type,
      groupName: dto.groupName !== undefined ? dto.groupName : current.group_name,
      topic: dto.topic !== undefined ? dto.topic : current.topic,
      competencyCodes: dto.competencyCodes !== undefined ? dto.competencyCodes : current.competency_codes,
    } as CreateTimetableSlotDto;

    await this.checkOverlap(slug, merged, id);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `UPDATE timetable_slots
       SET faculty_id = $1,
           subject_id = $2,
           department_id = $3,
           batch_id = $4,
           day_of_week = $5,
           start_time = $6::TIME,
           end_time = $7::TIME,
           room = $8,
           slot_type = $9,
           effective_from = $10,
           effective_until = $11,
           group_name = $12,
           topic = $13,
           competency_codes = $14
       WHERE id = $15
       RETURNING *`,
      [
        this.isUUID(merged.facultyId) ? merged.facultyId : null,
        this.isUUID(merged.subjectId) ? merged.subjectId : null,
        this.isUUID(merged.departmentId) ? merged.departmentId : null,
        this.isUUID(merged.batchId) ? merged.batchId : null,
        merged.dayOfWeek,
        merged.startTime,
        merged.endTime,
        merged.room || null,
        merged.slotType,
        dto.effectiveFrom !== undefined ? (dto.effectiveFrom ? new Date(dto.effectiveFrom) : null) : current.effective_from,
        dto.effectiveUntil !== undefined ? (dto.effectiveUntil ? new Date(dto.effectiveUntil) : null) : current.effective_until,
        merged.groupName || null,
        merged.topic || null,
        merged.competencyCodes || null,
        id,
      ],
    );
    return rows[0];
  }

  async deleteSlot(tenantSlug: string, id: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    await this.getSlotById(tenantSlug, id); // throws if not found
    await this.tenantSchemaService.queryInTenant(
      slug,
      `DELETE FROM timetable_slots WHERE id = $1`,
      [id],
    );
    return { success: true, message: 'Timetable slot deleted successfully' };
  }

  async getRelevantFaculties(tenantSlug: string, subjectId?: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const params: any[] = [];
    
    // We want a list of all faculties that belong to the department OR are linked to the subject via the Subject Linker (faculty_subjects).
    // Prioritize linked faculties at the top!
    let sql = `
      SELECT DISTINCT f.id, f.emp_id, f.name, f.designation, f.phone, f.department_id, f.staff_type, f.is_active,
                      d.name AS department_name,
                      (CASE WHEN fs.subject_id = $1 THEN 1 ELSE 2 END) AS priority
      FROM faculty f
      LEFT JOIN departments d ON d.id = f.department_id
      LEFT JOIN faculty_subjects fs ON fs.faculty_id = f.id AND fs.subject_id = $1 AND fs.is_active = true
      WHERE f.is_active = true
    `;
    params.push(subjectId || null);

    const conditions: string[] = [];
    if (subjectId) {
      // either linked via Subject Linker OR has it as their primary subject_id
      conditions.push(`(fs.subject_id = $1 OR f.subject_id = $1)`);
    }
    if (departmentId) {
      params.push(departmentId);
      conditions.push(`f.department_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` AND (${conditions.join(' OR ')})`;
    }

    sql += ` ORDER BY priority ASC, f.name ASC`;
    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }

  private async checkOverlap(slug: string, dto: CreateTimetableSlotDto, excludeId?: string) {
    const params = [
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    ];
    let queryIndex = 4;

    const clauses: string[] = [];

    if (dto.facultyId && this.isUUID(dto.facultyId)) {
      clauses.push(`(ts.faculty_id = $${queryIndex++})`);
      params.push(dto.facultyId);
    }
    if (dto.room) {
      clauses.push(`(ts.room = $${queryIndex++} AND ts.room <> '')`);
      params.push(dto.room);
    }
    if (dto.batchId && this.isUUID(dto.batchId)) {
      clauses.push(`(ts.batch_id = $${queryIndex++})`);
      params.push(dto.batchId);
    }

    if (clauses.length === 0) return;

    let sql = `
      SELECT ts.id, ts.room, ts.slot_type, f.name AS faculty_name, b.code AS batch_code
      FROM timetable_slots ts
      LEFT JOIN faculty f ON f.id = ts.faculty_id
      LEFT JOIN batches b ON b.id = ts.batch_id
      WHERE ts.day_of_week = $1
        AND (ts.start_time, ts.end_time) OVERLAPS ($2::TIME, $3::TIME)
        AND (${clauses.join(' OR ')})
    `;

    if (excludeId && this.isUUID(excludeId)) {
      sql += ` AND ts.id <> $${queryIndex}`;
      params.push(excludeId);
    }

    const conflicts = await this.tenantSchemaService.queryInTenant(slug, sql, params);
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      let msg = 'Schedule conflict: ';
      if (dto.facultyId && conflict.faculty_name) {
        msg += `Faculty member ${conflict.faculty_name} is already scheduled during this time. `;
      } else if (dto.batchId && conflict.batch_code) {
        msg += `Batch ${conflict.batch_code} is already scheduled during this time. `;
      } else if (dto.room && conflict.room) {
        msg += `Room ${conflict.room} is already booked during this time. `;
      } else {
        msg += `Overlapping schedule slot exists.`;
      }
      throw new BadRequestException(msg.trim());
    }
  }
}
