'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { ComplianceReportData } from './AcademicComplianceWidget';

interface ComplianceReportViewProps {
  role?: 'admin' | 'hod';
}

export default function ComplianceReportView({ role = 'admin' }: ComplianceReportViewProps) {
  const [data, setData] = useState<ComplianceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const slug = (
        (typeof window !== 'undefined'
          ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || ''
          : '') || 'mdis'
      ).replace(/^tenant_/, '').replace(/^tenant-/, '');

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const userId = u.id || u.sub || '';

      const qp = new URLSearchParams({ tenant: slug });
      if (role === 'hod' && userId) {
        qp.set('hodUserId', userId);
      }

      const headers: Record<string, string> = {
        'x-tenant-slug': slug,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res = await fetch(`/api/v1/analytics/compliance-report?${qp.toString()}`, {
        headers,
        cache: 'no-store',
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/analytics/compliance-report?${qp.toString()}`, {
          headers,
          cache: 'no-store',
        }).catch(() => null);
      }

      if (res && res.ok) {
        const json = await res.json();
        const payload = json?.data ?? json;
        if (payload && typeof payload === 'object' && payload.pillars) {
          setData(payload);
        } else {
          throw new Error('Invalid compliance report format.');
        }
      } else {
        throw new Error('Failed to retrieve academic compliance report.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch compliance report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [role]);

  // Unique Courses & Departments for dropdown filters
  const coursesList = useMemo(() => {
    if (!data?.departments) return [];
    const map = new Map<string, string>();
    for (const d of data.departments) {
      if (d.courseCd) map.set(d.courseCd, d.courseName);
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [data]);

  const deptsList = useMemo(() => {
    if (!data?.departments) return [];
    const map = new Map<string, string>();
    for (const d of data.departments) {
      if (d.departmentId) map.set(d.departmentId, d.departmentName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Filtered department rows
  const filteredDepartments = useMemo(() => {
    if (!data?.departments) return [];
    return data.departments.filter(d => {
      const matchCourse = selectedCourseFilter === 'ALL' || d.courseCd === selectedCourseFilter;
      const matchDept = selectedDeptFilter === 'ALL' || d.departmentId === selectedDeptFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || (
        d.departmentName.toLowerCase().includes(q) ||
        d.departmentCode.toLowerCase().includes(q) ||
        d.courseName.toLowerCase().includes(q) ||
        d.hodName.toLowerCase().includes(q)
      );
      return matchCourse && matchDept && matchSearch;
    });
  }, [data, selectedCourseFilter, selectedDeptFilter, searchQuery]);

  // Department compliance counts for Pie chart
  const compliantCount = data?.departments?.filter(d => d.overallScore >= 80).length || 0;
  const partialCount = data?.departments?.filter(d => d.overallScore >= 60 && d.overallScore < 80).length || 0;
  const attentionCount = data?.departments?.filter(d => d.overallScore < 60).length || 0;
  const totalDepts = data?.departments?.length || 1;

  // Pie chart slice calculation
  const p1 = (compliantCount / totalDepts) * 100;

  const score = data?.overallScore || 0;

  return (
    <div className="flex h-screen bg-[#F6F8FC] dark:bg-slate-950 overflow-hidden font-sans">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header title="Academic & Operational Compliance Report" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Top Title & Actions Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B4BFF] to-[#F36C21] text-white flex items-center justify-center text-2xl font-black shadow-md shadow-indigo-500/20">
                📊
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white tracking-tight">
                    Academic &amp; Operational Compliance Report
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] border border-indigo-200 dark:border-indigo-800">
                    {role === 'hod' ? 'HOD Scoped View' : 'Institution Executive View'}
                  </span>
                </div>
                <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
                  Automated department &amp; course-wise auditing across CO-PO mapping, timetable, question bank, lesson plans &amp; attendance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4a3be6] hover:to-[#6756eb] text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>🖨️</span>
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              {/* Course Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Course:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={e => setSelectedCourseFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Courses ({coursesList.length})</option>
                  {coursesList.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Department / Branch:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={e => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs focus:outline-none focus:border-[#5B4BFF]"
                >
                  <option value="ALL">All Departments ({deptsList.length})</option>
                  {deptsList.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Search */}
            <div className="w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search department, course, HOD..."
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Graphical Executive Overview: Pie Chart + 9 Macro Pillars */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-3 border-[#5B4BFF] border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Generating Department Academic Compliance Matrix...
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center space-y-2">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={fetchReport}
                className="px-4 py-1.5 rounded-xl bg-[#5B4BFF] text-white text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : !data ? null : (
            <>
              {/* Graphical Overview Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Visual Chart Card */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-6 flex flex-col items-center justify-between">
                  <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">
                      Department Compliance Distribution
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {totalDepts} Department{totalDepts > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Pure React SVG Donut & Segmented Pie */}
                  <div className="py-6 flex flex-col items-center justify-center">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                        {/* Outer base track */}
                        <circle cx="80" cy="80" r="62" stroke="currentColor" strokeWidth="18" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                        {/* Compliant Slice (Green) */}
                        <circle
                          cx="80"
                          cy="80"
                          r="62"
                          stroke="#00C48C"
                          strokeWidth="18"
                          strokeDasharray={2 * Math.PI * 62}
                          strokeDashoffset={(2 * Math.PI * 62) * (1 - (p1 / 100))}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      {/* Center Score */}
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-[#1B1E28] dark:text-white">
                          {score}%
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : score >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                          {(data.overallStatus || 'NEEDS_ATTENTION').replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Compliant (80%+)</p>
                        <p className="text-base font-black text-emerald-700 dark:text-emerald-400">{compliantCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Moderate (60-79%)</p>
                        <p className="text-base font-black text-amber-700 dark:text-amber-400">{partialCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                        <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300">Attention (&lt;60%)</p>
                        <p className="text-base font-black text-rose-700 dark:text-rose-400">{attentionCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9 Macro Pillars Cards Grid */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-6 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">
                      The 9 Institutional Academic Compliance Pillars
                    </h3>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Standardized Quality Scorecard
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { icon: '🎯', label: '1. CO-PO Matrix Mapping', stat: data.pillars.copoMapping },
                      { icon: '📅', label: '2. Timetable Up-to-date', stat: data.pillars.timetable },
                      { icon: '📚', label: '3. Question Bank & Bloom\'s', stat: data.pillars.questionBank },
                      { icon: '📝', label: '4. Question Design Paper', stat: data.pillars.questionDesign },
                      { icon: '✅', label: '5. Academic Approvals', stat: data.pillars.approvals },
                      { icon: '📖', label: '6. Lesson Plan Materials', stat: data.pillars.lessonPlan },
                      { icon: '💬', label: '7. Academic Chats', stat: data.pillars.chats },
                      { icon: '💼', label: '8. Portfolio (Seminar/MiniProj)', stat: data.pillars.portfolio },
                      { icon: '👥', label: '9. Student Attendance', stat: data.pillars.attendance },
                    ].map(p => (
                      <div key={p.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                            <span>{p.icon}</span>
                            <span className="truncate">{p.label}</span>
                          </span>
                          <span className={`text-xs font-black px-1.5 py-0.5 rounded ${p.stat.score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : p.stat.score >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                            {p.stat.score}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, p.stat.score))}%`,
                              backgroundColor: p.stat.score >= 80 ? '#00C48C' : p.stat.score >= 50 ? '#FFB020' : '#F04438'
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Verified: {p.stat.compliant}</span>
                          <span>Total: {p.stat.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Department & Course Comprehensive Compliance Table */}
              <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Department, Course &amp; Branch Compliance Matrix
                    </h3>
                    <p className="text-xs text-[#4E5969] dark:text-slate-400">
                      Showing {filteredDepartments.length} of {data.departments.length} department branches. Click any row to view subject-level CO-PO mapping checklist.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">Department &amp; HOD</th>
                        <th className="py-3 px-3">Course</th>
                        <th className="py-3 px-3">1. CO-PO Matrix</th>
                        <th className="py-3 px-3">2. Timetable</th>
                        <th className="py-3 px-3">3. Question Bank</th>
                        <th className="py-3 px-3">4. Question Paper</th>
                        <th className="py-3 px-3">5. Approvals</th>
                        <th className="py-3 px-3">6. Lessons</th>
                        <th className="py-3 px-3">8. Portfolio</th>
                        <th className="py-3 px-3">9. Attendance</th>
                        <th className="py-3 px-3 text-right">Overall Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDepartments.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-8 text-center text-slate-400 font-bold">
                            No departments found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredDepartments.map((dept, idx) => {
                          const isExpanded = expandedDeptId === dept.departmentId;
                          return (
                            <React.Fragment key={dept.departmentId || idx}>
                              <tr
                                onClick={() => setExpandedDeptId(isExpanded ? null : dept.departmentId)}
                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                              >
                                <td className="py-3 px-3 font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{dept.departmentName}</span>
                                    <span className="text-[10px] text-indigo-500 font-mono">[{dept.departmentCode}]</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    HOD: <span className="font-bold text-slate-700 dark:text-slate-300">{dept.hodName}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  <div>{dept.courseName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">#{dept.courseCd}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dept.copo.percentage >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : dept.copo.percentage >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                    <span>{dept.copo.mappedSubjects}/{dept.copo.totalSubjects}</span>
                                    <span>({dept.copo.percentage}%)</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dept.timetable.isUpToDate ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                    <span>{dept.timetable.isUpToDate ? '✓ Active Slots' : `${dept.timetable.draftsCount} Draft`}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                                  <span>{dept.questionBank.totalQuestions} Qs</span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {dept.questionPapers.totalPapers} Papers
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dept.approvals.approvalRate >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                    {dept.approvals.approvalRate}%
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {dept.lessons.totalMaterials} Files
                                </td>
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {dept.portfolio.overallScore}%
                                </td>
                                <td className="py-3 px-3 font-extrabold text-cyan-600 dark:text-cyan-400">
                                  {dept.attendance.attendanceRate}%
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black shadow-sm ${dept.overallScore >= 80 ? 'bg-[#00C48C] text-white' : dept.overallScore >= 60 ? 'bg-[#FFB020] text-white' : 'bg-[#F04438] text-white'}`}>
                                    {dept.overallScore}% ({dept.overallGrade})
                                  </span>
                                </td>
                              </tr>

                              {/* Accordion Row Details: Subject-wise checklist */}
                              {isExpanded && (
                                <tr className="bg-slate-50/80 dark:bg-slate-800/60">
                                  <td colSpan={12} className="p-4 sm:p-5">
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <h4 className="text-xs font-black text-[#5B4BFF] uppercase tracking-wider flex items-center gap-1.5">
                                          <span>🎯</span>
                                          <span>Subject-wise CO-PO Matrix Mapping Checklist for {dept.departmentName}</span>
                                        </h4>
                                        <span className="text-[11px] font-bold text-slate-500">
                                          {dept.copo.mappedSubjects} of {dept.copo.totalSubjects} subjects fully mapped
                                        </span>
                                      </div>

                                      {/* Subject Checklist */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {dept.copo.subjectList.length === 0 ? (
                                          <p className="text-xs text-slate-400">No subjects currently active under this department.</p>
                                        ) : (
                                          dept.copo.subjectList.map(s => (
                                            <div
                                              key={s.code}
                                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${s.isMapped ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-rose-200 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20'}`}
                                            >
                                              <div className="min-w-0">
                                                <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                                  [{s.code}] {s.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                  Course: {dept.courseCd}
                                                </p>
                                              </div>
                                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.isMapped ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                {s.isMapped ? '✓ Mapped' : 'Pending'}
                                              </span>
                                            </div>
                                          ))
                                        )}
                                      </div>

                                      {/* Additional Pillar Details (Blooms Levels & Academic Portfolio) */}
                                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                            <span>📚</span> Bloom\'s Taxonomy Question Coverage
                                          </p>
                                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L1 Rem: {dept.questionBank.bloomsBreakdown.remembering}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L2 Und: {dept.questionBank.bloomsBreakdown.understanding}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L3 App: {dept.questionBank.bloomsBreakdown.applying}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L4 Ana: {dept.questionBank.bloomsBreakdown.analyzing}</span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">L5/6 Eva/Cre: {dept.questionBank.bloomsBreakdown.evaluating + dept.questionBank.bloomsBreakdown.creating}</span>
                                          </div>
                                        </div>

                                        <div>
                                          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                                            <span>💼</span> Portfolio (Seminars / Tutorials / Projects)
                                          </p>
                                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                                            Seminars: {dept.portfolio.seminarsCount} ({dept.portfolio.verifiedSeminars} verified) • Tutorials: {dept.portfolio.tutorialsCount} • Projects: {dept.portfolio.miniProjectsCount}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
