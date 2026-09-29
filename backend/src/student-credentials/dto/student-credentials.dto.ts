import { IsNotEmpty, IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitCredentialDto {
  @ApiProperty({ enum: ['certificate', 'skill', 'extracurricular'], example: 'certificate' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['certificate', 'skill', 'extracurricular'])
  type: 'certificate' | 'skill' | 'extracurricular';

  @ApiProperty({ example: 'AWS Certified Cloud Practitioner' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Cloud Computing / Technical / Sports' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Amazon Web Services / IIT Bombay / SRMS Sports Council' })
  @IsOptional()
  @IsString()
  issuer?: string;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Completed foundational cloud architecture certification.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/... or uploaded document URL' })
  @IsNotEmpty({ message: 'Verification proof document or URL is required' })
  @IsString()
  file_url: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ example: '2025107990' })
  @IsOptional()
  @IsString()
  student_reg_no?: string;

  @ApiPropertyOptional({ example: 'AAFREEN KHAN' })
  @IsOptional()
  @IsString()
  student_name?: string;
}

export class ReviewCredentialDto {
  @ApiProperty({ enum: ['approved', 'rejected'], example: 'approved' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @ApiPropertyOptional({ example: 'Verified authentic university credential.' })
  @IsOptional()
  @IsString()
  reviewer_notes?: string;
}
