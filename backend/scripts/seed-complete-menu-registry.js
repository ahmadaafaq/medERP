const { Client } = require('pg');

const ALL_MENUS = [
  // ─── STUDENT ROLE ────────────────────────────────────────────────────────
  { role: 'STUDENT', menu_key: 'student_overview', menu_label: 'Dashboard Home', route_path: '/dashboard/student', sort_order: 1, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_attendance', menu_label: 'Subject Attendance', route_path: '/dashboard/student/attendance', sort_order: 2, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_biometric', menu_label: 'Biometric Attendance', route_path: '/dashboard/student/attendance-biometric', sort_order: 3, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_timetable', menu_label: 'Class Timetable', route_path: '/dashboard/student/timetable', sort_order: 4, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_lessons', menu_label: 'Lesson Plan & Units', route_path: '/dashboard/student/lessons', sort_order: 5, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_logbook', menu_label: 'Clinical Logbook', route_path: '/dashboard/student/logbook', sort_order: 6, applicable_firm_mode: 'MED' },
  { role: 'STUDENT', menu_key: 'student_marks', menu_label: 'Marks & Internal Assessment', route_path: '/dashboard/student/marks', sort_order: 7, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_assessment', menu_label: 'Online Assessment & Tests', route_path: '/dashboard/student/assessment', sort_order: 8, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_library', menu_label: 'Digital Library & Books', route_path: '/dashboard/student/library', sort_order: 9, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_placement', menu_label: 'Training & Placements', route_path: '/dashboard/student/placement', sort_order: 10, applicable_firm_mode: 'NONMED' },
  { role: 'STUDENT', menu_key: 'student_repository', menu_label: 'Study Materials Repository', route_path: '/dashboard/student/repository', sort_order: 11, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_chat', menu_label: 'Campus Messaging / Chat', route_path: '/dashboard/student/chat', sort_order: 12, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_notices', menu_label: 'Notice Board & Circulars', route_path: '/dashboard/student/notices', sort_order: 13, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_reports', menu_label: 'Student Performance Reports', route_path: '/dashboard/student/reports', sort_order: 14, applicable_firm_mode: 'BOTH' },
  { role: 'STUDENT', menu_key: 'student_profile', menu_label: 'My Profile & Details', route_path: '/dashboard/student/profile', sort_order: 15, applicable_firm_mode: 'BOTH' },

  // ─── FACULTY ROLE ────────────────────────────────────────────────────────
  { role: 'FACULTY', menu_key: 'faculty_overview', menu_label: 'Faculty Overview', route_path: '/dashboard/faculty', sort_order: 1, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_students', menu_label: 'Student Directory & Roster', route_path: '/dashboard/faculty/students', sort_order: 2, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_attendance', menu_label: 'Mark Daily Attendance', route_path: '/dashboard/faculty/attendance', sort_order: 3, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_biometric', menu_label: 'My Biometric Punches', route_path: '/dashboard/faculty/attendance-biometric', sort_order: 4, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_schedule', menu_label: 'Teaching Schedule', route_path: '/dashboard/faculty/schedule', sort_order: 5, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_lessons', menu_label: 'Lesson Planner & Syllabus', route_path: '/dashboard/faculty/lessons', sort_order: 6, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_logbook', menu_label: 'Clinical Logbook Verification', route_path: '/dashboard/faculty/logbook', sort_order: 7, applicable_firm_mode: 'MED' },
  { role: 'FACULTY', menu_key: 'faculty_marks', menu_label: 'Marks Entry & Rubrics', route_path: '/dashboard/faculty/marks', sort_order: 8, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_assessment', menu_label: 'Create / Grade Assessment', route_path: '/dashboard/faculty/assessment', sort_order: 9, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_dept', menu_label: 'Department Faculty', route_path: '/dashboard/faculty/department-faculty', sort_order: 10, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_library', menu_label: 'Digital Library Search', route_path: '/dashboard/faculty/library', sort_order: 11, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_repository', menu_label: 'Upload Course Materials', route_path: '/dashboard/faculty/repository', sort_order: 12, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_chat', menu_label: 'Department / Student Chat', route_path: '/dashboard/faculty/chat', sort_order: 13, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_notices', menu_label: 'Publish / View Notices', route_path: '/dashboard/faculty/notices', sort_order: 14, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_reports', menu_label: 'Academic Analytics & Reports', route_path: '/dashboard/faculty/reports', sort_order: 15, applicable_firm_mode: 'BOTH' },
  { role: 'FACULTY', menu_key: 'faculty_profile', menu_label: 'Faculty Profile & CV', route_path: '/dashboard/faculty/profile', sort_order: 16, applicable_firm_mode: 'BOTH' },

  // ─── ADMIN ROLE ──────────────────────────────────────────────────────────
  { role: 'ADMIN', menu_key: 'admin_overview', menu_label: 'College KPIs & Overview', route_path: '/dashboard/admin', sort_order: 1, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_college_master', menu_label: 'College Master', route_path: '/dashboard/admin/college-master', sort_order: 2, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_admin_master', menu_label: 'Admin Master (Depts & Courses)', route_path: '/dashboard/admin/admin-master', sort_order: 3, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_student_master', menu_label: 'Student Master & Admissions', route_path: '/dashboard/admin/student-master', sort_order: 4, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_staff_master', menu_label: 'Staff / Faculty Master', route_path: '/dashboard/admin/staff-master', sort_order: 5, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_subject_linker', menu_label: 'Subject & Competency Linker', route_path: '/dashboard/admin/subject-linker', sort_order: 6, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_timetable_design', menu_label: 'Design Timetable Matrix', route_path: '/dashboard/admin/timetable-design', sort_order: 7, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_attendance_master', menu_label: 'Attendance Master (Sessions)', route_path: '/dashboard/admin/attendance-master', sort_order: 8, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_biometric', menu_label: 'Biometric Device Logs', route_path: '/dashboard/admin/attendance-biometric', sort_order: 9, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_attendance_reports', menu_label: 'Attendance Audit Reports', route_path: '/dashboard/admin/attendance-reports', sort_order: 10, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_assessment', menu_label: 'Assessment Master & Setup', route_path: '/dashboard/admin/assessment', sort_order: 11, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_assessment_marks', menu_label: 'Assessment Results & Ranks', route_path: '/dashboard/admin/assessment-marks', sort_order: 12, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_placement', menu_label: 'Placement Master', route_path: '/dashboard/admin/placement', sort_order: 13, applicable_firm_mode: 'NONMED' },
  { role: 'ADMIN', menu_key: 'admin_library', menu_label: 'Library Management', route_path: '/dashboard/admin/library', sort_order: 14, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_notices', menu_label: 'Notices Broadcast System', route_path: '/dashboard/admin/notices', sort_order: 15, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_chat', menu_label: 'Campus Chat Moderation', route_path: '/dashboard/admin/chat', sort_order: 16, applicable_firm_mode: 'BOTH' },
  { role: 'ADMIN', menu_key: 'admin_reports', menu_label: 'Executive Reports & Analytics', route_path: '/dashboard/admin/reports', sort_order: 17, applicable_firm_mode: 'BOTH' },

  // ─── CLERK ROLE ──────────────────────────────────────────────────────────
  { role: 'CLERK', menu_key: 'clerk_overview', menu_label: 'Clerk Operations Hub', route_path: '/dashboard/clerk', sort_order: 1, applicable_firm_mode: 'BOTH' },
  { role: 'CLERK', menu_key: 'clerk_attendance', menu_label: 'Student Attendance Records', route_path: '/dashboard/clerk/attendance', sort_order: 2, applicable_firm_mode: 'BOTH' },
  { role: 'CLERK', menu_key: 'clerk_biometric', menu_label: 'Daily Biometric Logs', route_path: '/dashboard/clerk/attendance-biometric', sort_order: 3, applicable_firm_mode: 'BOTH' },
  { role: 'CLERK', menu_key: 'clerk_assessment', menu_label: 'Assessment Verification', route_path: '/dashboard/clerk/assessment', sort_order: 4, applicable_firm_mode: 'BOTH' },
  { role: 'CLERK', menu_key: 'clerk_notices', menu_label: 'Administrative Circulars', route_path: '/dashboard/clerk/notices', sort_order: 5, applicable_firm_mode: 'BOTH' },

  // ─── WARDEN ROLE ─────────────────────────────────────────────────────────
  { role: 'WARDEN', menu_key: 'warden_overview', menu_label: 'Hostel & Room Allocation', route_path: '/dashboard/warden', sort_order: 1, applicable_firm_mode: 'BOTH' },

  // ─── SUPERADMIN ROLE ─────────────────────────────────────────────────────
  { role: 'SUPERADMIN', menu_key: 'superadmin_overview', menu_label: 'SuperAdmin SaaS Overview', route_path: '/dashboard/owner', sort_order: 1, applicable_firm_mode: 'BOTH' },
  { role: 'SUPERADMIN', menu_key: 'superadmin_firms', menu_label: 'Firm Directory & Licenses', route_path: '/dashboard/superadmin/firms', sort_order: 2, applicable_firm_mode: 'BOTH' },
  { role: 'SUPERADMIN', menu_key: 'superadmin_register', menu_label: 'Register New Firm', route_path: '/dashboard/superadmin/firms/register', sort_order: 3, applicable_firm_mode: 'BOTH' },
];

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'unicampus',
    password: 'unicampus_secret',
    database: 'unicampus_erp',
  });

  await client.connect();

  console.log(`Seeding ${ALL_MENUS.length} menu items into public.menu_registry...`);

  for (const m of ALL_MENUS) {
    await client.query(`
      INSERT INTO public.menu_registry (
        role, menu_key, menu_label, route_path, parent_menu_key, sort_order, applicable_firm_mode, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (role, menu_key) DO UPDATE SET
        menu_label = EXCLUDED.menu_label,
        route_path = EXCLUDED.route_path,
        sort_order = EXCLUDED.sort_order,
        applicable_firm_mode = EXCLUDED.applicable_firm_mode,
        updated_at = NOW()
    `, [
      m.role,
      m.menu_key,
      m.menu_label,
      m.route_path,
      m.parent_menu_key || null,
      m.sort_order,
      m.applicable_firm_mode,
    ]);
  }

  const counts = await client.query('SELECT role, count(*) as count FROM public.menu_registry GROUP BY role ORDER BY count DESC');
  console.log('\n--- MENU REGISTRY SUMMARY ---');
  console.table(counts.rows);

  await client.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
