import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import { CreateBookDto, IssueBookDto } from './dto/library.dto';

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
}
