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
      { role: MenuRole.ADMIN, menu_key: 'admin_admin_master', menu_label: 'Admin Master (Units, Topics, Depts)', route_path: '/dashboard/admin/admin-master', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_student_master', menu_label: 'Student Master', route_path: '/dashboard/admin/student-master', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_staff_master', menu_label: 'Staff Master', route_path: '/dashboard/admin/staff-master', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_staff_admin', menu_label: 'Make Staff as Admin', route_path: '/dashboard/admin/staff-admin', sort_order: 55, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_subject_linker', menu_label: 'Subject Linker', route_path: '/dashboard/admin/subject-linker', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_timetable_design', menu_label: 'Design Timetable', route_path: '/dashboard/admin/timetable-design', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_attendance_master', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/admin/attendance-master', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/admin/attendance-biometric', sort_order: 90, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_attendance_reports', menu_label: 'Attendance Reports / MIS', route_path: '/dashboard/admin/attendance-reports', sort_order: 100, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_assessment', menu_label: 'Assessment & Q-Bank', route_path: '/dashboard/admin/assessment', sort_order: 110, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_marks', menu_label: 'Assessment Marks & Upload', route_path: '/dashboard/admin/assessment-marks', sort_order: 120, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_placement', menu_label: 'Placement Drive', route_path: '/dashboard/admin/placement', sort_order: 130, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.ADMIN, menu_key: 'admin_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/admin/internships', sort_order: 140, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_incubation_cell', menu_label: 'Incubation Cell 🚀', route_path: '/dashboard/admin/incubation-cell', sort_order: 145, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_repository', menu_label: 'Academic Repository 📂', route_path: '/dashboard/admin/repository', sort_order: 148, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/admin/notices/sent', sort_order: 150, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_library', menu_label: 'Digital Library', route_path: '/dashboard/admin/library', sort_order: 160, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/admin/chat', sort_order: 170, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.ADMIN, menu_key: 'admin_reports', menu_label: 'MIS Reports Center', route_path: '/dashboard/admin/reports', sort_order: 180, applicable_firm_mode: ApplicableFirmMode.BOTH },

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
      { role: MenuRole.FACULTY, menu_key: 'faculty_repository', menu_label: 'Academic Repository', route_path: '/dashboard/faculty/repository', sort_order: 120, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_placement', menu_label: 'Placement Drive', route_path: '/dashboard/faculty/placement', sort_order: 130, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.FACULTY, menu_key: 'faculty_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/faculty/internships', sort_order: 140, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/faculty/notices', sort_order: 150, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_library', menu_label: 'Digital Library', route_path: '/dashboard/faculty/library', sort_order: 160, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/faculty/chat', sort_order: 170, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.FACULTY, menu_key: 'faculty_reports', menu_label: 'MIS Reports', route_path: '/dashboard/faculty/reports', sort_order: 180, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ STUDENT ═══════════════════════════
      { role: MenuRole.STUDENT, menu_key: 'student_overview', menu_label: 'Student Dashboard', route_path: '/dashboard/student', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_profile', menu_label: 'Student Profile', route_path: '/dashboard/student/profile', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_timetable', menu_label: 'My Weekly Timetable', route_path: '/dashboard/student/timetable', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_schedule', menu_label: 'Live Class Schedule', route_path: '/dashboard/student/schedule', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_attendance', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/student/attendance', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/student/attendance-biometric', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_assessment', menu_label: 'Assessment & Tests', route_path: '/dashboard/student/assessment', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_marks', menu_label: 'Theory & Practical Marks', route_path: '/dashboard/student/marks', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_lessons', menu_label: 'Lessons & Study Materials', route_path: '/dashboard/student/lessons', sort_order: 90, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_repository', menu_label: 'Academic Repository', route_path: '/dashboard/student/repository', sort_order: 100, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_logbook', menu_label: 'Student Logbook & Records', route_path: '/dashboard/student/logbook', sort_order: 110, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_placement', menu_label: 'Placement Drive Portal', route_path: '/dashboard/student/placement', sort_order: 120, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.STUDENT, menu_key: 'student_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/student/internships', sort_order: 130, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/student/notices', sort_order: 140, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_library', menu_label: 'Digital Library Access', route_path: '/dashboard/student/library', sort_order: 150, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_reports_theory_result', menu_label: 'Result Card / Theory MIS', route_path: '/dashboard/student/reports/theory-result', sort_order: 160, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.STUDENT, menu_key: 'student_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/student/chat', sort_order: 170, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ CLERK ═══════════════════════════
      { role: MenuRole.CLERK, menu_key: 'clerk_overview', menu_label: 'Clerk Data Entry', route_path: '/dashboard/clerk', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_attendance', menu_label: 'Attendance Portal Sync', route_path: '/dashboard/clerk/attendance', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_biometric', menu_label: 'Attendance — Bio-Metric/CCTV', route_path: '/dashboard/clerk/attendance-biometric', sort_order: 30, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_assessment', menu_label: 'Assessment & Marks Entry', route_path: '/dashboard/clerk/assessment', sort_order: 40, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_placement', menu_label: 'Placement Drive Assistance', route_path: '/dashboard/clerk/placement', sort_order: 50, applicable_firm_mode: ApplicableFirmMode.NONMED },
      { role: MenuRole.CLERK, menu_key: 'clerk_internships', menu_label: 'Internships & Certifications', route_path: '/dashboard/clerk/internships', sort_order: 60, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_notices', menu_label: 'Notices & Circulars', route_path: '/dashboard/clerk/notices', sort_order: 70, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.CLERK, menu_key: 'clerk_chat', menu_label: 'Batch & Dept Chat', route_path: '/dashboard/chat', sort_order: 80, applicable_firm_mode: ApplicableFirmMode.BOTH },

      // ═══════════════════════════ WARDEN ═══════════════════════════
      { role: MenuRole.WARDEN, menu_key: 'warden_overview', menu_label: 'Hostel Warden Console', route_path: '/dashboard/warden', sort_order: 10, applicable_firm_mode: ApplicableFirmMode.BOTH },
      { role: MenuRole.WARDEN, menu_key: 'warden_student_master', menu_label: 'Resident Student Roster', route_path: '/dashboard/admin/student-master', sort_order: 20, applicable_firm_mode: ApplicableFirmMode.BOTH },
    ];
  }

  /**
   * Automatically synchronizes all scanned & master catalog menus into public.menu_registry
   */
  async autoSyncMenuRegistry() {
    const builtinItems = this.getBuiltinMasterCatalog();
    const scannedItems = this.scanFrontendDashboard();

    const merged = new Map<string, MenuManifestItemDto>();
    for (const item of builtinItems) {
      merged.set(`${item.role}__${item.menu_key}`, item);
    }
    for (const item of scannedItems) {
      merged.set(`${item.role}__${item.menu_key}`, item);
    }

    const itemsToUpsert = Array.from(merged.values());
    await this.seedManifest(itemsToUpsert);
  }

  async getRegistry(role?: MenuRole, firmMode?: ApplicableFirmMode | string) {
    // Ensure fresh synchronization
    await this.autoSyncMenuRegistry().catch(() => {});

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

    this.logger.log(`Upserted ${count} menu items into menu_registry`);
    return { success: true, count };
  }

  async seedFromFile(filePath?: string) {
    const defaultPath = path.resolve(process.cwd(), '..', 'menu-manifest.json');
    const targetPath = filePath || defaultPath;

    if (!fs.existsSync(targetPath)) {
      await this.autoSyncMenuRegistry();
      return { success: true, message: 'Synchronized menus from auto-scanner and master catalog.' };
    }

    const content = fs.readFileSync(targetPath, 'utf-8');
    const items: MenuManifestItemDto[] = JSON.parse(content);
    return await this.seedManifest(items);
  }
}

