'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Library, 
  Filter, 
  CheckCircle2, 
  Copy, 
  BookMarked,
  Download,
  Eye,
  GraduationCap
} from 'lucide-react';

interface BookItem {
  ttl_id: string;
  titleid: string;
  title: string;
  author: string;
  cover_url: string | null;
  pdf_url: string | null;
  external_link: string | null;
  has_digital_media: boolean;
  raw_cover?: string | null;
  raw_pdf?: string | null;
  raw_link?: string | null;
}

export default function DigitalLibraryPortal({ role = 'student' }: { role?: string }) {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'digital' | 'all'>('digital');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let colgCd = '1';
      if (typeof window !== 'undefined') {
        colgCd = localStorage.getItem('colg_cd') || '1';
      }

      const res = await fetch('/api/srms/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchvalue: '', colg: colgCd }),
      });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setBooks(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load digital library books:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      // 1. Tab filter
      if (activeTab === 'digital' && !b.has_digital_media) {
        return false;
      }

      // 2. Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = b.title?.toLowerCase().includes(q);
        const matchesAuthor = b.author?.toLowerCase().includes(q);
        const matchesId = b.ttl_id?.toLowerCase().includes(q) || b.titleid?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesId) return false;
      }

      // 3. Subject filter
      if (selectedSubjectFilter !== 'ALL') {
        const t = (b.title + ' ' + b.author).toLowerCase();
        if (selectedSubjectFilter === 'PHARMACY' && !t.includes('pharmacy') && !t.includes('medic') && !t.includes('drug')) return false;
        if (selectedSubjectFilter === 'COMPUTER' && !t.includes('computer') && !t.includes('c++') && !t.includes('program') && !t.includes('software') && !t.includes('web') && !t.includes('data')) return false;
        if (selectedSubjectFilter === 'MANAGEMENT' && !t.includes('management') && !t.includes('marketing') && !t.includes('business') && !t.includes('finance')) return false;
      }

      return true;
    });
  }, [books, activeTab, searchTerm, selectedSubjectFilter]);

  const digitalCount = useMemo(() => books.filter((b) => b.has_digital_media).length, [books]);

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2D2575] via-[#5B4BFF] to-[#7867FF] rounded-[22px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Library className="w-72 h-72" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black tracking-wide text-orange-200">
            <Sparkles className="w-3.5 h-3.5 text-[#F36C21]" />
            <span>SRMS Centralized E-Book &amp; Digital Library</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Digital Academic E-Library &amp; Catalog
          </h1>

          <p className="text-xs sm:text-sm text-purple-100/90 font-medium leading-relaxed">
            Access over 8,600+ university textbooks, research journals, reference volumes, and digital PDF publications synchronized directly from the SRMS Central Library.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono font-bold">
            <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#F36C21]" />
              <span>{digitalCount} Full Digital E-Books (PDF / Media)</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>{books.length} Total Catalog Titles</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-4 sm:p-5 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-[#F6F8FC] dark:bg-slate-800 rounded-xl border border-[#E7EAF3] dark:border-slate-700 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('digital')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'digital'
                  ? 'bg-[#F36C21] text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#F36C21]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Digital E-Books ({digitalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#F36C21] text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#F36C21]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Catalog Books ({books.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, author, title ID..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E7EAF3] dark:border-slate-700 bg-[#F6F8FC] dark:bg-slate-800 text-[#1B1E28] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F36C21]"
            />
          </div>

        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E7EAF3] dark:border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter By:
          </span>
          {['ALL', 'PHARMACY', 'COMPUTER', 'MANAGEMENT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedSubjectFilter(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedSubjectFilter === cat
                  ? 'bg-[#F36C21] text-white shadow-sm'
                  : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-[#F36C21]'
              }`}
            >
              {cat === 'ALL' ? 'All Subjects' : cat}
            </button>
          ))}
          <span className="text-slate-400 text-[11px] ml-auto font-mono">
            Showing {filteredBooks.length} titles
          </span>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-16 text-center text-slate-400 animate-pulse font-bold">
          Loading SRMS Centralized E-Library Catalog...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center text-slate-400 space-y-2">
          <BookMarked className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No books found matching your criteria</h3>
          <p className="text-xs">Try adjusting your search query or selecting a different subject filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBooks.slice(0, 80).map((b, idx) => (
            <div
              key={b.ttl_id || idx}
              className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] overflow-hidden shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-[#F36C21]/50"
            >
              {/* Top Cover Image / Fallback Art */}
              <div className="relative h-48 w-full bg-gradient-to-br from-slate-900 via-slate-800 to-[#0F172A] overflow-hidden flex items-center justify-center p-3 text-center">
                {b.cover_url ? (
                  <img
                    src={b.cover_url}
                    alt={b.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-lg"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="space-y-2 p-4">
                    <GraduationCap className="w-10 h-10 text-[#F36C21] mx-auto opacity-80" />
                    <p className="text-xs font-black text-white line-clamp-3 leading-snug">
                      {b.title}
                    </p>
                  </div>
                )}

                {/* Badges on Cover */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
                  {b.pdf_url && (
                    <span className="bg-[#00C48C] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                      PDF Ready
                    </span>
                  )}
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20">
                    {b.ttl_id || 'SRMS'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3
                    className="text-xs font-black text-[#1B1E28] dark:text-white line-clamp-2 group-hover:text-[#F36C21] transition-colors"
                    title={b.title}
                  >
                    {b.title}
                  </h3>
                  <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-bold truncate">
                    By: {b.author}
                  </p>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-[#E7EAF3] dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>ID: {b.ttl_id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(b.ttl_id)}
                      className="hover:text-[#F36C21] flex items-center gap-1 cursor-pointer"
                      title="Copy Book Title ID"
                    >
                      {copiedId === b.ttl_id ? (
                        <span className="text-[#00C48C] font-bold">Copied!</span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.pdf_url ? (
                      <a
                        href={b.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read PDF</span>
                      </a>
                    ) : b.external_link ? (
                      <a
                        href={b.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Access Link</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(b.ttl_id)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <span>Catalog Volume</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
