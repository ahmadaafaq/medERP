import { IsString, IsOptional, IsArray, ValidateNested, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatAttachmentDto {
  @ApiProperty({ description: 'Original file name', example: 'Assignment1.pdf' })
  @IsString()
  file_name: string;

  @ApiPropertyOptional({ description: 'File type category (pdf, doc, ppt, image, other)', example: 'pdf' })
  @IsOptional()
  @IsString()
  file_type?: string;

  @ApiProperty({ description: 'Download or storage URL of the file', example: '/uploads/chat/12345-Assignment1.pdf' })
  @IsString()
  file_url: string;

  @ApiPropertyOptional({ description: 'Size of file in kilobytes', example: 1024 })
  @IsOptional()
  @IsNumber()
  file_size_kb?: number;

  @ApiPropertyOptional({ description: 'Optional local file path' })
  @IsOptional()
  @IsString()
  file_path?: string;

  @ApiPropertyOptional({ description: 'Optional attachment ID' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Alternative name field' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Alternative url field' })
  @IsOptional()
  @IsString()
  url?: string;
}

export class SendMessageDto {
  @ApiPropertyOptional({ description: 'Text message content', example: 'Hello students, please review the uploaded lecture slides.' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Sender User ID' })
  @IsOptional()
  @IsString()
  sender_id?: string;

  @ApiPropertyOptional({ description: 'Sender Display Name' })
  @IsOptional()
  @IsString()
  sender_name?: string;

  @ApiPropertyOptional({ description: 'Sender Role (STUDENT, FACULTY, ADMIN)' })
  @IsOptional()
  @IsString()
  sender_role?: string;

  @ApiPropertyOptional({ description: 'Sender Profile Picture URL' })
  @IsOptional()
  @IsString()
  sender_avatar?: string;

  @ApiPropertyOptional({ description: 'List of file attachments', type: [CreateChatAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChatAttachmentDto)
  attachments?: CreateChatAttachmentDto[];
}

export class CreateChatGroupDto {
  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsOptional()
  @IsString()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Department Name', example: 'Computer Science & Engineering' })
  @IsOptional()
  @IsString()
  department_name?: string;

  @ApiProperty({ description: 'Batch Year', example: '2025' })
  @IsString()
  batch_year: string;

  @ApiPropertyOptional({ description: 'Batch Code', example: '2025-CSE' })
  @IsOptional()
  @IsString()
  batch_code?: string;

  @ApiProperty({ description: 'Group Name', example: '2025 Batch · CSE' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Group Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ChatGroupFilterDto {
  @ApiPropertyOptional({ description: 'Search term for group name or department' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsString()
  department_id?: string;

  @ApiPropertyOptional({ description: 'Filter by batch year', example: '2025' })
  @IsOptional()
  @IsString()
  batch_year?: string;

  @ApiPropertyOptional({ description: 'Course Code filter' })
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional({ description: 'Tenant slug passed in query' })
  @IsOptional()
  @IsString()
  tenant?: string;

  @ApiPropertyOptional({ description: 'Tenant slug passed in query' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}

export class JoinBatchGroupDto {
  @ApiPropertyOptional({ description: 'Course Code or ID', example: '13' })
  @IsOptional()
  @IsString()
  course_cd?: string;

  @ApiPropertyOptional({ description: 'Course Name', example: 'B.Tech' })
  @IsOptional()
  @IsString()
  course_name?: string;

  @ApiPropertyOptional({ description: 'Department/Branch ID or Code' })
  @IsOptional()
  @IsString()
  department_id?: string;

  @ApiProperty({ description: 'Department/Branch Name', example: 'Computer Science & Engineering' })
  @IsString()
  department_name: string;

  @ApiProperty({ description: 'Batch Year or Code', example: '2025' })
  @IsString()
  batch_year: string;

  @ApiPropertyOptional({ description: 'Batch Code', example: '2025-CSE' })
  @IsOptional()
  @IsString()
  batch_code?: string;
}

