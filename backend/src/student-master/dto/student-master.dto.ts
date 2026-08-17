import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  // Step 1: Academic & College Enrollment
  @ApiProperty({ example: 'col-srms' })
  @IsString()
  collegeId: string;

  @ApiProperty({ example: 'SRMS IMS Bareilly' })
  @IsString()
  collegeName: string;

  @ApiProperty({ example: 'crs-mbbs-srms' })
  @IsString()
  courseId: string;

  @ApiProperty({ example: 'MBBS' })
  @IsString()
  courseCode: string;

  @ApiPropertyOptional({ example: 'p1' })
  @IsOptional()
  @IsString()
  professionalId?: string;

  @ApiPropertyOptional({ example: '1st Professional MBBS (Phase I)' })
  @IsOptional()
  @IsString()
  professionalPhase?: string;

  @ApiPropertyOptional({ example: 'ses-2024' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ example: '2024-2025 Academic Session' })
  @IsOptional()
  @IsString()
  academicSession?: string;

  @ApiPropertyOptional({ example: 'batch-2024' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 'MB2024' })
  @IsOptional()
  @IsString()
  batchCode?: string;

  @ApiPropertyOptional({ example: 'branch-anat' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Hosteller' })
  @IsOptional()
  @IsString()
  residencyType?: string;

  @ApiPropertyOptional({ example: 'Government Quota' })
  @IsOptional()
  @IsString()
  admissionType?: string;

  @ApiPropertyOptional({ example: '20240001' })
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  rollNo?: string;

  @ApiPropertyOptional({ example: '2024-08-01' })
  @IsOptional()
  @IsString()
  admissionDate?: string;

  // Step 2: Personal Information
  @ApiProperty({ example: 'Rahul' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Kumar' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  gender: string;

  @ApiProperty({ example: '2002-05-15' })
  @IsString()
  dob: string;

  @ApiPropertyOptional({ example: 'B+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'Indian' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ example: 'Hinduism' })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional({ example: 'General' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Brahmin' })
  @IsOptional()
  @IsString()
  caste?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  aadhaarNo?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  panNo?: string;

  @ApiPropertyOptional({ example: 'Z1234567' })
  @IsOptional()
  @IsString()
  passportNo?: string;

  @ApiPropertyOptional({ example: 'Single' })
  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'rahul.sharma@mederp.edu' })
  @IsOptional()
  @IsString()
  emailAddress?: string;

  // Step 3: Parents & Addresses
  @ApiPropertyOptional({ example: 'Rakesh Sharma' })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional({ example: 'Doctor' })
  @IsOptional()
  @IsString()
  fatherOccupation?: string;

  @ApiPropertyOptional({ example: '9876543211' })
  @IsOptional()
  @IsString()
  fatherMobile?: string;

  @ApiPropertyOptional({ example: 'Sunita Sharma' })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional({ example: 'Professor' })
  @IsOptional()
  @IsString()
  motherOccupation?: string;

  @ApiPropertyOptional({ example: '9876543212' })
  @IsOptional()
  @IsString()
  motherMobile?: string;

  @ApiPropertyOptional({ example: 1200000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annualIncome?: number;

  @ApiPropertyOptional({ example: '123 Civil Lines' })
  @IsOptional()
  @IsString()
  permanentAddress1?: string;

  @ApiPropertyOptional({ example: 'Near City Park' })
  @IsOptional()
  @IsString()
  permanentAddress2?: string;

  @ApiPropertyOptional({ example: 'Bareilly' })
  @IsOptional()
  @IsString()
  permanentCity?: string;

  @ApiPropertyOptional({ example: 'Bareilly' })
  @IsOptional()
  @IsString()
  permanentDistrict?: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  permanentState?: string;

  @ApiPropertyOptional({ example: '243001' })
  @IsOptional()
  @IsString()
  permanentPincode?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sameAsPermanent?: boolean;

  // Step 4: Academic History & NEET
  @ApiPropertyOptional({ example: 'CBSE' })
  @IsOptional()
  @IsString()
  class10Board?: string;

  @ApiPropertyOptional({ example: 94.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class10Pct?: number;

  @ApiPropertyOptional({ example: 'CBSE' })
  @IsOptional()
  @IsString()
  class12Board?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class12Physics?: number;

  @ApiPropertyOptional({ example: 94 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class12Chemistry?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class12Biology?: number;

  @ApiPropertyOptional({ example: 92 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class12English?: number;

  @ApiPropertyOptional({ example: 94.75 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  class12Pct?: number;

  @ApiPropertyOptional({ example: '24041012345' })
  @IsOptional()
  @IsString()
  neetRollNo?: string;

  @ApiPropertyOptional({ example: 685 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  neetScore?: number;

  @ApiPropertyOptional({ example: 99.85 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  neetPercentile?: number;

  @ApiPropertyOptional({ example: 1250 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  neetAirRank?: number;

  // Step 5: Hostel, Transport & Banking
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hostelRequired?: boolean;

  @ApiPropertyOptional({ example: 'Charak Hostel Block A' })
  @IsOptional()
  @IsString()
  hostelName?: string;

  @ApiPropertyOptional({ example: 'A-204' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  busRequired?: boolean;

  @ApiPropertyOptional({ example: 'LIB-9988' })
  @IsOptional()
  @IsString()
  libraryCardNo?: string;

  @ApiPropertyOptional({ example: 'State Bank of India' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '309988776655' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001234' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  // Step 6: Medical & Status
  @ApiPropertyOptional({ example: 'Vaccinated (Fully)' })
  @IsOptional()
  @IsString()
  vaccinationStatus?: string;

  @ApiPropertyOptional({ example: 'CONFIRMED' })
  @IsOptional()
  @IsString()
  admissionStatus?: string;

  @ApiPropertyOptional({ example: 'data:image/jpeg;base64,...' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}

export class BulkLinkProfessionalDto {
  @ApiProperty({ type: [String], description: 'Array of student IDs to link and activate in the professional phase' })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({ example: 'p2' })
  @IsString()
  professionalId: string;

  @ApiProperty({ example: '2nd Professional MBBS (Phase II)' })
  @IsString()
  professionalPhase: string;

  @ApiPropertyOptional({ example: '2025-2026' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ example: 'batch-2024' })
  @IsOptional()
  @IsString()
  batchId?: string;
}

export class BulkLinkGroupDto {
  @ApiProperty({ type: [String], description: 'Array of student IDs to link to the academic group' })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({ example: 'grp-a-id' })
  @IsString()
  groupId: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  groupCode?: string;

  @ApiPropertyOptional({ example: 'Group A' })
  @IsOptional()
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({ example: 'batch-2025-id' })
  @IsOptional()
  @IsString()
  batchId?: string;
}

