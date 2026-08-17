import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/role.enum';

export class LoginDto {
  @ApiProperty({
    example: '2023MBBS045',
    description: 'Email, Username, Emp ID (Faculty), Registration No (Student), admin, 1234 (Clerk), or warden',
  })
  @IsString({ message: 'Username or email must be a string' })
  @MinLength(1, { message: 'Username or email is required' })
  email: string; // Accepts email, username, emp_id, registration_no, or role username

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({ example: 'srms-ims' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional({ example: 'srms-ims' })
  @IsOptional()
  @IsString()
  tenant?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Role hint (used to route to correct dashboard on login)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UserQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Items per page (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search query across email, name, emp_id, registration_no' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Filter users by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ default: 'created_at', description: 'Column to sort by: created_at, email, role' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ default: 'DESC', description: 'Sort direction: ASC or DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC';
}

export class CreateUserDto {
  @ApiProperty({ example: 'newuser@college.edu' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.FACULTY })
  @IsEnum(UserRole, { message: 'Valid user role is required' })
  role: UserRole;

  @ApiPropertyOptional({ example: 'Dr. John Doe', description: 'Full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'EMP2002', description: 'Employee ID for Faculty or Staff' })
  @IsOptional()
  @IsString()
  empId?: string;

  @ApiPropertyOptional({ example: '2024MBBS001', description: 'Registration No for Student' })
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional({ example: 'MBBS2024001', description: 'Roll No for Student' })
  @IsOptional()
  @IsString()
  rollno?: string;

  @ApiPropertyOptional({ description: 'Department ID UUID' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ description: 'Min 8 chars, at least one uppercase, one number' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@college.edu' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from email link' })
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token from previous login response' })
  @IsString()
  refreshToken: string;
}

