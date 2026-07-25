import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/role.enum';

export class LoginDto {
  @ApiProperty({ example: 'student@srms.ac.in' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Role hint (used to route to correct dashboard on login)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
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
