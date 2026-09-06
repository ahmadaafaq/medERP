import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  publisher?: string;

  @IsNumber()
  @IsOptional()
  copiesTotal?: number;

  @IsBoolean()
  @IsOptional()
  isEbook?: boolean;

  @IsString()
  @IsOptional()
  ebookUrl?: string;
}

export class IssueBookDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  dueDate?: string;
}

export class SaveReadingProgressDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsOptional()
  bookTitle?: string;

  @IsString()
  @IsOptional()
  bookAuthor?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsNumber()
  @IsNotEmpty()
  lastPageRead: number;

  @IsNumber()
  @IsOptional()
  totalPages?: number;

  @IsNumber()
  @IsOptional()
  percentageRead?: number;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsNumber()
  @IsOptional()
  readingTimeSeconds?: number;

  @IsNumber()
  @IsOptional()
  scrollPosition?: number;

  @IsOptional()
  bookmarks?: any[];

  @IsString()
  @IsOptional()
  lastLocationDescription?: string;
}


