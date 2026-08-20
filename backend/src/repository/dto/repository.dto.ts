import { IsString, IsNotEmpty, IsUrl, Matches, IsArray, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class CreateRepositoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/.+/i, { message: 'repo_link must be a valid http or https URL (e.g. https://github.com/user/project.git)' })
  repo_link: string;

  @IsArray()
  @IsString({ each: true })
  tech_stack: string[];

  @IsOptional()
  @IsString()
  student_reg_no?: string;

  @IsOptional()
  @IsString()
  colg_cd?: string;

  @IsOptional()
  @IsString()
  course_cd?: string;

  @IsOptional()
  @IsString()
  branch_cd?: string;

  @IsOptional()
  @IsString()
  batch_cd?: string;

  @IsOptional()
  @IsString()
  sem_cd?: string;
}

export class ReviewRepositoryDto {
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsBoolean()
  is_placement_eligible?: boolean;
}

export class QueryRepositoryDto {
  @IsOptional()
  @IsString()
  course_cd?: string;

  @IsOptional()
  @IsString()
  branch_cd?: string;

  @IsOptional()
  @IsString()
  batch_cd?: string;

  @IsOptional()
  @IsString()
  sem_cd?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
