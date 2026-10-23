'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  BookOpen,
  Calendar,
  Award,
  Users,
  Layers,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import FacultyAcademicCascadingDropdown, {
  AcademicCascadingState,
} from '@/components/faculty/FacultyAcademicCascadingDropdown';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
}

interface PublishTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export default function PublishTopicModal({ isOpen, onClose, onSuccess }: PublishTopicModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [submissionDeadline, setSubmissionDeadline] = useState<string>('');

  // Dynamic Academic Cascading State
  const [academicCascade, setAcademicCascade] = useState<AcademicCascadingState | null>(null);
  const [courseId, setCourseId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');
  const [semesterId, setSemesterId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');

  // Particular Students & Faculties of that Subject
  const [assignedFaculties, setAssignedFaculties] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [isRosterExpanded, setIsRosterExpanded] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTenantSlug = () => {
    if (typeof window === 'undefined') return 'srms-cet-bareilly';
    const slug =
      localStorage.getItem('tenantSlug') ||
      localStorage.getItem('selectedTenant') ||
      localStorage.getItem('colg_slug') ||
      'srms-cet-bareilly';
    return (slug || 'srms-cet-bareilly').replace(/^tenant_/, '').replace(/^tenant-/, '');
  };

  const getColgCd = () => {
    if (typeof window === 'undefined') return '1';
    return localStorage.getItem('colg_cd') || localStorage.getItem('colgCd') || '1';
  };

  const getFacultyId = (): string => {
    if (typeof window === 'undefined') return '';
    const direct = localStorage.getItem('userId') || localStorage.getItem('facultyId') || localStorage.getItem('emp_id') || '';
    if (direct) return direct;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        return u.emp_id || u.id || u.userId || u.usr_id || u.facultyId || u.profile?.id || u.profile?.emp_id || '';
      }
    } catch {}
    return '';
  };

  const fetchStudentsAndFaculties = async (
    crs: string,
    br: string,
    bat: string,
    sem: string,
    sec: string,
    sub: string,
    colg?: string
  ) => {
    if (!sub) {
      setAssignedFaculties([]);
      setEnrolledStudents([]);
      return;
    }

    setLoadingRoster(true);
    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const activeColgCd = colg || getColgCd();

    try {
      // 1. Fetch Faculties linked to this subject
      const facQuery = `${API_BASE}/admin-master/faculty-subjects?tenant=${encodeURIComponent(slug)}&subjectId=${encodeURIComponent(sub)}`;
      const facRes = await fetch(facQuery, {
        headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
      }).catch(() => null);

      let facList: any[] = [];
      if (facRes && facRes.ok) {
        const facJson = await facRes.json().catch(() => null);
        facList = Array.isArray(facJson?.data) ? facJson.data : Array.isArray(facJson) ? facJson : [];
      }
      setAssignedFaculties(facList);

      // 2. Fetch Students of that cohort & section / subject
      let studentList: any[] = [];

      // A. Try live SRMS student attendance / roster
      try {
        const numCrs = crs ? Number(crs) : 1;
        const numBr = br ? Number(br) : 1;
        const numBat = bat ? Number(bat) : 17;
        const numSem = sem ? Number(sem.replace(/\D/g, '')) : 1;
        const numSec = sec && sec !== 'all' ? (sec.toLowerCase().includes('b') ? 2 : 1) : 1;

        const srmsRes = await fetch('/api/srms/student-attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colg_cd: Number(activeColgCd) || 1,
            course_cd: numCrs,
            branch_cd: numBr,
            batch_cd: numBat,
            sem_cd: numSem,
            section_cd: numSec,
            fdt: '2026-07-02',
            tdt: '2026-08-21',
          }),
        }).catch(() => null);

        if (srmsRes && srmsRes.ok) {
          const srmsJson = await srmsRes.json().catch(() => null);
          if (srmsJson?.success && Array.isArray(srmsJson.data) && srmsJson.data.length > 0) {
            // Filter students taking this subject if subject array is attached
            studentList = srmsJson.data
              .filter((st: any) => {
                if (Array.isArray(st.subjects) && st.subjects.length > 0) {
                  return st.subjects.some(
                    (s: any) =>
                      String(s.sub_cd) === String(sub) ||
                      String(s.sub_name).toLowerCase() === String(sub).toLowerCase()
                  );
                }
                return true;
              })
              .map((st: any) => ({
                rollno: st.stud_roll_no || st.stud_reg_no,
                registration_no: st.stud_reg_no,
                name: st.stud_name,
                section: st.sec_cd ? (st.sec_cd === 2 ? 'Section B' : 'Section A') : sec || 'Section A',
                attendance: st.TotalPresentPercentage,
              }));
          }
        }
      } catch (err) {
        console.warn('SRMS student roster query notice:', err);
      }

      // B. Fallback to users/students if SRMS returned empty
      if (studentList.length === 0) {
        const userParams = new URLSearchParams({ tenant: slug });
        if (crs) userParams.append('courseCd', crs);
        if (br) userParams.append('departmentId', br);
        if (bat) userParams.append('batchId', bat);
        if (sem) userParams.append('semCd', sem);
        if (sec && sec !== 'all') userParams.append('section', sec);

        const userRes = await fetch(`${API_BASE}/users/students?${userParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}`, 'x-tenant-slug': slug },
        }).catch(() => null);

        if (userRes && userRes.ok) {
          const userJson = await userRes.json().catch(() => null);
          const raw = Array.isArray(userJson?.data) ? userJson.data : Array.isArray(userJson) ? userJson : [];
          studentList = raw.map((u: any) => ({
            rollno: u.rollno || u.registration_no || u.id,
            registration_no: u.registration_no,
            name: u.name,
            section: u.section || sec || 'Section A',
            email: u.email,
          }));
        }
      }

      setEnrolledStudents(studentList);
    } catch (e) {
      console.error('Failed to load students and faculties for subject:', e);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleAcademicCascadeChange = (state: AcademicCascadingState) => {
    setAcademicCascade(state);
    const crsCd = state.course?.course_cd || '';
    const brCd = state.branch?.branch_cd || '';
    const batCd = state.batch?.batch_cd ? String(state.batch.batch_cd) : '';
    const semCd = state.semester?.sem_cd ? String(state.semester.sem_cd) : state.semester?.code || '';
    const secCd = state.section || '';
    const subCd = state.subject?.code || state.subject?.id || '';
    const subName = state.subject?.name || '';

    setCourseId(crsCd);
    setBranchId(brCd);
    setBatchId(batCd);
    setSemesterId(semCd);
    setSectionId(secCd);
    setSubjectId(subCd);
    setSubjectName(subName);

    fetchStudentsAndFaculties(crsCd, brCd, batCd, semCd, secCd, subCd, state.college?.colg_cd);
  };

  const filteredRosterStudents = useMemo(() => {
    if (!studentSearch.trim()) return enrolledStudents;
    const q = studentSearch.trim().toLowerCase();
    return enrolledStudents.filter(
      (st) =>
        (st.name || '').toLowerCase().includes(q) ||
        (st.rollno || '').toLowerCase().includes(q) ||
        (st.registration_no || '').toLowerCase().includes(q)
    );
  }, [enrolledStudents, studentSearch]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setIsRosterExpanded(false);
      setStudentSearch('');
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setSubmissionDeadline(d.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const slug = getTenantSlug();
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/logbook/categories?tenant=${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        const hasTutorial = list.some((c: any) => (c.code || '').toUpperCase().includes('TUTORIAL') || (c.name || '').toLowerCase().includes('tutorial'));
        if (!hasTutorial) {
          list.push({
            id: 'TUTORIAL',
            code: 'TUTORIAL',
            name: 'Tutorial',
            description: 'Unit Tutorials, Problem Sheets and Exercises',
          });
        }
        setCategories(list);
        if (list.length > 0 && !categoryId) setCategoryId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a topic title.');
      return;
    }
    if (!categoryId) {
      setError('Please select an activity category.');
      return;
    }

    setLoading(true);
    try {
      const slug = getTenantSlug();
      const token = localStorage.getItem('token') || '';

      const res = await fetch(`${API_BASE}/logbook/topics?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          description: description.trim() || undefined,
          maxMarks: Number(maxMarks) || 100,
          submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : undefined,
          courseId: courseId === 'all' ? null : (courseId || null),
          branchId: branchId === 'all' ? null : (branchId || null),
          batchId: batchId === 'all' ? null : (batchId || null),
          semesterId: semesterId === 'all' ? null : (semesterId || null),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(json.message || 'Failed to publish topic');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5B4BFF] text-white flex items-center justify-center shadow-md shadow-[#5B4BFF]/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1B1E28] dark:text-white">
                Publish Academic Activity Topic
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Create a seminar, tutorial, assignment or practical activity for students to submit work.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Activity Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              Activity Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.code || '').toUpperCase().includes('TUTORIAL') || (c.name || '').toLowerCase().includes('tutorial')
                    ? '📘 Tutorial'
                    : (c.code || '').toUpperCase().includes('SEMINAR') || (c.name || '').toLowerCase().includes('seminar')
                    ? '🎓 Academic Seminar'
                    : c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              Topic Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Microservices Architecture & AWS Lambda Deployment Case Study"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-medium focus:outline-none focus:border-[#5B4BFF]"
              required
            />
          </div>

          {/* Instructions & Guidelines */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
              Instructions &amp; Requirements (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify formatting requirements, key questions to cover, expected presentation slides or lab observation steps..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-medium focus:outline-none focus:border-[#5B4BFF] resize-none"
            />
          </div>

          {/* Max Marks & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
                Max Evaluation Marks
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider block">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 text-[#1B1E28] dark:text-white text-xs font-bold focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Target Student Cohort Scoping (Dynamic Faculty Course & Subject Linker) */}
          <div className="space-y-4">
            <FacultyAcademicCascadingDropdown
              onSelectionChange={handleAcademicCascadeChange}
              onlyLinkedSubjects={true}
              showSection={true}
              showSubject={true}
              facultyId={getFacultyId()}
              title="🎯 Target Academic Cohort & Subject Linker"
              subtitle="Course • Branch • Batch • Semester • Section • Linked Subject"
              className="border-indigo-100 dark:border-indigo-950/60 shadow-sm"
            />

            {/* Particular Assigned Faculties & Enrolled Students Section */}
            <div className="bg-[#F8FAFC] dark:bg-slate-850 border border-[#E7EAF3] dark:border-slate-800 rounded-2xl p-4 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7EAF3] dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#1B1E28] dark:text-white">
                      Subject Cohort Roster &amp; Assigned Faculties
                    </h4>
                    <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
                      {subjectName
                        ? `Displaying verified students & faculty for [${subjectId || ''}] ${subjectName}`
                        : 'Select a subject from the cascading dropdown above to view particular students and faculties.'}
                    </p>
                  </div>
                </div>

                {subjectId && (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#EEF2FF] text-[#5B4BFF] border border-[#5B4BFF]/20">
                      {assignedFaculties.length} {assignedFaculties.length === 1 ? 'Faculty' : 'Faculties'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200">
                      {enrolledStudents.length} Students
                    </span>
                  </div>
                )}
              </div>

              {/* 1. Particular Assigned Faculties of this Subject */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-[#1B1E28] dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#5B4BFF]" />
                    <span>Assigned Faculties of this Subject</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {loadingRoster ? 'Loading faculties...' : `${assignedFaculties.length} assigned`}
                  </span>
                </div>

                {loadingRoster ? (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2 justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
                    <span>Fetching linked faculties...</span>
                  </div>
                ) : assignedFaculties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {assignedFaculties.map((fac: any, idx: number) => {
                      const name = fac.faculty_name || fac.faculty?.name || fac.name || 'Faculty Member';
                      const code = fac.faculty_code || fac.faculty_id || fac.emp_id || '';
                      const desig = fac.faculty_designation || fac.designation || 'Faculty';
                      const dept = fac.faculty_department_name || fac.department || '';
                      const sec = fac.section || '';

                      return (
                        <div
                          key={fac.id || idx}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 flex items-start gap-2.5 shadow-xs hover:border-[#5B4BFF]/40 transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-[#5B4BFF] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                            {name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="text-xs font-bold text-[#1B1E28] dark:text-white truncate">
                                {name}
                              </h5>
                              {sec && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                  Sec {sec}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#4E5969] dark:text-slate-400 truncate">
                              {desig} {dept ? `• ${dept}` : ''}
                            </p>
                            {code && (
                              <span className="inline-block mt-1 text-[9px] font-mono font-medium text-slate-500 dark:text-slate-400">
                                ID: #{code}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
                    {subjectId
                      ? 'No other faculty members assigned to this subject.'
                      : 'Select a subject to display assigned faculties.'}
                  </div>
                )}
              </div>

              {/* 2. Particular Enrolled Students of this Subject & Section (Accordion, Default Hide) */}
              <div className="space-y-2 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRosterExpanded(!isRosterExpanded)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 hover:border-[#5B4BFF]/40 cursor-pointer transition-all select-none group text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-[#1B1E28] dark:text-white">
                      Particular Enrolled Students ({filteredRosterStudents.length})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {isRosterExpanded ? 'Click to collapse' : 'Default hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5B4BFF] group-hover:text-[#4B3BFF]">
                    <span>{isRosterExpanded ? 'Hide Students' : 'View Students'}</span>
                    {isRosterExpanded ? (
                      <ChevronUp className="w-4 h-4 shrink-0 transition-transform" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 transition-transform" />
                    )}
                  </div>
                </button>

                {isRosterExpanded && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    {/* Search bar & count */}
                    {enrolledStudents.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                        <span className="text-[10px] text-slate-500 font-medium">
                          Showing {filteredRosterStudents.length} of {enrolledStudents.length} students
                        </span>
                        <div className="relative max-w-xs w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search student or roll no..."
                            className="w-full pl-8 pr-3 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                          />
                        </div>
                      </div>
                    )}

                    {loadingRoster ? (
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-2 justify-center">
                        <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading student roster for this cohort &amp; subject...</span>
                      </div>
                    ) : filteredRosterStudents.length > 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E7EAF3] dark:border-slate-800 overflow-hidden shadow-xs">
                        <div className="max-h-56 overflow-y-auto divide-y divide-[#E7EAF3] dark:divide-slate-800">
                          {filteredRosterStudents.map((st: any, idx: number) => (
                            <div
                              key={st.rollno || st.registration_no || idx}
                              className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#1B1E28] dark:text-white truncate">
                                    {st.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                    <span>Roll: {st.rollno}</span>
                                    {st.registration_no && st.registration_no !== st.rollno && (
                                      <span>• Reg: {st.registration_no}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {st.section && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {st.section}
                                  </span>
                                )}
                                {st.attendance !== undefined && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                      Number(st.attendance) >= 75
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                    }`}
                                  >
                                    {st.attendance}% Att.
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-3 py-1.5 bg-[#F8FAFC] dark:bg-slate-800/40 border-t border-[#E7EAF3] dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Showing {filteredRosterStudents.length} enrolled students</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Enrolled in this Subject</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 text-center">
                        {subjectId
                          ? 'No students found enrolled in this subject cohort.'
                          : 'Select a subject from the academic hierarchy above to load enrolled students.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E7EAF3] dark:border-slate-800 text-xs font-black text-[#4E5969] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4B3BFF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Activity...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Activity to Cohort</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
