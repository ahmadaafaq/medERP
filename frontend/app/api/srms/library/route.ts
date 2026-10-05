import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backend-config';

function formatSrmsMediaUrl(rawPath: string | null | undefined): string | null {
  if (!rawPath || rawPath === '0' || rawPath.trim() === '') return null;
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) return rawPath;

  // Convert Windows path: D:\Webapplication\library\Library\Cataloguing\BookUploads\1\...
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

const BACKEND_URL = getBackendBaseUrl();

async function fetchFromPostgres(tenantSlug: string, colg: string, searchvalue: string) {
  try {
    const params = new URLSearchParams();
    if (searchvalue) params.set('search', searchvalue);
    if (colg) params.set('colg_cd', colg);
    params.set('limit', '2000');

    const res = await fetch(`${BACKEND_URL}/api/v1/library/books?${params.toString()}`, {
      headers: {
        'x-tenant-slug': tenantSlug,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      return list.map((b: any) => ({
        ttl_id: b.ttl_id || b.titleid || b.id,
        titleid: b.titleid || b.ttl_id || b.id,
        title: b.title || `Catalog Book ${b.ttl_id || ''}`.trim(),
        author: b.author || 'Academic Publication',
        cover_url: b.cover_url || null,
        pdf_url: b.pdf_url || null,
        external_link: b.external_link || null,
        has_digital_media: Boolean(b.has_digital_media || b.cover_url || b.pdf_url || b.external_link),
        raw_cover: b.raw_cover,
        raw_pdf: b.raw_pdf,
        raw_link: b.raw_link,
      }));
    }
  } catch (err) {
    console.error('Failed to query fallback books from PostgreSQL:', err);
  }
  return [];
}

async function syncToPostgres(tenantSlug: string, books: any[], colg: string) {
  try {
    await fetch(`${BACKEND_URL}/api/v1/library/books/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
      },
      body: JSON.stringify({ books, colg_cd: colg }),
    });
  } catch (e: any) {
    console.error('Failed to persist books to PostgreSQL:', e?.message || e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const searchvalue = body.searchvalue || '';
    const colg = body.colg || body.colg_cd || '1';
    const source = body.source || '';
    const tenantSlug = req.headers.get('x-tenant-slug') || body.tenantSlug || 'srms-cet-bareilly';

    // If source is explicitly 'db', serve directly from PostgreSQL database
    if (source === 'db') {
      const dbBooks = await fetchFromPostgres(tenantSlug, colg, searchvalue);
      return NextResponse.json({
        success: true,
        source: 'postgresql',
        count: dbBooks.length,
        digital_count: dbBooks.filter((b: any) => b.has_digital_media).length,
        data: dbBooks,
      });
    }

    let rawList: any[] = [];
    let srmsSuccess = false;

    try {
      const response = await fetch('https://myportal.srms.ac.in/Library/EBook/searchbookbyTopic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        body: JSON.stringify({
          searchvalue,
          colg: String(colg),
        }),
        cache: 'no-store',
      });

      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json)) {
          rawList = json;
          srmsSuccess = true;
        }
      }
    } catch (fetchErr) {
      console.warn('SRMS live endpoint unreachable, falling back to PostgreSQL:', fetchErr);
    }

    // If SRMS failed or returned empty, fallback to PostgreSQL database
    if (!srmsSuccess || rawList.length === 0) {
      const dbBooks = await fetchFromPostgres(tenantSlug, colg, searchvalue);
      if (dbBooks.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'postgresql_fallback',
          count: dbBooks.length,
          digital_count: dbBooks.filter((b: any) => b.has_digital_media).length,
          data: dbBooks,
        });
      }
    }

    // Process and enrich book records
    const processedBooks = rawList
      .filter((b) => b && (b.ttl_id || b.titleid || b.author_name || b.Topics))
      .map((b) => {
        const coverUrl = formatSrmsMediaUrl(b.coverpage);
        const pdfUrl = formatSrmsMediaUrl(b.pdf);
        const externalLink = b.link && b.link !== '0' && b.link.trim() !== '' ? b.link.trim() : null;

        // Clean up title / topic
        let cleanTitle = b.Topics ? b.Topics.trim() : '';
        if ((!cleanTitle || cleanTitle === '-' || cleanTitle === '--') && (b.coverpage || b.pdf)) {
          const mediaPath = (b.coverpage && b.coverpage !== '0') ? b.coverpage : b.pdf;
          if (mediaPath && mediaPath !== '0') {
            const parts = mediaPath.split('\\');
            const fileName = parts[parts.length - 1] || '';
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ').trim();
            if (nameWithoutExt && nameWithoutExt !== b.ttl_id) {
              cleanTitle = nameWithoutExt;
            }
          }
        }
        if (!cleanTitle || cleanTitle === '-' || cleanTitle === '--') {
          cleanTitle = `Catalog Book ${b.ttl_id || b.titleid || ''}`.trim();
        }

        const author = b.author_name ? b.author_name.trim() : 'Academic Publication';
        const hasDigitalMedia = Boolean(coverUrl || pdfUrl || externalLink);

        return {
          ttl_id: b.ttl_id || b.titleid || '',
          titleid: b.titleid || b.ttl_id || '',
          title: cleanTitle,
          author: author,
          cover_url: coverUrl,
          pdf_url: pdfUrl,
          external_link: externalLink,
          has_digital_media: hasDigitalMedia,
          raw_cover: b.coverpage,
          raw_pdf: b.pdf,
          raw_link: b.link,
          colg_cd: String(colg),
        };
      });

    // Asynchronously ensure books are stored into PostgreSQL
    if (processedBooks.length > 0) {
      syncToPostgres(tenantSlug, processedBooks, colg).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      source: 'srms_live',
      count: processedBooks.length,
      digital_count: processedBooks.filter((b) => b.has_digital_media).length,
      data: processedBooks,
    });
  } catch (error: any) {
    console.error('Error fetching SRMS EBook Library:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal Server Error', data: [] },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const searchvalue = searchParams.get('searchvalue') || searchParams.get('search') || '';
  const colg = searchParams.get('colg') || searchParams.get('colg_cd') || '1';
  const source = searchParams.get('source') || '';

  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ searchvalue, colg, source }),
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': req.headers.get('x-tenant-slug') || 'srms-cet-bareilly',
      },
    })
  );
}
