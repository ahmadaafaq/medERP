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

export class DigitalBookItemDto {
  @IsString()
  @IsNotEmpty()
  ttl_id: string;

  @IsString()
  @IsOptional()
  titleid?: string;

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

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsString()
  @IsOptional()
  pdf_url?: string;

  @IsString()
  @IsOptional()
  external_link?: string;

  @IsBoolean()
  @IsOptional()
  has_digital_media?: boolean;

  @IsString()
  @IsOptional()
  raw_cover?: string;

  @IsString()
  @IsOptional()
  raw_pdf?: string;

  @IsString()
  @IsOptional()
  raw_link?: string;

  @IsString()
  @IsOptional()
  colg_cd?: string;
}

export class BulkUpsertDigitalBooksDto {
  @IsOptional()
  books: DigitalBookItemDto[];

  @IsString()
  @IsOptional()
  colg_cd?: string;
}

export class SyncDigitalBooksDto {
  @IsString()
  @IsOptional()
  searchvalue?: string;

  @IsString()
  @IsOptional()
  colg?: string;

  @IsString()
  @IsOptional()
  colg_cd?: string;
}

export class QueryBooksDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  digitalOnly?: string | boolean;

  @IsString()
  @IsOptional()
  colg_cd?: string;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  offset?: number | string;
}


