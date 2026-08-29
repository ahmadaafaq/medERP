'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';

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

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentLessons();
  }, []);

  const fetchStudentLessons = async () => {
    try {
      setLoading(true);
      const tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly';
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '';

      const res = await fetch(`${API_BASE}/lessons?tenant=${tenant}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setLessons(json.data || []);
      }
    } catch (err) {
      console.warn('Error loading student lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.topic_id && item.topic_id.toLowerCase().includes(term)) ||
      (item.subject_id && item.subject_id.toLowerCase().includes(term)) ||
      (item.faculty_name && item.faculty_name.toLowerCase().includes(term))
    );
  });

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

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-[#0F172A] text-[#1B1E28] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar role="student" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Student Lessons & Study Material Portal" />
        <main className="p-6 space-y-6 flex-1 flex flex-col">

          {/* Search & Header Section */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📚</span>
                <span>Course Lessons & Learning Resources</span>
              </h2>
              <p className="text-xs text-[#7B8794] font-medium mt-1">
                Access authentic lecture slides, PDF notes, assignments, and study materials uploaded by your faculty.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Search lessons or topics..."
                className="w-full bg-[#F6F8FC] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Lessons Grid Cards */}
          {loading ? (
            <div className="py-16 text-center text-xs text-[#7B8794] font-medium animate-pulse">
              Loading authentic study materials from database...
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#7B8794] border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-[22px] space-y-2">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">No lessons found matching your criteria</p>
              <p className="text-[#7B8794]">Uploaded study materials from your department faculty will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLessons.map((item) => {
                const meta = getFileMeta(item.file_type, item.file_name);
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/60 transition-all space-y-3 shadow-soft group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${meta.bg}`}>
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                          <span className="opacity-70 font-semibold">({formatBytes(item.file_size)})</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#7B8794]">
                          Semester: {item.sem_cd ? String(item.sem_cd).replace('S', '') : '1'}
                        </span>
                      </div>

                    <h4 className="font-extrabold text-sm text-[#1B1E28] dark:text-white group-hover:text-[#5B4BFF] transition-colors leading-snug">
                      {item.title}
                    </h4>

                    {item.topic_id && (
                      <p className="text-xs text-[#5B4BFF] dark:text-indigo-400 font-semibold flex items-center gap-1">
                        <span>📖</span>
                        <span>{item.topic_id}</span>
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-[#7B8794] dark:text-slate-400 leading-normal line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                    <div className="pt-3 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#1B1E28] dark:text-slate-200">👨‍🏫 {item.faculty_name || item.empid}</p>
                        <p className="text-[10px] text-[#7B8794]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.open(`${API_BASE}/lessons/${item.id}/download?tenant=${localStorage.getItem('tenantSlug') || 'srms-cet-bareilly'}`, '_blank')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3cf5] text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>📥 Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
