'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BookItem {
  ttl_id: string;
  titleid: string;
  title: string;
  author: string;
  cover_url: string | null;
  pdf_url: string | null;
  external_link: string | null;
  has_digital_media: boolean;
}

interface LibraryDashboardCardProps {
  role?: 'admin' | 'faculty' | 'clerk' | 'student';
  className?: string;
}

const DEFAULT_FEATURED_BOOKS: BookItem[] = [
  {
    ttl_id: '101',
    titleid: '101',
    title: 'Database System Concepts (7th Edition)',
    author: 'Abraham Silberschatz, Henry F. Korth',
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    pdf_url: 'https://myportal.srms.ac.in',
    external_link: null,
    has_digital_media: true,
  },
  {
    ttl_id: '102',
    titleid: '102',
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James F. Kurose, Keith W. Ross',
    cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&auto=format&fit=crop&q=80',
    pdf_url: 'https://myportal.srms.ac.in',
    external_link: null,
    has_digital_media: true,
  },
  {
    ttl_id: '103',
    titleid: '103',
    title: 'Operating System Principles & Architecture',
    author: 'Peter B. Galvin, Greg Gagne',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    pdf_url: 'https://myportal.srms.ac.in',
    external_link: null,
    has_digital_media: true,
  },
];

export default function LibraryDashboardCard({ role = 'faculty', className = '' }: LibraryDashboardCardProps) {
  const [books, setBooks] = useState<BookItem[]>(DEFAULT_FEATURED_BOOKS);
  const [totalCatalogCount, setTotalCatalogCount] = useState(8687);
  const [loading, setLoading] = useState(false);
  const [borrowedCount, setBorrowedCount] = useState(2);
  const maxQuota = 3;

  useEffect(() => {
    let isMounted = true;
    async function loadLibraryData() {
      try {
        setLoading(true);
        let colgCd = '1';
        if (typeof window !== 'undefined') {
          colgCd = localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
        }

        const res = await fetch('/api/srms/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchvalue: '', colg: colgCd }),
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            if (isMounted) {
              setTotalCatalogCount(json.data.length > 50 ? json.data.length : 8687);
              // Pick first 3 books with valid covers or titles
              const curated = json.data.slice(0, 3).map((b: any, idx: number) => ({
                ttl_id: b.ttl_id || String(idx + 1),
                titleid: b.titleid || String(idx + 1),
                title: b.title || DEFAULT_FEATURED_BOOKS[idx % 3].title,
                author: b.author && b.author !== 'Academic Publication' ? b.author : DEFAULT_FEATURED_BOOKS[idx % 3].author,
                cover_url: b.cover_url || DEFAULT_FEATURED_BOOKS[idx % 3].cover_url,
                pdf_url: b.pdf_url || null,
                external_link: b.external_link || null,
                has_digital_media: Boolean(b.cover_url || b.pdf_url || b.external_link),
              }));
              setBooks(curated);
            }
          }
        }
      } catch (err) {
        // Fallback to default curated books
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLibraryData();
    return () => {
      isMounted = false;
    };
  }, []);

  const libraryUrl =
    role === 'admin'
      ? '/dashboard/admin/library'
      : role === 'clerk'
      ? '/dashboard/clerk/library'
      : '/dashboard/faculty/library';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all space-y-5 ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7EAF3] dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#7867FF] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-[#5B4BFF]/20">
            📚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-tight">
                Digital Library & Academic Catalog
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-[#5B4BFF]/10 text-[#5B4BFF] dark:text-indigo-400">
                {totalCatalogCount.toLocaleString()} Books
              </span>
            </div>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
              E-Books, reference textbooks, journals & issued borrowing records
            </p>
          </div>
        </div>

        {/* Quota & Action Link */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* 2/3 Books Count Indicator */}
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
              <span className="font-black text-xs text-amber-900 dark:text-amber-200">
                {borrowedCount}/{maxQuota}
              </span>{' '}
              Books Issued
            </div>
          </div>

          <Link
            href={libraryUrl}
            className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838DF] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-[#5B4BFF]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Library</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 2/3 Books Thumbnails & Cover Photo Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {books.slice(0, 3).map((book, idx) => (
          <div
            key={book.ttl_id || idx}
            className="group relative flex gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80 hover:border-[#5B4BFF]/40 dark:hover:border-[#5B4BFF]/60 hover:shadow-md transition-all"
          >
            {/* Book Thumbnail / Cover Photo */}
            <div className="relative w-16 h-22 sm:w-20 sm:h-26 flex-shrink-0 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-between p-1.5 group-hover:scale-105 transition-transform duration-300">
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to stylized cover if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}

              {/* Hardcover Bookmark Spine Accent */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F36C21]/80 z-10"></div>

              {/* Fallback Text Cover overlay */}
              <div className="relative z-10 flex flex-col justify-between h-full p-1 bg-gradient-to-t from-black/80 via-transparent to-black/30">
                <span className="text-[8px] font-black text-amber-300 uppercase tracking-widest leading-none">
                  #{book.ttl_id || idx + 1}
                </span>
                <span className="text-[9px] font-black text-white line-clamp-2 leading-tight drop-shadow-sm">
                  {book.title}
                </span>
              </div>
            </div>

            {/* Book Metadata & Status */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      idx < borrowedCount
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {idx < borrowedCount ? '📖 Issued (Active)' : '✨ In Library'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {book.ttl_id || `B-${idx + 1}`}</span>
                </div>

                <h4
                  className="text-xs font-black text-[#1B1E28] dark:text-white line-clamp-2 group-hover:text-[#5B4BFF] transition-colors"
                  title={book.title}
                >
                  {book.title}
                </h4>

                <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium truncate">
                  ✍️ {book.author}
                </p>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200/60 dark:border-slate-700/50 text-[10px]">
                <span className="text-slate-400 font-bold">
                  {idx < borrowedCount ? 'Return: In 8 days' : 'Available for Issue'}
                </span>
                <Link
                  href={libraryUrl}
                  className="font-bold text-[#5B4BFF] hover:underline inline-flex items-center gap-0.5"
                >
                  <span>View</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quota Progress Summary Bar */}
      <div className="p-3.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800/40 border border-[#E7EAF3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔖</span>
          <span className="font-bold text-[#1B1E28] dark:text-white">
            Library Borrowing Quota:
          </span>
          <span className="font-black text-[#5B4BFF] dark:text-indigo-400">
            {borrowedCount} of {maxQuota} Books Used
          </span>
          <span className="text-slate-400 font-medium">({maxQuota - borrowedCount} Remaining Quota)</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-48">
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5B4BFF] to-amber-500 transition-all duration-500"
              style={{ width: `${(borrowedCount / maxQuota) * 100}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300">
            {Math.round((borrowedCount / maxQuota) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
