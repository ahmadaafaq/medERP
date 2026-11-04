import { queryDb } from './db';
import { resolveSchema } from './timetable-drafts-db';

export function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function getDisciplineKey(dept: any): string {
  const raw = ((dept?.name || '') + ' ' + (dept?.code || '')).toUpperCase();
  const clean = raw.replace(/[()&,.-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/COMPUTER\s*SCI|CSE|B\.TECH\.\s*\(?CS|\bCS\b/i.test(clean) && !/APPLICATION|MCA|BCA/i.test(clean)) {
    return 'CSE';
  }
  if (/\bBCA\b|BACHELOR.*COMPUTER.*APP/i.test(clean)) {
    return 'BCA';
  }
  if (/\bMCA\b|MASTER.*COMPUTER.*APP/i.test(clean)) {
    return 'MCA';
  }
  if (/COMPUTER\s*APP/i.test(clean)) {
    return 'COMP_APP';
  }
  if (/MECHANICAL|\bME\b/i.test(clean) && !/ELECTRICAL/i.test(clean)) {
    return 'ME';
  }
  if (/ELECTRONIC|\bECE?\b|\bEC\b/i.test(clean)) {
    return 'ECE';
  }
  if (/ELECTRICAL|\bEE\b|\bEN\b/i.test(clean)) {
    return 'EE';
  }
  if (/INFORMATION\s*TECH|\bIT\b/i.test(clean)) {
    return 'IT';
  }
  if (/PHARM/i.test(clean)) {
    return 'PHARMACY';
  }
  if (/\bMBA\b|MASTER.*BUSINESS/i.test(clean)) {
    return 'MBA';
  }
  if (/\bBBA\b|BACHELOR.*BUSINESS/i.test(clean)) {
    return 'BBA';
  }
  if (/MANAGEMENT/i.test(clean)) {
    return 'MANAGEMENT';
  }
  if (/LAW|LL\.?B/i.test(clean)) {
    return 'LAW';
  }
  return clean;
}

export async function resolveHodScope(
  tenantSlug: string,
  options: {
    departmentId?: string;
    userId?: string;
    empId?: string;
    courseCd?: string;
    role?: string;
  }
): Promise<{
  departmentIds: string[];
  courseCds: string[];
  isRestricted: boolean;
}> {
  const schema = resolveSchema(tenantSlug);
  const rawDeptId = options.departmentId;
  const rawUserId = options.userId?.trim() || null;
  const rawEmpId = options.empId?.trim() || null;
  const rawRole = (options.role || '').toUpperCase();

  const result = {
    departmentIds: [] as string[],
    courseCds: [] as string[],
    isRestricted: true,
  };

  try {
    let userRow: any = null;
    if (rawUserId || rawEmpId) {
      const uRes = await queryDb(
        `SELECT u.id, u.emp_id, u.department, u.role, u.assigned_roles,
                f.id as faculty_id, f.department_id as fac_dept_id
         FROM "${schema}".users u
         LEFT JOIN "${schema}".faculty f ON (f.user_id::text = u.id::text OR (f.emp_id IS NOT NULL AND f.emp_id = u.emp_id))
         WHERE ($1::text IS NOT NULL AND u.id::text = $1::text)
            OR ($2::text IS NOT NULL AND (u.emp_id = $2::text OR u.username = $2::text))
         LIMIT 1`,
        [rawUserId, rawEmpId]
      );
      userRow = uRes[0] || null;
    }

    const facDeptId = userRow?.fac_dept_id;
    const dbRole = (userRow?.role || '').toUpperCase();
    const dbAssignedRoles = (userRow?.assigned_roles || '').toUpperCase();
    const isHodUser = rawRole.includes('HOD') || dbRole.includes('HOD') || dbAssignedRoles.includes('HOD');

    // Fetch all departments in tenant to dynamically group disciplines
    const allDepts = await queryDb(
      `SELECT id, code, name, course_cd, branch_cd, hod_user_id FROM "${schema}".departments`
    ).catch(() => []);

    // PRIMARY: Collect departments where this user is explicitly set as hod_user_id
    const hodLinkedDepts = userRow?.id
      ? allDepts.filter((d: any) => d.hod_user_id && d.hod_user_id === userRow.id)
      : [];

    // SECONDARY: Anchor on faculty.department_id (the dept this person teaches in)
    const facDept = facDeptId ? allDepts.find((d: any) => d.id === facDeptId) : null;

    // Build anchor set: hod-linked depts + faculty dept
    const anchorDeptIds = new Set<string>(hodLinkedDepts.map((d: any) => d.id));
    if (facDept) anchorDeptIds.add(facDept.id);

    // If user wasn't linked to a dept directly but rawDeptId was supplied, use as fallback anchor
    if (anchorDeptIds.size === 0 && rawDeptId && isUUID(rawDeptId)) {
      anchorDeptIds.add(rawDeptId);
    }

    // Compute discipline keys from anchors only
    const activeDisciplines = new Set<string>();
    anchorDeptIds.forEach((id) => {
      const d = allDepts.find((x: any) => x.id === id);
      if (d) activeDisciplines.add(getDisciplineKey(d));
    });

    // Add all departments that share the same discipline as the anchors
    for (const d of allDepts) {
      const dKey = getDisciplineKey(d);
      const isAnchor = anchorDeptIds.has(d.id);
      const matchesDiscipline = activeDisciplines.size > 0 && activeDisciplines.has(dKey);

      if (isAnchor || matchesDiscipline) {
        if (!result.departmentIds.includes(d.id)) {
          result.departmentIds.push(d.id);
        }
        const dCourse = d.course_cd ? String(d.course_cd) : '';
        if (dCourse && !result.courseCds.includes(dCourse)) {
          result.courseCds.push(dCourse);
        }
      }
    }

    if (options.courseCd && !isHodUser) {
      result.courseCds.push(options.courseCd);
    }
  } catch (e) {
    console.warn('[resolveHodScope] Error:', e);
  }

  return result;
}
