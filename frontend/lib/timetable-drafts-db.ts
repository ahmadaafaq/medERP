import { queryDb } from './db';
import { isSrmsTenant, srmsPostDirect, fetchSrmsLoadSubjects, resolveSrmsSubjectLink } from './srms-client';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUUID(str?: string | null): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str.trim());
}

export function resolveSchema(tenantSlug?: string): string {
  const clean = (tenantSlug || '').replace(/^tenant_/, '').trim() || 'default';
  return `tenant_${clean}`;
}

export async function ensureTimetableDraftsTable(tenantSlug: string) {
  const schema = resolveSchema(tenantSlug);
  try {
    await queryDb(`
      CREATE TABLE IF NOT EXISTS "${schema}".timetable_drafts (
        id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        title          VARCHAR(255) NOT NULL,
        department_id  UUID,
        batch_id       UUID,
        semester       VARCHAR(50),
        academic_year  VARCHAR(50),
        slots          JSONB        DEFAULT '[]'::jsonb,
        status         VARCHAR(50)  DEFAULT 'DRAFT',
        notes          TEXT,
        hod_remarks    TEXT,
        created_by     UUID,
        colg_cd        VARCHAR(50),
        course_cd      VARCHAR(50),
        branch_cd      VARCHAR(50),
        batch_cd       VARCHAR(50),
        section        VARCHAR(50),
        created_at     TIMESTAMPTZ  DEFAULT NOW(),
        updated_at     TIMESTAMPTZ  DEFAULT NOW()
      );
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS hod_remarks TEXT;
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT';
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS colg_cd VARCHAR(50);
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS course_cd VARCHAR(50);
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS branch_cd VARCHAR(50);
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS batch_cd VARCHAR(50);
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS section VARCHAR(50);
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS week_start DATE;
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS week_end DATE;
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS format_slots JSONB;
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS hod_approved_by VARCHAR(255);
      ALTER TABLE "${schema}".timetable_drafts ADD COLUMN IF NOT EXISTS hod_approved_at TIMESTAMPTZ;
    `);

    // Ensure status & draft_id in timetable_slots
    await queryDb(`
      ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';
      ALTER TABLE "${schema}".timetable_slots ADD COLUMN IF NOT EXISTS draft_id UUID;
    `).catch(() => {});
  } catch (err: any) {
    console.warn(`[ensureTimetableDraftsTable] ${schema}:`, err.message);
  }
}

export async function getTimetableDrafts(tenantSlug: string, filters?: { departmentId?: string; status?: string }) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (filters?.status) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters?.departmentId && isUUID(filters.departmentId)) {
      conditions.push(`department_id::text = $${idx++}`);
      params.push(filters.departmentId);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await queryDb(
      `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts ${where} ORDER BY updated_at DESC, created_at DESC`,
      params
    );

    return rows;
  } catch (err: any) {
    console.error(`[getTimetableDrafts] ${schema}:`, err.message);
    return [];
  }
}

