import {
  IsDateString, IsString, IsOptional,
  IsArray, ValidateNested, IsEnum, ArrayMinSize,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export class AttendanceEntryDto {
  @ApiProperty({ description: 'Student UUID or registration/enrollment number' })
  @IsString()
  @IsNotEmpty()
  studentId: string; // Accepts UUID or any student identifier string

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offeringId?: string;

  @ApiPropertyOptional({ description: 'Subject UUID or subject_cd numeric code — optional; auto-resolved from timetableSlotId if absent' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Subject numeric code (e.g. "87659") per RestrictAPI.md' })
  @IsOptional()
  @IsString()
  subjectCd?: string;

  @ApiPropertyOptional({ description: 'Batch UUID or batch_cd numeric code (e.g. "2", "2025") per RestrictAPI.md' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Batch numeric code (e.g. "17", "2025") per RestrictAPI.md' })
  @IsOptional()
  @IsString()
  batchCd?: string;

  @ApiProperty({ example: '2025-09-23' })
  @IsDateString()
  sessionDate: string;

  @ApiPropertyOptional({ example: 'THEORY', enum: ['THEORY', 'PRACTICAL', 'TUTORIAL', 'LECTURE', 'LAB', 'SDL'] })
  @IsOptional()
  @IsString()
  sessionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicCovered?: string;

  @ApiPropertyOptional({ description: 'UUID of the timetable slot this session belongs to' })
  @IsOptional()
  @IsString()
  timetableSlotId?: string;

  @ApiProperty({ type: [AttendanceEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  records: AttendanceEntryDto[];
}

export class UpdateRecordDto {
  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
