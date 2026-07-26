/**
 * UserRole enum — RBAC hierarchy for UniCampus ERP
 *
 * Hierarchy (highest → lowest privilege):
 * SUPER_ADMIN > COLLEGE_ADMIN > HOD > FACULTY > CLERK > STUDENT > STAFF > WARDEN
 *
 * CLERK: Data entry operator — feeds attendance records and examination
 *        results into the ERP. Can mark/import attendance and enter marks
 *        but cannot approve logbooks, leaves, or access financial data.
 */
export enum UserRole {
  SUPER_ADMIN   = 'SUPER_ADMIN',    // Platform-level: manages all tenants
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',  // College-level: full college management
  ADMIN         = 'COLLEGE_ADMIN',  // Alias for COLLEGE_ADMIN
  HOD           = 'HOD',            // Department head: dept management + approvals
  FACULTY       = 'FACULTY',        // Teaching staff: attendance, logbook verify
  CLERK         = 'CLERK',          // Data entry: attendance import, marks entry
  STUDENT       = 'STUDENT',        // Self-service: own academic data
  STAFF         = 'STAFF',          // Non-teaching staff
  WARDEN        = 'WARDEN',         // Hostel warden: hostel management
}

/**
 * Role permission groups for quick guard checks.
 * Use these in @Roles() decorator instead of repeating roles everywhere.
 */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
];

export const ACADEMIC_STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.FACULTY,
];

export const DATA_ENTRY_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.FACULTY,
  UserRole.CLERK,
];

export const ALL_STAFF_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.COLLEGE_ADMIN,
  UserRole.HOD,
  UserRole.FACULTY,
  UserRole.CLERK,
  UserRole.STAFF,
  UserRole.WARDEN,
];