export async function createOrUpdateTimetableDraft(tenantSlug: string, dto: any, user?: any) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  const createdBy = user?.userId || user?.sub || user?.id || null;
  const rawSlots = Array.isArray(dto.slots) ? dto.slots : [];

  const firstSlot = rawSlots[0] || {};
  const colgCd = dto.colgCd || dto.colg_cd || firstSlot.colgCd || firstSlot.colg_cd || firstSlot.pgPayload?.colgCd || firstSlot.srmsPayload?.improperEvent?.colgcd || '1';
  const courseCd = dto.courseCd || dto.course_cd || firstSlot.courseCd || firstSlot.course_cd || firstSlot.pgPayload?.courseCd || firstSlot.srmsPayload?.improperEvent?.course || null;
  const rawBranchCd = dto.branchCd || dto.branch_cd || firstSlot.branchCd || firstSlot.branch_cd || firstSlot.pgPayload?.branchCd || firstSlot.srmsPayload?.improperEvent?.branch || '1';
  let branchCd = String(rawBranchCd);
  if (branchCd.includes('-') || isNaN(Number(branchCd))) {
    branchCd = '1';
  }
  const batchCd = dto.batchCd || dto.batch_cd || firstSlot.batchCd || firstSlot.batch_cd || firstSlot.pgPayload?.batchCd || firstSlot.srmsPayload?.improperEvent?.batch || null;
  const semester = dto.semester || firstSlot.semester || firstSlot.pgPayload?.semester || firstSlot.srmsPayload?.improperEvent?.sem || null;
  const section = dto.section || firstSlot.section || firstSlot.pgPayload?.section || firstSlot.srmsPayload?.improperEvent?.txtSec || null;
  const slotsJson = JSON.stringify(rawSlots);
  const formatSlots = dto.formatSlots || dto.format_slots;
  const formatSlotsJson = formatSlots ? JSON.stringify(formatSlots) : null;

  const rawWeekStart = dto.weekStart || dto.week_start || firstSlot.effectiveFrom || firstSlot.effective_from || (firstSlot.srmsPayload?.improperEvent?.start ? String(firstSlot.srmsPayload.improperEvent.start).slice(0, 10) : null);
  const rawWeekEnd = dto.weekEnd || dto.week_end || firstSlot.effectiveUntil || firstSlot.effective_until || null;
  let weekStartVal: string | null = null;
  let weekEndVal: string | null = null;
  if (rawWeekStart) {
    const d = new Date(rawWeekStart);
    if (!isNaN(d.getTime())) {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.getFullYear(), d.getMonth(), diff);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const pad = (n: number) => String(n).padStart(2, '0');
      weekStartVal = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
      weekEndVal = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;
    }
  }

  try {
    if (dto.id && isUUID(dto.id)) {
      const updateRes = await queryDb(
        `UPDATE "${schema}".timetable_drafts 
         SET title = COALESCE($1, title), 
             department_id = COALESCE($2::uuid, department_id),
             batch_id = COALESCE($3::uuid, batch_id),
             semester = COALESCE($4, semester),
             academic_year = COALESCE($5, academic_year),
             slots = COALESCE($6::jsonb, slots),
             notes = COALESCE($7, notes),
             colg_cd = COALESCE($8, colg_cd),
             course_cd = COALESCE($9, course_cd),
             branch_cd = COALESCE($10, branch_cd),
             batch_cd = COALESCE($11, batch_cd),
             section = COALESCE($12, section),
             format_slots = COALESCE($13::jsonb, format_slots),
             week_start = COALESCE($15::date, week_start),
             week_end = COALESCE($16::date, week_end),
             updated_at = NOW()
         WHERE id::text = $14 RETURNING *, week_start::text AS week_start, week_end::text AS week_end`,
        [
          dto.title || null,
          isUUID(dto.departmentId) ? dto.departmentId : null,
          isUUID(dto.batchId) ? dto.batchId : null,
          semester,
          dto.academicYear || null,
          slotsJson,
          dto.notes || null,
          colgCd,
          courseCd,
          branchCd,
          batchCd,
          section,
          formatSlotsJson,
          dto.id,
          weekStartVal,
          weekEndVal,
        ]
      );
      if (updateRes && updateRes.length > 0) {
        dispatchTimetableScheduleNotifications(tenantSlug, updateRes[0]).catch(() => {});
        return updateRes[0];
      }
    }

    const res = await queryDb(
      `INSERT INTO "${schema}".timetable_drafts (
         title, department_id, batch_id, semester, academic_year, slots, status, notes, created_by,
         colg_cd, course_cd, branch_cd, batch_cd, section, format_slots, week_start, week_end, created_at, updated_at
       ) VALUES ($1, $2::uuid, $3::uuid, $4, $5, COALESCE($6::jsonb, '[]'::jsonb), 'DRAFT', $7, $8::uuid, $9, $10, $11, $12, $13, $14::jsonb, $15::date, $16::date, NOW(), NOW()) RETURNING *, week_start::text AS week_start, week_end::text AS week_end`,
      [
        dto.title || 'Untitled Draft',
        isUUID(dto.departmentId) ? dto.departmentId : null,
        isUUID(dto.batchId) ? dto.batchId : null,
        semester,
        dto.academicYear || null,
        slotsJson,
        dto.notes || null,
        isUUID(createdBy) ? createdBy : null,
        colgCd,
        courseCd,
        branchCd,
        batchCd,
        section,
        formatSlotsJson,
        weekStartVal,
        weekEndVal,
      ]
    );
    const saved = res[0] || { success: true };
    dispatchTimetableScheduleNotifications(tenantSlug, saved).catch(() => {});
    return saved;
  } catch (err: any) {
    console.error(`[createOrUpdateTimetableDraft] ${schema}:`, err.message);
    throw err;
  }
}

export async function submitTimetableDraftForApproval(tenantSlug: string, draftId: string, notes?: string) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    const res = await queryDb(
      `UPDATE "${schema}".timetable_drafts SET status = 'PENDING_HOD_APPROVAL', updated_at = NOW() WHERE id::text = $1 RETURNING *, week_start::text AS week_start, week_end::text AS week_end`,
      [draftId]
    );
    const submitted = res[0] || { success: true, message: 'Submitted for HOD approval' };
    dispatchTimetableScheduleNotifications(tenantSlug, submitted).catch(() => {});
    return submitted;
  } catch (err: any) {
    console.error(`[submitTimetableDraftForApproval] ${schema}:`, err.message);
    throw err;
  }
}

export async function getPendingTimetableForHod(tenantSlug: string, departmentId?: string) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    const params: any[] = ['PENDING_HOD_APPROVAL'];
    let deptFilter = '';
    if (departmentId && isUUID(departmentId)) {
      deptFilter = `AND department_id::text = $2`;
      params.push(departmentId);
    }
    return await queryDb(
      `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts 
       WHERE status = $1 
         AND (slots IS NOT NULL AND jsonb_array_length(slots) > 0)
         ${deptFilter} 
       ORDER BY updated_at DESC, created_at DESC`,
      params
    );

  } catch (err: any) {
    console.error(`[getPendingTimetableForHod] ${schema}:`, err.message);
    return [];
  }
}

export async function getApprovedTimetableDrafts(tenantSlug: string) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    return await queryDb(
      `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts 
       WHERE status = 'HOD_APPROVED' 
         AND (slots IS NOT NULL AND jsonb_array_length(slots) > 0)
       ORDER BY updated_at DESC`
    );
  } catch (err: any) {
    console.error(`[getApprovedTimetableDrafts] ${schema}:`, err.message);
    return [];
  }
}

export async function deleteTimetableDraft(tenantSlug: string, draftId: string) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    await queryDb(
      `DELETE FROM "${schema}".timetable_drafts WHERE id::text = $1`,
      [draftId]
    );
    return { success: true, message: 'Timetable draft deleted' };
  } catch (err: any) {
    console.error(`[deleteTimetableDraft] ${schema}:`, err.message);
    throw err;
  }
}

