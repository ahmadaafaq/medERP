'use client';

import React, { useState, useEffect } from 'react';
import IncubationHustleBoardModal, { IncubationItem } from './IncubationHustleBoardModal';

interface IncubationCellCardProps {
  role?: string;
  className?: string;
}

export default function IncubationCellCard({ role = 'faculty', className = '' }: IncubationCellCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<IncubationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getTenantSlug = () => {
    if (typeof window !== 'undefined') {
      const slug = localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || '';
      return slug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    }
    return '';
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const slug = getTenantSlug();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(slug ? { 'x-tenant-slug': slug, 'x-tenant': slug } : {}),
      };

      const res = await fetch(`/api/incubation-cell/projects${slug ? `?tenant=${slug}` : ''}`, { headers }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setProjects(list);
        setLoading(false);
        return;
      }

      const directRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'}/incubation-cell/projects${slug ? `?tenant=${slug}` : ''}`, { headers }).catch(() => null);
      if (directRes && directRes.ok) {
        const json = await directRes.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setProjects(list);
      } else {
        setProjects([]);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Compute metrics from actual fetched projects
  const totalProjects = projects.length;
  const fundedCount = projects.filter((p) => p.incubationStatus === 'Funded' || (p.fundingAmount && p.fundingAmount > 0)).length;
  const selectedCount = projects.filter((p) => p.incubationStatus === 'Selected' || p.incubationStatus === 'Incubated').length;
  
  // Latest project description if any exist
  const latestProject = projects[0] || null;

  // Top Student Innovators for Avatar Row (Unique students)
  const uniqueStudents = Array.from(
    new Map(projects.map((p) => [p.studentRegNo || p.studentName, p])).values()
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsModalOpen(true);
        }}
        className={`bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft hover:shadow-md hover:border-[#5B4BFF] transition-all block group space-y-2.5 cursor-pointer relative overflow-hidden text-left ${className}`}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5B4BFF] animate-pulse"></span>
            Incubation Records
          </span>
          <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
            🚀
          </span>
        </div>

        {/* Total Ventures & Sub-counts */}
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-black text-[#5B4BFF] dark:text-indigo-400">
            {loading ? '...' : `${totalProjects} Ventures`}
          </p>
          <span className="text-[11px] font-black text-[#00C48C]">
            {fundedCount} Funded • {selectedCount} Shortlisted
          </span>
        </div>

        {/* Latest Incubated Project Description Highlight Box */}
        {latestProject ? (
          <div className="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40">
            <div className="flex items-center justify-between text-[10px] font-black text-purple-900 dark:text-purple-300">
              <span className="flex items-center gap-1 truncate">
                <span>🌟</span>
                <span className="truncate">Latest: {latestProject.title}</span>
              </span>
              {latestProject.score ? (
                <span className="shrink-0 font-extrabold text-[#F36C21]">{latestProject.score}% ⭐</span>
              ) : null}
            </div>
            <p className="text-xs font-bold text-[#1B1E28] dark:text-white truncate line-clamp-1 mt-0.5" title={latestProject.description}>
              {latestProject.description || 'Innovation project nominated for incubation.'}
            </p>
            <p className="text-[9px] text-[#4E5969] dark:text-slate-400 font-medium truncate mt-0.5">
              Lead: <strong className="text-indigo-600 dark:text-indigo-300">{latestProject.studentName}</strong> {latestProject.courseName ? `(${latestProject.courseName})` : ''}
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
            <span className="text-sm">💡</span>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              No incubation ventures registered yet.
            </p>
          </div>
        )}

        {/* Side-by-Side / Overlapping Student Profile Pictures */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-500/20">
              {totalProjects > 0 ? 'Top: #1 Rank' : 'Active R&D'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-black border border-purple-500/20">
              {uniqueStudents.length} Innovators
            </span>
          </div>

          {/* Side-by-side Avatar Circles */}
          {uniqueStudents.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {uniqueStudents.slice(0, 3).map((st, idx) => (
                <div
                  key={st.studentRegNo || idx}
                  className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 shadow-sm flex items-center justify-center font-black text-[8px] text-white"
                  style={{
                    backgroundColor: idx === 0 ? '#5B4BFF' : idx === 1 ? '#F36C21' : '#00C48C',
                    zIndex: 10 - idx,
                  }}
                  title={`Rank #${idx + 1}: ${st.studentName} (${st.courseName || 'Student'})`}
                >
                  {st.studentPhoto ? (
                    <img
                      src={st.studentPhoto}
                      alt={st.studentName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span>{st.studentName ? st.studentName.charAt(0) : 'S'}</span>
                </div>
              ))}
              {uniqueStudents.length > 3 && (
                <div
                  className="relative w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[#5B4BFF] dark:text-indigo-400 flex items-center justify-center font-black text-[8px] ring-2 ring-white dark:ring-slate-900 shadow-sm"
                  style={{ zIndex: 5 }}
                  title={`${uniqueStudents.length - 3} more student innovators`}
                >
                  +{uniqueStudents.length - 3}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">0 records</span>
          )}
        </div>

        {/* Progress Bar & Interactive Action Link */}
        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5B4BFF] via-[#7867FF] to-[#F36C21] transition-all duration-500"
              style={{
                width: `${totalProjects > 0 ? Math.min(100, Math.max(25, (totalProjects / 10) * 100)) : 0}%`
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span className="font-bold text-[#5B4BFF] dark:text-indigo-400">
              ⚡ Hustle Board {totalProjects > 0 ? 'Active' : 'Ready'}
            </span>
            <span className="text-[#F36C21] font-bold group-hover:underline flex items-center gap-0.5">
              Open Hustle Board ➔
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Hustle Board Modal Dialog */}
      <IncubationHustleBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
      />
    </>
  );
}
