import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  Min, 
  IsDateString, 
  IsIn,
  IsBoolean
} from 'class-validator';

export class CreateInternshipProgramDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsIn(['IT', 'MANAGEMENT', 'PARAMEDICAL'])
  category: 'IT' | 'MANAGEMENT' | 'PARAMEDICAL';

  @IsString()
  @IsIn(['1_MONTH', '2_MONTH', '3_MONTH', '6_MONTH', '1_YEAR'])
  duration: string;

  @IsString()
  @IsIn(['PAID', 'FREE', 'STIPEND'])
  fee_type: 'PAID' | 'FREE' | 'STIPEND';

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stipend_amount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ON_CAMPUS', 'OFF_CAMPUS'])
  campus_type?: 'ON_CAMPUS' | 'OFF_CAMPUS';

  @IsOptional()
  @IsString()
  organization_name?: string;

  @IsOptional()
  @IsString()
  organization_type?: string; // 'Companies' | 'Hospitals' | 'Factories' | 'Research Center' | 'Industry' | 'College Firm'

  @IsOptional()
  @IsString()
  off_campus_title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  working_conditions?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ON_SITE', 'REMOTE', 'HYBRID'])
  work_mode?: 'ON_SITE' | 'REMOTE' | 'HYBRID';

  @IsOptional()
  @IsString()
  @IsIn(['IN_HOUSE_AUTO', 'OFF_CAMPUS_UPLOAD', 'DUAL'])
  certification_mode?: 'IN_HOUSE_AUTO' | 'OFF_CAMPUS_UPLOAD' | 'DUAL';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  seats_available?: number;

  @IsOptional()
  @IsDateString()
  application_deadline?: string;

  @IsOptional()
  @IsString()
  approved_by?: string;
}

export class ApplyInternshipDto {
  @IsString()
  @IsNotEmpty()
  program_id: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  student_id?: string;

  @IsOptional()
  @IsString()
  student_reg_no?: string;

  @IsOptional()
  @IsString()
  student_name?: string;

  @IsOptional()
  @IsString()
  course_cd?: string;

  @IsOptional()
  @IsString()
  batch_cd?: string;
}

export class UpdateApplicantStatusDto {
  @IsString()
  @IsIn(['applied', 'under_review', 'selected', 'rejected', 'completed'])
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  payment_status?: 'not_required' | 'pending' | 'paid';

  @IsOptional()
  @IsString()
  external_cert_url?: string;

  @IsOptional()
  @IsString()
  cert_source?: 'in_house' | 'uploaded' | 'both';
}

export class UploadExternalCertificateDto {
  @IsString()
  @IsNotEmpty()
  application_id: string;

  @IsString()
  @IsNotEmpty()
  external_cert_url: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class LockApplicantsDto {
  @IsBoolean()
  locked: boolean;
}