export async function hodTimetableAction(tenantSlug: string, dto: { draftId: string; action: 'approve' | 'reject'; remarks?: string; slots?: any[] }) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  const newStatus = dto.action === 'approve' ? 'HOD_APPROVED' : 'HOD_REJECTED';

  // Block approval if any slot is still PENDING
  if (dto.action === 'approve') {
    const checkRows = await queryDb(
      `SELECT slots FROM "${schema}".timetable_drafts WHERE id::text = $1`,
      [dto.draftId]
    ).catch(() => []);
    if (checkRows && checkRows.length > 0) {
      const rawSlots = checkRows[0].slots;
      const checkSlots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
      const hasPending = checkSlots.some(
        (s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING',
      );
      if (hasPending) {
        const pendingCount = checkSlots.filter((s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
        throw new Error(
          `Cannot approve: all faculty must link their Schedule Planner slots before approval. ${pendingCount} slot(s) are still PENDING.`
        );
      }
    }
  }

  try {
    const slotsJson = dto.slots ? JSON.stringify(dto.slots) : null;
    let res: any[];
    if (dto.action === 'approve') {
      const approvedBy = 'Dr. Anuj Kumar (Head of Department)';
      if (slotsJson) {
        res = await queryDb(
          `UPDATE "${schema}".timetable_drafts 
           SET status = $1, 
               hod_remarks = $2, 
               slots = $3::jsonb,
               hod_approved_by = $4,
               hod_approved_at = NOW(),
               updated_at = NOW() 
           WHERE id::text = $5 
           RETURNING *`,
          [newStatus, dto.remarks || null, slotsJson, approvedBy, dto.draftId]
        );
      } else {
        res = await queryDb(
          `UPDATE "${schema}".timetable_drafts 
           SET status = $1, 
               hod_remarks = $2,
               hod_approved_by = $3,
               hod_approved_at = NOW(),
               updated_at = NOW() 
           WHERE id::text = $4 
           RETURNING *`,
          [newStatus, dto.remarks || null, approvedBy, dto.draftId]
        );
      }
    } else {
      if (slotsJson) {
        res = await queryDb(
          `UPDATE "${schema}".timetable_drafts 
           SET status = $1, 
               hod_remarks = $2, 
               slots = $3::jsonb, 
               updated_at = NOW() 
           WHERE id::text = $4 
           RETURNING *`,
          [newStatus, dto.remarks || null, slotsJson, dto.draftId]
        );
      } else {
        res = await queryDb(
          `UPDATE "${schema}".timetable_drafts 
           SET status = $1, 
               hod_remarks = $2, 
               updated_at = NOW() 
           WHERE id::text = $3 
           RETURNING *`,
          [newStatus, dto.remarks || null, dto.draftId]
        );
      }
    }

    // On approval, persist all draft slots into timetable_slots with status = 'APPROVED'
    if (dto.action === 'approve') {
      const draftRows = await queryDb(
        `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts WHERE id::text = $1`,
        [dto.draftId]
      );
      const draft = draftRows?.[0];
      if (draft) {
        const rawSlots = draft.slots;
        const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);

        // Clear any previous slots from this draft to avoid duplicates
        await queryDb(
          `DELETE FROM "${schema}".timetable_slots WHERE draft_id = $1::uuid`,
          [dto.draftId]
        ).catch(() => {});

        for (const sl of slots) {
          try {
            const colgVal = sl.colgcd || sl.colgCd || sl.colg_cd || sl.pgPayload?.colgCd || sl.pgPayload?.colgcd || sl.srmsPayload?.improperEvent?.colgcd || draft.colg_cd || '1';
            const courseVal = sl.coursecd || sl.courseCd || sl.course_cd || sl.pgPayload?.courseCd || sl.pgPayload?.coursecd || sl.srmsPayload?.improperEvent?.course || draft.course_cd || null;
            const branchVal = sl.branchcd || sl.branchCd || sl.branch_cd || sl.pgPayload?.branchCd || sl.pgPayload?.branchcd || sl.srmsPayload?.improperEvent?.branch || draft.branch_cd || null;
            const batchVal = sl.batchcd || sl.batchCd || sl.batch_cd || sl.pgPayload?.batchCd || sl.pgPayload?.batchcd || sl.srmsPayload?.improperEvent?.batch || draft.batch_cd || null;
            const semVal = sl.semester || sl.pgPayload?.semester || sl.srmsPayload?.improperEvent?.sem || draft.semester || null;
            const secVal = sl.section || sl.pgPayload?.section || sl.srmsPayload?.improperEvent?.txtSec || draft.section || null;
            const rawEffFrom = sl.effectiveFrom || sl.effective_from || sl.pgPayload?.effectiveFrom || sl.pgPayload?.effective_from;
            const rawEffUntil = sl.effectiveUntil || sl.effective_until || sl.pgPayload?.effectiveUntil || sl.pgPayload?.effective_until;

            await queryDb(
              `INSERT INTO "${schema}".timetable_slots (
                 faculty_id, subject_id, department_id, batch_id, day_of_week,
                 start_time, end_time, room, slot_type, effective_from, effective_until,
                 group_name, topic, competency_codes, unit_name, unit_id, sub_topics,
                 colg_cd, course_cd, branch_cd, batch_cd, semester, section, description,
                 status, draft_id
               ) VALUES (
                 $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5,
                 $6::TIME, $7::TIME, $8, $9, $10, $11,
                 $12, $13, $14, $15, $16, $17,
                 $18, $19, $20, $21, $22, $23, $24,
                 'APPROVED', $25::uuid
               )`,
              [
                isUUID(sl.facultyId || sl.faculty_id || sl.pgPayload?.facultyId) ? (sl.facultyId || sl.faculty_id || sl.pgPayload?.facultyId) : null,
                isUUID(sl.subjectId || sl.subject_id || sl.pgPayload?.subjectId) ? (sl.subjectId || sl.subject_id || sl.pgPayload?.subjectId) : null,
                isUUID(sl.departmentId || sl.department_id || sl.pgPayload?.departmentId || draft.department_id) ? (sl.departmentId || sl.department_id || sl.pgPayload?.departmentId || draft.department_id) : null,
                isUUID(sl.batchId || sl.batch_id || sl.pgPayload?.batchId || draft.batch_id) ? (sl.batchId || sl.batch_id || sl.pgPayload?.batchId || draft.batch_id) : null,
                Number(sl.dayOfWeek || sl.day_of_week || 1),
                sl.startTime || sl.start_time || '09:00:00',
                sl.endTime || sl.end_time || '10:00:00',
                sl.room || null,
                sl.slotType || sl.slot_type || 'Lecture',
                rawEffFrom ? new Date(rawEffFrom) : null,
                (() => {
                  if (!rawEffUntil) return null;
                  const uDate = new Date(rawEffUntil);
                  if (rawEffFrom) {
                    const fDate = new Date(rawEffFrom);
                    const fDay = fDate.getDay();
                    const fDiff = fDate.getDate() - fDay + (fDay === 0 ? -6 : 1);
                    const sun = new Date(fDate.getFullYear(), fDate.getMonth(), fDiff + 6, 23, 59, 59, 999);
                    if (uDate > sun) return sun;
                  }
                  return uDate;
                })(),
                sl.groupName || sl.group_name || 'All Group',
                sl.topic || null,
                sl.competencyCodes || sl.competency_codes || null,
                sl.unitName || sl.unit_name || null,
                sl.unitId || sl.unit_id || null,
                sl.subTopics || sl.sub_topics || null,
                colgVal,
                courseVal,
                branchVal,
                batchVal,
                semVal,
                secVal,
                sl.description || `${sl.subject_name || sl.topic || 'Lecture'} ${sl.faculty_name || ''}`.trim(),
                dto.draftId,
              ]
            );

            // 2. For SRMS tenants, synchronize slot to SRMS via official AddEvent API
            if (isSrmsTenant(tenantSlug)) {
              try {
                const now = new Date();
                const effBase = rawEffFrom ? new Date(rawEffFrom) : now;
                const effDay = effBase.getDay();
                const effDiff = effBase.getDate() - effDay + (effDay === 0 ? -6 : 1);
                const monday = new Date(effBase.getFullYear(), effBase.getMonth(), effDiff);
                const dow = Number(sl.dayOfWeek || sl.day_of_week || 1);
                const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (dow - 1));
                const pad = (n: number) => String(n).padStart(2, '0');
                const ymd = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

                const slotStartTime = (sl.startTime || sl.start_time || '09:00:00').slice(0, 5);
                const slotEndTime = (sl.endTime || sl.end_time || '10:00:00').slice(0, 5);
                const srmsStart = `${ymd} ${slotStartTime} `;
                const srmsEnd = `${ymd} ${slotEndTime} `;

                let linkcdVal = String(sl.srmsPayload?.improperEvent?.linkcd || sl.linkcd || '0');
                let empidVal = String(sl.srmsPayload?.improperEvent?.empid || sl.facultyEmpId || sl.faculty_code || sl.facultyId || '');
                const subCodeVal = String(sl.subjectCode || sl.subject_code || sl.sub_cd || '');
                const subNameVal = String(sl.subject_name || sl.subjectName || sl.topic || '');
                const facNameVal = String(sl.faculty_name || sl.facultyName || '');

                // Resolve authentic linkcd if missing, 0, or equal to subject code
                if (!linkcdVal || linkcdVal === '0' || linkcdVal === subCodeVal) {
                  try {
                    const loadSubs = await fetchSrmsLoadSubjects({
                      course: courseVal || 13,
                      branch: branchVal || 1,
                      batch: batchVal || 2,
                      semester: semVal || 3,
                      section: secVal || 1,
                      colgcd: colgVal || 1,
                    });
                    const matched = resolveSrmsSubjectLink(loadSubs, {
                      linkcd: linkcdVal,
                      subjectCode: subCodeVal || linkcdVal,
                      subjectName: subNameVal,
                      facultyName: facNameVal,
                      empid: empidVal,
                    });
                    if (matched?.linkcd) {
                      linkcdVal = matched.linkcd;
                      if (!empidVal && matched.empid) empidVal = matched.empid;
                    }
                  } catch (e: any) {
                    console.warn(`[hodTimetableAction resolve linkcd warning]: ${e.message}`);
                  }
                }

                const titleVal = sl.topic ? `${sl.subject_name || sl.subjectName || 'Subject'} - ${sl.topic}` : (sl.subject_name || sl.subjectName || 'Subject Session');
                const descVal = sl.description || `${sl.subject_name || sl.subjectName || 'Subject'} ${sl.faculty_name || ''}`.trim();

                const srmsAddPayload = {
                  title: titleVal,
                  description: descVal,
                  start: srmsStart,
                  end: srmsEnd,
                  linkcd: linkcdVal,
                  electiveflg: String(sl.srmsPayload?.improperEvent?.electiveflg || sl.electiveflg || 'N'),
                  txtG: String(sl.srmsPayload?.improperEvent?.txtG || sl.groupValue || '0'),
                  txtSec: String(secVal || '1'),
                  empid: empidVal,
                  colgcd: String(colgVal || '1'),
                  CameraLink: String(sl.srmsPayload?.improperEvent?.CameraLink || sl.cameraId || '0'),
                  Cancel_flg: '0',
                  cancelflg: '0',
                };

                // Check if already synced to SRMS (e.g. from HOD approval modal or pre-existing event)
                const alreadySyncedEv = await queryDb(
                  `SELECT id, srms_id FROM "${schema}".srms_timetable_events
                   WHERE day_of_week = $1
                     AND (start_str LIKE '%' || $2 || '%' OR start_time::TIME = $3::TIME)
                     AND (empid = $4 OR empid IS NULL)
                     AND srms_id IS NOT NULL AND (srms_id > 0 OR srms_id::text != '')
                     AND id::text NOT IN (SELECT event_id FROM "${schema}".deleted_timetable_events)
                   ORDER BY created_at DESC LIMIT 1`,
                  [dow, slotStartTime, slotStartTime, empidVal]
                ).catch(() => []);

                if (alreadySyncedEv && alreadySyncedEv.length > 0) {
                  // Slot already exists on SRMS, skip redundant remote POST
                  continue;
                }

                const srmsRes = await srmsPostDirect(
                  'https://myportal.srms.ac.in/srmserp/Timetbl/AddEvent',
                  srmsAddPayload,
                ).catch(err => ({ success: false, message: err.message }));

                const srmsId = (srmsRes && (srmsRes.id || (srmsRes.success && srmsRes.data?.id))) ? String(srmsRes.id || srmsRes.data?.id) : null;

                await queryDb(
                  `INSERT INTO "${schema}".srms_timetable_events (
                     srms_id, title, description, start_time, end_time, start_str, end_str,
                     day_of_week, linkcd, electiveflg, txt_g, txt_sec, empid, colg_cd,
                     course_cd, branch_cd, batch_cd, sem_cd, camera_link, raw_payload,
                     unit_id, unit_name, topic, sub_topics, competency_codes
                   ) VALUES (
                     $1, $2, $3, $4::timestamp, $5::timestamp, $6, $7,
                     $8, $9, $10, $11, $12, $13, $14,
                     $15, $16, $17, $18, $19, $20::jsonb,
                     $21, $22, $23, $24, $25
                   )
                   ON CONFLICT (id) DO NOTHING`,
                  [
                    srmsId,
                    titleVal,
                    descVal,
                    new Date(`${ymd}T${slotStartTime}:00Z`),
                    new Date(`${ymd}T${slotEndTime}:00Z`),
                    srmsStart,
                    srmsEnd,
                    String(dow),
                    linkcdVal,
                    srmsAddPayload.electiveflg === 'Y',
                    srmsAddPayload.txtG,
                    srmsAddPayload.txtSec,
                    empidVal,
                    String(colgVal),
                    String(courseVal || ''),
                    String(branchVal || ''),
                    String(batchVal || ''),
                    String(semVal || ''),
                    srmsAddPayload.CameraLink,
                    JSON.stringify({ ...srmsAddPayload, srmsResponse: srmsRes }),
                    sl.unitId || sl.unit_id || null,
                    sl.unitName || sl.unit_name || null,
                    sl.topic || null,
                    sl.subTopics || sl.sub_topics || null,
                    sl.competencyCodes || sl.competency_codes || null,
                  ]
                ).catch(srmsDbErr => {
                  console.warn(`[hodTimetableAction] srms_timetable_events insert: ${srmsDbErr.message}`);
                });
              } catch (srmsErr: any) {
                console.warn(`[hodTimetableAction] SRMS sync error for slot: ${srmsErr.message}`);
              }
            }

            // Also backfill academic hierarchy on the draft itself if it was missing
            if (!draft.course_cd && courseVal) {
              await queryDb(
                `UPDATE "${schema}".timetable_drafts 
                 SET colg_cd = COALESCE(colg_cd, $1), 
                     course_cd = COALESCE(course_cd, $2), 
                     branch_cd = COALESCE(branch_cd, $3), 
                     batch_cd = COALESCE(batch_cd, $4), 
                     semester = COALESCE(semester, $5), 
                     section = COALESCE(section, $6) 
                 WHERE id::text = $7`,
                [colgVal, courseVal, branchVal, batchVal, semVal, secVal, dto.draftId]
              ).catch(() => {});
            }
          } catch (insErr: any) {
            console.warn(`[hodTimetableAction] insert slot error: ${insErr.message}`);
          }
        }
      }
    }

    return res[0] || { success: true, status: newStatus };
  } catch (err: any) {
    console.error(`[hodTimetableAction] ${schema}:`, err.message);
    throw err;
  }
}

