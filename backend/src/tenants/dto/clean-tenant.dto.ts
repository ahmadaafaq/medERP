import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type TenantCleanModule =
  | 'ALL'
  | 'STUDENTS'
  | 'FACULTY'
  | 'COLLEGE_MASTER'
  | 'ADMIN_MASTER'
  | 'INCUBATION'
  | 'PROJECTS'
  | 'TIMETABLE'
  | 'LOGBOOK'
  | 'EXAMS_PAPERS'
  | 'REPOSITORIES'
  | 'CHATS_NOTICES'
  | 'ATTENDANCE';

export class CleanTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantSlug: string;

  @IsArray()
  @IsNotEmpty()
  modules: string[];

  @IsBoolean()
  @IsOptional()
  preserveAdminAccount?: boolean = true;
}
