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
  ) { }

  async onModuleInit() {
    try {
      const schemasRes = await this.dataSource.query(`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'
      `);
      if (Array.isArray(schemasRes)) {
        for (const row of schemasRes) {
          const schemaName = row.schema_name;
          try {
            // 1. Ensure timetable_slots table exists before attempting ALTER TABLE
            await this.dataSource.query(`
              CREATE TABLE IF NOT EXISTS "${schemaName}".timetable_slots (
                id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                faculty_id      UUID,
                subject_id      UUID,
                department_id   UUID,
                batch_id        UUID,
                day_of_week     INT          NOT NULL DEFAULT 1,
                start_time      TIME         NOT NULL DEFAULT '09:00:00',
                end_time        TIME         NOT NULL DEFAULT '10:00:00',
                room            VARCHAR(50),
                slot_type       VARCHAR(50),
                effective_from  DATE,
                effective_until DATE,
                group_name      VARCHAR(100),
                topic           VARCHAR(255),
                competency_codes VARCHAR(255),
                unit_name       VARCHAR(255),
                unit_id         VARCHAR(100),
                sub_topics      VARCHAR(500),
                colg_cd         VARCHAR(50),
                course_cd       VARCHAR(50),
                branch_cd       VARCHAR(50),
                batch_cd        VARCHAR(50),
                semester        VARCHAR(50),
                section         VARCHAR(50),
                description     TEXT,
                status          VARCHAR(50)  DEFAULT 'APPROVED',
                draft_id        UUID
              );
            `);

            // 2. Ensure all columns exist in case it was created with an older schema
            await this.dataSource.query(`
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS effective_from DATE;
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS effective_until DATE;
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS competency_codes VARCHAR(255);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS unit_name VARCHAR(255);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS unit_id VARCHAR(100);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS sub_topics VARCHAR(500);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS section VARCHAR(50);
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS description TEXT;
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';
              ALTER TABLE "${schemaName}".timetable_slots ADD COLUMN IF NOT EXISTS draft_id UUID;
            `);

            // 3. Auto-link timetable slots that have null subject_id to their respective subjects if table exists
            try {
              const hasSubjects = await this.dataSource.query(
                `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'subjects'`,
                [schemaName],
              );
              if (hasSubjects.length > 0) {
                await this.dataSource.query(`
                  UPDATE "${schemaName}".timetable_slots ts
                  SET subject_id = s.id
                  FROM "${schemaName}".subjects s
                  WHERE ts.subject_id IS NULL
                    AND (
                      s.id::text = ts.topic
                      OR s.code = ts.topic
                      OR LOWER(s.name) = LOWER(ts.topic)
                      OR (LOWER(ts.topic) = 'coa' AND (s.name ILIKE '%Computer Organization%' OR s.code ILIKE '%302%'))
                      OR (LOWER(ts.topic) LIKE '%tc%' AND s.name ILIKE '%Technical Communication%')
                      OR (LOWER(ts.topic) LIKE '%web technology lab%' AND s.name ILIKE '%Web Technology Lab%')
                      OR (LOWER(ts.topic) LIKE '%web technology%' AND s.name ILIKE '%Web Technology%')
                      OR (LOWER(ts.topic) LIKE '%business communication%' AND s.name ILIKE '%Business Communication%')
                      OR (LOWER(ts.topic) LIKE '%object oriented programming%' AND s.name ILIKE '%Object Oriented Programming in C++%')
                      OR (LOWER(ts.topic) LIKE '%front end development%' AND s.name ILIKE '%Front End Development%')
                      OR (LOWER(ts.topic) = 'wt' AND s.name ILIKE '%Web Technology%')
                      OR (LOWER(ts.topic) = 'dbms' AND s.name ILIKE '%Database Management%')
                      OR (LOWER(ts.topic) = 'os' AND s.name ILIKE '%Operating System%')
                    )
                `);
              }
            } catch {
              // Ignore subject link errors
            }
          } catch (schemaErr: any) {
            this.logger.warn(`Could not auto-migrate timetable_slots in schema ${schemaName}: ${schemaErr?.message}`);
          }
        }
        this.logger.log('Auto-migrated timetable_slots columns and linked subjects across all tenant schemas.');
      }
    } catch (err) {
      this.logger.error('Error auto-migrating timetable_slots columns:', err);
    }
  }

  async listSlots(
    tenantSlug: string,
    query: {
      departmentId?: string;
      batchId?: string;
      dayOfWeek?: number;
      facultyId?: string;
      subjectId?: string;
      courseId?: string;
      courseCd?: string;
      branchId?: string;
      branchCd?: string;
      batchCd?: string;
      colgCd?: string;
      semester?: string;
      section?: string;
      sessionId?: string;
      status?: string;
      isStudent?: boolean;
    },
  ) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);

    const params: any[] = [];
    let sql = `
      SELECT ts.id, ts.faculty_id, ts.subject_id, ts.department_id, ts.batch_id,
             ts.day_of_week, ts.start_time, ts.end_time, ts.room, ts.slot_type,
             ts.effective_from, ts.effective_until, ts.group_name, ts.topic, ts.competency_codes,
             ts.unit_name, ts.unit_id, ts.sub_topics, ts.colg_cd, ts.course_cd, ts.branch_cd, ts.batch_cd,
             ts.semester, ts.section, ts.description, COALESCE(ts.status, 'APPROVED') AS status, ts.draft_id,
             COALESCE(f.name, '') AS faculty_name, f.emp_id AS faculty_code,
             COALESCE(s.name, '') AS subject_name, COALESCE(s.code, '') AS subject_code, COALESCE(s.code, '') AS subject_cd, COALESCE(s.sub_addinfo, '') AS subject_paper_code, COALESCE(s.type, '') AS subject_type,
             COALESCE(d.name, '') AS department_name, d.code AS department_code,
             COALESCE(d.course_name, '') AS course_name,
             COALESCE(ts.batch_id::text, b.id::text) AS batch_id,
             COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, ts.batch_cd, b.code) AS batch_code,
             COALESCE(b.name, CASE WHEN b.year IS NOT NULL THEN 'Batch ' || b.year::text ELSE NULL END, ts.batch_cd, b.code) AS batch_name,
             COALESCE(b.year::text, ts.batch_cd) AS batch_year,
             COALESCE(ts.batch_cd, b.batch_cd) AS batch_numeric_cd
      FROM timetable_slots ts
      LEFT JOIN faculty f ON f.id::text = ts.faculty_id::text
      LEFT JOIN subjects s ON s.id::text = ts.subject_id::text
      LEFT JOIN departments d ON d.id::text = ts.department_id::text
      LEFT JOIN batches b ON (CASE WHEN ts.batch_id IS NOT NULL THEN b.id::text = ts.batch_id::text ELSE (b.batch_cd = ts.batch_cd AND (b.course_cd = ts.course_cd OR ts.course_cd IS NULL)) END)
      WHERE 1=1
    `;

    let facultyRecord: any = null;
    if (query.facultyId && query.facultyId !== 'all') {
      try {
        const facRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, emp_id, name, department_id FROM faculty 
           WHERE id::text = $1 OR emp_id::text = $1 OR user_id::text = $1 
              OR LOWER(name) = LOWER($1) 
              OR regexp_replace(name, '\\s+', ' ', 'g') ILIKE '%' || regexp_replace($1, '\\s+', ' ', 'g') || '%'
           LIMIT 1`,
          [query.facultyId],
        );
        facultyRecord = facRows?.[0] || null;
      } catch (e) {
        // Continue gracefully
      }
    }

    if (query.departmentId && query.departmentId !== 'all') {
      // If a faculty is querying for their own schedule across multiple courses/departments, don't restrict by department
      if (!query.facultyId || query.facultyId === 'all') {
        params.push(query.departmentId);
        const pIdx = params.length;
        if (this.isUUID(query.departmentId)) {
          sql += ` AND (ts.department_id::text = $${pIdx}::text OR f.department_id::text = $${pIdx}::text OR s.department_id::text = $${pIdx}::text)`;
        } else {
          sql += ` AND (
            d.code = $${pIdx} OR d.branch_cd = $${pIdx} OR d.id::text = $${pIdx} OR d.name ILIKE '%' || $${pIdx} || '%'
            OR ts.department_id IN (SELECT id FROM departments WHERE code = $${pIdx} OR branch_cd = $${pIdx} OR name ILIKE '%' || $${pIdx} || '%')
            OR f.department_id IN (SELECT id FROM departments WHERE code = $${pIdx} OR branch_cd = $${pIdx} OR name ILIKE '%' || $${pIdx} || '%')
            OR s.department_id IN (SELECT id FROM departments WHERE code = $${pIdx} OR branch_cd = $${pIdx} OR name ILIKE '%' || $${pIdx} || '%')
          )`;
        }
      }
    }

    if (query.facultyId && query.facultyId !== 'all') {
      const facIds: string[] = [query.facultyId];
      if (facultyRecord?.id && !facIds.includes(String(facultyRecord.id))) facIds.push(String(facultyRecord.id));
      if (facultyRecord?.emp_id && !facIds.includes(String(facultyRecord.emp_id))) facIds.push(String(facultyRecord.emp_id));

      params.push(facIds);
      const facArrIdx = params.length;

      const searchName = (facultyRecord?.name || query.facultyId).trim();
      const words = searchName.split(/\s+/).filter(Boolean);

      let facMatchSql = `(ts.faculty_id::text = ANY($${facArrIdx}::text[]) OR f.id::text = ANY($${facArrIdx}::text[]) OR f.emp_id::text = ANY($${facArrIdx}::text[])`;

      if (words.length > 0) {
        const wordConditions: string[] = [];
        for (const w of words) {
          params.push(`%${w}%`);
          const wIdx = params.length;
          wordConditions.push(`(ts.description ILIKE $${wIdx} OR f.name ILIKE $${wIdx})`);
        }
        facMatchSql += ` OR (${wordConditions.join(' AND ')})`;
      }
      facMatchSql += `)`;
      sql += ` AND ${facMatchSql}`;
    }

    if (query.subjectId && query.subjectId !== 'all') {
      params.push(query.subjectId);
      const pIdx = params.length;
      if (this.isUUID(query.subjectId)) {
        sql += ` AND (ts.subject_id::text = $${pIdx}::text OR s.id::text = $${pIdx}::text)`;
      } else {
        sql += ` AND (s.code::text = $${pIdx}::text OR s.sub_addinfo::text = $${pIdx}::text OR ts.subject_id::text = $${pIdx}::text OR s.id::text = $${pIdx}::text OR s.name ILIKE '%' || $${pIdx} || '%')`;
      }
    }

    if (query.batchId && query.batchId !== 'all') {
      params.push(query.batchId);
      const pIdx = params.length;
      if (this.isUUID(query.batchId)) {
        sql += ` AND (ts.batch_id::text = $${pIdx}::text OR b.id::text = $${pIdx}::text)`;
      } else {
        sql += ` AND (b.year::text = $${pIdx} OR b.code = $${pIdx} OR b.name = $${pIdx} OR b.name ILIKE '%' || $${pIdx} || '%' OR ts.batch_id::text = $${pIdx} OR ts.batch_cd = $${pIdx})`;
      }
    }

    if (query.courseId && query.courseId !== 'all') {
      params.push(query.courseId);
      const pIdx = params.length;
      if (this.isUUID(query.courseId)) {
        sql += ` AND (b.course_id = $${pIdx} OR s.course_id = $${pIdx})`;
      } else {
        sql += ` AND (b.course_cd = $${pIdx} OR s.course_cd = $${pIdx} OR b.course_name ILIKE '%' || $${pIdx} || '%' OR ts.course_cd = $${pIdx})`;
      }
    }

    if (query.courseCd && query.courseCd !== 'all') {
      params.push(query.courseCd);
      const pIdx = params.length;
      sql += ` AND (ts.course_cd = $${pIdx} OR b.course_cd = $${pIdx} OR s.course_cd = $${pIdx})`;
    }

    if (query.branchCd && query.branchCd !== 'all') {
      params.push(query.branchCd);
      const pIdx = params.length;
      sql += ` AND (ts.branch_cd = $${pIdx} OR d.branch_cd = $${pIdx} OR d.code = $${pIdx})`;
    }

    if (query.batchCd && query.batchCd !== 'all') {
      params.push(query.batchCd);
      const pIdx = params.length;
      sql += ` AND (ts.batch_cd = $${pIdx} OR b.batch_cd = $${pIdx} OR b.code = $${pIdx} OR b.year::text = $${pIdx} OR b.name ILIKE '%' || $${pIdx} || '%')`;
    }

    if (query.colgCd && query.colgCd !== 'all') {
      params.push(query.colgCd);
      const pIdx = params.length;
      sql += ` AND (ts.colg_cd = $${pIdx} OR ts.colg_cd IS NULL)`;
    }

    if (query.semester && query.semester !== 'all') {
      params.push(String(query.semester));
      const pIdx = params.length;
      sql += ` AND (ts.semester = $${pIdx} OR ts.semester IS NULL)`;
    }

    if (query.section && query.section !== 'all') {
      params.push(String(query.section));
      const pIdx = params.length;
      sql += ` AND (ts.section = $${pIdx} OR ts.section IS NULL OR ts.section = 'All')`;
    }

    if (query.dayOfWeek !== undefined && !isNaN(Number(query.dayOfWeek))) {
      params.push(Number(query.dayOfWeek));
      sql += ` AND ts.day_of_week = $${params.length}`;
    }

    if (query.status && query.status !== 'all') {
      params.push(query.status);
      sql += ` AND (ts.status = $${params.length})`;
    } else if (query.isStudent) {
      sql += ` AND (ts.status = 'APPROVED' OR ts.status IS NULL)`;
    }

    sql += ` ORDER BY ts.day_of_week ASC, ts.start_time ASC`;

    const slots = await this.tenantSchemaService.queryInTenant(slug, sql, params);

    // 1. Index PostgreSQL designed slots
    const slotMap = new Map<string, any>();
    for (const s of slots) {
      slotMap.set(s.id, { ...s });
    }

    // 2. Fetch SRMS Timetable Events strictly matching requested academic filters
    let srmsWhere: string[] = ['1=1'];
    let srmsParams: any[] = [];
    if (query.colgCd && query.colgCd !== 'all') {
      srmsParams.push(query.colgCd);
      srmsWhere.push(`(colg_cd = $${srmsParams.length} OR colg_cd IS NULL)`);
    }
    if (query.courseCd && query.courseCd !== 'all') {
      srmsParams.push(query.courseCd);
      srmsWhere.push(`(course_cd = $${srmsParams.length} OR course_cd IS NULL)`);
    }
    if (query.branchCd && query.branchCd !== 'all') {
      srmsParams.push(query.branchCd);
      srmsWhere.push(`(branch_cd = $${srmsParams.length} OR branch_cd IS NULL)`);
    }
    if (query.batchCd && query.batchCd !== 'all') {
      srmsParams.push(query.batchCd);
      srmsWhere.push(`(batch_cd = $${srmsParams.length} OR batch_cd IS NULL)`);
    }
    if (query.semester && query.semester !== 'all') {
      srmsParams.push(String(query.semester));
      srmsWhere.push(`(sem_cd = $${srmsParams.length} OR sem_cd IS NULL)`);
    }
    if (query.facultyId && query.facultyId !== 'all') {
      const matchIds: string[] = [query.facultyId];
      if (facultyRecord?.emp_id && !matchIds.includes(String(facultyRecord.emp_id))) matchIds.push(String(facultyRecord.emp_id));
      if (facultyRecord?.id && !matchIds.includes(String(facultyRecord.id))) matchIds.push(String(facultyRecord.id));

      const orClauses: string[] = [];
      for (const mId of matchIds) {
        srmsParams.push(mId);
        const idx = srmsParams.length;
        orClauses.push(`empid = $${idx} OR empid ILIKE '%' || $${idx} || '%'`);
      }
      if (facultyRecord?.name) {
        srmsParams.push(facultyRecord.name);
        const idx = srmsParams.length;
        orClauses.push(`title ILIKE '%' || $${idx} || '%' OR description ILIKE '%' || $${idx} || '%'`);
      }
      srmsWhere.push(`(${orClauses.join(' OR ')})`);
    }

    let srmsEvents: any[] = [];
    let tenantSubjects: any[] = [];
    try {
      [srmsEvents, tenantSubjects] = await Promise.all([
        this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, title, description, start_time, end_time, start_str, end_str, day_of_week,
                  linkcd, empid, colg_cd, course_cd, branch_cd, batch_cd, sem_cd, camera_link,
                  unit_name, unit_id, topic, sub_topics, competency_codes
           FROM srms_timetable_events
           WHERE ${srmsWhere.join(' AND ')}
           ORDER BY start_time ASC`,
          srmsParams,
        ),
        this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, code, name, sub_addinfo, course_cd FROM subjects`,
        ).catch(() => []),
      ]);
    } catch (e) {
      // Graceful fallback
    }

    for (const ev of srmsEvents) {
      const sTime = ev.start_str && ev.start_str.includes(':')
        ? ev.start_str.split(' ')[1]?.slice(0, 8)
        : (ev.start_time ? String(ev.start_time).slice(11, 19) : '09:30:00');
      const eTime = ev.end_str && ev.end_str.includes(':')
        ? ev.end_str.split(' ')[1]?.slice(0, 8)
        : (ev.end_time ? String(ev.end_time).slice(11, 19) : '10:30:00');
      const dayVal = ev.day_of_week || 1;
      const sTimePrefix = (sTime || '').slice(0, 5);

      const rawTitle = String(ev.title || ev.description || '');
      const cleanName = rawTitle.replace(/\([^)]*\)/g, '').trim();
      const teacher = (rawTitle.match(/\(([^)]+)\)/)?.[1] || 'Faculty Incharge').trim();
      const isLab = rawTitle.toLowerCase().includes('lab') || rawTitle.toLowerCase().includes('practical');

      // Resolve real subject_id and subject_code from tenant subjects (never use course names like B.Tech/BCA)
      let resolvedSubCode = ev.linkcd || '';
      let resolvedSubId: string | null = null;
      let resolvedSubName = cleanName || rawTitle;

      const matchedSubject = tenantSubjects.find((sub: any) => {
        if (ev.linkcd && String(sub.code).trim() === String(ev.linkcd).trim()) return true;
        const normSub = String(sub.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const normClean = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normClean && normSub && (normSub.includes(normClean) || normClean.includes(normSub))) return true;
        if (cleanName.toLowerCase() === 'coa' && (sub.code === '85717' || sub.code === '88606' || sub.code === 'KCS-302' || String(sub.name).toLowerCase().includes('computer organization'))) return true;
        return false;
      });

      if (matchedSubject) {
        resolvedSubId = matchedSubject.id;
        resolvedSubCode = matchedSubject.code || resolvedSubCode;
        resolvedSubName = matchedSubject.name || resolvedSubName;
      }

      // Check if a slot already exists for this exact day, start time, course, and section
      let matchingSlotKey: string | null = null;
      for (const [key, slot] of slotMap.entries()) {
        const sameDay = Number(slot.day_of_week) === Number(dayVal);
        const sameTime = String(slot.start_time || '').slice(0, 5) === sTimePrefix;
        const sameCourse = !ev.course_cd || !slot.course_cd || String(ev.course_cd) === String(slot.course_cd);
        const sameSec = !ev.txt_sec || !slot.section || String(ev.txt_sec) === String(slot.section);
        if (sameDay && sameTime && sameCourse && sameSec) {
          matchingSlotKey = key;
          break;
        }
      }

      const isCourseTitle = (code: any) => {
        if (!code) return false;
        const s = String(code).toLowerCase().trim();
        return s === 'b.tech' || s === 'b.tech.' || s === 'bca' || s === 'mba' || s === 'mca' || s === 'b.pharma';
      };

      if (matchingSlotKey) {
        // Merge metadata into existing rich slot
        const existing = slotMap.get(matchingSlotKey);
        const validCode = !isCourseTitle(existing.subject_code) ? (existing.subject_code || resolvedSubCode) : resolvedSubCode;
        slotMap.set(matchingSlotKey, {
          ...existing,
          subject_id: existing.subject_id || resolvedSubId,
          subject_code: validCode,
          subject_cd: validCode,
          topic: existing.topic || ev.topic || cleanName || rawTitle,
          unit_name: existing.unit_name || ev.unit_name,
          unit_id: existing.unit_id || ev.unit_id,
          sub_topics: existing.sub_topics || ev.sub_topics,
          competency_codes: existing.competency_codes || ev.competency_codes,
          room: existing.room || (ev.camera_link ? `Room 204 (Cam #${ev.camera_link})` : 'Room 204'),
          course_cd: existing.course_cd || ev.course_cd,
          branch_cd: existing.branch_cd || ev.branch_cd,
          semester: existing.semester || ev.sem_cd,
          section: existing.section || ev.txt_sec,
        });
      } else if (!slotMap.has(ev.id)) {
        slotMap.set(ev.id, {
          id: ev.id,
          subject_id: resolvedSubId,
          day_of_week: dayVal,
          start_time: sTime || '09:30:00',
          end_time: eTime || '10:30:00',
          room: ev.camera_link ? `Room 204 (Cam #${ev.camera_link})` : (isLab ? 'Comp Lab 2' : 'Room 204'),
          slot_type: isLab ? 'Practical' : 'Lecture',
          topic: ev.topic || cleanName || rawTitle,
          unit_name: ev.unit_name,
          unit_id: ev.unit_id,
          sub_topics: ev.sub_topics,
          competency_codes: ev.competency_codes,
          subject_name: resolvedSubName,
          subject_code: resolvedSubCode,
          subject_cd: resolvedSubCode,
          faculty_name: teacher,
          faculty_code: ev.empid,
          department_name: ev.course_cd === '1' ? 'Computer Science and Engineering' : (ev.course_cd === '13' ? 'BCA Department' : 'Academic Department'),
          batch_code: ev.batch_cd ? `Batch ${ev.batch_cd}` : 'Batch 2025',
          batch_name: ev.batch_cd ? `Batch ${ev.batch_cd}` : 'Batch 2025',
          batch_year: 2025,
          course_cd: ev.course_cd,
          branch_cd: ev.branch_cd,
          semester: ev.sem_cd,
          section: ev.txt_sec,
          description: rawTitle,
        });
      }
    }

    // 3. Enrich existing slots with conducted session updates from attendance_sessions
    let sessionParams: any[] = [];
    let sessionWhere: string[] = ['s.is_cancelled = false', 's.timetable_slot_id IS NOT NULL'];

    if (query.facultyId && query.facultyId !== 'all') {
      sessionParams.push(query.facultyId);
      const pIdx = sessionParams.length;
      if (this.isUUID(query.facultyId)) {
        sessionWhere.push(`(s.faculty_id::text = $${pIdx}::text OR ts.faculty_id::text = $${pIdx}::text)`);
      } else {
        sessionWhere.push(`(f.emp_id = $${pIdx} OR f.id::text = $${pIdx} OR f.name ILIKE '%' || $${pIdx} || '%')`);
      }
    }

    try {
      const conductedSessions = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT s.id, s.timetable_slot_id, s.topic_covered AS topic, s.session_date::text AS session_date,
                COALESCE(f.name, '') AS faculty_name
         FROM attendance_sessions s
         LEFT JOIN timetable_slots ts ON ts.id::text = s.timetable_slot_id::text
         LEFT JOIN faculty f ON f.id::text = s.faculty_id::text
         WHERE ${sessionWhere.join(' AND ')}
         ORDER BY s.session_date DESC`,
        sessionParams,
      );

      for (const cs of conductedSessions) {
        if (cs.timetable_slot_id && slotMap.has(cs.timetable_slot_id)) {
          const existing = slotMap.get(cs.timetable_slot_id);
          slotMap.set(cs.timetable_slot_id, {
            ...existing,
            topic: cs.topic || existing.topic,
            session_date: cs.session_date,
            faculty_name: cs.faculty_name || existing.faculty_name,
          });
        }
      }
    } catch (e) {
      // Graceful fallback
    }

    const mergedSlots = Array.from(slotMap.values());

    // Enrich slots with matching competencies details from database competencies table
    const subjectIds = Array.from(new Set(mergedSlots.map((s: any) => s.subject_id).filter(Boolean)));
    let compMap: Record<string, any[]> = {};
    if (subjectIds.length > 0) {
      try {
        const compRows = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT id, subject_id, code, description, domain, level, is_core 
           FROM competencies 
           WHERE subject_id = ANY($1::uuid[]) AND is_active = true`,
          [subjectIds]
        );
        for (const comp of compRows) {
          if (!compMap[comp.subject_id]) compMap[comp.subject_id] = [];
          compMap[comp.subject_id].push(comp);
        }
      } catch (err) {
        // Continue gracefully if table is missing
      }
    }

    // Deduplicate slots that share the same day, time window, course, semester, section, and subject/faculty
    const seenSlots = new Map<string, any>();
    for (const slot of mergedSlots) {
      const sTime = String(slot.start_time || '').slice(0, 5);
      const eTime = String(slot.end_time || '').slice(0, 5);
      const cleanSubj = String(slot.subject_code || slot.subject_name || slot.topic || slot.description || '')
        .replace(/\([^)]*\)/g, '')
        .toLowerCase()
        .trim();
      const facKey = String(slot.faculty_id || slot.faculty_name || '').toLowerCase().trim();
      const dedupKey = `${slot.day_of_week}_${sTime}_${eTime}_${slot.course_cd || ''}_${slot.semester || ''}_${slot.section || ''}_${cleanSubj}_${facKey}`;

      if (seenSlots.has(dedupKey)) {
        const existing = seenSlots.get(dedupKey);
        if (!existing.batch_id && slot.batch_id) existing.batch_id = slot.batch_id;
        if (!existing.subject_id && slot.subject_id) existing.subject_id = slot.subject_id;
        if (slot.room && (!existing.room || existing.room === 'Web Cam')) existing.room = slot.room;
        seenSlots.set(dedupKey, existing);
      } else {
        seenSlots.set(dedupKey, { ...slot });
      }
    }
    const finalSlots = Array.from(seenSlots.values());

    return finalSlots.map((slot: any) => {
      const relatedComps = compMap[slot.subject_id] || [];
      let matchedComps = relatedComps;
      if (slot.competency_codes || slot.topic) {
        const topicStr = String(slot.topic || '').toLowerCase();
        const codesArr = String(slot.competency_codes || '').split(',').map((c: string) => c.trim().toLowerCase());
        const filtered = relatedComps.filter(c =>
          codesArr.includes(c.code.toLowerCase()) ||
          (c.code && topicStr.includes(c.code.toLowerCase()))
        );
        if (filtered.length > 0) matchedComps = filtered;
      }
      const cleanDesc = String(slot.description || '').replace(/\([^)]*\)/g, '').trim();
      const effectiveSubjectName = (slot.subject_name && slot.subject_name.trim())
        ? slot.subject_name
        : (slot.topic || cleanDesc || 'Subject');
      const effectiveSubjectCode = (slot.subject_code && slot.subject_code.trim())
        ? slot.subject_code
        : (slot.topic || (slot.course_cd === '1' ? 'B.Tech' : (slot.course_cd === '13' ? 'BCA' : '')));

      return {
        ...slot,
        subject_name: effectiveSubjectName,
        subject_code: effectiveSubjectCode,
        competencies_detail: matchedComps,
      };
    });
  }

  async getStudentSchedule(
    tenantSlug: string,
    filters: {
      batchId?: string;
      courseCd?: string;
      branchCd?: string;
      batchCd?: string;
      colgCd?: string;
      semester?: string;
      section?: string;
    },
  ) {
    const slots = await this.listSlots(tenantSlug, { ...filters, status: 'APPROVED', isStudent: true });
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
    if (!this.isUUID(id)) {
      const srmsRows = await this.tenantSchemaService.queryInTenant(
        slug,
        `SELECT * FROM srms_timetable_events WHERE id::text = $1 OR srms_id::text = $1 LIMIT 1`,
        [id],
      ).catch(() => []);
      if (srmsRows.length > 0) {
        const r = srmsRows[0];
        return {
          id: r.id,
          faculty_id: r.empid,
          subject_id: r.linkcd,
          department_id: r.branch_cd,
          batch_id: r.batch_cd,
          day_of_week: r.day_of_week,
          start_time: r.start_str?.split(' ')[1] || (r.start_time ? String(r.start_time).slice(11, 19) : '08:30:00'),
          end_time: r.end_str?.split(' ')[1] || (r.end_time ? String(r.end_time).slice(11, 19) : '09:30:00'),
          room: r.camera_link ? `Room 204 (Cam #${r.camera_link})` : 'Room 204',
          slot_type: 'Lecture',
          group_name: r.txt_g || '0',
          topic: r.topic || r.title,
          competency_codes: r.competency_codes,
          unit_name: r.unit_name,
          unit_id: r.unit_id,
          sub_topics: r.sub_topics,
          colg_cd: r.colg_cd,
          course_cd: r.course_cd,
          branch_cd: r.branch_cd,
          batch_cd: r.batch_cd,
          semester: r.sem_cd,
          section: r.txt_sec,
          description: r.description,
        };
      }
      return null;
    }
    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `SELECT * FROM timetable_slots WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  private isUUID(str?: string): boolean {
    if (!str) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
  }

  private async resolveToUUID(slug: string, table: string, field: string, value?: string): Promise<string | null> {
    if (!value) return null;
    if (this.isUUID(value)) return value;

    let query = '';
    const params = [value];
    if (table === 'faculty') {
      query = `SELECT id FROM faculty WHERE emp_id = $1 OR id::text = $1 OR name ILIKE '%' || $1 || '%' LIMIT 1`;
    } else if (table === 'subjects') {
      query = `SELECT id FROM subjects WHERE code = $1 OR id::text = $1 OR name ILIKE '%' || $1 || '%' LIMIT 1`;
    } else if (table === 'departments') {
      query = `SELECT id FROM departments WHERE branch_cd = $1 OR code = $1 OR id::text = $1 OR name ILIKE '%' || $1 || '%' LIMIT 1`;
    } else if (table === 'batches') {
      query = `SELECT id FROM batches 
               WHERE batch_cd::text = $1 OR code = $1 OR year::text = $1 OR name = $1 OR id::text = $1
               ORDER BY (CASE WHEN batch_cd::text = $1 THEN 1 WHEN code = $1 THEN 2 WHEN year::text = $1 THEN 3 WHEN name = $1 THEN 4 ELSE 5 END)
               LIMIT 1`;
    } else {
      return null;
    }

    try {
      const rows = await this.tenantSchemaService.queryInTenant(slug, query, params);
      if (rows && rows.length > 0) {
        return rows[0].id;
      }
    } catch (err) {
      this.logger.error(`Error resolving ${field} value "${value}" in table ${table}:`, err);
    }
    return null;
  }

  async createSlot(tenantSlug: string, dto: CreateTimetableSlotDto) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);

    const resolvedFacultyId = await this.resolveToUUID(slug, 'faculty', 'facultyId', dto.facultyId);
    const resolvedSubjectId = await this.resolveToUUID(slug, 'subjects', 'subjectId', dto.subjectId);
    const resolvedDepartmentId = await this.resolveToUUID(slug, 'departments', 'departmentId', dto.departmentId);
    const resolvedBatchId = await this.resolveToUUID(slug, 'batches', 'batchId', dto.batchId);

    if (dto.facultyId && !resolvedFacultyId) {
      this.logger.warn(`Faculty "${dto.facultyId}" not found in local DB; creating slot without faculty FK.`);
    }
    if (dto.subjectId && !resolvedSubjectId) {
      this.logger.warn(`Subject "${dto.subjectId}" not found in local DB; creating slot without subject FK.`);
    }
    if (dto.batchId && !resolvedBatchId) {
      this.logger.warn(`Batch "${dto.batchId}" not found in local DB; creating slot without batch FK.`);
    }

    const resolvedDto = {
      ...dto,
      facultyId: resolvedFacultyId || undefined,
      subjectId: resolvedSubjectId || undefined,
      departmentId: resolvedDepartmentId || undefined,
      batchId: resolvedBatchId || undefined,
    };

    // Enforce faculty, room, and batch overlap validation across all departments & courses
    await this.checkOverlap(slug, resolvedDto);

    const rows = await this.tenantSchemaService.queryInTenant(
      slug,
      `INSERT INTO timetable_slots (
         faculty_id, subject_id, department_id, batch_id, day_of_week,
         start_time, end_time, room, slot_type, effective_from, effective_until,
         group_name, topic, competency_codes, unit_name, unit_id, sub_topics,
         colg_cd, course_cd, branch_cd, batch_cd, semester, section, description,
         status, draft_id
       ) VALUES ($1, $2, $3, $4, $5, $6::TIME, $7::TIME, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
       RETURNING *`,
      [
        resolvedFacultyId,
        resolvedSubjectId,
        resolvedDepartmentId,
        resolvedBatchId,
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
        dto.unitName || dto.unit || null,
        dto.unitId || null,
        dto.subTopics || null,
        dto.colgcd || dto.colgCd || null,
        dto.coursecd || dto.courseCd || null,
        dto.branchcd || dto.branchCd || null,
        dto.batchcd || dto.batchCd || null,
        dto.semester || null,
        dto.section || null,
        dto.description || null,
        dto.status || 'APPROVED',
        dto.draftId || null,
      ],
    );
    return rows[0];
  }

  async updateSlot(tenantSlug: string, id: string, dto: UpdateTimetableSlotDto) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    const current = await this.getSlotById(tenantSlug, id);

    if (!current || !this.isUUID(id)) {
      // Non-UUID or missing slot: route cleanly to createSlot
      return this.createSlot(tenantSlug, { ...dto, ...current } as CreateTimetableSlotDto);
    }

    // Resolve any incoming code/ID values in dto
    const resolvedFacultyId = dto.facultyId !== undefined ? await this.resolveToUUID(slug, 'faculty', 'facultyId', dto.facultyId) : current.faculty_id;
    const resolvedSubjectId = dto.subjectId !== undefined ? await this.resolveToUUID(slug, 'subjects', 'subjectId', dto.subjectId) : current.subject_id;
    const resolvedDepartmentId = dto.departmentId !== undefined ? await this.resolveToUUID(slug, 'departments', 'departmentId', dto.departmentId) : current.department_id;
    const resolvedBatchId = dto.batchId !== undefined ? await this.resolveToUUID(slug, 'batches', 'batchId', dto.batchId) : current.batch_id;
    if (dto.facultyId && !resolvedFacultyId) {
      this.logger.warn(`Faculty "${dto.facultyId}" not found in local DB; updating slot without faculty FK.`);
    }
    // Merge current and update details to perform proper conflict check
    const merged = {
      facultyId: resolvedFacultyId || undefined,
      subjectId: resolvedSubjectId || undefined,
      departmentId: resolvedDepartmentId || undefined,
      batchId: resolvedBatchId || undefined,
      dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : current.day_of_week,
      startTime: dto.startTime !== undefined ? dto.startTime : current.start_time,
      endTime: dto.endTime !== undefined ? dto.endTime : current.end_time,
      room: dto.room !== undefined ? dto.room : current.room,
      slotType: dto.slotType !== undefined ? dto.slotType : current.slot_type,
      groupName: dto.groupName !== undefined ? dto.groupName : current.group_name,
      topic: dto.topic !== undefined ? dto.topic : current.topic,
      competencyCodes: dto.competencyCodes !== undefined ? dto.competencyCodes : current.competency_codes,
    } as CreateTimetableSlotDto;

    // Enforce faculty, room, and batch overlap validation across all departments & courses
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
           competency_codes = $14,
           unit_name = $15,
           unit_id = $16,
           sub_topics = $17,
           colg_cd = $18,
           course_cd = $19,
           branch_cd = $20,
           batch_cd = $21,
           semester = $22,
           section = $23,
           description = $24
       WHERE id = $25
       RETURNING *`,
      [
        resolvedFacultyId,
        resolvedSubjectId,
        resolvedDepartmentId,
        resolvedBatchId,
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
        dto.unitName !== undefined ? dto.unitName : (dto.unit !== undefined ? dto.unit : current.unit_name),
        dto.unitId !== undefined ? dto.unitId : current.unit_id,
        dto.subTopics !== undefined ? dto.subTopics : current.sub_topics,
        dto.colgcd !== undefined ? dto.colgcd : (dto.colgCd !== undefined ? dto.colgCd : current.colg_cd),
        dto.coursecd !== undefined ? dto.coursecd : (dto.courseCd !== undefined ? dto.courseCd : current.course_cd),
        dto.branchcd !== undefined ? dto.branchcd : (dto.branchCd !== undefined ? dto.branchCd : current.branch_cd),
        dto.batchcd !== undefined ? dto.batchcd : (dto.batchCd !== undefined ? dto.batchCd : current.batch_cd),
        dto.semester !== undefined ? dto.semester : current.semester,
        dto.section !== undefined ? dto.section : current.section,
        dto.description !== undefined ? dto.description : current.description,
        id,
      ],
    );
    return rows[0];
  }

  async deleteSlot(tenantSlug: string, id: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);
    if (this.isUUID(id)) {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `DELETE FROM timetable_slots WHERE id = $1`,
        [id],
      ).catch(() => { });
    }

    // Also delete from srms_timetable_events by id or raw_payload
    try {
      await this.tenantSchemaService.queryInTenant(
        slug,
        `DELETE FROM srms_timetable_events 
         WHERE id::text = $1 
            OR raw_payload->'improperEvent'->>'id' = $1 
            OR linkcd = $1`,
        [id],
      );
    } catch { }

    return { success: true, message: 'Timetable slot deleted successfully' };
  }

  async getRelevantFaculties(tenantSlug: string, subjectId?: string, departmentId?: string) {
    const slug = this.tenantSchemaService.resolveTenantSlug(tenantSlug);

    // Frontend sends subject/department CODES, not UUIDs — resolve first, same as every other method.
    const resolvedSubjectId = await this.resolveToUUID(slug, 'subjects', 'subjectId', subjectId);
    const resolvedDepartmentId = await this.resolveToUUID(slug, 'departments', 'departmentId', departmentId);

    const params: any[] = [];

    // We want a list of all faculties that belong to the department OR are linked to the subject via the Subject Linker (faculty_subjects).
    // Prioritize linked faculties at the top!
    let sql = `
      SELECT DISTINCT f.id, f.emp_id, f.name, f.designation, f.phone, f.department_id, f.staff_type, f.is_active,
                      d.name AS department_name,
                      (CASE WHEN fs.subject_id = $1 THEN 1 ELSE 2 END) AS priority
      FROM faculty f
      LEFT JOIN departments d ON d.id::text = f.department_id::text
      LEFT JOIN faculty_subjects fs ON fs.faculty_id::text = f.id::text AND fs.subject_id::text = $1::text AND fs.is_active = true
      WHERE f.is_active = true
    `;
    params.push(resolvedSubjectId || null);

    const conditions: string[] = [];
    if (resolvedSubjectId) {
      // either linked via Subject Linker OR has it as their primary subject_id
      conditions.push(`(fs.subject_id::text = $1::text OR f.subject_id::text = $1::text)`);
    }
    if (resolvedDepartmentId) {
      params.push(resolvedDepartmentId);
      conditions.push(`f.department_id::text = $${params.length}::text`);
    }

    if (conditions.length > 0) {
      sql += ` AND (${conditions.join(' OR ')})`;
    }

    sql += ` ORDER BY priority ASC, f.name ASC`;
    return this.tenantSchemaService.queryInTenant(slug, sql, params);
  }

  private async checkOverlap(slug: string, dto: CreateTimetableSlotDto, excludeId?: string) {
    const params: any[] = [
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    ];
    let queryIndex = 4;

    const clauses: string[] = [];

    if (dto.facultyId) {
      clauses.push(`(ts.faculty_id::text = $${queryIndex}::text OR f.emp_id = $${queryIndex} OR f.id::text = $${queryIndex}::text)`);
      params.push(dto.facultyId);
      queryIndex++;
    }
    if (dto.room) {
      clauses.push(`(ts.room = $${queryIndex} AND ts.room <> '')`);
      params.push(dto.room);
      queryIndex++;
    }
    if (dto.batchId) {
      clauses.push(`(ts.batch_id::text = $${queryIndex}::text OR b.code = $${queryIndex} OR b.batch_cd = $${queryIndex})`);
      params.push(dto.batchId);
      queryIndex++;
    }

    if (clauses.length === 0) return;

    let dateFilter = '';
    if (dto.effectiveFrom && dto.effectiveUntil) {
      const effUntilStr = String(dto.effectiveUntil).slice(0, 10);
      const effFromStr = String(dto.effectiveFrom).slice(0, 10);
      dateFilter = ` AND (ts.effective_from IS NULL OR ts.effective_from::text = '' OR $${queryIndex}::TEXT IS NULL OR SUBSTRING(ts.effective_from::text FROM 1 FOR 10) <= $${queryIndex}::TEXT)`;
      params.push(effUntilStr);
      queryIndex++;
      dateFilter += ` AND (ts.effective_until IS NULL OR ts.effective_until::text = '' OR $${queryIndex}::TEXT IS NULL OR SUBSTRING(ts.effective_until::text FROM 1 FOR 10) >= $${queryIndex}::TEXT)`;
      params.push(effFromStr);
      queryIndex++;
    }

    let sql = `
      SELECT ts.id, ts.room, ts.slot_type, ts.start_time, ts.end_time, ts.day_of_week,
             ts.effective_from, ts.effective_until,
             ts.faculty_id, ts.batch_id, ts.department_id, ts.subject_id,
             ts.course_cd, ts.branch_cd, ts.batch_cd, ts.semester, ts.section, ts.topic, ts.description,
             COALESCE(f.name, '') AS faculty_name, f.emp_id AS faculty_code, f.id AS faculty_uuid,
             COALESCE(sub.name, '') AS subject_name,
             COALESCE(d.name, '') AS department_name,
             COALESCE(b.name, b.code) AS batch_name, b.code AS batch_code,
             COALESCE(c.name, '') AS course_name
      FROM timetable_slots ts
      LEFT JOIN faculty f ON f.id::text = ts.faculty_id::text
      LEFT JOIN subjects sub ON sub.id::text = ts.subject_id::text
      LEFT JOIN departments d ON d.id::text = ts.department_id::text
      LEFT JOIN batches b ON (CASE WHEN ts.batch_id IS NOT NULL THEN b.id::text = ts.batch_id::text ELSE (b.batch_cd = ts.batch_cd AND (b.course_cd = ts.course_cd OR ts.course_cd IS NULL)) END)
      LEFT JOIN courses c ON (c.course_cd::text = ts.course_cd::text OR c.code::text = ts.course_cd::text OR c.id::text = ts.course_cd::text)
      WHERE ts.day_of_week = $1
        AND (ts.start_time::TIME < $3::TIME AND ts.end_time::TIME > $2::TIME)
        AND (${clauses.join(' OR ')})
        ${dateFilter}
    `;

    if (excludeId) {
      sql += ` AND ts.id::text <> $${queryIndex}::text`;
      params.push(String(excludeId));
      queryIndex++;
    }

    const conflicts = await this.tenantSchemaService.queryInTenant(slug, sql, params);
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (conflicts && conflicts.length > 0) {
      // 1. Prioritize FACULTY conflict check
      for (const conflict of conflicts) {
        const isFacultyConflict = Boolean(
          dto.facultyId && (
            String(conflict.faculty_id) === String(dto.facultyId) ||
            String(conflict.faculty_uuid) === String(dto.facultyId) ||
            String(conflict.faculty_code) === String(dto.facultyId)
          )
        );

        if (isFacultyConflict) {
          const dayName = days[conflict.day_of_week] || `Day ${conflict.day_of_week}`;
          const timeRange = `${String(conflict.start_time).slice(0, 5)} - ${String(conflict.end_time).slice(0, 5)}`;
          const facultyName = conflict.faculty_name || conflict.faculty_code || 'Faculty member';
          const courseName = conflict.course_name || (conflict.course_cd ? `Course ${conflict.course_cd}` : (conflict.department_name || 'Academic Course'));
          const branchName = conflict.department_name ? ` (${conflict.department_name})` : (conflict.branch_cd ? ` (Branch ${conflict.branch_cd})` : '');
          const rawBatch = conflict.batch_name || conflict.batch_code || conflict.batch_cd || '';
          const batchName = rawBatch ? (String(rawBatch).toLowerCase().startsWith('batch') ? String(rawBatch) : `Batch ${rawBatch}`) : 'Batch';
          const semesterName = conflict.semester ? `Semester ${conflict.semester}` : 'Semester';
          const sectionName = conflict.section === '1' ? 'Section A' : conflict.section === '2' ? 'Section B' : conflict.section === '3' ? 'Section C' : conflict.section === '4' ? 'Section D' : (conflict.section ? `Section ${conflict.section}` : 'Section');
          const subjectName = conflict.subject_name || conflict.topic || conflict.description || 'another class';

          const msg = `${facultyName} is already assigned to ${courseName}${branchName}, ${batchName}, ${semesterName}, ${sectionName} for "${subjectName}" on ${dayName} (${timeRange}). Please select a different time slot or choose another faculty member, or contact the Academic Administrator to resolve the schedule overlap.`;
          throw new BadRequestException(msg);
        }
      }

      // 2. Batch conflict check
      for (const conflict of conflicts) {
        const isSameClassSlot = (
          (dto.batchCd && conflict.batch_cd && String(dto.batchCd) === String(conflict.batch_cd)) ||
          (dto.batchId && conflict.batch_id && String(dto.batchId) === String(conflict.batch_id))
        ) && (
          !dto.section || !conflict.section || String(dto.section) === String(conflict.section)
        );

        const isBatchConflict = !isSameClassSlot && (
          (dto.batchId && String(conflict.batch_id) === String(dto.batchId)) ||
          (dto.batchCd && String(conflict.batch_cd) === String(dto.batchCd))
        ) && (
          !dto.section || !conflict.section || conflict.section === dto.section || conflict.section === 'All'
        );

        if (isBatchConflict) {
          const dayName = days[conflict.day_of_week] || `Day ${conflict.day_of_week}`;
          const timeRange = `${String(conflict.start_time).slice(0, 5)} - ${String(conflict.end_time).slice(0, 5)}`;
          const courseName = conflict.course_name || (conflict.course_cd ? `Course ${conflict.course_cd}` : (conflict.department_name || 'Academic Course'));
          const batchName = conflict.batch_name || conflict.batch_code || conflict.batch_cd ? `Batch ${conflict.batch_name || conflict.batch_code || conflict.batch_cd}` : 'Batch';
          const semesterName = conflict.semester ? `Semester ${conflict.semester}` : 'Semester';
          const sectionName = conflict.section === '1' ? 'Section A' : conflict.section === '2' ? 'Section B' : conflict.section === '3' ? 'Section C' : conflict.section === '4' ? 'Section D' : (conflict.section ? `Section ${conflict.section}` : 'Section');

          const msg = `${batchName} (${courseName}, ${semesterName}, ${sectionName}) already has a scheduled session (${conflict.subject_name || conflict.topic || 'Subject'}) on ${dayName} (${timeRange}).`;
          throw new BadRequestException(msg);
        }
      }

      // 3. Room conflict check
      for (const conflict of conflicts) {
        const isSameClassSlot = (
          (dto.batchCd && conflict.batch_cd && String(dto.batchCd) === String(conflict.batch_cd)) ||
          (dto.batchId && conflict.batch_id && String(dto.batchId) === String(conflict.batch_id))
        ) && (
          !dto.section || !conflict.section || String(dto.section) === String(conflict.section)
        );

        const isGenericRoom = (r?: string) => {
          if (!r) return true;
          const norm = r.toLowerCase();
          return norm === '0' || norm === '' || norm.includes('room 204') || norm.includes('cam #') || norm.includes('web cam') || norm.includes('default');
        };

        const isRoomConflict = !isSameClassSlot && dto.room && conflict.room && conflict.room.trim().toLowerCase() === dto.room.trim().toLowerCase() && !isGenericRoom(conflict.room);
        if (isRoomConflict) {
          const dayName = days[conflict.day_of_week] || `Day ${conflict.day_of_week}`;
          const timeRange = `${String(conflict.start_time).slice(0, 5)} - ${String(conflict.end_time).slice(0, 5)}`;
          const msg = `Room (${conflict.room}) is already occupied on ${dayName} (${timeRange}).`;
          throw new BadRequestException(msg);
        }
      }
    }

    // 4. Cross-Module Faculty Conflict Check with medical_schedule_entries (if table exists)
    if (dto.facultyId) {
      try {
        const hasMedTable = await this.tenantSchemaService.queryInTenant(
          slug,
          `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'medical_schedule_entries'`,
        );
        if (hasMedTable && hasMedTable.length > 0) {
          const medConflicts = await this.tenantSchemaService.queryInTenant(
            slug,
            `SELECT id, department_name, professional_year_name, subject_name, day_of_week, start_time, end_time, faculty_name
             FROM medical_schedule_entries
             WHERE (faculty_id::text = $1::text OR faculty_emp_id = $1)
               AND day_of_week = $2
               AND (start_time::TIME < $4::TIME AND end_time::TIME > $3::TIME)`,
            [dto.facultyId, dto.dayOfWeek, dto.startTime, dto.endTime],
          );
          if (medConflicts && medConflicts.length > 0) {
            const mc = medConflicts[0];
            const dayName = days[dto.dayOfWeek] || `Day ${dto.dayOfWeek}`;
            const timeRange = `${String(mc.start_time).slice(0, 5)} - ${String(mc.end_time).slice(0, 5)}`;
            const facName = mc.faculty_name || 'This faculty member';
            const msg = `${facName} is already assigned in Medical Timetable (${mc.department_name || 'Medical'}, ${mc.professional_year_name || 'MBBS'}, Subject: ${mc.subject_name || 'Class'}) on ${dayName} (${timeRange}).`;
            throw new BadRequestException(msg);
          }
        }
      } catch (medErr) {
        if (medErr instanceof BadRequestException) throw medErr;
      }
    }
  }
}
