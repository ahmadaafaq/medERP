'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  colg_cd: string;
  course_cd: string;
  branch_cd: string;
  batch_cd: string;
  sem_cd: string;
  subject_id?: string;
  unit_id?: string;
  topic_id?: string;
  subtopic_id?: string;
  empid: string;
  faculty_name?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function RecentLessonsWidget({ role = 'FACULTY' }: { role?: string }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLessons();
  }, []);

  const fetchRecentLessons = async () => {
    try {
      setLoading(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/lessons/recent?tenant=${tenant}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setLessons(json.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch recent lessons for widget:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (id: number) => {
    const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
    window.open(`${API_BASE}/lessons/${id}/download?tenant=${tenant}`, '_blank');
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileMeta = (fileType?: string, fileName?: string) => {
    const typeStr = `${fileType || ''} ${fileName || ''}`.toLowerCase();
    if (typeStr.includes('pdf')) {
      return { icon: '📄', label: 'PDF', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30' };
    }
    if (typeStr.includes('doc') || typeStr.includes('word')) {
      return { icon: '📝', label: 'DOC', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' };
    }
    if (typeStr.includes('xls') || typeStr.includes('excel') || typeStr.includes('sheet')) {
      return { icon: '📊', label: 'XLS', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' };
    }
    if (typeStr.includes('jpg') || typeStr.includes('jpeg') || typeStr.includes('png') || typeStr.includes('img') || typeStr.includes('image')) {
      return { icon: '🖼️', label: 'IMG', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30' };
    }
    if (typeStr.includes('txt')) {
      return { icon: '📑', label: 'TXT', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30' };
    }
    return { icon: '📎', label: (fileType || 'FILE').toUpperCase(), bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30' };
  };

  const getCurriculumLink = () => {
    if (role === 'ADMIN') return '/dashboard/admin/assessment';
    if (role === 'CLERK') return '/dashboard/clerk/assessment';
    return '/dashboard/faculty/curriculum';
  };

  return (
    <div className="h-full flex flex-col justify-between bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md transition-all">
      {/* Header - Standardized Height & Alignment */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E7EAF3] dark:border-slate-800 shrink-0 min-h-[48px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00C48C] to-teal-500 flex items-center justify-center text-white text-lg shadow-md shadow-emerald-500/20 shrink-0">
            📚
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#F36C21] uppercase tracking-wide font-sans truncate">
              LESSON UPLOADS & MATERIALS
            </h3>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-semibold truncate">
              Study material & lecture slide notes
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2">
          <span className="text-[11px] font-bold text-[#5B4BFF] dark:text-indigo-400 bg-[#5B4BFF]/10 px-2.5 py-0.5 rounded-full">
            {lessons.length} File{lessons.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Content - Top Aligned without empty space */}
      <div className="flex-1 pt-3.5 space-y-2.5 flex flex-col justify-start">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#7B8794] font-medium animate-pulse my-auto">
            Loading recent lesson files...
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#7B8794] border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-2xl space-y-1 my-auto">
            <p className="font-bold text-[#1B1E28] dark:text-slate-200">No lesson materials uploaded yet</p>
            <p className="text-[11px]">Uploaded study materials and lecture notes will appear here automatically.</p>
          </div>
        ) : (
          lessons.map((item) => {
            const meta = getFileMeta(item.file_type, item.file_name);
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-[#F6F8FC]/60 dark:bg-slate-800/60 border border-[#E7EAF3] dark:border-slate-700/80 hover:border-[#5B4BFF]/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between gap-3 text-xs shadow-xs"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[#1B1E28] dark:text-white truncate">
                      {item.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] inline-flex items-center gap-1 ${meta.bg}`}>
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                      <span className="opacity-70 font-semibold">({formatBytes(item.file_size)})</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#4E5969] dark:text-slate-400 font-medium flex-wrap">
                    <span>📖 {item.topic_id || item.subject_id || 'Curriculum Module'}</span>
                    <span>👨‍🏫 {item.faculty_name || item.empid || 'Faculty Member'}</span>
                    <span>🗓️ {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDownload(item.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4838e6] text-white font-extrabold text-xs shrink-0 shadow-sm transition-all flex items-center gap-1 hover:scale-105 cursor-pointer"
                >
                  <span>📥</span>
                  <span>Download</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link - Standardized Position */}
      <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 shrink-0 mt-auto flex items-center justify-between text-xs font-bold text-[#4E5969] dark:text-slate-400">
        <span>{lessons.length} study resource{lessons.length === 1 ? '' : 's'}</span>
        <Link
          href={getCurriculumLink()}
          className="text-[#5B4BFF] hover:underline font-extrabold flex items-center gap-1"
        >
          <span>Curriculum Hub</span>
          <span>➔</span>
        </Link>
      </div>
    </div>
  );
}