export async function getDraftsByWeekForFaculty(
  tenantSlug: string,
  facultyId?: string,
  facultyEmpId?: string,
  facultyName?: string
) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    const rows = await queryDb(
      `SELECT t.*, t.week_start::text AS week_start, t.week_end::text AS week_end 
       FROM "${schema}".timetable_drafts t
       WHERE t.status IN ('DRAFT', 'PENDING_HOD_APPROVAL', 'HOD_APPROVED')
         AND t.slots IS NOT NULL
         AND jsonb_array_length(t.slots) > 0
       ORDER BY t.week_start DESC NULLS LAST, t.updated_at DESC`,
      []
    );

    const fId = (facultyId || '').trim();
    const fEmp = (facultyEmpId || '').trim();
    const fName = (facultyName || '').trim().toLowerCase();

    return (rows || []).map((draft: any) => {
      const rawSlots = draft.slots;
      const allSlots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
      const mySlots = allSlots.filter((s: any) => {
        const slotFacId = String(s.facultyId || s.faculty_id || '').trim();
        const slotEmpId = String(s.facultyEmpId || s.faculty_emp_id || s.faculty_code || '').trim();
        const slotName = String(s.facultyName || s.faculty_name || '').trim().toLowerCase();

        const matchId = fId && slotFacId && slotFacId === fId;
        const matchEmp = fEmp && slotEmpId && slotEmpId === fEmp;
        const matchName = fName && slotName && (slotName.includes(fName) || fName.includes(slotName));

        return matchId || matchEmp || matchName;
      });

      if (mySlots.length === 0) return null;
      return { ...draft, slots: mySlots };
    }).filter(Boolean);
  } catch (err: any) {
    console.error(`[getDraftsByWeekForFaculty] ${schema}:`, err.message);
    return [];
  }
}

