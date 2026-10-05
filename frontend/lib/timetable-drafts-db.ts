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
      `SELECT * FROM "${schema}".timetable_drafts ${where} ORDER BY updated_at DESC, created_at DESC`,
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
             updated_at = NOW()
         WHERE id::text = $14 RETURNING *`,
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
        ]
      );
      if (updateRes && updateRes.length > 0) return updateRes[0];
    }

    const res = await queryDb(
      `INSERT INTO "${schema}".timetable_drafts (
         title, department_id, batch_id, semester, academic_year, slots, status, notes, created_by,
         colg_cd, course_cd, branch_cd, batch_cd, section, format_slots, created_at, updated_at
       ) VALUES ($1, $2::uuid, $3::uuid, $4, $5, COALESCE($6::jsonb, '[]'::jsonb), 'DRAFT', $7, $8::uuid, $9, $10, $11, $12, $13, $14::jsonb, NOW(), NOW()) RETURNING *`,
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
      ]
    );
    return res[0] || { success: true };
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
      `UPDATE "${schema}".timetable_drafts SET status = 'PENDING_HOD_APPROVAL', updated_at = NOW() WHERE id::text = $1 RETURNING *`,
      [draftId]
    );
    return res[0] || { success: true, message: 'Submitted for HOD approval' };
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
      `SELECT * FROM "${schema}".timetable_drafts 
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
      `SELECT * FROM "${schema}".timetable_drafts 
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
        `SELECT * FROM "${schema}".timetable_drafts WHERE id::text = $1`,
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
                rawEffUntil ? new Date(rawEffUntil) : null,
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
