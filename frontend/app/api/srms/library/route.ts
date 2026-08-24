import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const searchvalue = body.searchvalue || '';
    const colg = body.colg || body.colg_cd || '1';

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

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `SRMS API responded with status ${response.status}`, data: [] },
        { status: response.status }
      );
    }

    const rawList: any[] = await response.json();
    if (!Array.isArray(rawList)) {
      return NextResponse.json({ success: true, count: 0, data: [] });
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
          author: author,
          cover_url: coverUrl,
          pdf_url: pdfUrl,
          external_link: externalLink,
          has_digital_media: hasDigitalMedia,
          raw_cover: b.coverpage,
          raw_pdf: b.pdf,
          raw_link: b.link,
        };
      });

    return NextResponse.json({
      success: true,
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
  const searchvalue = searchParams.get('searchvalue') || '';
  const colg = searchParams.get('colg') || searchParams.get('colg_cd') || '1';

  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ searchvalue, colg }),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}