export async function facultyLinkSlot(
  tenantSlug: string,
  dto: {
    draftId: string;
    slotId: string;
    unitId?: string;
    unitName?: string;
    topic?: string;
    subTopics?: string;
    competencyCodes?: string;
  }
) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    const rows = await queryDb(
      `SELECT slots FROM "${schema}".timetable_drafts WHERE id::text = $1 LIMIT 1`,
      [dto.draftId]
    );
    if (!rows || rows.length === 0) throw new Error('Draft not found');
    const rawSlots = rows[0].slots;
    let slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
    let matched = false;
    slots = slots.map((s: any) => {
      if (String(s.id) === String(dto.slotId)) {
        matched = true;
        return {
          ...s,
          unitId: dto.unitId || s.unitId || s.unit_id,
          unit_id: dto.unitId || s.unitId || s.unit_id,
          unitName: dto.unitName || s.unitName || s.unit_name,
          unit_name: dto.unitName || s.unitName || s.unit_name,
          topic: dto.topic || s.topic,
          subTopics: dto.subTopics || s.subTopics || s.sub_topics,
          sub_topics: dto.subTopics || s.subTopics || s.sub_topics,
          competencyCodes: dto.competencyCodes || s.competencyCodes || s.competency_codes,
          competency_codes: dto.competencyCodes || s.competencyCodes || s.competency_codes,
          curriculumMappings: (dto as any).curriculumMappings || s.curriculumMappings || undefined,
          mappingStatus: 'LINKED',
          mapping_status: 'LINKED',
        };
      }
      return s;
    });
    if (!matched) throw new Error(`Slot ${dto.slotId} not found in draft`);
    await queryDb(
      `UPDATE "${schema}".timetable_drafts SET slots = $1::jsonb, updated_at = NOW() WHERE id::text = $2`,
      [JSON.stringify(slots), dto.draftId]
    );
    return { success: true, message: 'Slot linked successfully', slots };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to link slot');
  }
}

