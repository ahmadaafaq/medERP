import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

function resolveTenantSchema(slug?: string | null): string {
  if (!slug) return 'tenant_srms-cet-bareilly';
  const clean = slug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
  if (clean === 'srms' || clean === 'cet' || clean === '1') return 'tenant_srms-cet-bareilly';
  return `tenant_${clean}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId') || searchParams.get('book_id');
    const authHeader = req.headers.get('authorization') || '';
    const cookieTenant = req.cookies.get('auth_tenant')?.value;
    const headerTenant = req.headers.get('x-tenant-slug') || searchParams.get('tenant') || cookieTenant || 'srms-cet-bareilly';
    const schema = resolveTenantSchema(headerTenant);

    // Dynamic backend base URL for live public IP or docker deployment
    const rawBackend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
    const backendApi = rawBackend.replace(/\/+$/, '').replace(/\/api\/v1$/, '') + '/api/v1';

    // Try backend proxy first if auth header exists
    if (authHeader) {
      try {
        const backendUrl = bookId 
          ? `${backendApi}/library/progress/${encodeURIComponent(bookId)}`
          : `${backendApi}/library/progress`;
        
        const backendRes = await fetch(backendUrl, {
          headers: {
            'Authorization': authHeader,
            'x-tenant-slug': headerTenant,
          },
          cache: 'no-store',
        });

        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json({ success: true, data });
        }
      } catch (proxyErr) {
        // Fallback to direct DB query below
      }
    }

    // Direct PostgreSQL query fallback
    const userId = searchParams.get('userId') || searchParams.get('user_id') || '202616658'; // default Vinay Kumar or query param

    if (bookId) {
      const rows = await queryDb(
        `SELECT * FROM "${schema}".book_reading_progress WHERE user_id = $1 AND book_id = $2 LIMIT 1`,
        [userId, bookId]
      );
      return NextResponse.json({ success: true, data: rows[0] || null });
    }

    const rows = await queryDb(
      `SELECT * FROM "${schema}".book_reading_progress WHERE user_id = $1 ORDER BY last_read_at DESC`,
      [userId]
    );

    return NextResponse.json({ success: true, count: rows.length, data: rows });
  } catch (error: any) {
    console.error('Error fetching library progress:', error);
    return NextResponse.json({ success: false, message: error.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('authorization') || '';
    const cookieTenant = req.cookies.get('auth_tenant')?.value;
    const headerTenant = req.headers.get('x-tenant-slug') || body.tenantSlug || cookieTenant || 'srms-cet-bareilly';
    const schema = resolveTenantSchema(headerTenant);

    // Dynamic backend base URL for live public IP or docker deployment
    const rawBackend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
    const backendApi = rawBackend.replace(/\/+$/, '').replace(/\/api\/v1$/, '') + '/api/v1';

    // If backend proxy is available
    if (authHeader) {
      try {
        const backendRes = await fetch(`${backendApi}/library/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'x-tenant-slug': headerTenant,
          },
          body: JSON.stringify(body),
        });

        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json({ success: true, data });
        }
      } catch (proxyErr) {
        // Fallback to direct DB
      }
    }

    // Direct PostgreSQL upsert fallback
    const userId = body.userId || body.user_id || '202616658';
    const userRole = body.userRole || body.user_role || 'FACULTY';
    const userName = body.userName || body.user_name || 'Vinay Kumar';
    const bookId = body.bookId || body.book_id;
    if (!bookId) {
      return NextResponse.json({ success: false, message: 'bookId is required' }, { status: 400 });
    }

    const totalPages = Math.max(1, parseInt(body.totalPages || body.total_pages || 1, 10));
    const lastPageRead = Math.max(1, parseInt(body.lastPageRead || body.last_page_read || 1, 10));
    const percentageRead = body.percentageRead !== undefined
      ? Number(body.percentageRead)
      : Number(((lastPageRead / totalPages) * 100).toFixed(2));
    const isCompleted = body.isCompleted !== undefined ? Boolean(body.isCompleted) : lastPageRead >= totalPages;
    const readingTime = parseInt(body.readingTimeSeconds || body.reading_time_seconds || 0, 10);

    const scrollPosition = body.scrollPosition !== undefined ? Number(body.scrollPosition) : (body.scroll_position !== undefined ? Number(body.scroll_position) : null);
    const bookmarks = body.bookmarks ? JSON.stringify(body.bookmarks) : null;
    const lastLocationDescription = body.lastLocationDescription || body.last_location_description || null;

    const rows = await queryDb(
      `INSERT INTO "${schema}".book_reading_progress (
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
        String(userRole),
        userName,
        String(bookId),
        body.bookTitle || body.title || null,
        body.bookAuthor || body.author || null,
        body.coverUrl || body.cover_url || null,
        body.pdfUrl || body.pdf_url || null,
        lastPageRead,
        totalPages,
        percentageRead,
        isCompleted,
        readingTime,
        scrollPosition,
        bookmarks,
        lastLocationDescription,
      ]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Error saving library progress:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
