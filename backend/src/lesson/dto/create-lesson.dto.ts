import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ description: 'Lesson Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Lesson Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'College Code' })
  @IsString()
  @IsOptional()
  colgCd?: string;

  @ApiProperty({ description: 'Course Code' })
  @IsString()
  @IsNotEmpty()
  courseCd: string;

  @ApiProperty({ description: 'Branch Code' })
  @IsString()
  @IsNotEmpty()
  branchCd: string;

  @ApiProperty({ description: 'Batch Code' })
  @IsString()
  @IsNotEmpty()
  batchCd: string;

  @ApiProperty({ description: 'Semester Code' })
  @IsString()
  @IsNotEmpty()
  semCd: string;

  @ApiPropertyOptional({ description: 'Subject ID/Code' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Unit ID/Code' })
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Topic ID/Code' })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Sub-Topic ID/Code' })
  @IsString()
  @IsOptional()
  subtopicId?: string;
}
