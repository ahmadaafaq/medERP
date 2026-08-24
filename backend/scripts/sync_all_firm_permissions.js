const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://unicampus:unicampus_secret@localhost:5432/unicampus_erp' });

async function syncAllFirmPermissions() {
  console.log('--- Synchronizing Menu Registry & Firm Role Permissions ---');

  // 1. Ensure menu_registry has all active catalog items
  const catalog = [
    // ADMIN
    { role: 'ADMIN', menu_key: 'admin_overview', menu_label: 'College KPIs', route_path: '/dashboard/admin', sort_order: 10, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_college_master', menu_label: 'College Master', route_path: '/dashboard/admin/college-master', sort_order: 20, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_admin_master', menu_label: 'Admin Master', route_path: '/dashboard/admin/admin-master', sort_order: 30, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_student_master', menu_label: 'Student Master', route_path: '/dashboard/admin/student-master', sort_order: 40, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_staff_master', menu_label: 'Staff Master', route_path: '/dashboard/admin/staff-master', sort_order: 50, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_subject_linker', menu_label: 'Subject Linker', route_path: '/dashboard/admin/subject-linker', sort_order: 60, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_timetable_design', menu_label: 'Design Timetable', route_path: '/dashboard/admin/timetable-design', sort_order: 70, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_attendance_master', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/admin/attendance-master', sort_order: 80, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/admin/attendance-biometric', sort_order: 90, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_attendance_reports', menu_label: 'Attendance Reports / MIS', route_path: '/dashboard/admin/attendance-reports', sort_order: 100, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_assessment', menu_label: 'Assessment & Q-Bank', route_path: '/dashboard/admin/assessment', sort_order: 110, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_marks', menu_label: 'Assessment Marks & Upload', route_path: '/dashboard/admin/assessment-marks', sort_order: 120, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_placement', menu_label: 'Placement Drive', route_path: '/dashboard/admin/placement', sort_order: 130, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/admin/internships', sort_order: 140, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_incubation_cell', menu_label: 'Incubation Cell 🚀', route_path: '/dashboard/admin/incubation-cell', sort_order: 145, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_repository', menu_label: 'Academic Repository 📂', route_path: '/dashboard/admin/repository', sort_order: 148, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/admin/notices/sent', sort_order: 150, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_library', menu_label: 'Digital Library', route_path: '/dashboard/admin/library', sort_order: 160, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/admin/chat', sort_order: 170, applicable_firm_mode: 'BOTH' },
    { role: 'ADMIN', menu_key: 'admin_reports', menu_label: 'MIS Reports Center', route_path: '/dashboard/admin/reports', sort_order: 180, applicable_firm_mode: 'BOTH' },

    // FACULTY
    { role: 'FACULTY', menu_key: 'faculty_overview', menu_label: 'Teaching Dashboard', route_path: '/dashboard/faculty', sort_order: 10, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_profile', menu_label: 'Faculty Profile', route_path: '/dashboard/faculty/profile', sort_order: 20, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_students', menu_label: 'Student Info & Roster', route_path: '/dashboard/faculty/students', sort_order: 30, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_dept', menu_label: 'Department Faculty', route_path: '/dashboard/faculty/department-faculty', sort_order: 40, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_schedule', menu_label: 'Schedule & Timetable', route_path: '/dashboard/faculty/schedule', sort_order: 50, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_attendance', menu_label: 'Daily Attendance Sync', route_path: '/dashboard/faculty/attendance', sort_order: 60, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/faculty/attendance-biometric', sort_order: 70, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_assessment', menu_label: 'Assessment & Q-Bank', route_path: '/dashboard/faculty/assessment', sort_order: 80, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_marks', menu_label: 'Marks Entry & Grading', route_path: '/dashboard/faculty/marks', sort_order: 90, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_lessons', menu_label: 'Lesson Uploads & Notes', route_path: '/dashboard/faculty/lessons', sort_order: 100, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_logbook', menu_label: 'Faculty Activity Logbook', route_path: '/dashboard/faculty/logbook', sort_order: 110, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_repository', menu_label: 'Project Score & Repo 📂', route_path: '/dashboard/faculty/repository', sort_order: 120, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_placement', menu_label: 'Placement Drive', route_path: '/dashboard/faculty/placement', sort_order: 130, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/faculty/internships', sort_order: 140, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/faculty/notices', sort_order: 150, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_library', menu_label: 'Digital Library', route_path: '/dashboard/faculty/library', sort_order: 160, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/faculty/chat', sort_order: 170, applicable_firm_mode: 'BOTH' },
    { role: 'FACULTY', menu_key: 'faculty_reports', menu_label: 'MIS Reports', route_path: '/dashboard/faculty/reports', sort_order: 180, applicable_firm_mode: 'BOTH' },

    // STUDENT
    { role: 'STUDENT', menu_key: 'student_overview', menu_label: 'Student Dashboard', route_path: '/dashboard/student', sort_order: 10, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_profile', menu_label: 'Student Profile', route_path: '/dashboard/student/profile', sort_order: 20, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_timetable', menu_label: 'My Weekly Timetable', route_path: '/dashboard/student/timetable', sort_order: 30, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_schedule', menu_label: 'Live Class Schedule', route_path: '/dashboard/student/schedule', sort_order: 40, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_attendance', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/student/attendance', sort_order: 50, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/student/attendance-biometric', sort_order: 60, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_assessment', menu_label: 'Assessment & Tests', route_path: '/dashboard/student/assessment', sort_order: 70, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_marks', menu_label: 'Theory & Practical Marks', route_path: '/dashboard/student/marks', sort_order: 80, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_lessons', menu_label: 'Lessons & Study Materials', route_path: '/dashboard/student/lessons', sort_order: 90, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_repository', menu_label: 'Academic Repository 📂', route_path: '/dashboard/student/repository', sort_order: 100, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_logbook', menu_label: 'Student Logbook & Records', route_path: '/dashboard/student/logbook', sort_order: 110, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_placement', menu_label: 'Placement Drive Portal', route_path: '/dashboard/student/placement', sort_order: 120, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/student/internships', sort_order: 130, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/student/notices', sort_order: 140, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_library', menu_label: 'Digital Library Access', route_path: '/dashboard/student/library', sort_order: 150, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_reports_theory_result', menu_label: 'Result Card / Theory MIS', route_path: '/dashboard/student/reports/theory-result', sort_order: 160, applicable_firm_mode: 'BOTH' },
    { role: 'STUDENT', menu_key: 'student_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/student/chat', sort_order: 170, applicable_firm_mode: 'BOTH' },

    // CLERK
    { role: 'CLERK', menu_key: 'clerk_overview', menu_label: 'Clerk Data Entry', route_path: '/dashboard/clerk', sort_order: 10, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_attendance', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/clerk/attendance', sort_order: 20, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/clerk/attendance-biometric', sort_order: 30, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_assessment', menu_label: 'Assessment & Marks Entry', route_path: '/dashboard/clerk/assessment', sort_order: 40, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_placement', menu_label: 'Placement Drive Assistance', route_path: '/dashboard/clerk/placement', sort_order: 50, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/clerk/internships', sort_order: 60, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/clerk/notices', sort_order: 70, applicable_firm_mode: 'BOTH' },
    { role: 'CLERK', menu_key: 'clerk_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/chat', sort_order: 80, applicable_firm_mode: 'BOTH' },

    // WARDEN
    { role: 'WARDEN', menu_key: 'warden_overview', menu_label: 'Hostel Warden Console', route_path: '/dashboard/warden', sort_order: 10, applicable_firm_mode: 'BOTH' },
    { role: 'WARDEN', menu_key: 'warden_student_master', menu_label: 'Resident Student Roster', route_path: '/dashboard/admin/student-master', sort_order: 20, applicable_firm_mode: 'BOTH' },
  ];

  for (const item of catalog) {
    await pool.query(
      `INSERT INTO public.menu_registry (role, menu_key, menu_label, route_path, sort_order, applicable_firm_mode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (role, menu_key) DO UPDATE SET
         menu_label = EXCLUDED.menu_label,
         route_path = EXCLUDED.route_path,
         sort_order = EXCLUDED.sort_order,
         applicable_firm_mode = EXCLUDED.applicable_firm_mode,
         updated_at = NOW()`,
      [item.role, item.menu_key, item.menu_label, item.route_path, item.sort_order, item.applicable_firm_mode]
    );
  }
  console.log(`Upserted ${catalog.length} items into public.menu_registry`);

  // 2. For each firm in public.firms, ensure all catalog permissions exist
  const firms = await pool.query('SELECT id, slug, title FROM public.firms');
  console.log(`Checking permissions for ${firms.rows.length} firms...`);

  for (const f of firms.rows) {
    for (const item of catalog) {
      await pool.query(
        `INSERT INTO public.firm_role_permissions (firm_id, role, menu_key, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())
         ON CONFLICT (firm_id, role, menu_key) DO NOTHING`,
        [f.id, item.role, item.menu_key]
      );
    }
  }

  console.log('All firm permissions synchronized successfully!');
  await pool.end();
}

syncAllFirmPermissions().catch(console.error);
