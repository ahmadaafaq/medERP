import {
  IsString, IsEmail, IsEnum, IsOptional, MinLength,
  MaxLength, IsBoolean, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@srms.ac.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Temp@1234' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}

export class CreateStudentDto {
  @ApiProperty({ example: 'MB2024001' })
  @IsString()
  @MaxLength(50)
  rollno: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'john.doe@srms.ac.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Temp@1234' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseCd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  admissionYear?: string;
}

export class CreateFacultyDto {
  @ApiProperty({ example: 'EMP001' })
  @IsString()
  empId: string;

  @ApiProperty({ example: 'Dr. Jane Smith' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'jane.smith@srms.ac.in' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Temp@1234' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: [UserRole.FACULTY, UserRole.HOD, UserRole.CLERK] })
  @IsEnum([UserRole.FACULTY, UserRole.HOD, UserRole.CLERK])
  role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class BulkCreateStudentsDto {
  @ApiProperty({ type: [CreateStudentDto] })
  students: CreateStudentDto[];
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
export class UpdateFacultyDto extends PartialType(CreateFacultyDto) {}
