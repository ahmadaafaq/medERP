/**
 * MedERP Route & Permission Verification Registry
 * Maps dashboard routes to required roles and menu permissions.
 * Prevents unauthorized or disabled module access when users navigate directly via URL.
 */

export interface RoutePermissionConfig {
  role: string;
  menuKey: string;
  parentKey?: string | null;
  label: string;
}

export const ROUTE_REGISTRY: Record<string, RoutePermissionConfig[]> = {
  // === ADMIN PORTAL ROUTES ===
  '/dashboard/admin': [
    { role: 'ADMIN', menuKey: 'admin_overview', label: 'College KPIs Overview' },
  ],
  '/dashboard/admin/admin-master': [
    { role: 'ADMIN', menuKey: 'admin_admin_master', label: 'Admin Master (Units, Topics, Depts)' },
  ],
  '/dashboard/admin/assessment': [
    { role: 'ADMIN', menuKey: 'admin_assessment', label: 'Assessment & Question Bank' },
  ],
  '/dashboard/admin/assessment-marks': [
    { role: 'ADMIN', menuKey: 'admin_assessment_marks', label: 'Assessment Marks & Upload' },
  ],
  '/dashboard/admin/attendance': [
    { role: 'ADMIN', menuKey: 'admin_attendance', label: 'Daily Attendance' },
  ],
  '/dashboard/admin/attendance-biometric': [
    { role: 'ADMIN', menuKey: 'admin_attendance_biometric', label: 'Attendance — Bio-Metric/CCTV' },
  ],
  '/dashboard/admin/attendance-master': [
    { role: 'ADMIN', menuKey: 'admin_attendance_master', label: 'Attendance Portal Sync' },
  ],
  '/dashboard/admin/attendance-mark': [
    { role: 'ADMIN', menuKey: 'admin_attendance_mark', label: 'Attendance Mark' },
  ],
  '/dashboard/admin/attendance-reports': [
    { role: 'ADMIN', menuKey: 'admin_reports_attendance', parentKey: 'admin_reports', label: 'Attendance Report' },
  ],
  '/dashboard/admin/chat': [
    { role: 'ADMIN', menuKey: 'admin_chat', label: 'Batch & Dept Chat' },
  ],
  '/dashboard/admin/college-master': [
    { role: 'ADMIN', menuKey: 'admin_college_master', label: 'College Master' },
  ],
  '/dashboard/admin/incubation-cell': [
    { role: 'ADMIN', menuKey: 'admin_incubation_cell', label: 'Incubation Cell' },
  ],
  '/dashboard/admin/internships': [
    { role: 'ADMIN', menuKey: 'admin_internships', label: 'Internships & Certifications' },
  ],
  '/dashboard/admin/library': [
    { role: 'ADMIN', menuKey: 'admin_library', label: 'Digital Library' },
  ],
  '/dashboard/admin/medical-logbook/data-directory': [
    { role: 'ADMIN', menuKey: 'admin_medical_logbook', label: 'Medical Logbook' },
    { role: 'ADMIN', menuKey: 'admin_medical_logbook_data_directory', label: 'Data Directory' },
  ],
  '/dashboard/admin/medical-logbook/pg-logbook': [
    { role: 'ADMIN', menuKey: 'admin_medical_logbook_pg_logbook', parentKey: 'admin_medical_logbook', label: 'PG LogBook' },
    { role: 'ADMIN', menuKey: 'admin_medical_logbook', label: 'Medical Logbook' },
  ],
  '/dashboard/admin/medical-logbook/ug-logbook': [
    { role: 'ADMIN', menuKey: 'admin_medical_logbook_ug_logbook', parentKey: 'admin_medical_logbook', label: 'UG LogBook' },
    { role: 'ADMIN', menuKey: 'admin_medical_logbook', label: 'Medical Logbook' },
  ],
  '/dashboard/admin/medical-timetable': [
    { role: 'ADMIN', menuKey: 'admin_medical_timetable', label: 'Medical Timetable' },
  ],
  '/dashboard/admin/notices': [
    { role: 'ADMIN', menuKey: 'admin_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/admin/notices/compose': [
    { role: 'ADMIN', menuKey: 'admin_notices_compose', parentKey: 'admin_notices', label: 'Compose Notice' },
    { role: 'ADMIN', menuKey: 'admin_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/admin/notices/groups': [
    { role: 'ADMIN', menuKey: 'admin_notices_groups', parentKey: 'admin_notices', label: 'Notice Groups' },
    { role: 'ADMIN', menuKey: 'admin_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/admin/notices/sent': [
    { role: 'ADMIN', menuKey: 'admin_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/admin/placement': [
    { role: 'ADMIN', menuKey: 'admin_placement', label: 'Placement Drive' },
  ],
  '/dashboard/admin/reports': [
    { role: 'ADMIN', menuKey: 'admin_reports', label: 'MIS Reports Center' },
  ],
  '/dashboard/admin/reports/attendance': [
    { role: 'ADMIN', menuKey: 'admin_reports_attendance', parentKey: 'admin_reports', label: 'Attendance MIS Report' },
    { role: 'ADMIN', menuKey: 'admin_reports', label: 'MIS Reports Center' },
  ],
  '/dashboard/admin/reports/logbook': [
    { role: 'ADMIN', menuKey: 'admin_reports_logbook', parentKey: 'admin_reports', label: 'Academic Portfolio (Logbook)' },
    { role: 'ADMIN', menuKey: 'admin_reports', label: 'MIS Reports Center' },
  ],
  '/dashboard/admin/reports/theory-result': [
    { role: 'ADMIN', menuKey: 'admin_reports_theory_result', parentKey: 'admin_reports', label: 'Theory Result Card' },
    { role: 'ADMIN', menuKey: 'admin_reports', label: 'MIS Reports Center' },
  ],
  '/dashboard/admin/repository': [
    { role: 'ADMIN', menuKey: 'admin_repository', label: 'Academic Repository' },
  ],
  '/dashboard/admin/staff-admin': [
    { role: 'ADMIN', menuKey: 'admin_staff_admin', label: 'Make Staff as Admin' },
  ],
  '/dashboard/admin/staff-master': [
    { role: 'ADMIN', menuKey: 'admin_staff_master', label: 'Staff Master' },
  ],
  '/dashboard/admin/student-master': [
    { role: 'ADMIN', menuKey: 'admin_student_master', label: 'Student Master' },
  ],
  '/dashboard/admin/subject-linker': [
    { role: 'ADMIN', menuKey: 'admin_subject_linker', label: 'Subject Linker' },
  ],
  '/dashboard/admin/timetable-design': [
    { role: 'ADMIN', menuKey: 'admin_timetable_design', label: 'Design Timetable' },
  ],

  // === CLERK PORTAL ROUTES ===
  '/dashboard/clerk': [
    { role: 'CLERK', menuKey: 'clerk_overview', label: 'Clerk Data Entry' },
  ],
  '/dashboard/clerk/assessment': [
    { role: 'CLERK', menuKey: 'clerk_assessment', label: 'Assessment & Marks Entry' },
  ],
  '/dashboard/clerk/attendance': [
    { role: 'CLERK', menuKey: 'clerk_attendance', label: 'Attendance Portal Sync' },
  ],
  '/dashboard/clerk/attendance-mark': [
    { role: 'CLERK', menuKey: 'clerk_attendance_mark', label: 'Attendance Mark' },
  ],
  '/dashboard/clerk/attendance-biometric': [
    { role: 'CLERK', menuKey: 'clerk_biometric', label: 'Attendance — Bio-Metric/CCTV' },
    { role: 'CLERK', menuKey: 'clerk_attendance_biometric', label: 'Attendance — Bio-Metric/CCTV' },
  ],
  '/dashboard/clerk/internships': [
    { role: 'CLERK', menuKey: 'clerk_internships', label: 'Internships & Certifications' },
  ],
  '/dashboard/clerk/library': [
    { role: 'CLERK', menuKey: 'clerk_library', label: 'Digital Library' },
  ],
  '/dashboard/clerk/notices': [
    { role: 'CLERK', menuKey: 'clerk_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/clerk/placement': [
    { role: 'CLERK', menuKey: 'clerk_placement', label: 'Placement Drive Assistance' },
  ],
  '/dashboard/clerk/staff-master': [
    { role: 'CLERK', menuKey: 'clerk_staff_master', label: 'Staff & Faculty Master' },
    { role: 'CLERK', menuKey: 'clerk_staff', label: 'Staff & Faculty Master' },
  ],
  '/dashboard/clerk/student-master': [
    { role: 'CLERK', menuKey: 'clerk_student_master', label: 'Student Roster Master' },
    { role: 'CLERK', menuKey: 'clerk_student', label: 'Student Roster Master' },
  ],
  '/dashboard/clerk/question-paper-designer': [
    { role: 'CLERK', menuKey: 'clerk_qp_designer', label: 'QP Designer (Submit HOD)' },
  ],
  '/dashboard/clerk/qp-designer': [
    { role: 'CLERK', menuKey: 'clerk_qp_designer', label: 'QP Designer (Submit HOD)' },
  ],
  '/dashboard/clerk/timetable-designer': [
    { role: 'CLERK', menuKey: 'clerk_timetable_designer', label: 'Timetable Designer (Submit HOD)' },
  ],
  '/dashboard/clerk/timetable-design': [
    { role: 'CLERK', menuKey: 'clerk_timetable_designer', label: 'Timetable Designer (Submit HOD)' },
  ],

  // === FACULTY PORTAL ROUTES ===
  '/dashboard/faculty': [
    { role: 'FACULTY', menuKey: 'faculty_overview', label: 'Teaching Dashboard' },
  ],
  '/dashboard/faculty/assessment': [
    { role: 'FACULTY', menuKey: 'faculty_assessment', label: 'Assessment & Question Bank' },
  ],
  '/dashboard/faculty/attendance': [
    { role: 'FACULTY', menuKey: 'faculty_attendance', label: 'Daily Attendance Sync' },
  ],
  '/dashboard/faculty/attendance-mark': [
    { role: 'FACULTY', menuKey: 'faculty_attendance_mark', label: 'Attendance Mark' },
  ],
  '/dashboard/faculty/attendance-biometric': [
    { role: 'FACULTY', menuKey: 'faculty_biometric', label: 'Attendance — Bio-Metric/CCTV' },
    { role: 'FACULTY', menuKey: 'faculty_attendance_biometric', label: 'Attendance — Bio-Metric/CCTV' },
  ],
  '/dashboard/faculty/chat': [
    { role: 'FACULTY', menuKey: 'faculty_chat', label: 'Batch & Dept Chat' },
  ],
  '/dashboard/faculty/department-faculty': [
    { role: 'FACULTY', menuKey: 'faculty_dept', label: 'Department Faculty' },
    { role: 'FACULTY', menuKey: 'faculty_department_faculty', label: 'Department Faculty' },
  ],
  '/dashboard/faculty/internships': [
    { role: 'FACULTY', menuKey: 'faculty_internships', label: 'Internships & Certifications' },
  ],
  '/dashboard/faculty/lessons': [
    { role: 'FACULTY', menuKey: 'faculty_lessons', label: 'Lesson Uploads & Notes' },
  ],
  '/dashboard/faculty/library': [
    { role: 'FACULTY', menuKey: 'faculty_library', label: 'Digital Library' },
  ],
  '/dashboard/faculty/logbook': [
    { role: 'FACULTY', menuKey: 'faculty_logbook', label: 'Faculty Activity Logbook' },
  ],
  '/dashboard/faculty/marks': [
    { role: 'FACULTY', menuKey: 'faculty_marks', label: 'Marks Entry & Grading' },
  ],
  '/dashboard/faculty/medical-logbook/data-directory': [
    { role: 'FACULTY', menuKey: 'faculty_medical_logbook', label: 'Medical Logbook' },
    { role: 'FACULTY', menuKey: 'faculty_medical_logbook_data_directory', label: 'Data Directory' },
  ],
  '/dashboard/faculty/medical-logbook/pg-logbook': [
    { role: 'FACULTY', menuKey: 'faculty_medical_logbook_pg_logbook', parentKey: 'faculty_medical_logbook', label: 'PG LogBook' },
    { role: 'FACULTY', menuKey: 'faculty_medical_logbook', label: 'Medical Logbook' },
  ],
  '/dashboard/faculty/medical-logbook/ug-logbook': [
    { role: 'FACULTY', menuKey: 'faculty_medical_logbook_ug_logbook', parentKey: 'faculty_medical_logbook', label: 'UG LogBook' },
    { role: 'FACULTY', menuKey: 'faculty_medical_logbook', label: 'Medical Logbook' },
  ],
  '/dashboard/faculty/medical-schedule': [
    { role: 'FACULTY', menuKey: 'faculty_medical_schedule', label: 'Medical Schedule' },
  ],
  '/dashboard/faculty/notices': [
    { role: 'FACULTY', menuKey: 'faculty_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/faculty/placement': [
    { role: 'FACULTY', menuKey: 'faculty_placement', label: 'Placement Drive' },
  ],
  '/dashboard/faculty/profile': [
    { role: 'FACULTY', menuKey: 'faculty_profile', label: 'Faculty Profile' },
  ],
  '/dashboard/faculty/reports': [
    { role: 'FACULTY', menuKey: 'faculty_reports', label: 'MIS Reports' },
  ],
  '/dashboard/faculty/reports/attendance': [
    { role: 'FACULTY', menuKey: 'faculty_reports_attendance', parentKey: 'faculty_reports', label: 'Attendance Report' },
    { role: 'FACULTY', menuKey: 'faculty_reports', label: 'MIS Reports' },
  ],
  '/dashboard/faculty/reports/logbook': [
    { role: 'FACULTY', menuKey: 'faculty_reports_logbook', parentKey: 'faculty_reports', label: 'Academic Portfolio (Logbook)' },
    { role: 'FACULTY', menuKey: 'faculty_reports', label: 'MIS Reports' },
  ],
  '/dashboard/faculty/reports/theory-result': [
    { role: 'FACULTY', menuKey: 'faculty_reports_theory_result', parentKey: 'faculty_reports', label: 'Theory Result Card' },
    { role: 'FACULTY', menuKey: 'faculty_reports', label: 'MIS Reports' },
  ],
  '/dashboard/faculty/repository': [
    { role: 'FACULTY', menuKey: 'faculty_repository', label: 'Academic Repository' },
  ],
  '/dashboard/faculty/schedule': [
    { role: 'FACULTY', menuKey: 'faculty_schedule', label: 'Schedule & Timetable' },
  ],
  '/dashboard/faculty/students': [
    { role: 'FACULTY', menuKey: 'faculty_students', label: 'Student Info & Roster' },
  ],

  // === HOD PORTAL ROUTES ===
  '/dashboard/hod': [
    { role: 'HOD', menuKey: 'hod_overview', label: 'HOD Department Overview' },
  ],
  '/dashboard/hod/qp-approvals': [
    { role: 'HOD', menuKey: 'hod_qp_approvals', label: 'Question Paper Approvals' },
  ],
  '/dashboard/hod/timetable-approvals': [
    { role: 'HOD', menuKey: 'hod_timetable_approvals', label: 'Timetable Approvals' },
  ],
  '/dashboard/hod/question-bank': [
    { role: 'HOD', menuKey: 'hod_question_bank', label: 'Question Bank & Topics' },
  ],
  '/dashboard/hod/chat': [
    { role: 'HOD', menuKey: 'hod_chat', label: 'HOD Chat' },
  ],
  '/dashboard/admin/qp-print': [
    { role: 'ADMIN', menuKey: 'admin_qp_print', label: 'QP Print Center' },
  ],

  // === STUDENT PORTAL ROUTES ===
  '/dashboard/student': [
    { role: 'STUDENT', menuKey: 'student_overview', label: 'Student Dashboard' },
  ],
  '/dashboard/student/assessment': [
    { role: 'STUDENT', menuKey: 'student_assessment', label: 'Assessment & Tests' },
  ],
  '/dashboard/student/attendance': [
    { role: 'STUDENT', menuKey: 'student_attendance', label: 'Attendance Portal Sync' },
  ],
  '/dashboard/student/attendance-biometric': [
    { role: 'STUDENT', menuKey: 'student_biometric', label: 'Attendance — Bio-Metric/CCTV' },
    { role: 'STUDENT', menuKey: 'student_attendance_biometric', label: 'Attendance — Bio-Metric/CCTV' },
  ],
  '/dashboard/student/chat': [
    { role: 'STUDENT', menuKey: 'student_chat', label: 'Batch & Dept Chat' },
  ],
  '/dashboard/student/internships': [
    { role: 'STUDENT', menuKey: 'student_internships', label: 'Internships & Certifications' },
  ],
  '/dashboard/student/lessons': [
    { role: 'STUDENT', menuKey: 'student_lessons', label: 'Lessons & Study Materials' },
  ],
  '/dashboard/student/library': [
    { role: 'STUDENT', menuKey: 'student_library', label: 'Digital Library Access' },
  ],
  '/dashboard/student/logbook': [
    { role: 'STUDENT', menuKey: 'student_logbook', label: 'Academic Portfolio & Submissions' },
  ],
  '/dashboard/student/marks': [
    { role: 'STUDENT', menuKey: 'student_marks', label: 'Theory & Practical Marks' },
  ],
  '/dashboard/student/medical-schedule': [
    { role: 'STUDENT', menuKey: 'student_medical_schedule', label: 'Medical Schedule' },
  ],
  '/dashboard/student/notices': [
    { role: 'STUDENT', menuKey: 'student_notices', label: 'Notices & Circulars' },
  ],
  '/dashboard/student/placement': [
    { role: 'STUDENT', menuKey: 'student_placement', label: 'Placement Drive Portal' },
  ],
  '/dashboard/student/profile': [
    { role: 'STUDENT', menuKey: 'student_profile', label: 'Student Profile' },
  ],
  '/dashboard/student/reports': [
    { role: 'STUDENT', menuKey: 'student_reports', label: 'Student Performance Reports' },
  ],
  '/dashboard/student/reports/theory-result': [
    { role: 'STUDENT', menuKey: 'student_reports_theory_result', parentKey: 'student_reports', label: 'Result Card / Theory MIS' },
    { role: 'STUDENT', menuKey: 'student_reports', label: 'Student Performance Reports' },
  ],
  '/dashboard/student/repository': [
    { role: 'STUDENT', menuKey: 'student_repository', label: 'Academic Repository' },
  ],
  '/dashboard/student/schedule': [
    { role: 'STUDENT', menuKey: 'student_schedule', label: 'Live Class Schedule' },
  ],
  '/dashboard/student/timetable': [
    { role: 'STUDENT', menuKey: 'student_timetable', label: 'Weekly Timetable' },
  ],

  // === WARDEN PORTAL ROUTES ===
  '/dashboard/warden': [
    { role: 'WARDEN', menuKey: 'warden_overview', label: 'Hostel Warden Console' },
  ],

  // === COMMON DASHBOARD UTILITY ROUTES ===
  '/dashboard/chat': [
    { role: 'CLERK', menuKey: 'clerk_chat', label: 'Hostel & Staff Chat' },
    { role: 'WARDEN', menuKey: 'warden_chat', label: 'Hostel & Staff Chat' },
    { role: 'FACULTY', menuKey: 'faculty_chat', label: 'Batch & Dept Chat' },
    { role: 'STUDENT', menuKey: 'student_chat', label: 'Batch & Dept Chat' },
    { role: 'ADMIN', menuKey: 'admin_chat', label: 'Batch & Dept Chat' },
  ],
  '/dashboard/notices': [
    { role: 'ADMIN', menuKey: 'admin_notices', label: 'Notices & Circulars' },
    { role: 'FACULTY', menuKey: 'faculty_notices', label: 'Notices & Circulars' },
    { role: 'STUDENT', menuKey: 'student_notices', label: 'Notices & Circulars' },
    { role: 'CLERK', menuKey: 'clerk_notices', label: 'Notices & Circulars' },
  ],

  // === SUPERADMIN / SAAS OWNER ROUTES ===
  '/dashboard/owner': [
    { role: 'SUPERADMIN', menuKey: 'superadmin_overview', label: 'SuperAdmin SaaS Overview' },
  ],
  '/dashboard/owner/data-cleaner': [
    { role: 'SUPERADMIN', menuKey: 'superadmin_overview', label: 'Data Cleaner' },
  ],
  '/dashboard/superadmin/clean-data': [
    { role: 'SUPERADMIN', menuKey: 'superadmin_clean_data', label: 'Clean Data' },
  ],
  '/dashboard/superadmin/firms': [
    { role: 'SUPERADMIN', menuKey: 'superadmin_firms', label: 'Firms Registry' },
  ],
  '/dashboard/superadmin/firms/register': [
    { role: 'SUPERADMIN', menuKey: 'superadmin_firms_register', label: 'Register New Firm' },
  ],
};

/**
 * Normalizes a route pathname by stripping trailing slashes and hash fragments.
 */
export function normalizePathname(pathname: string): string {
  if (!pathname) return '';
  let clean = pathname.split('?')[0].split('#')[0].trim().toLowerCase();
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * In-memory cache for fetched role permissions
 * Key: `${tenantSlug}:${role}`
 */
const permissionsMemoryCache: Record<string, { keys: Set<string>; timestamp: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

/**
 * Expands enabled keys with standard aliases and normalized forms.
 */
export function expandPermissionKeys(rawList: any[]): Set<string> {
  const keySet = new Set<string>();

  rawList.forEach((item: any) => {
    if (item.is_enabled === false) return;
    const key = typeof item === 'string' ? item : item.menu_key;
    if (!key) return;

    const norm = key.toLowerCase().trim().replace(/[\/\-\.]+/g, '_');
    keySet.add(key);
    keySet.add(norm);

    // Bidirectional Aliases
    if (norm === 'admin_attendance_biometric') keySet.add('admin_biometric');
    if (norm === 'admin_biometric') keySet.add('admin_attendance_biometric');
    if (norm === 'admin_assessment_marks') keySet.add('admin_marks');
    if (norm === 'admin_marks') keySet.add('admin_assessment_marks');
    if (norm === 'faculty_attendance_biometric') keySet.add('faculty_biometric');
    if (norm === 'faculty_biometric') keySet.add('faculty_attendance_biometric');
    if (norm === 'student_attendance_biometric') keySet.add('student_biometric');
    if (norm === 'student_biometric') keySet.add('student_attendance_biometric');
    if (norm === 'clerk_attendance_biometric') keySet.add('clerk_biometric');
    if (norm === 'clerk_biometric') keySet.add('clerk_attendance_biometric');
    if (norm === 'faculty_assessment_marks') keySet.add('faculty_marks');
    if (norm === 'faculty_marks') keySet.add('faculty_assessment_marks');
    if (norm === 'student_assessment_marks') keySet.add('student_marks');
    if (norm === 'student_marks') keySet.add('student_assessment_marks');
    if (norm === 'faculty_department_faculty') keySet.add('faculty_dept');
    if (norm === 'faculty_dept') keySet.add('faculty_department_faculty');
    if (norm === 'clerk_staff_master') keySet.add('clerk_staff');
    if (norm === 'clerk_student_master') keySet.add('clerk_student');
    if (norm === 'warden_mess_menu') keySet.add('warden_mess');
    if (norm === 'warden_mess') keySet.add('warden_mess_menu');
    if (norm === 'warden_student_master') keySet.add('warden_roster');

    // Route path variants
    const rp = typeof item === 'object' ? item.route_path : null;
    if (rp) {
      const rClean = rp.toLowerCase().trim();
      keySet.add(rClean);
      const rStripped = rClean.replace(/^\/dashboard\/?/, '').replace(/[\/\-\.]+/g, '_');
      keySet.add(rStripped);
      const rBare = rClean.replace(/^\//, '').replace(/[\/\-\.]+/g, '_');
      keySet.add(rBare);
    }
  });

  return keySet;
}

/**
 * Normalizes any incoming role string to the canonical MedERP database role:
 * ADMIN | FACULTY | STUDENT | CLERK | WARDEN | SUPERADMIN
 */
export function normalizeRole(rawRole?: string): string {
  if (!rawRole) return 'STUDENT';
  const r = rawRole.toUpperCase().trim();
  if (r === 'COLLEGE_ADMIN' || r === 'ADMINISTRATOR' || r === 'ADMIN') return 'ADMIN';
  if (r === 'HOD') return 'HOD';
  if (r === 'STAFF' || r === 'TEACHER' || r === 'FACULTY') return 'FACULTY';
  if (r === 'SUPERADMIN' || r === 'SUPER_ADMIN' || r === 'OWNER') return 'SUPERADMIN';
  if (r === 'STUDENT') return 'STUDENT';
  if (r === 'CLERK') return 'CLERK';
  if (r === 'WARDEN') return 'WARDEN';
  return r;
}

/**
 * Fetch and cache permissions for a specific tenant and role.
 */
export async function getRolePermissionsForTenant(
  tenantSlug: string,
  role: string,
  forceRefresh = false
): Promise<Set<string>> {
  const cleanSlug = tenantSlug.replace(/^tenant_/, '').replace(/^tenant-/, '').trim() || 'srms-cet-bareilly';
  const targetRole = normalizeRole(role);
  const cacheKey = `${cleanSlug}:${targetRole}`;

  if (!forceRefresh && permissionsMemoryCache[cacheKey]) {
    const cached = permissionsMemoryCache[cacheKey];
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.keys;
    }
  }

  // Also check sessionStorage
  if (!forceRefresh && typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`med_perms_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          const keys = new Set<string>(parsed.keys);
          permissionsMemoryCache[cacheKey] = { keys, timestamp: parsed.timestamp };
          return keys;
        }
      }
    } catch {
      // sessionStorage unavailable or parse error, proceed with fetch
    }
  }

  try {
    const rolesToFetch = targetRole === 'HOD' ? ['HOD', 'FACULTY'] : [targetRole];
    const responses = await Promise.all(
      rolesToFetch.map(r =>
        fetch(`/api/firms/${cleanSlug}/role-permissions?role=${r}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }).then(res => (res.ok ? res.json() : null)).catch(() => null)
      )
    );

    let combinedList: any[] = [];
    responses.forEach(json => {
      if (!json) return;
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      combinedList = combinedList.concat(list);
    });

    const expandedKeys = expandPermissionKeys(combinedList);

    // If HOD, ensure all shared faculty keys and HOD keys are always enabled
    if (targetRole === 'HOD') {
      [
        'faculty_profile',
        'faculty_students',
        'faculty_department_faculty',
        'faculty_dept',
        'faculty_schedule',
        'faculty_attendance',
        'faculty_attendance_mark',
        'faculty_attendance_biometric',
        'faculty_biometric',
        'faculty_marks',
        'faculty_assessment',
        'faculty_lessons',
        'faculty_library',
        'faculty_logbook',
        'faculty_reports',
        'faculty_medical_schedule',
        'faculty_medical_logbook',
        'faculty_chat',
        'faculty_notices',
        'faculty_placement',
        'faculty_repository',
        'hod_overview',
        'hod_qp_approvals',
        'hod_timetable_approvals',
        'hod_question_bank',
        'hod_chat',
      ].forEach(k => expandedKeys.add(k));
    }

    // If CLERK, ensure clerk workspace keys are always enabled
    if (targetRole === 'CLERK') {
      [
        'clerk_overview',
        'clerk_assessment',
        'clerk_attendance',
        'clerk_attendance_mark',
        'clerk_attendance_biometric',
        'clerk_biometric',
        'clerk_internships',
        'clerk_library',
        'clerk_notices',
        'clerk_placement',
        'clerk_staff_master',
        'clerk_staff',
        'clerk_student_master',
        'clerk_student',
        'clerk_qp_designer',
        'clerk_timetable_designer',
        'clerk_timetable_design',
      ].forEach(k => expandedKeys.add(k));
    }

    const cacheEntry = { keys: expandedKeys, timestamp: Date.now() };
    permissionsMemoryCache[cacheKey] = cacheEntry;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          `med_perms_${cacheKey}`,
          JSON.stringify({ keys: Array.from(expandedKeys), timestamp: Date.now() })
        );
      } catch {}
    }

    return expandedKeys;
  } catch (err) {
    console.warn(`[routeRegistry] Could not fetch permissions for ${cacheKey}:`, err);
  }

  return new Set<string>();
}

/**
 * Clear the permissions cache when an update occurs.
 */
export function invalidatePermissionsCache() {
  for (const k of Object.keys(permissionsMemoryCache)) {
    delete permissionsMemoryCache[k];
  }
  if (typeof window !== 'undefined') {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('med_perms_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}
  }
}

export interface RouteVerificationResult {
  allowed: boolean;
  reason?: string;
  moduleLabel?: string;
  requiredKey?: string;
}

/**
 * Checks whether a given pathname is allowed for the authenticated user and their tenant's permissions.
 */
export function verifyRouteAccess({
  pathname,
  userRole,
  isOwner,
  enabledKeys,
}: {
  pathname: string;
  userRole: string;
  isOwner: boolean;
  enabledKeys: Set<string> | null;
}): RouteVerificationResult {
  const normPath = normalizePathname(pathname);
  const roleUpper = normalizeRole(userRole);

  // 1. Owner and SuperAdmin have unrestricted access to all SaaS & college features
  if (roleUpper === 'SUPERADMIN' || isOwner) {
    return { allowed: true };
  }

  // 2. Protect Superadmin / Owner areas from all normal college users
  if (normPath.startsWith('/dashboard/owner') || normPath.startsWith('/dashboard/superadmin')) {
    return {
      allowed: false,
      reason: 'This section is restricted to Platform SuperAdministrators only.',
      moduleLabel: 'SuperAdmin SaaS Control Panel',
    };
  }

  // 3. Base landing page for each role is ALWAYS permitted (Zero lockouts on login)
  if (
    (roleUpper === 'ADMIN' && (normPath === '/dashboard/admin' || normPath === '/dashboard')) ||
    (roleUpper === 'FACULTY' && (normPath === '/dashboard/faculty' || normPath === '/dashboard')) ||
    (roleUpper === 'HOD' && (normPath === '/dashboard/hod' || normPath === '/dashboard')) ||
    (roleUpper === 'STUDENT' && (normPath === '/dashboard/student' || normPath === '/dashboard')) ||
    (roleUpper === 'CLERK' && (normPath === '/dashboard/clerk' || normPath === '/dashboard')) ||
    (roleUpper === 'WARDEN' && (normPath === '/dashboard/warden' || normPath === '/dashboard'))
  ) {
    return { allowed: true };
  }

  // 4. Check role namespace boundaries
  if (roleUpper === 'STUDENT' && (normPath.startsWith('/dashboard/admin') || normPath.startsWith('/dashboard/faculty') || normPath.startsWith('/dashboard/clerk') || normPath.startsWith('/dashboard/warden') || normPath.startsWith('/dashboard/hod'))) {
    return {
      allowed: false,
      reason: 'Your Student account does not have access to administrative or faculty portals.',
      moduleLabel: 'Administrative Portal',
    };
  }

  if ((roleUpper === 'FACULTY' || roleUpper === 'HOD') && (normPath.startsWith('/dashboard/admin') || normPath.startsWith('/dashboard/student') || normPath.startsWith('/dashboard/clerk') || normPath.startsWith('/dashboard/warden'))) {
    return {
      allowed: false,
      reason: 'Your Faculty account does not have access to student or administrative consoles.',
      moduleLabel: 'Portal Section',
    };
  }

  if (roleUpper === 'CLERK' && (normPath.startsWith('/dashboard/admin') || normPath.startsWith('/dashboard/student') || normPath.startsWith('/dashboard/faculty') || normPath.startsWith('/dashboard/warden') || normPath.startsWith('/dashboard/hod'))) {
    return {
      allowed: false,
      reason: 'Your Clerk account does not have access to admin, faculty, or student portals.',
      moduleLabel: 'Portal Section',
    };
  }

  if (roleUpper === 'WARDEN' && (normPath.startsWith('/dashboard/admin') || normPath.startsWith('/dashboard/student') || normPath.startsWith('/dashboard/faculty') || normPath.startsWith('/dashboard/clerk') || normPath.startsWith('/dashboard/hod'))) {
    return {
      allowed: false,
      reason: 'Your Warden account does not have access to admin, faculty, clerk, or student portals.',
      moduleLabel: 'Portal Section',
    };
  }

  if (roleUpper === 'ADMIN' && (normPath.startsWith('/dashboard/student') || normPath.startsWith('/dashboard/faculty') || normPath.startsWith('/dashboard/clerk') || normPath.startsWith('/dashboard/warden') || normPath.startsWith('/dashboard/hod'))) {
    return {
      allowed: false,
      reason: 'This section is designated for non-admin user roles.',
      moduleLabel: 'Role Portal',
    };
  }

  // HOD specific and shared faculty routes are always permitted for HOD
  if (roleUpper === 'HOD' && (normPath.startsWith('/dashboard/hod') || normPath.startsWith('/dashboard/faculty'))) {
    return { allowed: true };
  }

  // Clerk specific routes are always permitted for Clerk
  if (roleUpper === 'CLERK' && normPath.startsWith('/dashboard/clerk')) {
    return { allowed: true };
  }

  // 5. While permissions are still loading (null), allow temporary display to avoid flicker on normal navigation
  if (enabledKeys === null) {
    return { allowed: true };
  }

  // 6. Look up route in registry (exact match or parent match)
  let matchingConfigs = ROUTE_REGISTRY[normPath];

  // If dynamic sub-route like /dashboard/admin/notices/reports/123, resolve to parent
  if (!matchingConfigs) {
    if (normPath.startsWith('/dashboard/admin/notices/')) {
      matchingConfigs = ROUTE_REGISTRY['/dashboard/admin/notices'];
    } else if (normPath.startsWith('/dashboard/admin/reports/')) {
      matchingConfigs = ROUTE_REGISTRY['/dashboard/admin/reports'];
    } else if (normPath.startsWith('/dashboard/faculty/reports/')) {
      matchingConfigs = ROUTE_REGISTRY['/dashboard/faculty/reports'];
    } else if (normPath.startsWith('/dashboard/student/reports/')) {
      matchingConfigs = ROUTE_REGISTRY['/dashboard/student/reports'];
    } else if (normPath.startsWith('/dashboard/faculty/medical-logbook/')) {
      matchingConfigs = ROUTE_REGISTRY['/dashboard/faculty/medical-logbook/data-directory'];
    } else if (normPath.startsWith('/dashboard/admin/medical-logbook/')) {
      matchingConfigs = ROUTE_REGISTRY['/dashboard/admin/medical-logbook/data-directory'];
    }
  }

  // If route is explicitly registered in ROUTE_REGISTRY
  if (matchingConfigs && matchingConfigs.length > 0) {
    // Find config that matches the current user's role (HOD inherits all FACULTY permissions)
    const roleConfig = matchingConfigs.find((c) => c.role === roleUpper || (roleUpper === 'HOD' && c.role === 'FACULTY'));

    if (!roleConfig) {
      // Route is registered for other roles, but not this one
      return {
        allowed: false,
        reason: `The page '${normPath}' is not authorized for the '${roleUpper}' role.`,
        moduleLabel: matchingConfigs[0]?.label || normPath,
      };
    }

    // Check if the required menuKey is enabled in tenant permissions
    const requiredKey = roleConfig.menuKey;
    const normKey = requiredKey.toLowerCase().trim().replace(/[\/\-\.]+/g, '_');
    const pathAsKey = normPath.replace(/^\/dashboard\/?/, '').replace(/[\/\-\.]+/g, '_');

    const hasPermission =
      enabledKeys.has(requiredKey) ||
      enabledKeys.has(normKey) ||
      enabledKeys.has(normPath) ||
      enabledKeys.has(pathAsKey);

    if (!hasPermission) {
      return {
        allowed: false,
        reason: `The module '${roleConfig.label}' (${normPath}) has been disabled for your institution by the Super Administrator.`,
        moduleLabel: roleConfig.label,
        requiredKey: roleConfig.menuKey,
      };
    }

    return { allowed: true };
  }

  // 7. Generic check: If route starts with /dashboard/<role> but wasn't explicitly caught,
  // check if path converted to key matches enabledKeys
  const strippedPath = normPath.replace(/^\/dashboard\/?/, '').replace(/[\/\-\.]+/g, '_');
  if (enabledKeys.has(strippedPath) || enabledKeys.has(normPath)) {
    return { allowed: true };
  }

  // Default: Allowed if within the user's role domain
  return { allowed: true };
}
