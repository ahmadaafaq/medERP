import {
  IsUUID, IsDateString, IsString, IsOptional,
  IsArray, ValidateNested, IsEnum, ArrayMinSize,
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
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiProperty()
  @IsUUID()
  batchId: string;

  @ApiProperty({ example: '2025-08-01' })
  @IsDateString()
  sessionDate: string;

  @ApiPropertyOptional({ example: 'THEORY', enum: ['THEORY', 'PRACTICAL', 'TUTORIAL', 'SDL'] })
  @IsOptional()
  @IsString()
  sessionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicCovered?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
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
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
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
