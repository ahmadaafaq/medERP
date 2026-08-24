import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTimetableSlotDto {
  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsString()
  facultyId?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ example: 1, description: 'Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '10:00:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Lecture Hall 3' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiProperty({ example: 'Lecture', description: 'SDL, Lecture, Practical, DOAP' })
  @IsString()
  slotType: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ example: 'Whole Batch' })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({ example: 'Action Potential' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'Unit 1: Neurophysiology' })
  @IsOptional()
  @IsString()
  unitName?: string;

  @ApiPropertyOptional({ example: 'u1' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ example: 'Unit 1' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'Resting membrane potential, Action potential generation' })
  @IsOptional()
  @IsString()
  subTopics?: string;

  @ApiPropertyOptional({ example: 'PY1.2, PY1.3' })
  @IsOptional()
  @IsString()
  competencyCodes?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  colgcd?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  colgCd?: string;

  @ApiPropertyOptional({ example: '13' })
  @IsOptional()
  @IsString()
  coursecd?: string;

  @ApiPropertyOptional({ example: '13' })
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  branchcd?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  branchCd?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  batchcd?: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  batchCd?: string;

  @ApiPropertyOptional({ example: '3' })
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ example: 'Web Technology VINAY KUMAR' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTimetableSlotDto extends PartialType(CreateTimetableSlotDto) { }
