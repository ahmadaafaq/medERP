import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryIncubationProjectsDto {
  @IsOptional()
  @IsString()
  collegeId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number;

  @IsOptional()
  @IsString()
  tenant?: string;
}

export class UpdateIncubationStatusDto {
  @IsString()
  @IsIn(['Under Review', 'Selected', 'Funded', 'Incubated', 'Rejected'], {
    message: 'status must be one of: Under Review, Selected, Funded, Incubated, Rejected',
  })
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  incubation_notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  funding_amount?: number;

  @IsOptional()
  @IsString()
  mentor_assigned?: string;

  @IsOptional()
  @IsString()
  tenant?: string;
}