export async function copyDraftToNextWeek(tenantSlug: string, draftId: string, user?: any) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  const rows = await queryDb(
    `SELECT * FROM "${schema}".timetable_drafts WHERE id::text = $1 LIMIT 1`,
    [draftId]
  ).catch(() => []);
  if (!rows || rows.length === 0) throw new Error('Draft not found');
  const src = rows[0];
  const rawSlots = src.slots;
  const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  let srcDate = new Date();
  if (src.week_start) {
    if (src.week_start instanceof Date) {
      srcDate = new Date(src.week_start.getFullYear(), src.week_start.getMonth(), src.week_start.getDate());
    } else {
      const str = String(src.week_start).slice(0, 10);
      if (str.includes('-')) {
        const parts = str.split('-').map(Number);
        srcDate = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        srcDate = new Date(src.week_start);
      }
    }
  } else {
    const day = srcDate.getDay();
    const diff = srcDate.getDate() - day + (day === 0 ? -6 : 1);
    srcDate = new Date(srcDate.getFullYear(), srcDate.getMonth(), diff);
  }
  const nextStart = new Date(srcDate.getFullYear(), srcDate.getMonth(), srcDate.getDate() + 7);
  const nextEnd = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() + 6);
  const nextStartStr = toYMD(nextStart);
  const nextEndStr = toYMD(nextEnd);

  // Keep slot copy (day, time, subject, faculty, room) but CLEAR unit, topic, subtopic for next week faculty planning
  const newSlots = slots.map((s: any) => {
    const dow = Number(s.dayOfWeek || s.day_of_week || 1);
    const slotTargetDate = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() + (dow - 1));
    const slotYmd = toYMD(slotTargetDate);
    const startTime = (s.startTime || s.start_time || '09:00').slice(0, 5);
    const endTime = (s.endTime || s.end_time || '10:00').slice(0, 5);

    let srmsPayload = s.srmsPayload;
    if (srmsPayload && typeof srmsPayload === 'object') {
      const improper = srmsPayload.improperEvent ? { ...srmsPayload.improperEvent } : undefined;
      if (improper) {
        improper.start = `${slotYmd} ${startTime} `;
        improper.end = `${slotYmd} ${endTime} `;
        improper.unit_id = '';
        improper.unit_name = '';
        improper.topic = '';
        improper.sub_topics = '';
        improper.competency_codes = '';
        improper.hodRemark = '';
        improper.hod_remark = '';
      }
      srmsPayload = {
        ...srmsPayload,
        improperEvent: improper,
      };
    }

    return {
      ...s,
      id: `slot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      mappingStatus: 'PENDING',
      mapping_status: 'PENDING',
      curriculumMappings: undefined,
      unitId: '',
      unit_id: '',
      unitName: '',
      unit_name: '',
      topic: '',
      subTopics: '',
      sub_topics: '',
      competencyCodes: '',
      competency_codes: '',
      effectiveFrom: nextStartStr,
      effectiveUntil: nextEndStr,
      effective_from: nextStartStr,
      effective_until: nextEndStr,
      hodRemark: undefined,
      hod_remark: undefined,
      remark: undefined,
      srmsPayload,
    };
  });

  const createdBy = user?.userId || user?.sub || user?.id || null;
  const newTitle = `Week of ${nextStartStr} – ${nextEndStr}`;
  const res = await queryDb(
    `INSERT INTO "${schema}".timetable_drafts (
       title, department_id, batch_id, semester, academic_year, slots, status, notes, created_by,
       colg_cd, course_cd, branch_cd, batch_cd, section, week_start, week_end, hod_remarks, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'DRAFT', $7, $8, $9, $10, $11, $12, $13, $14, $15, NULL, NOW(), NOW()) RETURNING *`,
    [
      newTitle,
      src.department_id || null,
      src.batch_id || null,
      src.semester || null,
      src.academic_year || null,
      JSON.stringify(newSlots),
      src.notes || null,
      isUUID(createdBy) ? createdBy : null,
      src.colg_cd || null,
      src.course_cd || null,
      src.branch_cd || null,
      src.batch_cd || null,
      src.section || null,
      nextStartStr,
      nextEndStr,
    ]
  );
  const created = res[0] || { success: true };
  dispatchTimetableScheduleNotifications(tenantSlug, created).catch(() => {});
  return created;
}

export async function dispatchTimetableScheduleNotifications(tenantSlug: string, draft: any) {
  const schema = resolveSchema(tenantSlug);
  try {
    const rawSlots = draft?.slots;
    const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
    if (!slots || slots.length === 0) return;

    const draftTitle = draft.title || 'Weekly Timetable';
    const weekStart = draft.week_start ? String(draft.week_start).slice(0, 10) : '';
    const weekEnd = draft.week_end ? String(draft.week_end).slice(0, 10) : '';
    const dateRangeStr = weekStart && weekEnd ? ` (Week: ${weekStart} to ${weekEnd})` : '';

    // Ensure notifications table exists
    await queryDb(`
      CREATE TABLE IF NOT EXISTS "${schema}".notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id TEXT,
        title TEXT,
        message TEXT,
        body TEXT,
        type TEXT,
        category TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE "${schema}".notifications ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE "${schema}".notifications ADD COLUMN IF NOT EXISTS body TEXT;
    `).catch(() => {});

    // Group slots by faculty
    const facMap = new Map<string, { facultyId: string; facultyEmpId: string; facultyName: string; slots: any[]; subjects: Set<string> }>();
    for (const s of slots) {
      const facId = String(s.facultyId || s.faculty_id || '').trim();
      const facEmpId = String(s.facultyEmpId || s.faculty_emp_id || s.faculty_code || '').trim();
      const facName = String(s.facultyName || s.faculty_name || '').trim();
      const key = facEmpId || facId || facName;
      if (!key) continue;

      if (!facMap.has(key)) {
        facMap.set(key, { facultyId: facId, facultyEmpId: facEmpId, facultyName: facName, slots: [], subjects: new Set() });
      }
      const entry = facMap.get(key)!;
      entry.slots.push(s);
      const sub = s.subjectName || s.subject_name || s.subject || s.subjectCode || '';
      if (sub) entry.subjects.add(sub);
    }

    // 1. Alert each assigned Faculty
    for (const fac of Array.from(facMap.values())) {
      const pendingCnt = fac.slots.filter((s: any) => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
      const subList = Array.from(fac.subjects).slice(0, 3).join(', ');
      const title = `🗓️ Weekly Schedule Added: Planning Required`;
      const message = `Clerk scheduled ${fac.slots.length} lecture(s) for you (${subList || 'Curriculum'}) in ${draftTitle}${dateRangeStr}. ${pendingCnt > 0 ? `${pendingCnt} lecture(s) need topic & syllabus linking in Schedule Planner.` : 'All currently linked.'}`;

      const recId = fac.facultyEmpId || fac.facultyId || fac.facultyName;
      if (recId) {
        // Prevent duplicate spam within 4 hours for this recipient
        const dupCheck = await queryDb(
          `SELECT id FROM "${schema}".notifications 
           WHERE recipient_id = $1 AND title = $2 AND created_at > NOW() - INTERVAL '4 hours' LIMIT 1`,
          [recId, title]
        ).catch(() => []);

        if (!dupCheck || dupCheck.length === 0) {
          await queryDb(
            `INSERT INTO "${schema}".notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $3, 'warning', 'timetable', false, NOW())`,
            [recId, title, message]
          ).catch((e: any) => console.warn('[dispatchFacNotification error]:', e?.message));
        }
      }
    }

    // 2. Alert HOD
    const hodTitle = `📅 Clerk Scheduled Lectures Awaiting Review`;
    const hodMsg = `Clerk has scheduled ${slots.length} lecture(s) across ${facMap.size} faculty member(s) for ${draftTitle}${dateRangeStr}. Awaiting faculty curriculum linking before HOD approval.`;
    const dupHod = await queryDb(
      `SELECT id FROM "${schema}".notifications 
       WHERE (recipient_id = 'HOD' OR recipient_id = 'ALL_HODS') AND title = $1 AND created_at > NOW() - INTERVAL '4 hours' LIMIT 1`,
      [hodTitle]
    ).catch(() => []);

    if (!dupHod || dupHod.length === 0) {
      await queryDb(
        `INSERT INTO "${schema}".notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
         VALUES (gen_random_uuid(), 'HOD', $1, $2, $2, 'info', 'timetable', false, NOW())`,
        [hodTitle, hodMsg]
      ).catch(() => {});
      await queryDb(
        `INSERT INTO "${schema}".notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
         VALUES (gen_random_uuid(), 'ALL_HODS', $1, $2, $2, 'info', 'timetable', false, NOW())`,
        [hodTitle, hodMsg]
      ).catch(() => {});
    }
  } catch (err: any) {
    console.warn(`[dispatchTimetableScheduleNotifications] error:`, err?.message);
  }
}

export async function getFacultyTimetableCompliance(tenantSlug: string, draftId?: string) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    let drafts: any[] = [];
    if (draftId && isUUID(draftId)) {
      drafts = await queryDb(
        `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts WHERE id::text = $1`,
        [draftId]
      );
    } else {
      drafts = await queryDb(
        `SELECT *, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts 
         WHERE status IN ('DRAFT', 'PENDING_HOD_APPROVAL') AND slots IS NOT NULL AND jsonb_array_length(slots) > 0
         ORDER BY week_start DESC NULLS LAST, updated_at DESC LIMIT 10`,
        []
      );
    }

    const facMap = new Map<string, {
      facultyId: string;
      facultyEmpId: string;
      facultyName: string;
      totalSlots: number;
      linkedSlots: number;
      pendingSlots: number;
      drafts: Array<{ id: string; title: string; weekStart?: string; weekEnd?: string }>;
      pendingSlotList: any[];
      subjects: string[];
    }>();

    for (const d of drafts) {
      const rawSlots = d.slots;
      const slots: any[] = typeof rawSlots === 'string' ? JSON.parse(rawSlots || '[]') : (rawSlots || []);
      for (const s of slots) {
        const facId = String(s.facultyId || s.faculty_id || '').trim();
        const facEmpId = String(s.facultyEmpId || s.faculty_emp_id || s.faculty_code || '').trim();
        const facName = String(s.facultyName || s.faculty_name || '').trim();
        const key = facEmpId || facId || facName;
        if (!key) continue;

        if (!facMap.has(key)) {
          facMap.set(key, {
            facultyId: facId,
            facultyEmpId: facEmpId,
            facultyName: facName || facEmpId || 'Faculty',
            totalSlots: 0,
            linkedSlots: 0,
            pendingSlots: 0,
            drafts: [],
            pendingSlotList: [],
            subjects: [],
          });
        }
        const item = facMap.get(key)!;
        item.totalSlots++;
        const isLinked = s.mappingStatus === 'LINKED';
        if (isLinked) {
          item.linkedSlots++;
        } else {
          item.pendingSlots++;
          item.pendingSlotList.push({
            id: s.id,
            dayOfWeek: s.dayOfWeek || s.day_of_week || 1,
            startTime: s.startTime || s.start_time || '',
            endTime: s.endTime || s.end_time || '',
            subjectName: s.subjectName || s.subject_name || s.subject || '',
            subjectCode: s.subjectCode || s.subject_code || '',
            room: s.room || '',
            draftId: d.id,
            draftTitle: d.title,
          });
        }

        const subName = s.subjectName || s.subject_name || s.subject || s.subjectCode || '';
        if (subName && !item.subjects.includes(subName)) {
          item.subjects.push(subName);
        }

        if (!item.drafts.some((x) => x.id === d.id)) {
          item.drafts.push({
            id: d.id,
            title: d.title,
            weekStart: d.week_start,
            weekEnd: d.week_end,
          });
        }
      }
    }

    const facultyCompliance = Array.from(facMap.values()).map((f) => {
      const complianceStatus = f.pendingSlots === 0 && f.totalSlots > 0 ? 'COMPLETED' : f.linkedSlots === 0 ? 'NOT_STARTED' : 'PARTIAL';
      const compliancePct = f.totalSlots > 0 ? Math.round((f.linkedSlots / f.totalSlots) * 100) : 100;
      return {
        ...f,
        complianceStatus,
        compliancePct,
      };
    }).sort((a, b) => a.compliancePct - b.compliancePct); // Lagging faculties first

    const totalPendingFaculties = facultyCompliance.filter((f) => f.pendingSlots > 0).length;

    return {
      success: true,
      drafts,
      facultyCompliance,
      totalPendingFaculties,
    };
  } catch (err: any) {
    console.error(`[getFacultyTimetableCompliance] ${schema}:`, err.message);
    return { success: false, drafts: [], facultyCompliance: [], totalPendingFaculties: 0 };
  }
}

export async function remindFacultyForPlanning(
  tenantSlug: string,
  dto: {
    draftId: string;
    facultyId?: string;
    facultyEmpId?: string;
    facultyName?: string;
    customMessage?: string;
  }
) {
  const schema = resolveSchema(tenantSlug);
  await ensureTimetableDraftsTable(tenantSlug);
  try {
    const draftRows = await queryDb(
      `SELECT title, week_start::text AS week_start, week_end::text AS week_end FROM "${schema}".timetable_drafts WHERE id::text = $1`,
      [dto.draftId]
    ).catch(() => []);
    const draft = draftRows?.[0];
    const draftTitle = draft?.title || 'Weekly Timetable';
    const dates = draft?.week_start ? ` (${draft.week_start} – ${draft.week_end})` : '';

    const recId = (dto.facultyEmpId || dto.facultyId || dto.facultyName || '').trim();
    if (!recId) throw new Error('Faculty identifier is required');

    const title = `⚠️ URGENT: Link Syllabus in Schedule Planner`;
    const message = dto.customMessage || `HOD has requested you to link your curriculum topics & syllabus for ${draftTitle}${dates}. Timetable approval is currently blocked until all lectures are linked.`;

    await queryDb(
      `INSERT INTO "${schema}".notifications (id, recipient_id, title, message, body, type, category, is_read, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $3, 'warning', 'timetable', false, NOW())`,
      [recId, title, message]
    );

    return {
      success: true,
      message: `Reminder sent to ${dto.facultyName || recId}`,
    };
  } catch (err: any) {
    console.error(`[remindFacultyForPlanning] ${schema}:`, err.message);
    throw err;
  }
}
