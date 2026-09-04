import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUrl, 
  Matches, 
  IsNumber, 
  Min, 
  IsDateString, 
  IsIn 
} from 'class-validator';

export class CreatePlacementDriveDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsOptional()
  @IsString()
  package_ctc?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  eligibility_course_cd: string;

  @IsOptional()
  @IsString()
  eligibility_branch_cd?: string;

  @IsString()
  @IsNotEmpty()
  eligibility_batch_cd: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_score_required?: number;

  @IsDateString()
  @IsNotEmpty()
  drive_date: string;

  @IsDateString()
  @IsNotEmpty()
  deadline_date: string;

  @IsOptional()
  eligible_branches?: any;

  @IsOptional()
  eligible_batches?: any;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  extra_fields?: any;

  @IsOptional()
  target_cohorts?: any;

  @IsOptional()
  eligible_courses?: any;
}

export class UpdatePlacementDriveDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  package_ctc?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  eligibility_course_cd?: string;

  @IsOptional()
  @IsString()
  eligibility_branch_cd?: string;

  @IsOptional()
  @IsString()
  eligibility_batch_cd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_score_required?: number;

  @IsOptional()
  @IsDateString()
  drive_date?: string;

  @IsOptional()
  @IsDateString()
  deadline_date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  eligible_branches?: any;

  @IsOptional()
  eligible_batches?: any;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  extra_fields?: any;

  @IsOptional()
  target_cohorts?: any;

  @IsOptional()
  eligible_courses?: any;
}

export class ApplyPlacementDriveDto {
  @IsNumber()
  @IsNotEmpty()
  drive_id: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/.+/i, { message: 'resume_link must be a valid http or https URL' })
  resume_link: string;

  @IsOptional()
  @IsString()
  cover_note?: string;
}

export class UpdateApplicantStatusDto {
  @IsNumber()
  @IsNotEmpty()
  application_id: number;

  @IsString()
  @IsIn(['Applied', 'Shortlisted', 'Selected', 'Rejected'])
  status: string;

  @IsOptional()
  @IsString()
  selected_company?: string;

  @IsOptional()
  @IsString()
  selected_role?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PlacementReportQueryDto {
  @IsOptional()
  @IsString()
  course_cd?: string;

  @IsOptional()
  @IsString()
  batch_cd?: string;

  @IsOptional()
  @IsString()
  filter_type?: 'all' | 'zero' | 'multiple'; // 'zero' = 0 placements, 'multiple' = 2+ placements

  @IsOptional()
  @IsString()
  tenant?: string;
}

export class ConfirmImportDriveDto {
  @IsString()
  @IsNotEmpty()
  batch_title: string;

  @IsOptional()
  @IsString()
  source_file_name?: string;

  @IsNotEmpty()
  companies: any[];
}

export class RespondOfferDto {
  @IsString()
  @IsIn(['accept', 'decline'])
  action: 'accept' | 'decline';
}
