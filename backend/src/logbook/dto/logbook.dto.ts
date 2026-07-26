import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateLogbookEntryDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  activityTypeId: string;

  @IsString()
  @IsNotEmpty()
  entryDate: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  facultyId?: string;
}

export class VerifyLogbookEntryDto {
  @IsString()
  @IsNotEmpty()
  status: string; // VERIFIED, REJECTED

  @IsString()
  @IsOptional()
  remarks?: string;
}
