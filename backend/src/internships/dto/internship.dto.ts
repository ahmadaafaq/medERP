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
  @IsIn(['PAID', 'FREE'])
  fee_type: 'PAID' | 'FREE';

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee_amount?: number;

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
}

export class LockApplicantsDto {
  @IsBoolean()
  locked: boolean;
}
