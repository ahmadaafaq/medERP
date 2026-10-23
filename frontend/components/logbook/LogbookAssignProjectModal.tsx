'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Tag,
  Laptop,
} from 'lucide-react';
import FacultyAcademicCascadingDropdown, {
  AcademicCascadingState,
} from '@/components/faculty/FacultyAcademicCascadingDropdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LogbookAssignProjectModal({ isOpen, onClose, onSuccess }: Props) {
  // Academic Hierarchy Cascading State
  const [academicCascade, setAcademicCascade] = useState<AcademicCascadingState | null>(null);
  const [colgCd, setColgCd] = useState<string>('1');
  const [courseCd, setCourseCd] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [branchCd, setBranchCd] = useState<string>('');
  const [batchCd, setBatchCd] = useState<string>('');
  const [semesterCd, setSemesterCd] = useState<string>('');
  const [sectionCd, setSectionCd] = useState<string>('');
  const [subjectCd, setSubjectCd] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptInstructions, setPromptInstructions] = useState('');
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([
    'React',
    'Next.js',
    'PostgreSQL',
    'TailwindCSS',
    'Node.js',
  ]);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  const [submitting, setSubmitting] = useState(false);
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

  const getFacultyId = (): string => {
    if (typeof window === 'undefined') return '';
    const direct =
      localStorage.getItem('userId') ||
      localStorage.getItem('facultyId') ||
      localStorage.getItem('emp_id') ||
      '';
    if (direct) return direct;
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        return (
          u.emp_id ||
          u.id ||
          u.userId ||
          u.usr_id ||
          u.facultyId ||
          u.profile?.id ||
          u.profile?.emp_id ||
          ''
        );
      }
    } catch {}
    return '';
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setSubmissionDeadline(d.toISOString().slice(0, 10));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAcademicCascadeChange = (state: AcademicCascadingState) => {
    setAcademicCascade(state);
    const col = state.college?.colg_cd || '1';
    const crs = state.course?.course_cd || '';
    const crsName = state.course?.course_name || '';
    const br = state.branch?.branch_cd || '';
    const bat = state.batch?.batch_cd ? String(state.batch.batch_cd) : '';
    const sem = state.semester?.sem_cd ? String(state.semester.sem_cd) : state.semester?.code || '';
    const sec = state.section || '';
    const sub = state.subject?.code || state.subject?.id || '';
    const subN = state.subject?.name || '';

    setColgCd(col);
    setCourseCd(crs);
    setCourseName(crsName);
    setBranchCd(br);
    setBatchCd(bat);
    setSemesterCd(sem);
    setSectionCd(sec);
    setSubjectCd(sub);
    setSubjectName(subN);
  };

  const handleAddTech = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setTechnologies([...technologies, techInput.trim()]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter the project topic title.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const slug = getTenantSlug();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    // Infer discipline type dynamically based on linked course/branch name
    const cLow = (courseName || '').toLowerCase();
    const discipline = cLow.includes('pharm')
      ? 'PHARMACEUTICAL'
      : cLow.includes('mba') ||
        cLow.includes('bba') ||
        cLow.includes('management') ||
        cLow.includes('pgdm')
      ? 'MANAGEMENT'
      : 'ENGINEERING';

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      promptInstructions:
        promptInstructions.trim() ||
        'Follow the standard academic guidelines and complete weekly milestones.',
      technologies,
      disciplineType: discipline,
      collegeId: colgCd || '1',
      courseId: courseCd || null,
      branchId: branchCd || null,
      batchId: batchCd || null,
      semesterId: semesterCd || null,
      section: sectionCd && sectionCd !== 'all' ? sectionCd : undefined,
      subjectId: subjectCd || undefined,
      maxMarks: Number(maxMarks) || 100,
      submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : null,
    };

    try {
      const res = await fetch(`/api/v1/logbook/mini-project?tenant=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-slug': slug,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to assign project topic');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while publishing mini project topic');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2D2575] via-[#3730A3] to-[#4F46E5] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Laptop className="w-5 h-5 text-[#F36C21]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">
                  Assign Mini Project Topic &amp; Technology Stack
                </h3>
                {courseName && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F36C21] text-white shadow-sm">
                    {courseName}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Publish required topic, mandatory tech stack and prompt instructions for students
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dynamic Course & Subject Linker (Course_subject_link_Faculty.md applied) */}
          <FacultyAcademicCascadingDropdown
            onSelectionChange={handleAcademicCascadeChange}
            onlyLinkedSubjects={true}
            showSection={true}
            showSubject={true}
            facultyId={getFacultyId()}
            title="🎯 Target Academic Cohort & Subject Linker"
            subtitle="Strictly scoped to your assigned Course, Branch, Batch, Semester, Section and Linked Subject"
            className="border-indigo-100 dark:border-indigo-950/60 shadow-sm"
          />

          {/* Project Topic Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Microservices Healthcare Platform, ML Model, Drug Formulation, or Capstone Project"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              required
            />
          </div>

          {/* Chips / Required Technologies Stack */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Required Technologies Stack (Chips)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                placeholder="Type tech name (e.g. React, Docker, NestJS, Python) and press Enter..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-3.5 py-2 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] font-bold text-xs hover:bg-[#5B4BFF]/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {technologies.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-[#2D2575]/10 dark:bg-[#2D2575]/40 text-[#2D2575] dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 border border-[#2D2575]/20 shadow-sm"
                >
                  <Tag className="w-3 h-3 text-[#F36C21]" />
                  {t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(t)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1 text-sm leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Description & System Architecture */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Project Description &amp; System Architecture
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the problem statement, system architecture requirements, and core functional features..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] leading-relaxed resize-none"
            />
          </div>

          {/* Prompt / Guidelines */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Student Coding Prompt &amp; Weekly Milestone Guidelines
            </label>
            <textarea
              rows={3}
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              placeholder="Instructions for students to follow when building their project code and weekly milestones in the Mini Project tab..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] leading-relaxed resize-none"
            />
          </div>

          {/* Max Marks & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Max Marks (Rubric Score)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Final Submission Deadline
              </label>
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#F36C21] hover:bg-[#E05B10] text-white text-xs font-bold shadow-md shadow-[#F36C21]/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assign Mini Project Topic</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
