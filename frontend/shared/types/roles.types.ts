export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',
  HOD = 'HOD',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  WARDEN = 'WARDEN',
}

export type RoleType = keyof typeof UserRole;
