import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateBookDto, IssueBookDto, SaveReadingProgressDto } from './dto/library.dto';

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  async createBook(tenantSlug: string, dto: CreateBookDto) {
    const copies = dto.copiesTotal ?? 1;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO library_books (title, author, isbn, category, publisher, copies_total, copies_available, is_ebook, ebook_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [dto.title, dto.author || null, dto.isbn || null, dto.category || null, dto.publisher || null, copies, copies, dto.isEbook || false, dto.ebookUrl || null],
    );
    return res[0];
  }

  async getBooks(tenantSlug: string, search?: string) {
    if (search) {
      return this.tenantSchemaService.queryInTenant(
        tenantSlug,
        `SELECT * FROM library_books WHERE is_active = true AND (title ILIKE $1 OR author ILIKE $1 OR isbn ILIKE $1) ORDER BY title ASC`,
        [`%${search}%`],
      );
    }
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM library_books WHERE is_active = true ORDER BY title ASC`,
    );
  }

  async issueBook(tenantSlug: string, dto: IssueBookDto) {
    const books = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT copies_available FROM library_books WHERE id = $1`,
      [dto.bookId],
    );
    if (!books.length || books[0].copies_available <= 0) {
      throw new BadRequestException('Book is not available for issue');
    }

    await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `UPDATE library_books SET copies_available = copies_available - 1 WHERE id = $1`,
      [dto.bookId],
    );

    const dueDate = dto.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO library_circulation (book_id, student_id, issued_at, due_date)
       VALUES ($1, $2, NOW(), $3) RETURNING *`,
      [dto.bookId, dto.studentId, dueDate],
    );
    return res[0];
  }

  async getStudentCirculation(tenantSlug: string, rollno: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT c.*, b.title, b.author, b.cover_url
       FROM library_circulation c
       JOIN students s ON c.student_id = s.id
       JOIN library_books b ON c.book_id = b.id
       WHERE s.rollno = $1
       ORDER BY c.issued_at DESC`,
      [rollno],
    );
  }

  async saveReadingProgress(
    tenantSlug: string,
    userId: string,
    userRole: string,
    userName: string,
    dto: SaveReadingProgressDto,
  ) {
    const totalPages = Math.max(1, dto.totalPages || 1);
    const lastPageRead = Math.max(1, dto.lastPageRead || 1);
    const percentage = dto.percentageRead !== undefined
      ? Number(dto.percentageRead)
      : Number(((lastPageRead / totalPages) * 100).toFixed(2));
    const isCompleted = dto.isCompleted !== undefined
      ? dto.isCompleted
      : lastPageRead >= totalPages;

    const bookmarksJson = dto.bookmarks !== undefined ? JSON.stringify(dto.bookmarks) : null;
    const scrollPosition = dto.scrollPosition !== undefined ? Number(dto.scrollPosition) : null;

    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO book_reading_progress (
        user_id, user_role, user_name, book_id, book_title, book_author, cover_url, pdf_url,
        last_page_read, total_pages, percentage_read, is_completed, reading_time_seconds,
        scroll_position, bookmarks, last_location_description, last_read_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, COALESCE($15::jsonb, '[]'::jsonb), $16, NOW(), NOW()
      )
      ON CONFLICT (user_id, book_id) DO UPDATE SET
        last_page_read = EXCLUDED.last_page_read,
        total_pages = GREATEST(book_reading_progress.total_pages, EXCLUDED.total_pages),
        percentage_read = EXCLUDED.percentage_read,
        is_completed = EXCLUDED.is_completed,
        reading_time_seconds = book_reading_progress.reading_time_seconds + COALESCE(EXCLUDED.reading_time_seconds, 0),
        scroll_position = COALESCE(EXCLUDED.scroll_position, book_reading_progress.scroll_position),
        bookmarks = CASE WHEN $15 IS NOT NULL THEN EXCLUDED.bookmarks ELSE book_reading_progress.bookmarks END,
        last_location_description = COALESCE(EXCLUDED.last_location_description, book_reading_progress.last_location_description),
        last_read_at = NOW(),
        updated_at = NOW(),
        book_title = COALESCE(EXCLUDED.book_title, book_reading_progress.book_title),
        book_author = COALESCE(EXCLUDED.book_author, book_reading_progress.book_author),
        cover_url = COALESCE(EXCLUDED.cover_url, book_reading_progress.cover_url),
        pdf_url = COALESCE(EXCLUDED.pdf_url, book_reading_progress.pdf_url)
      RETURNING *`,
      [
        String(userId),
        String(userRole || 'USER'),
        userName || null,
        String(dto.bookId),
        dto.bookTitle || null,
        dto.bookAuthor || null,
        dto.coverUrl || null,
        dto.pdfUrl || null,
        lastPageRead,
        totalPages,
        percentage,
        isCompleted,
        dto.readingTimeSeconds || 0,
        scrollPosition,
        bookmarksJson,
        dto.lastLocationDescription || null,
      ],
    );
    return res[0];
  }

  async getReadingProgressAll(tenantSlug: string, userId: string) {
    return this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM book_reading_progress
       WHERE user_id = $1
       ORDER BY last_read_at DESC`,
      [String(userId)],
    );
  }

  async getReadingProgressForBook(tenantSlug: string, userId: string, bookId: string) {
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `SELECT * FROM book_reading_progress
       WHERE user_id = $1 AND book_id = $2
       LIMIT 1`,
      [String(userId), String(bookId)],
    );
    return res[0] || null;
  }
}

