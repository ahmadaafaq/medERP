import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TenantSchemaService } from '../database/tenant-schema.service';
import {
  CreateBookDto,
  IssueBookDto,
  SaveReadingProgressDto,
  DigitalBookItemDto,
  QueryBooksDto,
} from './dto/library.dto';

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(private readonly tenantSchemaService: TenantSchemaService) {}

  private formatSrmsMediaUrl(rawPath: string | null | undefined): string | null {
    if (!rawPath || rawPath === '0' || rawPath.trim() === '') return null;
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath;

    const normalized = rawPath.replace(/\\/g, '/');
    const match = normalized.match(/Library\/Cataloguing\/BookUploads\/(.+)/i);
    if (match && match[1]) {
      const encodedPart = match[1]
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      return `https://myportal.srms.ac.in/Library/Cataloguing/BookUploads/${encodedPart}`;
    }

    const matchShort = normalized.match(/BookUploads\/(.+)/i);
    if (matchShort && matchShort[1]) {
      const encodedPart = matchShort[1]
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/');
      return `https://myportal.srms.ac.in/Library/Cataloguing/BookUploads/${encodedPart}`;
    }

    return null;
  }

  async bulkUpsertDigitalBooks(tenantSlug: string, books: DigitalBookItemDto[], colgCd: string = '1') {
    if (!books || !Array.isArray(books) || books.length === 0) {
      return { success: true, count: 0 };
    }

    // Deduplicate books within the payload by ttl_id (merging to retain rich digital media)
    const bookMap = new Map<string, DigitalBookItemDto>();
    for (const b of books) {
      if (!b) continue;
      const key = String(b.ttl_id || b.titleid || '').trim();
      if (!key) continue;

      const existing = bookMap.get(key);
      if (!existing) {
        bookMap.set(key, b);
      } else {
        const hasDigital = Boolean(b.has_digital_media || b.pdf_url || b.cover_url || b.external_link);
        const existingHasDigital = Boolean(existing.has_digital_media || existing.pdf_url || existing.cover_url || existing.external_link);
        if (hasDigital && !existingHasDigital) {
          bookMap.set(key, { ...existing, ...b });
        } else {
          bookMap.set(key, {
            ...b,
            ...existing,
            pdf_url: existing.pdf_url || b.pdf_url,
            cover_url: existing.cover_url || b.cover_url,
            external_link: existing.external_link || b.external_link,
            has_digital_media: existingHasDigital || hasDigital,
          });
        }
      }
    }

    const validBooks = Array.from(bookMap.values());
    if (validBooks.length === 0) {
      return { success: true, count: 0 };
    }

    const chunkSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < validBooks.length; i += chunkSize) {
      const chunk = validBooks.slice(i, i + chunkSize);
      const values: any[] = [];
      const rowPlaceholders: string[] = [];

      chunk.forEach((b, idx) => {
        const offset = idx * 16;
        const ttlId = String(b.ttl_id || b.titleid).trim();
        const titleId = String(b.titleid || b.ttl_id || '').trim();
        const title = String(b.title || `Catalog Book ${ttlId}`).trim();
        const author = b.author ? String(b.author).trim() : 'Academic Publication';
        const isbn = b.isbn ? String(b.isbn).trim() : null;
        const category = b.category ? String(b.category).trim() : 'General';
        const publisher = b.publisher ? String(b.publisher).trim() : null;
        const coverUrl = b.cover_url || null;
        const pdfUrl = b.pdf_url || null;
        const extLink = b.external_link || null;
        const rawCover = b.raw_cover || null;
        const rawPdf = b.raw_pdf || null;
        const rawLink = b.raw_link || null;
        const colg = String(b.colg_cd || colgCd || '1');
        const hasDigital = Boolean(b.has_digital_media || coverUrl || pdfUrl || extLink);
        const isEbook = Boolean(pdfUrl || extLink || b.has_digital_media);

        rowPlaceholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, true, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, NOW())`
        );

        values.push(
          title,
          author,
          isbn,
          category,
          publisher,
          coverUrl,
          isEbook,
          ttlId,
          titleId,
          pdfUrl,
          extLink,
          rawCover,
          rawPdf,
          rawLink,
          colg,
          hasDigital,
        );
      });

      const sql = `
        INSERT INTO library_books (
          title, author, isbn, category, publisher,
          cover_url, is_ebook, is_active,
          ttl_id, titleid, pdf_url, external_link,
          raw_cover, raw_pdf, raw_link, colg_cd,
          has_digital_media, updated_at
        )
        VALUES ${rowPlaceholders.join(', ')}
        ON CONFLICT (ttl_id) DO UPDATE SET
          title = EXCLUDED.title,
          author = COALESCE(EXCLUDED.author, library_books.author),
          isbn = COALESCE(EXCLUDED.isbn, library_books.isbn),
          category = COALESCE(EXCLUDED.category, library_books.category),
          publisher = COALESCE(EXCLUDED.publisher, library_books.publisher),
          cover_url = COALESCE(EXCLUDED.cover_url, library_books.cover_url),
          pdf_url = COALESCE(EXCLUDED.pdf_url, library_books.pdf_url),
          external_link = COALESCE(EXCLUDED.external_link, library_books.external_link),
          is_ebook = EXCLUDED.is_ebook,
          has_digital_media = EXCLUDED.has_digital_media,
          raw_cover = COALESCE(EXCLUDED.raw_cover, library_books.raw_cover),
          raw_pdf = COALESCE(EXCLUDED.raw_pdf, library_books.raw_pdf),
          raw_link = COALESCE(EXCLUDED.raw_link, library_books.raw_link),
          colg_cd = COALESCE(EXCLUDED.colg_cd, library_books.colg_cd),
          updated_at = NOW()
      `;

      await this.tenantSchemaService.queryInTenant(tenantSlug, sql, values);
      totalUpserted += chunk.length;
    }

    return { success: true, count: totalUpserted };
  }

  async syncFromSrms(tenantSlug: string, colgCd: string = '1', searchvalue: string = '') {
    this.logger.log(`Starting SRMS EBook sync for tenant=${tenantSlug}, colg=${colgCd}, search='${searchvalue}'`);
    try {
      const response = await fetch('https://myportal.srms.ac.in/Library/EBook/searchbookbyTopic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        body: JSON.stringify({
          searchvalue: searchvalue || '',
          colg: String(colgCd || '1'),
        }),
      });

      if (!response.ok) {
        throw new Error(`SRMS API error: status ${response.status}`);
      }

      const rawList: any[] = await response.json();
      if (!Array.isArray(rawList)) {
        return { success: true, totalFetched: 0, digitalCount: 0, upsertedCount: 0 };
      }

      const processedBooks: DigitalBookItemDto[] = rawList
        .filter((b) => b && (b.ttl_id || b.titleid || b.author_name || b.Topics))
        .map((b) => {
          const coverUrl = this.formatSrmsMediaUrl(b.coverpage);
          const pdfUrl = this.formatSrmsMediaUrl(b.pdf);
          const externalLink = b.link && b.link !== '0' && b.link.trim() !== '' ? b.link.trim() : null;

          let cleanTitle = b.Topics ? b.Topics.trim() : '';
          if (!cleanTitle && b.coverpage) {
            const parts = b.coverpage.split('\\');
            const fileName = parts[parts.length - 1] || '';
            cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
          }
          if (!cleanTitle) {
            cleanTitle = `Catalog Book ${b.ttl_id || b.titleid || ''}`.trim();
          }

          const author = b.author_name ? b.author_name.trim() : 'Academic Publication';
          const hasDigitalMedia = Boolean(coverUrl || pdfUrl || externalLink);

          return {
            ttl_id: b.ttl_id || b.titleid || '',
            titleid: b.titleid || b.ttl_id || '',
            title: cleanTitle,
            author,
            isbn: b.isbn || null,
            category: b.department || b.subject || 'Academic',
            publisher: b.publisher || null,
            cover_url: coverUrl || undefined,
            pdf_url: pdfUrl || undefined,
            external_link: externalLink || undefined,
            has_digital_media: hasDigitalMedia,
            raw_cover: b.coverpage || undefined,
            raw_pdf: b.pdf || undefined,
            raw_link: b.link || undefined,
            colg_cd: String(colgCd || '1'),
          };
        });

      const digitalCount = processedBooks.filter((b) => b.has_digital_media).length;
      const upsertResult = await this.bulkUpsertDigitalBooks(tenantSlug, processedBooks, colgCd);

      this.logger.log(`Synced ${upsertResult.count} books (${digitalCount} digital) for tenant=${tenantSlug}`);
      return {
        success: true,
        totalFetched: rawList.length,
        digitalCount,
        upsertedCount: upsertResult.count,
      };
    } catch (err: any) {
      this.logger.error(`Failed to sync books from SRMS: ${err.message}`, err.stack);
      throw new BadRequestException(`SRMS Sync failed: ${err.message}`);
    }
  }

  async createBook(tenantSlug: string, dto: CreateBookDto) {
    const copies = dto.copiesTotal ?? 1;
    const res = await this.tenantSchemaService.queryInTenant(
      tenantSlug,
      `INSERT INTO library_books (title, author, isbn, category, publisher, copies_total, copies_available, is_ebook, ebook_s3_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [dto.title, dto.author || null, dto.isbn || null, dto.category || null, dto.publisher || null, copies, copies, dto.isEbook || false, dto.ebookUrl || null],
    );
    return res[0];
  }

  async getBooks(tenantSlug: string, queryOrSearch?: QueryBooksDto | string) {
    const query: QueryBooksDto = typeof queryOrSearch === 'string'
      ? { search: queryOrSearch }
      : (queryOrSearch || {});

    const search = (query.search || query.q || '').trim();
    const digitalOnly = String(query.digitalOnly) === 'true';
    const colgCd = query.colg_cd ? String(query.colg_cd).trim() : null;
    const limit = Math.min(Math.max(1, Number(query.limit) || 1000), 5000);
    const offset = Math.max(0, Number(query.offset) || 0);

    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(title ILIKE $${paramIdx} OR author ILIKE $${paramIdx} OR isbn ILIKE $${paramIdx} OR category ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (digitalOnly) {
      conditions.push(`has_digital_media = true`);
    }

    if (colgCd) {
      conditions.push(`colg_cd = $${paramIdx}`);
      params.push(colgCd);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT * FROM library_books
      ${whereClause}
      ORDER BY has_digital_media DESC, title ASC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);

    return this.tenantSchemaService.queryInTenant(tenantSlug, sql, params);
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

