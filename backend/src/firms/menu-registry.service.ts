import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { ApplicableFirmMode, MenuRole } from '../database/entities/menu-registry.entity';
import { MenuManifestItemDto } from './dto/menu-registry.dto';

@Injectable()
export class MenuRegistryService implements OnModuleInit {
  private readonly logger = new Logger(MenuRegistryService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.autoSyncMenuRegistry();
    } catch (err: any) {
      this.logger.error(`Error auto-syncing menu registry on startup: ${err.message}`);
    }
  }

  /**
   * Titleize a slug or folder name
   */
  private titleize(slug: string): string {
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bKpis\b/i, 'KPIs')
      .replace(/\bMis\b/i, 'MIS')
      .replace(/\bOtp\b/i, 'OTP')
      .replace(/\bErp\b/i, 'ERP')
      .replace(/\bQ Bank\b/i, 'Q-Bank')
      .replace(/\bCctv\b/i, 'CCTV');
  }

  /**
   * Dynamic scanner for frontend dashboard directory
   */
  private scanFrontendDashboard(): MenuManifestItemDto[] {
    const items: MenuManifestItemDto[] = [];
    const possiblePaths = [
      path.resolve(process.cwd(), '..', 'frontend', 'app', 'dashboard'),
      path.resolve(process.cwd(), 'frontend', 'app', 'dashboard'),
      path.resolve(__dirname, '..', '..', '..', '..', 'frontend', 'app', 'dashboard'),
    ];

    let dashboardDir = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        dashboardDir = p;
        break;
      }
    }

    if (!dashboardDir) {
      return items;
    }

    const roleMap: Record<string, MenuRole> = {
      admin: MenuRole.ADMIN,
      faculty: MenuRole.FACULTY,
      hod: MenuRole.HOD,
      student: MenuRole.STUDENT,
      clerk: MenuRole.CLERK,
      warden: MenuRole.WARDEN,
      superadmin: MenuRole.SUPERADMIN,
    };

    for (const [folderName, roleEnum] of Object.entries(roleMap)) {
      const fullRolePath = path.join(dashboardDir, folderName);
      if (!fs.existsSync(fullRolePath)) continue;

      // Root role page
      if (fs.existsSync(path.join(fullRolePath, 'page.tsx'))) {
        items.push({
          role: roleEnum,
          menu_key: `${folderName}_overview`,
          menu_label: `${this.titleize(folderName)} Dashboard`,
          route_path: `/dashboard/${folderName}`,
          parent_menu_key: undefined,
          sort_order: 10,
          applicable_firm_mode: ApplicableFirmMode.BOTH,
        });
      }

      let sortOrder = 20;

      const walk = (currentPath: string, parentKey: string | null) => {
        try {
          const entries = fs.readdirSync(currentPath, { withFileTypes: true });
          for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name.startsWith('[')) continue;

            const subPath = path.join(currentPath, entry.name);
            const relativeToRole = path.relative(fullRolePath, subPath).replace(/\\/g, '/');
            const pageFile = path.join(subPath, 'page.tsx');

            if (fs.existsSync(pageFile)) {
              const parts = relativeToRole.split('/');
              const folderLeaf = parts[parts.length - 1];
              const normalizedKey = `${folderName}_${relativeToRole.replace(/[\/\-\.]+/g, '_')}`;
              const routePath = `/dashboard/${folderName}/${relativeToRole}`;

              let applicableMode: ApplicableFirmMode = ApplicableFirmMode.BOTH;
              const lower = relativeToRole.toLowerCase();
              if (lower.includes('clinical') || lower.includes('patient') || lower.includes('opd') || lower.includes('hospital')) {
                applicableMode = ApplicableFirmMode.MED;
              } else if (lower.includes('placement') || lower.includes('cad') || lower.includes('workshop')) {
                applicableMode = ApplicableFirmMode.NONMED;
              }

              items.push({
                role: roleEnum,
                menu_key: normalizedKey,
                menu_label: this.titleize(folderLeaf),
                route_path: routePath,
                parent_menu_key: parentKey || undefined,
                sort_order: sortOrder,
                applicable_firm_mode: applicableMode,
              });

              sortOrder += 10;
              walk(subPath, normalizedKey);
            } else {
              walk(subPath, parentKey);
            }
          }
        } catch {}
      };

      walk(fullRolePath, null);
    }

    return items;
  }

  /**
   * Built-in Master Catalog of all ERP menus for high reliability
   */
  private getBuiltinMasterCatalog(): MenuManifestItemDto[] {
    return [
      // ═══════════════════════════ ADMIN ═══════════════════════════
      { role: MenuRole.ADMIN, menu_key: 'admin_overview', menu_label: 'College KPIs', route_path: '/dashboard/admin', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master', menu_label: 'College Master', route_path: '/dashboard/admin/college-master', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_colleges', menu_label: '1. College', route_path: '/dashboard/admin/college-master#colleges', parent_menu_key: 'admin_college_master', sort_order: 21, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_courses', menu_label: '2. Courses', route_path: '/dashboard/admin/college-master#courses', parent_menu_key: 'admin_college_master', sort_order: 22, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_professionals', menu_label: '3. Academic Year', route_path: '/dashboard/admin/college-master#professionals', parent_menu_key: 'admin_college_master', sort_order: 23, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_batches', menu_label: '4. Batch', route_path: '/dashboard/admin/college-master#batches', parent_menu_key: 'admin_college_master', sort_order: 24, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_branches', menu_label: '5. Departments & Specialties', route_path: '/dashboard/admin/college-master#branches', parent_menu_key: 'admin_college_master', sort_order: 25, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_groups', menu_label: '6. Section Groups', route_path: '/dashboard/admin/college-master#groups', parent_menu_key: 'admin_college_master', sort_order: 26, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_sessions', menu_label: '7. Session', route_path: '/dashboard/admin/college-master#sessions', parent_menu_key: 'admin_college_master', sort_order: 27, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_college_master_residencies', menu_label: '8. Residency Category', route_path: '/dashboard/admin/college-master#residencies', parent_menu_key: 'admin_college_master', sort_order: 28, applicable_firm_mode: ApplicableFirmMode.BOTH },

      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master', menu_label: 'Admin Master (Units, Topics, Depts)', route_path: '/dashboard/admin/admin-master', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_departments', menu_label: '1. Department Master', route_path: '/dashboard/admin/admin-master#departments', parent_menu_key: 'admin_admin_master', sort_order: 31, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_subjects', menu_label: '2. Subject Master', route_path: '/dashboard/admin/admin-master#subjects', parent_menu_key: 'admin_admin_master', sort_order: 32, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_guidelines', menu_label: '3. Guidelines', route_path: '/dashboard/admin/admin-master#guidelines', parent_menu_key: 'admin_admin_master', sort_order: 33, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_offerings', menu_label: '4. Subject Offerings', route_path: '/dashboard/admin/admin-master#offerings', parent_menu_key: 'admin_admin_master', sort_order: 34, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_delivery_types', menu_label: '5. Delivery Types', route_path: '/dashboard/admin/admin-master#delivery-types', parent_menu_key: 'admin_admin_master', sort_order: 35, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_units', menu_label: '6. Unit Master', route_path: '/dashboard/admin/admin-master#units', parent_menu_key: 'admin_admin_master', sort_order: 36, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_topics', menu_label: '7. Topic Master', route_path: '/dashboard/admin/admin-master#topics', parent_menu_key: 'admin_admin_master', sort_order: 37, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master_competencies', menu_label: '8. Sub Topics', route_path: '/dashboard/admin/admin-master#sub-topics', parent_menu_key: 'admin_admin_master', sort_order: 38, applicable_firm_mode: ApplicableFirmMode.BOTH },

      { role: MenuRole.ADMIN, menu_key: 'admin_student_master', menu_label: 'Student Master', route_path: '/dashboard/admin/student-master', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_staff_master', menu_label: 'Staff Master', route_path: '/dashboard/admin/staff-master', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_staff_admin', menu_label: 'Make Staff as Admin', route_path: '/dashboard/admin/staff-admin', sort_order: 55, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_subject_linker', menu_label: 'Subject Linker', route_path: '/dashboard/admin/subject-linker', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_timetable_design', menu_label: 'Design Timetable', route_path: '/dashboard/admin/timetable-design', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_attendance_master', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/admin/attendance-master', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_attendance_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/admin/attendance-biometric', sort_order: 90, applicable_firm_mode: ApplicableFirmMode.BOTH },

      { role: MenuRole.ADMIN, menu_key: 'admin_assessment', menu_label: 'Assessment & Q-Bank', route_path: '/dashboard/admin/assessment', sort_order: 110, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_bank', menu_label: 'Question Bank', route_path: '/dashboard/admin/assessment#bank', parent_menu_key: 'admin_assessment', sort_order: 111, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_design', menu_label: 'Paper Designer', route_path: '/dashboard/admin/assessment#design', parent_menu_key: 'admin_assessment', sort_order: 112, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_publish', menu_label: 'Published Assessments', route_path: '/dashboard/admin/assessment#publish', parent_menu_key: 'admin_assessment', sort_order: 113, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_qp_print', menu_label: 'Question Paper Print Center', route_path: '/dashboard/admin/qp-print', parent_menu_key: 'admin_assessment', sort_order: 115, applicable_firm_mode: ApplicableFirmMode.BOTH },

      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_marks', menu_label: 'Assessment Marks & Upload', route_path: '/dashboard/admin/assessment-marks', sort_order: 120, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_marks_theory', menu_label: 'Theory Evaluation', route_path: '/dashboard/admin/assessment-marks#theory', parent_menu_key: 'admin_assessment_marks', sort_order: 121, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_marks_practical', menu_label: 'Practical Evaluation', route_path: '/dashboard/admin/assessment-marks#practical', parent_menu_key: 'admin_assessment_marks', sort_order: 122, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment_marks_competency', menu_label: 'Competency Scoring', route_path: '/dashboard/admin/assessment-marks#competency', parent_menu_key: 'admin_assessment_marks', sort_order: 123, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_placement', menu_label: 'Placement Drive', route_path: '/dashboard/admin/placement', sort_order: 130, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.ADMIN, menu_key: 'admin_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/admin/internships', sort_order: 140, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_medical_logbook', menu_label: 'Medical Logbook', route_path: '/dashboard/admin/medical-logbook/data-directory', sort_order: 141, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.ADMIN, menu_key: 'admin_medical_logbook_data_directory', menu_label: '1. Data Directory', route_path: '/dashboard/admin/medical-logbook/data-directory', parent_menu_key: 'admin_medical_logbook', sort_order: 142, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.ADMIN, menu_key: 'admin_medical_logbook_ug_logbook', menu_label: '2. UG LogBook', route_path: '/dashboard/admin/medical-logbook/ug-logbook', parent_menu_key: 'admin_medical_logbook', sort_order: 143, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.ADMIN, menu_key: 'admin_medical_logbook_pg_logbook', menu_label: '3. PG LogBook', route_path: '/dashboard/admin/medical-logbook/pg-logbook', parent_menu_key: 'admin_medical_logbook', sort_order: 144, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.ADMIN, menu_key: 'admin_incubation_cell', menu_label: 'Incubation Cell 🚀', route_path: '/dashboard/admin/incubation-cell', sort_order: 145, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_repository', menu_label: 'Academic Repository 📂', route_path: '/dashboard/admin/repository', sort_order: 148, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/admin/notices/sent', sort_order: 150, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_library', menu_label: 'Digital Library', route_path: '/dashboard/admin/library', sort_order: 160, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/admin/chat', sort_order: 170, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_reports', menu_label: 'MIS Reports Center', route_path: '/dashboard/admin/reports', sort_order: 180, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_reports_attendance', menu_label: 'Attendance Report', route_path: '/dashboard/admin/attendance-reports', parent_menu_key: 'admin_reports', sort_order: 181, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_reports_theory_result', menu_label: 'Theory Result', route_path: '/dashboard/admin/reports/theory-result', parent_menu_key: 'admin_reports', sort_order: 182, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_reports_logbook', menu_label: 'Academic Portfolio (Logbook)', route_path: '/dashboard/admin/reports/logbook', parent_menu_key: 'admin_reports', sort_order: 183, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ FACULTY ═══════════════════════════
      { role: MenuRole.FACULTY, menu_key: 'faculty_overview', menu_label: 'Teaching Dashboard', route_path: '/dashboard/faculty', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_profile', menu_label: 'Faculty Profile', route_path: '/dashboard/faculty/profile', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_students', menu_label: 'Student Info & Roster', route_path: '/dashboard/faculty/students', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_dept', menu_label: 'Department Faculty', route_path: '/dashboard/faculty/department-faculty', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_schedule', menu_label: 'Schedule & Timetable', route_path: '/dashboard/faculty/schedule', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_attendance', menu_label: 'Daily Attendance Sync', route_path: '/dashboard/faculty/attendance', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/faculty/attendance-biometric', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_assessment', menu_label: 'Assessment & Q-Bank', route_path: '/dashboard/faculty/assessment', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_marks', menu_label: 'Marks Entry & Grading', route_path: '/dashboard/faculty/marks', sort_order: 90, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_lessons', menu_label: 'Lesson Uploads & Notes', route_path: '/dashboard/faculty/lessons', sort_order: 100, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_logbook', menu_label: 'Faculty Activity Logbook', route_path: '/dashboard/faculty/logbook', sort_order: 110, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_medical_logbook', menu_label: 'Medical Logbook', route_path: '/dashboard/faculty/medical-logbook/data-directory', sort_order: 111, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.FACULTY, menu_key: 'faculty_medical_logbook_data_directory', menu_label: '1. Data Directory', route_path: '/dashboard/faculty/medical-logbook/data-directory', parent_menu_key: 'faculty_medical_logbook', sort_order: 112, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.FACULTY, menu_key: 'faculty_medical_logbook_ug_logbook', menu_label: '2. UG LogBook', route_path: '/dashboard/faculty/medical-logbook/ug-logbook', parent_menu_key: 'faculty_medical_logbook', sort_order: 113, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.FACULTY, menu_key: 'faculty_medical_logbook_pg_logbook', menu_label: '3. PG LogBook', route_path: '/dashboard/faculty/medical-logbook/pg-logbook', parent_menu_key: 'faculty_medical_logbook', sort_order: 114, applicable_firm_mode: ApplicableFirmMode.MED },
      { role: MenuRole.FACULTY, menu_key: 'faculty_repository', menu_label: 'Academic Repository', route_path: '/dashboard/faculty/repository', sort_order: 120, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_placement', menu_label: 'Placement Drive', route_path: '/dashboard/faculty/placement', sort_order: 130, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.FACULTY, menu_key: 'faculty_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/faculty/internships', sort_order: 140, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/faculty/notices', sort_order: 150, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_library', menu_label: 'Digital Library', route_path: '/dashboard/faculty/library', sort_order: 160, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/faculty/chat', sort_order: 170, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_reports', menu_label: 'MIS Reports', route_path: '/dashboard/faculty/reports', sort_order: 180, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_reports_attendance', menu_label: 'Attendance Report', route_path: '/dashboard/faculty/reports/attendance', parent_menu_key: 'faculty_reports', sort_order: 181, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_reports_theory_result', menu_label: 'Theory Result', route_path: '/dashboard/faculty/reports/theory-result', parent_menu_key: 'faculty_reports', sort_order: 182, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_reports_logbook', menu_label: 'Academic Portfolio (Logbook)', route_path: '/dashboard/faculty/reports/logbook', sort_order: 183, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ HOD ═══════════════════════════
      { role: MenuRole.HOD, menu_key: 'hod_overview', menu_label: 'HOD Department Console', route_path: '/dashboard/hod', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_qp_approvals', menu_label: 'Question Paper Approvals & Publishing', route_path: '/dashboard/hod/qp-approvals', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_timetable_approvals', menu_label: 'Timetable Approvals', route_path: '/dashboard/hod/timetable-approvals', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_question_bank', menu_label: 'Department Question Bank', route_path: '/dashboard/hod/question-bank', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_chat', menu_label: 'Department Faculty & Staff Chat', route_path: '/dashboard/hod/chat', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_faculty_schedule', menu_label: 'Faculty Schedule & Timetable', route_path: '/dashboard/faculty/schedule', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_faculty_attendance', menu_label: 'Daily Attendance Sync', route_path: '/dashboard/faculty/attendance', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_faculty_assessment', menu_label: 'Assessment & Grading', route_path: '/dashboard/faculty/assessment', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_faculty_marks', menu_label: 'Marks Entry & Grading', route_path: '/dashboard/faculty/marks', sort_order: 90, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.HOD, menu_key: 'hod_faculty_reports', menu_label: 'Department MIS Reports', route_path: '/dashboard/faculty/reports', sort_order: 100, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ STUDENT ═══════════════════════════
      { role: MenuRole.STUDENT, menu_key: 'student_overview', menu_label: 'Student Dashboard', route_path: '/dashboard/student', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_profile', menu_label: 'Student Profile', route_path: '/dashboard/student/profile', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_timetable', menu_label: 'My Weekly Timetable', route_path: '/dashboard/student/timetable', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_schedule', menu_label: 'Live Class Schedule', route_path: '/dashboard/student/schedule', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_attendance', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/student/attendance', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_attendance_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/student/attendance-biometric', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_assessment', menu_label: 'Assessment & Tests', route_path: '/dashboard/student/assessment', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_marks', menu_label: 'Theory & Practical Marks', route_path: '/dashboard/student/marks', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_lessons', menu_label: 'Lessons & Study Materials', route_path: '/dashboard/student/lessons', sort_order: 90, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_repository', menu_label: 'Academic Repository', route_path: '/dashboard/student/repository', sort_order: 100, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_logbook', menu_label: 'Academic Portfolio & Submissions', route_path: '/dashboard/student/logbook', sort_order: 110, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_placement', menu_label: 'Placement Drive Portal', route_path: '/dashboard/student/placement', sort_order: 120, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.STUDENT, menu_key: 'student_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/student/internships', sort_order: 130, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/student/notices', sort_order: 140, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_library', menu_label: 'Digital Library Access', route_path: '/dashboard/student/library', sort_order: 150, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_reports_theory_result', menu_label: 'Result Card / Theory MIS', route_path: '/dashboard/student/reports/theory-result', sort_order: 160, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/student/chat', sort_order: 170, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ CLERK ═══════════════════════════
      { role: MenuRole.CLERK, menu_key: 'clerk_overview', menu_label: 'Clerk Data Entry', route_path: '/dashboard/clerk', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_staff_master', menu_label: 'Staff & Faculty Master', route_path: '/dashboard/admin/staff-master', sort_order: 15, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_student_master', menu_label: 'Student Roster Master', route_path: '/dashboard/admin/student-master', sort_order: 18, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_attendance', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/clerk/attendance', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/clerk/attendance-biometric', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_assessment', menu_label: 'Assessment & Marks Entry', route_path: '/dashboard/clerk/assessment', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_qp_designer', menu_label: 'Question Paper Designer', route_path: '/dashboard/clerk/qp-designer', sort_order: 42, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_timetable_designer', menu_label: 'Timetable Designer', route_path: '/dashboard/clerk/timetable-designer', sort_order: 45, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_placement', menu_label: 'Placement Drive Assistance', route_path: '/dashboard/clerk/placement', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.CLERK, menu_key: 'clerk_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/clerk/internships', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_library', menu_label: 'Digital Library', route_path: '/dashboard/clerk/library', sort_order: 65, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/clerk/notices', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/chat', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ WARDEN ═══════════════════════════
      { role: MenuRole.WARDEN, menu_key: 'warden_overview', menu_label: 'Hostel Warden Console', route_path: '/dashboard/warden', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.WARDEN, menu_key: 'warden_mess_menu', menu_label: 'Hostel Mess & Food Menu', route_path: '/dashboard/warden#mess-menu', sort_order: 15, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.WARDEN, menu_key: 'warden_student_master', menu_label: 'Resident Student Roster', route_path: '/dashboard/admin/student-master', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.WARDEN, menu_key: 'warden_chat', menu_label: 'Hostel & Staff Chat', route_path: '/dashboard/chat', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
    ];
  }

  /**
   * Automatically synchronizes all scanned & master catalog menus into public.menu_registry
   */
  /**
   * Automatically synchronizes all scanned & master catalog menus into public.menu_registry
   */
  async autoSyncMenuRegistry() {
    const builtinItems = this.getBuiltinMasterCatalog();
    const scannedItems = this.scanFrontendDashboard();

    const normalizeRoute = (role: MenuRole, route: string): string => {
      let r = (route || '').toLowerCase().trim();
      if (role === MenuRole.ADMIN && r === '/dashboard/admin/reports/attendance') {
        r = '/dashboard/admin/attendance-reports';
      }
      return r;
    };

    // Deduplicate by role and route_path so each page route appears EXACTLY once per role
    const routeMap = new Map<string, MenuManifestItemDto>();

    // 1. Register codebase routes discovered from filesystem
    for (const item of scannedItems) {
      if (item.menu_key === 'admin_attendance_reports') item.menu_key = 'admin_reports_attendance';
      if (item.menu_key === 'student_biometric') item.menu_key = 'student_attendance_biometric';
      const cleanRoute = normalizeRoute(item.role, item.route_path || '');
      item.route_path = cleanRoute;
      const routeKey = `${item.role}__${cleanRoute}`;
      routeMap.set(routeKey, item);
    }

    // 2. Merge and enrich with master catalog metadata
    for (const item of builtinItems) {
      const cleanRoute = normalizeRoute(item.role, item.route_path || '');
      item.route_path = cleanRoute;
      const routeKey = `${item.role}__${cleanRoute}`;
      if (routeMap.has(routeKey)) {
        const existing = routeMap.get(routeKey)!;
        routeMap.set(routeKey, {
          ...existing,
          menu_key: item.menu_key,
          menu_label: item.menu_label || existing.menu_label,
          parent_menu_key: item.parent_menu_key || existing.parent_menu_key,
          sort_order: item.sort_order !== undefined ? item.sort_order : existing.sort_order,
          applicable_firm_mode: item.applicable_firm_mode || existing.applicable_firm_mode,
        });
      } else {
        routeMap.set(routeKey, item);
      }
    }

    const itemsToUpsert = Array.from(routeMap.values());
    await this.seedManifest(itemsToUpsert);
  }

  async getRegistry(role?: MenuRole, firmMode?: ApplicableFirmMode | string) {
    let query = `SELECT * FROM public.menu_registry`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (firmMode) {
      const mode = firmMode.toUpperCase();
      if (mode === 'MED' || mode === 'NONMED') {
        params.push(mode);
        conditions.push(`(applicable_firm_mode = $${params.length} OR applicable_firm_mode = 'BOTH')`);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY role ASC, sort_order ASC, menu_label ASC`;

    return await this.dataSource.query(query, params);
  }

  async seedManifest(items: MenuManifestItemDto[]) {
    let count = 0;

    await this.dataSource.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_menu_registry_role_key ON public.menu_registry (role, menu_key);
    `).catch(() => {});

    // Delete any legacy dot-syntax duplicate entries and duplicate aliases
    await this.dataSource.query(`DELETE FROM public.menu_registry WHERE menu_key LIKE '%.%'`).catch(() => {});
    await this.dataSource.query(`DELETE FROM public.menu_registry WHERE role = 'ADMIN' AND menu_key = 'admin_attendance_reports'`).catch(() => {});
    await this.dataSource.query(`DELETE FROM public.menu_registry WHERE role = 'STUDENT' AND menu_key = 'student_biometric'`).catch(() => {});

    for (const item of items) {
      const applicableMode = item.applicable_firm_mode || 'BOTH';

      await this.dataSource.query(
        `INSERT INTO public.menu_registry (
          role, menu_key, menu_label, route_path, parent_menu_key, sort_order, applicable_firm_mode, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (role, menu_key) DO UPDATE SET
          menu_label = EXCLUDED.menu_label,
          route_path = EXCLUDED.route_path,
          parent_menu_key = EXCLUDED.parent_menu_key,
          sort_order = EXCLUDED.sort_order,
          applicable_firm_mode = EXCLUDED.applicable_firm_mode,
          updated_at = NOW()`,
        [
          item.role,
          item.menu_key,
          item.menu_label,
          item.route_path,
          item.parent_menu_key || null,
          item.sort_order ?? 0,
          applicableMode,
        ],
      );
      count++;
    }

    // Clean up any remaining duplicates for the same role and route_path
    await this.dataSource.query(`
      DELETE FROM public.menu_registry a
      USING public.menu_registry b
      WHERE a.id < b.id
        AND a.role = b.role
        AND LOWER(TRIM(a.route_path)) = LOWER(TRIM(b.route_path));
    `).catch(() => {});

    this.logger.log(`Upserted and deduplicated ${count} menu items in menu_registry`);
    return { success: true, count };
  }

  async seedFromFile(filePath?: string) {
    await this.autoSyncMenuRegistry();
    return { success: true, message: 'Synchronized unique menus dynamically from codebase and master catalog.' };
  }
}

