import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NoticePriority {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  URGENT = 'urgent',
}

export enum NoticeCategory {
  ANNOUNCEMENT = 'announcement',
  DEADLINE = 'deadline',
  EVENT = 'event',
  EXAM = 'exam',
  GENERAL = 'general',
}

export enum TargetType {
  ALL = 'all',
  ROLE = 'role',
  COLLEGE = 'college',
  COURSE = 'course',
  BRANCH = 'branch',
  BATCH_YEAR = 'batch_year',
  USER = 'user',
}

export class NoticeTargetRuleDto {
  @ApiProperty({ enum: TargetType, example: TargetType.ROLE })
  @IsEnum(TargetType)
  target_type: TargetType;

  @ApiProperty({ example: 'STUDENT', description: 'Target value e.g. STUDENT, MBBS, 2023-MBBS, all, user_id' })
  @IsString()
  @IsNotEmpty()
  target_value: string;

  @ApiPropertyOptional({ example: 'All Students' })
  @IsOptional()
  @IsString()
  target_label?: string;
}

export class NoticeAttachmentDto {
  @ApiProperty({ example: 'Exam_Schedule_2026.pdf' })
  @IsString()
  @IsNotEmpty()
  file_name: string;

  @ApiProperty({ example: 'pdf', enum: ['pdf', 'xlsx', 'docx', 'image', 'other'] })
  @IsString()
  @IsNotEmpty()
  file_type: string;

  @ApiProperty({ example: '/uploads/notices/1723456789-schedule.pdf' })
  @IsString()
  @IsNotEmpty()
  file_url: string;

  @ApiPropertyOptional({ example: 450, description: 'File size in KB' })
  @IsOptional()
  @IsNumber()
  file_size_kb?: number;
}

export class CreateNoticeDto {
  @ApiProperty({ example: 'Internal Assessment Notice', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'All MBBS 2023 batch students are hereby informed...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ enum: NoticePriority, default: NoticePriority.NORMAL })
  @IsOptional()
  @IsEnum(NoticePriority)
  priority?: NoticePriority;

  @ApiPropertyOptional({ enum: NoticeCategory, default: NoticeCategory.ANNOUNCEMENT })
  @IsOptional()
  @IsEnum(NoticeCategory)
  category?: NoticeCategory;

  @ApiPropertyOptional({ example: 'SRMS-IMS' })
  @IsOptional()
  @IsString()
  college_id?: string;

  @ApiPropertyOptional({ example: '2026-08-20T10:00:00Z' })
  @IsOptional()
  @IsString()
  scheduled_at?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59Z' })
  @IsOptional()
  @IsString()
  expires_at?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requires_acknowledgement?: boolean;

  @ApiProperty({ type: [NoticeTargetRuleDto], description: 'Target audience criteria rules' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeTargetRuleDto)
  targets: NoticeTargetRuleDto[];

  @ApiPropertyOptional({ type: [NoticeAttachmentDto], description: 'List of uploaded attachments' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeAttachmentDto)
  attachments?: NoticeAttachmentDto[];
}

export class UpdateNoticeDto {
  @ApiPropertyOptional({ example: 'Updated Notice Title' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: NoticePriority })
  @IsOptional()
  @IsEnum(NoticePriority)
  priority?: NoticePriority;

  @ApiPropertyOptional({ enum: NoticeCategory })
  @IsOptional()
  @IsEnum(NoticeCategory)
  category?: NoticeCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduled_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expires_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requires_acknowledgement?: boolean;
}

export class PreviewRecipientsDto {
  @ApiProperty({ type: [NoticeTargetRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeTargetRuleDto)
  targets: NoticeTargetRuleDto[];
}

export class CreateNoticeGroupDto {
  @ApiProperty({ example: '2023 MBBS Batch & Faculty' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'All students in 2023 MBBS batch along with physiology faculty' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [NoticeTargetRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeTargetRuleDto)
  target_rules: NoticeTargetRuleDto[];
}

export class UpdateNoticeGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [NoticeTargetRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoticeTargetRuleDto)
  target_rules?: NoticeTargetRuleDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class NoticeFilterDto {
  @ApiPropertyOptional({ enum: ['all', 'unread', 'important', 'urgent', 'announcements', 'deadlines'] })
  @IsOptional()
  @IsString()
  filter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tenant slug passed as query param' })
  @IsOptional()
  @IsString()
  tenant?: string;
}
