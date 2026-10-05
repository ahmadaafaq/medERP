'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../../../components/Sidebar';
import Header from '../../../../components/Header';
import {
  FileText, Plus, Printer, CheckCircle2, AlertCircle, RotateCcw,
  Edit3, Trash2, Search, ArrowRight, Eye, Send, Check, Sparkles, Filter, ChevronRight,
  BookOpen, Layers, Calendar, Clock, Lock, ShieldCheck, CheckCheck, HelpCircle
} from 'lucide-react';
import QuestionPaperReviewModal, { QuestionRemarkItem } from '../../../../components/exam/QuestionPaperReviewModal';
import {
  fetchCourses, fetchBranches, fetchBatches, fetchColleges, getTenantSlug, isSrmsTenant
} from '../../../../hooks/useTenantAcademicData';
import { formatCourseName, formatSemester } from '../../../../lib/exam-formatters';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any };
  const slug = getTenantSlug() || 'srms-cet-bareilly';
  const token = localStorage.getItem('token') || '';
  return {
    slug,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'Content-Type': 'application/json',
    },
  };
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  DRAFT: { cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Draft' },
  PENDING_HOD_APPROVAL: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', label: '⏳ Pending HOD Approval' },
  CHANGES_REQUESTED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', label: '⚠️ Changes Requested' },
  RESUBMITTED: { cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300', label: '🚀 Resubmitted to HOD' },
  HOD_APPROVED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', label: '✅ HOD Approved' },
  PUBLISHED: { cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300', label: '🚀 Published' },
};

export default function ClerkQPDesignerPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // ─── 3 PRIMARY TABS: Question Bank, Design Paper, Publish ─────────────────
  const [activeTab, setActiveTab] = useState<'bank' | 'design' | 'publish'>('design');

  // Preview / Review Modal State
  const [previewPaper, setPreviewPaper] = useState<any | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'clerk_view' | 'print'>('preview');

  // ─── CASCADING HIERARCHY STATE ──────────────────────────────────────────
  // 1. College -> 2. Course -> 3. Branch -> 4. Batch -> 5. Semester -> 6. Section -> Subject
  const [colleges, setColleges] = useState<any[]>([]);
  const [selectedColgCd, setSelectedColgCd] = useState<string>('1');

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseCd, setSelectedCourseCd] = useState<string>('13');

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchCd, setSelectedBranchCd] = useState<string>('1');

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchCd, setSelectedBatchCd] = useState<string>('');

  const [selectedSemester, setSelectedSemester] = useState<string>('3');
  const [selectedSection, setSelectedSection] = useState<string>('Section A');

  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // ─── DESIGNER FORM STATE ────────────────────────────────────────────────
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [paperCode, setPaperCode] = useState(`EXAM-${Date.now().toString().slice(-6)}`);
  const [paperTitle, setPaperTitle] = useState('Mid-Term Examination 2026-27');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [passingMarks, setPassingMarks] = useState<number>(20);
  const [paperType, setPaperType] = useState<string>('THEORY');
  const [paperVersion, setPaperVersion] = useState<number>(1);
  const [hodRemarksHistory, setHodRemarksHistory] = useState<string>('');
  const [existingQuestionRemarks, setExistingQuestionRemarks] = useState<Record<string, QuestionRemarkItem>>({});

  // Sections
  const [sections, setSections] = useState<any[]>([
    {
      id: 'sec-a',
      title: 'Section A: Multiple Choice Questions (MCQs)',
      type: 'MCQ',
      instructions: 'Answer all multiple choice questions. Each question carries 1 mark.',
      targetCount: 10,
      questions: [],
    },
    {
      id: 'sec-b',
      title: 'Section B: Descriptive & Analytical Questions',
      type: 'DESC',
      instructions: 'Answer all long-answer questions. Sub-parts must be clearly numbered.',
      targetCount: 3,
      questions: [],
    },
  ]);

  // ─── TAB 1: QUESTION BANK STATE ──────────────────────────────────────────
  const [allBankQuestions, setAllBankQuestions] = useState<any[]>([]);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbSearchQuery, setQbSearchQuery] = useState('');
  const [qbSubjectFilter, setQbSubjectFilter] = useState<string>('ALL');
  const [qbSemesterFilter, setQbSemesterFilter] = useState<string>('ALL');
  const [qbModeFilter, setQbModeFilter] = useState<string>('ALL');
  const [qbDifficultyFilter, setQbDifficultyFilter] = useState<string>('ALL');

  // Add Question Modal State
  const [isAddQModalOpen, setIsAddQModalOpen] = useState(false);
  const [newQMode, setNewQMode] = useState<'MCQ' | 'DESC'>('MCQ');
  const [newQText, setNewQText] = useState('');
  const [newQSubjectId, setNewQSubjectId] = useState('');
  const [newQSemester, setNewQSemester] = useState('3');
  const [newQUnit, setNewQUnit] = useState('CO1');
  const [newQTopic, setNewQTopic] = useState('');
  const [newQDifficulty, setNewQDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  const [newQMarks, setNewQMarks] = useState<number | string>(1);
  const [newQOptionA, setNewQOptionA] = useState('');
  const [newQOptionB, setNewQOptionB] = useState('');
  const [newQOptionC, setNewQOptionC] = useState('');
  const [newQOptionD, setNewQOptionD] = useState('');
  const [newQCorrectOption, setNewQCorrectOption] = useState<'option_a' | 'option_b' | 'option_c' | 'option_d'>('option_a');
  const [newQHasSubParts, setNewQHasSubParts] = useState(false);
  const [newQSubParts, setNewQSubParts] = useState<any[]>([
    { id: '1', label: 'a)', questionText: '', marks: 5 },
    { id: '2', label: 'b)', questionText: '', marks: 5 },
  ]);

  // ─── CASCADING: Unit → Topic → Subtopic ──────────────────────────────────
  const [modalUnits, setModalUnits] = useState<any[]>([]);
  const [modalTopics, setModalTopics] = useState<any[]>([]);
  const [modalSubtopics, setModalSubtopics] = useState<any[]>([]);
  const [newQUnitId, setNewQUnitId] = useState<string>('');
  const [newQTopicId, setNewQTopicId] = useState<string>('');
  const [newQTopicName, setNewQTopicName] = useState<string>('');
  const [newQSubtopicId, setNewQSubtopicId] = useState<string>('');
  const [newQSubtopicName, setNewQSubtopicName] = useState<string>('');
  const [newQSubtopicCode, setNewQSubtopicCode] = useState<string>('');
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);

  // ─── TAB 2: QUESTION PICKER MODAL STATE ──────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetSectionId, setPickerTargetSectionId] = useState<string | null>(null);
  const [replacingQuestionId, setReplacingQuestionId] = useState<string | null>(null);
  const [selectedQbIds, setSelectedQbIds] = useState<string[]>([]);

  // Cascading filters in picker: Unit -> Topic -> Sub-Topic
  const [pickerUnits, setPickerUnits] = useState<any[]>([]);
  const [pickerTopics, setPickerTopics] = useState<any[]>([]);
  const [pickerSubtopics, setPickerSubtopics] = useState<any[]>([]);
  const [pickerSelectedUnitId, setPickerSelectedUnitId] = useState<string>('');
  const [pickerSelectedUnitCode, setPickerSelectedUnitCode] = useState<string>('');
  const [pickerSelectedTopicId, setPickerSelectedTopicId] = useState<string>('');
  const [pickerSelectedTopicName, setPickerSelectedTopicName] = useState<string>('');
  const [pickerSelectedSubtopicId, setPickerSelectedSubtopicId] = useState<string>('');
  const [pickerSelectedSubtopicCode, setPickerSelectedSubtopicCode] = useState<string>('');
  const [pickerUnitsLoading, setPickerUnitsLoading] = useState(false);
  const [pickerTopicsLoading, setPickerTopicsLoading] = useState(false);
  const [pickerSubtopicsLoading, setPickerSubtopicsLoading] = useState(false);

  // Temporary staging tray for questions to be added into section
  const [stagedQuestions, setStagedQuestions] = useState<any[]>([]);

  // ─── TAB 3: PUBLISH & SCHEDULE STATE ─────────────────────────────────────
  const [publishSemesterFilter, setPublishSemesterFilter] = useState<string>('ALL');
  const [publishSectionFilter, setPublishSectionFilter] = useState<string>('ALL');
  const [selectedPaperToPublish, setSelectedPaperToPublish] = useState<any | null>(null);
  const [publishTargetBatch, setPublishTargetBatch] = useState<string>('');
  const [publishDate, setPublishDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [publishStartTime, setPublishStartTime] = useState<string>('09:30');
  const [publishEndTime, setPublishEndTime] = useState<string>('12:30');
  const [publishRoom, setPublishRoom] = useState<string>('Hall A-101');
  const [publishedLedger, setPublishedLedger] = useState<any[]>([]);

  // ─── LOAD PAPERS ────────────────────────────────────────────────────────
  const loadPapers = async () => {
    setLoading(true);
    try {
      const { slug, headers } = getH();
      let list: any[] = [];
      try {
        const r0 = await fetch(`/api/v1/exams/papers?tenant=${slug}`, {
          headers: { ...headers, 'x-tenant-slug': slug },
          cache: 'no-store'
        });
        if (r0.ok) {
          const d0 = await r0.json();
          list = Array.isArray(d0) ? d0 : (d0.data || []);
        } else {
          throw new Error('Local route fallback');
        }
      } catch {
        const r = await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, { headers, cache: 'no-store' });
        const d = await r.json();
        list = Array.isArray(d) ? d : (d.data || []);
      }

      // Latest paper ALWAYS on TOP
      list.sort((a: any, b: any) => {
        const tB = b.updated_at || b.created_at ? new Date(b.updated_at || b.created_at).getTime() : 0;
        const tA = a.updated_at || a.created_at ? new Date(a.updated_at || a.created_at).getTime() : 0;
        return tB - tA;
      });

      setPapers(list);

      // Pre-populate published exams ledger
      const published = list.filter((p: any) => p.status === 'PUBLISHED' || p.exam_date);
      setPublishedLedger(published);
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── LOAD QUESTION BANK ─────────────────────────────────────────────────
  const loadQuestionBank = async () => {
    setQbLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/exams/question-bank?tenant=${slug}`, { headers });
      const d = await r.json();
      const list = Array.isArray(d) ? d : (d.data || []);
      setAllBankQuestions(list);
    } catch {
      setAllBankQuestions([]);
    } finally {
      setQbLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
    loadQuestionBank();
    initCascade();
  }, []);

  // ─── INITIALIZE CASCADING DATA ──────────────────────────────────────────
  const initCascade = async () => {
    const slug = getTenantSlug() || (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly');
    try {
      const { headers } = getH();
      // fetchCourses takes (slug, colgCd)
      const [colgs, crs, subjs] = await Promise.all([
        fetchColleges(slug),
        fetchCourses(slug, selectedColgCd || '1'),
        fetch(`${API_BASE}/admin-master/subjects?tenant=${slug}`, { headers }).then(r => r.json()).catch(() => []),
      ]);

      const cList = Array.isArray(colgs) ? colgs : [];
      setColleges(cList);
      const effectiveColg = (cList.length > 0 && cList[0].colg_cd) ? String(cList[0].colg_cd) : (selectedColgCd || '1');
      setSelectedColgCd(effectiveColg);

      const crsList = Array.isArray(crs) ? crs : [];
      setCourses(crsList);
      const initialCrs = crsList.length > 0 ? String(crsList[0].course_cd || '13') : '13';
      setSelectedCourseCd(initialCrs);

      const rawSubjs = Array.isArray(subjs) ? subjs : (subjs?.data || []);
      setAllSubjects(rawSubjs);

      await cascadeLoadBranchesAndBatches(effectiveColg, initialCrs, slug);
    } catch (e) {
      console.error('Failed to init cascade:', e);
    }
  };

  const cascadeLoadBranchesAndBatches = async (colg: string, crs: string, slug?: string) => {
    const s = slug || getTenantSlug() || (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly');
    try {
      // Signature in useTenantAcademicData: fetchBranches(slug, courseCd, colgCd), fetchBatches(slug, courseCd, colgCd)
      const [brs, bts] = await Promise.all([
        fetchBranches(s, crs, colg),
        fetchBatches(s, crs, colg),
      ]);

      let brList = Array.isArray(brs) ? brs : [];
      if (brList.length === 0) {
        // Fallback branch synthesis if not returned
        const courseObj = courses.find((c: any) => String(c.course_cd || c.code) === String(crs));
        brList = [{
          branch_cd: '1',
          branch_name: crs === '13' ? 'BCA Department' : courseObj?.course_name ? `${courseObj.course_name} Department` : 'General Department',
          course_cd: crs,
          colg_cd: colg,
        }];
      }
      setBranches(brList);
      if (brList.length > 0) {
        setSelectedBranchCd(String(brList[0].branch_cd || '1'));
      }

      const btList = Array.isArray(bts) ? bts : [];
      // Clean synthetic codes per RestrictAPI.md Rule 6 ("Batch 2026", never "B2021-C1-1")
      const cleanedBatches = btList.map((b: any) => {
        const rawName = String(b.batch_name || b.name || '');
        const cleanName = rawName.replace(/^B\d{4}-C\d+-\d+/i, '').trim() || (b.year ? `Batch ${b.year}` : `Batch ${b.batch_cd || b.code}`);
        return {
          ...b,
          batch_name: cleanName,
          batch_cd: String(b.batch_cd || b.code || ''),
        };
      });
      const effectiveBatches = cleanedBatches.length > 0 ? cleanedBatches : [
        { batch_cd: '1', batch_name: 'Batch 2026', course_cd: crs, colg_cd: colg },
        { batch_cd: '2', batch_name: 'Batch 2025', course_cd: crs, colg_cd: colg },
        { batch_cd: '3', batch_name: 'Batch 2024', course_cd: crs, colg_cd: colg },
      ];
      setBatches(effectiveBatches);
      if (effectiveBatches.length > 0) {
        setSelectedBatchCd(String(effectiveBatches[0].batch_cd || '1'));
      }
    } catch (e) {
      console.warn('Failed to load branches and batches:', e);
    }
  };

  const handleCourseChange = async (newCrs: string) => {
    setSelectedCourseCd(newCrs);
    await cascadeLoadBranchesAndBatches(selectedColgCd, newCrs);
  };

  const handleCollegeChange = async (newColg: string) => {
    setSelectedColgCd(newColg);
    const slug = getTenantSlug() || (typeof window !== 'undefined' ? (localStorage.getItem('tenantSlug') || 'srms-cet-bareilly') : 'srms-cet-bareilly');
    const crs = await fetchCourses(slug, newColg);
    const crsList = Array.isArray(crs) ? crs : [];
    setCourses(crsList);
    const initialCrs = crsList.length > 0 ? String(crsList[0].course_cd || '13') : '13';
    setSelectedCourseCd(initialCrs);
    await cascadeLoadBranchesAndBatches(newColg, initialCrs, slug);
  };

  // Filter subjects based on course and semester (handling digits like "3" and "Semester 3")
  const availableSubjects = useMemo(() => {
    const selSemDigits = String(selectedSemester || '').replace(/[^0-9]/g, '');
    const filtered = allSubjects.filter((s: any) => {
      if (selectedCourseCd && s.course_cd && String(s.course_cd) !== String(selectedCourseCd)) {
        return false;
      }
      if (selSemDigits && s.semester) {
        const sSemDigits = String(s.semester).replace(/[^0-9]/g, '');
        if (sSemDigits && sSemDigits !== selSemDigits) {
          return false;
        }
      }
      return true;
    });
    if (filtered.length > 0) return filtered;
    const courseFiltered = allSubjects.filter((s: any) => !selectedCourseCd || !s.course_cd || String(s.course_cd) === String(selectedCourseCd));
    return courseFiltered.length > 0 ? courseFiltered : allSubjects;
  }, [allSubjects, selectedCourseCd, selectedSemester]);

  useEffect(() => {
    if (availableSubjects.length > 0 && (!selectedSubjectId || !availableSubjects.some(s => (s.id || s.code) === selectedSubjectId))) {
      setSelectedSubjectId(availableSubjects[0].id || availableSubjects[0].code || '');
    }
  }, [availableSubjects, selectedSubjectId]);

  const currentSubjectObj = useMemo(() => {
    return allSubjects.find((s: any) => (s.id || s.code) === selectedSubjectId);
  }, [allSubjects, selectedSubjectId]);

  const [qbShowAllSubjects, setQbShowAllSubjects] = useState(false);

  // Feeded questions for active subject
  const currentSubjectQuestions = useMemo(() => {
    return allBankQuestions.filter((q: any) => {
      if (!selectedSubjectId) return true;
      if (q.subject_id === selectedSubjectId) return true;
      if (currentSubjectObj?.id && String(q.subject_id) === String(currentSubjectObj.id)) return true;
      if (currentSubjectObj?.code && (String(q.subject_id) === String(currentSubjectObj.code) || String(q.subject_code) === String(currentSubjectObj.code))) return true;
      if (currentSubjectObj?.name && q.subject_name && String(q.subject_name).toLowerCase() === String(currentSubjectObj.name).toLowerCase()) return true;
      return false;
    });
  }, [allBankQuestions, selectedSubjectId, currentSubjectObj]);

  const displayedBankQuestions = useMemo(() => {
    const source = qbShowAllSubjects ? allBankQuestions : currentSubjectQuestions;
    return source.filter((q: any) => {
      if (qbModeFilter !== 'ALL' && q.mode !== qbModeFilter) return false;
      if (qbDifficultyFilter !== 'ALL' && q.difficulty_level !== qbDifficultyFilter) return false;
      if (qbSemesterFilter !== 'ALL' && q.semester && String(q.semester).replace(/[^0-9]/g, '') !== String(qbSemesterFilter).replace(/[^0-9]/g, '')) return false;
      if (qbSubjectFilter !== 'ALL' && q.subject_id && String(q.subject_id) !== String(qbSubjectFilter) && String(q.subject_code) !== String(qbSubjectFilter)) return false;
      if (qbSearchQuery) {
        const txt = (q.question_text || q.questionText || '').toLowerCase();
        const top = (q.topic || '').toLowerCase();
        const sName = (q.subject_name || '').toLowerCase();
        const query = qbSearchQuery.toLowerCase();
        if (!txt.includes(query) && !top.includes(query) && !sName.includes(query)) return false;
      }
      return true;
    });
  }, [qbShowAllSubjects, allBankQuestions, currentSubjectQuestions, qbModeFilter, qbDifficultyFilter, qbSemesterFilter, qbSubjectFilter, qbSearchQuery]);

  // ─── Format Unit Text: show code + description instead of repetitive CO1 — CO1 ─
  const formatUnitLabel = (u: any) => {
    const code = (u.unit_code || u.code || '').trim();
    const name = (u.unit_name || u.name || '').trim();
    const desc = (u.unit_description || u.description || '').replace(/\s+/g, ' ').trim();

    // Case 1: Name is identical to code (e.g. "CO1" and "CO1")
    if (code && name && code.toLowerCase() === name.toLowerCase()) {
      if (desc) {
        const shortDesc = desc.length > 70 ? desc.slice(0, 67) + '…' : desc;
        return `${code} — ${shortDesc}`;
      }
      return code;
    }

    // Case 2: Name is distinct from code (e.g. code: "DS-U1", name: "Unit 1: Linear Data Structures")
    if (code && name) {
      if (desc && desc.toLowerCase() !== name.toLowerCase()) {
        const shortDesc = desc.length > 50 ? desc.slice(0, 47) + '…' : desc;
        return `${code}: ${name} (${shortDesc})`;
      }
      return `${code} — ${name}`;
    }

    // Case 3: Only name or only desc
    if (name) {
      if (desc && desc.toLowerCase() !== name.toLowerCase()) {
        const shortDesc = desc.length > 50 ? desc.slice(0, 47) + '…' : desc;
        return `${name} (${shortDesc})`;
      }
      return name;
    }

    if (desc) {
      const shortDesc = desc.length > 70 ? desc.slice(0, 67) + '…' : desc;
      return code ? `${code} — ${shortDesc}` : shortDesc;
    }

    return code || 'Unit';
  };

  // ─── Sub-questions dynamic management (a, b, c, d...) ──────────────────
  const handleAddSubPart = () => {
    setNewQSubParts(prev => {
      const nextIdx = prev.length;
      const labelLetter = String.fromCharCode(97 + (nextIdx % 26));
      const label = `${labelLetter})`;
      const numMain = parseFloat(String(newQMarks)) || 10;
      const rawDivision = numMain / (nextIdx + 1);
      const defaultPartMarks = Math.round(rawDivision * 100) / 100 || 1;
      return [
        ...prev,
        { id: String(Date.now() + Math.random()), label, questionText: '', marks: defaultPartMarks }
      ];
    });
  };

  const handleRemoveSubPart = (id: string) => {
    setNewQSubParts(prev => {
      if (prev.length <= 1) return prev;
      const remaining = prev.filter(p => p.id !== id);
      return remaining.map((p, idx) => ({
        ...p,
        label: `${String.fromCharCode(97 + (idx % 26))})`,
      }));
    });
  };

  const handleToggleSubParts = () => {
    const nextState = !newQHasSubParts;
    setNewQHasSubParts(nextState);
    if (nextState && newQSubParts.length === 0) {
      const mainM = parseFloat(String(newQMarks)) || 10;
      const half = Math.round((mainM / 2) * 100) / 100;
      setNewQSubParts([
        { id: '1', label: 'a)', questionText: '', marks: half },
        { id: '2', label: 'b)', questionText: '', marks: half },
      ]);
    }
  };

  // ─── Load Units by numeric subject code ─────────────────────────────────
  const loadModalUnits = async (subjectCode: string) => {
    if (!subjectCode) { setModalUnits([]); return; }
    setUnitsLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/admin-master/units?tenant=${slug}&subjectCode=${encodeURIComponent(subjectCode)}`, { headers });
      const d = await r.json();
      const list = Array.isArray(d) ? d : (d.data || []);
      setModalUnits(list);
      if (list.length > 0) {
        setNewQUnitId(String(list[0].id || ''));
        setNewQUnit(list[0].unit_code || list[0].code || 'CO1');
        await loadModalTopics(subjectCode, list[0].unit_code || list[0].code || '');
      } else {
        setNewQUnitId(''); setModalTopics([]); setModalSubtopics([]);
      }
    } catch { setModalUnits([]); }
    finally { setUnitsLoading(false); }
  };

  const loadModalTopics = async (subjectCode: string, unitCode: string) => {
    if (!unitCode) { setModalTopics([]); return; }
    setTopicsLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/admin-master/topics?tenant=${slug}&subjectCode=${encodeURIComponent(subjectCode)}&unitCode=${encodeURIComponent(unitCode)}`, { headers });
      const d = await r.json();
      const list = Array.isArray(d) ? d : (d.data || []);
      setModalTopics(list);
      if (list.length > 0) {
        const firstTopic = list[0];
        setNewQTopicId(String(firstTopic.id || ''));
        const tName = firstTopic.topic_name || firstTopic.name || '';
        setNewQTopicName(tName);
        setNewQTopic(tName);
        await loadModalSubtopics(String(firstTopic.id || ''), unitCode, subjectCode, firstTopic.code || firstTopic.topic_code);
      } else {
        setNewQTopicId(''); setNewQTopicName(''); setNewQTopic('');
        setModalSubtopics([]); setNewQSubtopicId(''); setNewQSubtopicName('');
      }
    } catch { setModalTopics([]); }
    finally { setTopicsLoading(false); }
  };

  const loadModalSubtopics = async (topicId: string, unitCode?: string, subjectCode?: string, topicCode?: string) => {
    if (!topicId) { setModalSubtopics([]); return; }
    setSubtopicsLoading(true);
    try {
      const { slug, headers } = getH();
      const params = new URLSearchParams({ tenant: slug });
      if (topicId) params.set('topicId', topicId);
      if (topicCode) params.set('topicCode', topicCode);
      if (unitCode) params.set('unitCode', unitCode);
      if (subjectCode) params.set('subjectCode', subjectCode);

      // Prefer /admin-master/competencies (authoritative across both remote 100.63.22.73 and local backend)
      let d: any = null;
      try {
        const r = await fetch(`${API_BASE}/admin-master/competencies?${params}`, { headers });
        if (r.ok) {
          d = await r.json();
        }
      } catch (err) {
        console.warn('Competencies fetch error, falling back:', err);
      }

      if (!d || !d.data) {
        try {
          const r2 = await fetch(`${API_BASE}/admin-master/subtopics?${params}`, { headers });
          if (r2.ok) {
            d = await r2.json();
          }
        } catch { }
      }

      const list = Array.isArray(d) ? d : (d?.data || []);
      setModalSubtopics(list);
      if (list.length > 0) {
        setNewQSubtopicId(String(list[0].id || ''));
        const name = list[0].competency_name || list[0].name || list[0].description || '';
        setNewQSubtopicName(name);
        setNewQSubtopicCode(list[0].code || list[0].competency_code || '');
      } else {
        setNewQSubtopicId(''); setNewQSubtopicName(''); setNewQSubtopicCode('');
      }
    } catch { setModalSubtopics([]); }
    finally { setSubtopicsLoading(false); }
  };

  const openAddQuestionModal = async () => {
    const subjId = selectedSubjectId || (availableSubjects[0]?.id || availableSubjects[0]?.code || '');
    setNewQSubjectId(subjId);
    setNewQSemester(selectedSemester || '3');
    setNewQTopic('');
    setNewQTopicId('');
    setNewQTopicName('');
    setNewQSubtopicId('');
    setNewQSubtopicName('');
    setNewQSubtopicCode('');
    setNewQText('');
    setNewQUnit('CO1');
    setNewQUnitId('');
    setModalUnits([]);
    setModalTopics([]);
    setModalSubtopics([]);
    setNewQMarks(newQMode === 'MCQ' ? 1 : 10);
    setIsAddQModalOpen(true);
    // Auto-load units for the pre-selected subject
    const subjObj = allSubjects.find((s: any) => (s.id || s.code) === subjId);
    const subjCode = subjObj?.code || subjObj?.subject_code || '';
    if (subjCode) await loadModalUnits(String(subjCode));
  };

  // ─── LIVE PAPER TOTALS CALCULATION ──────────────────────────────────────
  const paperTotals = useMemo(() => {
    let totalQuestions = 0;
    let grandTotalMarks = 0;

    sections.forEach((sec: any) => {
      const qList: any[] = sec.questions || [];
      totalQuestions += qList.length;
      qList.forEach((q: any) => {
        grandTotalMarks += parseFloat(String(q.marks)) || 0;
      });
      if (sec.type === 'PRACTICAL') {
        const pList: any[] = sec.practicalComponents || [];
        if (pList.length > 0) {
          const compSum = pList.reduce((acc: number, p: any) => acc + (parseFloat(String(p.marks)) || 0), 0);
          grandTotalMarks += compSum;
          totalQuestions += pList.length;
        } else {
          grandTotalMarks += parseFloat(String(sec.practicalMarks ?? 20)) || 0;
          totalQuestions += 1;
        }
      }
    });

    return { totalQuestions, grandTotalMarks: Math.round(grandTotalMarks * 100) / 100 };
  }, [sections]);

  // ─── QUESTION BANK PICKER CASCADING LOADERS ─────────────────────────────
  const loadPickerUnits = async (subjectCode: string) => {
    if (!subjectCode) { setPickerUnits([]); return; }
    setPickerUnitsLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/admin-master/units?tenant=${slug}&subjectCode=${encodeURIComponent(subjectCode)}`, { headers });
      const d = await r.json();
      const list = Array.isArray(d) ? d : (d.data || []);
      setPickerUnits(list);
    } catch {
      setPickerUnits([]);
    } finally {
      setPickerUnitsLoading(false);
    }
  };

  const loadPickerTopics = async (subjectCode: string, unitCode: string) => {
    if (!unitCode) { setPickerTopics([]); return; }
    setPickerTopicsLoading(true);
    try {
      const { slug, headers } = getH();
      const r = await fetch(`${API_BASE}/admin-master/topics?tenant=${slug}&subjectCode=${encodeURIComponent(subjectCode)}&unitCode=${encodeURIComponent(unitCode)}`, { headers });
      const d = await r.json();
      const list = Array.isArray(d) ? d : (d.data || []);
      setPickerTopics(list);
    } catch {
      setPickerTopics([]);
    } finally {
      setPickerTopicsLoading(false);
    }
  };

  const loadPickerSubtopics = async (topicId: string, unitCode?: string, subjectCode?: string, topicCode?: string) => {
    if (!topicId) { setPickerSubtopics([]); return; }
    setPickerSubtopicsLoading(true);
    try {
      const { slug, headers } = getH();
      const params = new URLSearchParams({ tenant: slug });
      if (topicId) params.set('topicId', topicId);
      if (topicCode) params.set('topicCode', topicCode);
      if (unitCode) params.set('unitCode', unitCode);
      if (subjectCode) params.set('subjectCode', subjectCode);

      let d: any = null;
      try {
        const r = await fetch(`${API_BASE}/admin-master/competencies?${params}`, { headers });
        if (r.ok) d = await r.json();
      } catch (err) {
        console.warn('Picker Competencies fetch error, falling back:', err);
      }

      if (!d || !d.data) {
        try {
          const r2 = await fetch(`${API_BASE}/admin-master/subtopics?${params}`, { headers });
          if (r2.ok) d = await r2.json();
        } catch { }
      }

      const list = Array.isArray(d) ? d : (d?.data || []);
      setPickerSubtopics(list);
    } catch {
      setPickerSubtopics([]);
    } finally {
      setPickerSubtopicsLoading(false);
    }
  };

  // ─── QUESTION BANK PICKER MODAL (For Designing) ─────────────────────────
  const openQuestionPicker = async (sectionId: string, replaceQId?: string) => {
    setPickerTargetSectionId(sectionId);
    setReplacingQuestionId(replaceQId || null);
    setSelectedQbIds([]);
    setStagedQuestions([]);
    setPickerSelectedUnitId('');
    setPickerSelectedUnitCode('');
    setPickerSelectedTopicId('');
    setPickerSelectedTopicName('');
    setPickerSelectedSubtopicId('');
    setPickerSelectedSubtopicCode('');
    setPickerTopics([]);
    setPickerSubtopics([]);
    setQbSearchQuery('');
    setPickerOpen(true);

    const subjObj = allSubjects.find((s: any) => (s.id || s.code) === selectedSubjectId);
    const subjCode = subjObj?.code || subjObj?.subject_code || selectedSubjectId;
    if (subjCode) {
      await loadPickerUnits(String(subjCode));
    }
  };

  const filteredPickerQuestions = useMemo(() => {
    // DO NOT list questions directly: user must select Unit and Topic first!
    if (!pickerSelectedUnitCode && !pickerSelectedUnitId) return [];
    if (!pickerSelectedTopicId && !pickerSelectedTopicName) return [];

    const curSec = sections.find(s => s.id === pickerTargetSectionId);
    return allBankQuestions.filter((q: any) => {
      if (curSec?.type && q.mode !== curSec.type) return false;
      if (selectedSubjectId) {
        const matches =
          !q.subject_id ||
          String(q.subject_id) === String(selectedSubjectId) ||
          (currentSubjectObj?.id && String(q.subject_id) === String(currentSubjectObj.id)) ||
          (currentSubjectObj?.code && (String(q.subject_id) === String(currentSubjectObj.code) || String(q.subject_code) === String(currentSubjectObj.code))) ||
          (currentSubjectObj?.name && q.subject_name && String(q.subject_name).toLowerCase() === String(currentSubjectObj.name).toLowerCase());
        if (!matches) return false;
      }

      // Unit Filter
      if (pickerSelectedUnitCode || pickerSelectedUnitId) {
        const qUnitCode = (q.unit_code || '').toLowerCase().trim();
        const pUnitCode = pickerSelectedUnitCode.toLowerCase().trim();
        const qUnitId = q.unit_id ? String(q.unit_id) : '';
        const pUnitId = pickerSelectedUnitId ? String(pickerSelectedUnitId) : '';
        const unitMatches = (pUnitCode && qUnitCode && qUnitCode === pUnitCode) || (pUnitId && qUnitId && qUnitId === pUnitId);
        if (!unitMatches) return false;
      }

      // Topic Filter
      if (pickerSelectedTopicId || pickerSelectedTopicName) {
        const qTopicId = q.topic_id ? String(q.topic_id) : '';
        const pTopicId = pickerSelectedTopicId ? String(pickerSelectedTopicId) : '';
        const qTopicName = (q.topic || '').toLowerCase().trim();
        const pTopicName = pickerSelectedTopicName.toLowerCase().trim();
        const topicMatches =
          (pTopicId && qTopicId && qTopicId === pTopicId) ||
          (pTopicName && qTopicName && (qTopicName === pTopicName || qTopicName.includes(pTopicName) || pTopicName.includes(qTopicName)));
        if (!topicMatches) return false;
      }

      // Sub-Topic Filter (if specific subtopic is selected)
      if (pickerSelectedSubtopicId || pickerSelectedSubtopicCode) {
        const qSubId = (q.competency_id || q.sub_topic_id || q.subtopic_id) ? String(q.competency_id || q.sub_topic_id || q.subtopic_id) : '';
        const pSubId = pickerSelectedSubtopicId ? String(pickerSelectedSubtopicId) : '';
        const qSubCode = (q.competency_code || q.sub_topic_code || '').toLowerCase().trim();
        const pSubCode = pickerSelectedSubtopicCode.toLowerCase().trim();
        const subtopicMatches =
          (pSubId && qSubId && qSubId === pSubId) ||
          (pSubCode && qSubCode && (qSubCode === pSubCode || qSubCode.includes(pSubCode)));
        if (!subtopicMatches) return false;
      }

      if (qbSearchQuery) {
        const text = (q.question_text || q.questionText || '').toLowerCase();
        const topic = (q.topic || '').toLowerCase();
        const query = qbSearchQuery.toLowerCase();
        if (!text.includes(query) && !topic.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [allBankQuestions, pickerTargetSectionId, selectedSubjectId, currentSubjectObj, pickerSelectedUnitCode, pickerSelectedUnitId, pickerSelectedTopicId, pickerSelectedTopicName, pickerSelectedSubtopicId, pickerSelectedSubtopicCode, qbSearchQuery, sections]);

  const handleToggleStageQuestion = (q: any) => {
    if (replacingQuestionId) {
      setStagedQuestions([q]);
      return;
    }
    setStagedQuestions(prev => {
      const exists = prev.some(item => item.id === q.id);
      if (exists) {
        return prev.filter(item => item.id !== q.id);
      } else {
        return [...prev, q];
      }
    });
  };

  const handleStageAllFiltered = () => {
    setStagedQuestions(prev => {
      const newItems = filteredPickerQuestions.filter((q: any) => !prev.some(item => item.id === q.id));
      return [...prev, ...newItems];
    });
  };

  const handleCommitStagedQuestionsToSection = () => {
    if (!pickerTargetSectionId || stagedQuestions.length === 0) return;

    if (replacingQuestionId) {
      const chosenQ = stagedQuestions[0];
      const formattedQ = {
        questionId: chosenQ.id,
        questionText: chosenQ.question_text || chosenQ.questionText,
        mode: chosenQ.mode,
        marks: parseFloat(String(chosenQ.max_marks)) || 1,
        topic: chosenQ.topic,
        unit_code: chosenQ.unit_code,
        option_a: chosenQ.option_a,
        option_b: chosenQ.option_b,
        option_c: chosenQ.option_c,
        option_d: chosenQ.option_d,
        correct_option: chosenQ.correct_option,
        has_sub_questions: chosenQ.has_sub_questions,
        sub_questions: chosenQ.sub_questions,
      };

      setSections(prev => prev.map(sec => {
        if (sec.id === pickerTargetSectionId) {
          const updatedQs = (sec.questions || []).map((q: any) => {
            if ((q.questionId || q.id) === replacingQuestionId) {
              return formattedQ;
            }
            return q;
          });
          return { ...sec, questions: updatedQs };
        }
        return sec;
      }));

      setExistingQuestionRemarks(prev => {
        const copy = { ...prev };
        delete copy[replacingQuestionId];
        return copy;
      });

      setStagedQuestions([]);
      setPickerOpen(false);
      setReplacingQuestionId(null);
      return;
    }

    // Normal Bulk Add from Staged Table
    const formattedList = stagedQuestions.map((chosenQ: any) => ({
      questionId: chosenQ.id,
      questionText: chosenQ.question_text || chosenQ.questionText,
      mode: chosenQ.mode,
      marks: parseFloat(String(chosenQ.max_marks)) || 1,
      topic: chosenQ.topic,
      unit_code: chosenQ.unit_code,
      option_a: chosenQ.option_a,
      option_b: chosenQ.option_b,
      option_c: chosenQ.option_c,
      option_d: chosenQ.option_d,
      correct_option: chosenQ.correct_option,
      has_sub_questions: chosenQ.has_sub_questions,
      sub_questions: chosenQ.sub_questions,
    }));

    setSections(prev => prev.map(sec => {
      if (sec.id === pickerTargetSectionId) {
        return {
          ...sec,
          questions: [...(sec.questions || []), ...formattedList],
        };
      }
      return sec;
    }));

    setStagedQuestions([]);
    setPickerOpen(false);
  };

  // ─── DYNAMIC SECTION CREATION & REMOVAL ──────────────────────────────────
  const handleAddSection = (type: 'MCQ' | 'DESC' | 'PRACTICAL') => {
    const nextSecLetter = String.fromCharCode(65 + (sections.length % 26));
    if (type === 'PRACTICAL') {
      const newSec = {
        id: `sec-practical-${Date.now()}`,
        title: `Section ${nextSecLetter}: Practical & Viva Voce Assessment`,
        type: 'PRACTICAL',
        instructions: 'Practical spotting, OSPE stations, lab experiment execution, and oral viva voce evaluation.',
        practicalMarks: 20,
        practicalComponents: [
          { id: `pc-${Date.now()}-1`, name: 'Lab Experiment / Practical Execution', marks: 10 },
          { id: `pc-${Date.now()}-2`, name: 'Viva Voce / Oral Examination', marks: 5 },
          { id: `pc-${Date.now()}-3`, name: 'OSPE Spotting Stations / Logbook', marks: 5 },
        ],
        questions: [],
      };
      setSections(prev => [...prev, newSec]);
    } else if (type === 'MCQ') {
      const newSec = {
        id: `sec-${Date.now()}`,
        title: `Section ${nextSecLetter}: Multiple Choice Questions (MCQs)`,
        type: 'MCQ',
        instructions: 'Answer all multiple choice questions. Each question carries specified marks.',
        targetCount: 10,
        questions: [],
      };
      setSections(prev => [...prev, newSec]);
    } else {
      const newSec = {
        id: `sec-${Date.now()}`,
        title: `Section ${nextSecLetter}: Descriptive & Analytical Questions`,
        type: 'DESC',
        instructions: 'Answer all descriptive questions. Sub-parts must be clearly numbered and answered.',
        targetCount: 5,
        questions: [],
      };
      setSections(prev => [...prev, newSec]);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    if (sections.length <= 1) {
      alert('At least one section is required for an exam paper blueprint.');
      return;
    }
    if (!confirm('Are you sure you want to remove this section and all its contents from this paper blueprint?')) return;
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s));
  };

  const handleUpdateSectionInstructions = (sectionId: string, instructions: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, instructions } : s));
  };

  const handleUpdateSectionPracticalMarks = (sectionId: string, practicalMarks: number) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        let updatedComps = s.practicalComponents;
        if (Array.isArray(updatedComps) && updatedComps.length > 0) {
          const oldTotal = updatedComps.reduce((acc: number, c: any) => acc + (parseFloat(String(c.marks)) || 0), 0);
          if (oldTotal > 0) {
            updatedComps = updatedComps.map((c: any) => ({
              ...c,
              marks: Math.round(((parseFloat(String(c.marks)) || 0) / oldTotal) * practicalMarks * 100) / 100
            }));
          }
        }
        return { ...s, practicalMarks, practicalComponents: updatedComps };
      }
      return s;
    }));
  };

  const handleAddPracticalComponent = (sectionId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const comps = s.practicalComponents || [];
        const newComp = {
          id: `pc-${Date.now()}-${comps.length + 1}`,
          name: `Practical Station ${comps.length + 1}`,
          marks: 5,
        };
        const updated = [...comps, newComp];
        const newTotal = Math.round(updated.reduce((acc: number, c: any) => acc + (parseFloat(String(c.marks)) || 0), 0) * 100) / 100;
        return { ...s, practicalComponents: updated, practicalMarks: newTotal };
      }
      return s;
    }));
  };

  const handleUpdatePracticalComponent = (sectionId: string, compId: string, field: 'name' | 'marks', value: any) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const updated = (s.practicalComponents || []).map((c: any) => {
          if (c.id === compId) {
            return { ...c, [field]: value };
          }
          return c;
        });
        const newTotal = Math.round(updated.reduce((acc: number, c: any) => acc + (parseFloat(String(c.marks)) || 0), 0) * 100) / 100;
        return { ...s, practicalComponents: updated, practicalMarks: newTotal };
      }
      return s;
    }));
  };

  const handleRemovePracticalComponent = (sectionId: string, compId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        const updated = (s.practicalComponents || []).filter((c: any) => c.id !== compId);
        const newTotal = Math.round(updated.reduce((acc: number, c: any) => acc + (parseFloat(String(c.marks)) || 0), 0) * 100) / 100;
        return { ...s, practicalComponents: updated, practicalMarks: newTotal };
      }
      return s;
    }));
  };

  const handleRemoveQuestionFromSection = (sectionId: string, qId: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: (sec.questions || []).filter((q: any) => (q.questionId || q.id) !== qId),
        };
      }
      return sec;
    }));
  };

  // ─── RE-EDIT QUESTION WEIGHTAGE & SUB-PART MARKS ────────────────────────
  const handleUpdateMarks = (sectionId: string, qId: string, newMarks: number) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: (sec.questions || []).map((q: any) => {
            if ((q.questionId || q.id) === qId) {
              let updatedSubs = q.sub_questions;
              if (Array.isArray(updatedSubs) && updatedSubs.length > 0) {
                const oldTotal = updatedSubs.reduce((acc: number, sp: any) => acc + (parseFloat(String(sp.marks)) || 0), 0);
                if (oldTotal > 0) {
                  updatedSubs = updatedSubs.map((sp: any) => ({
                    ...sp,
                    marks: Math.round(((parseFloat(String(sp.marks)) || 0) / oldTotal) * newMarks * 100) / 100,
                  }));
                } else {
                  const equalShare = Math.round((newMarks / updatedSubs.length) * 100) / 100;
                  updatedSubs = updatedSubs.map((sp: any) => ({ ...sp, marks: equalShare }));
                }
              }
              return { ...q, marks: newMarks, sub_questions: updatedSubs };
            }
            return q;
          }),
        };
      }
      return sec;
    }));
  };

  const handleUpdateSubQuestionMarks = (sectionId: string, qId: string, subPartId: string, newPartMarks: number) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: (sec.questions || []).map((q: any) => {
            if ((q.questionId || q.id) === qId) {
              const updatedSubs = (q.sub_questions || []).map((sp: any) => {
                if (sp.id === subPartId) {
                  return { ...sp, marks: newPartMarks };
                }
                return sp;
              });
              const sumMarks = Math.round(updatedSubs.reduce((acc: number, sp: any) => acc + (parseFloat(String(sp.marks)) || 0), 0) * 100) / 100;
              return { ...q, marks: sumMarks, sub_questions: updatedSubs };
            }
            return q;
          }),
        };
      }
      return sec;
    }));
  };

  const handleUpdateStagedQuestionMarks = (qId: string, newMarks: number) => {
    setStagedQuestions(prev => prev.map(sq => {
      if (sq.id === qId) {
        let updatedSubs = sq.sub_questions;
        if (Array.isArray(updatedSubs) && updatedSubs.length > 0) {
          const oldTotal = updatedSubs.reduce((acc: number, sp: any) => acc + (parseFloat(String(sp.marks)) || 0), 0);
          if (oldTotal > 0) {
            updatedSubs = updatedSubs.map((sp: any) => ({
              ...sp,
              marks: Math.round(((parseFloat(String(sp.marks)) || 0) / oldTotal) * newMarks * 100) / 100,
            }));
          } else {
            const equalShare = Math.round((newMarks / updatedSubs.length) * 100) / 100;
            updatedSubs = updatedSubs.map((sp: any) => ({ ...sp, marks: equalShare }));
          }
        }
        return {
          ...sq,
          max_marks: newMarks,
          marks: newMarks,
          sub_questions: updatedSubs,
        };
      }
      return sq;
    }));
  };

  const handleUpdateStagedSubQuestionMarks = (qId: string, subPartId: string, newPartMarks: number) => {
    setStagedQuestions(prev => prev.map(sq => {
      if (sq.id === qId) {
        const updatedSubs = (sq.sub_questions || []).map((sp: any) => {
          if (sp.id === subPartId) {
            return { ...sp, marks: newPartMarks };
          }
          return sp;
        });
        const sumMarks = Math.round(updatedSubs.reduce((acc: number, sp: any) => acc + (parseFloat(String(sp.marks)) || 0), 0) * 100) / 100;
        return {
          ...sq,
          max_marks: sumMarks,
          marks: sumMarks,
          sub_questions: updatedSubs,
        };
      }
      return sq;
    }));
  };

  const handleApplySuggestedMarks = (sectionId: string, qId: string, suggestedMarks: number) => {
    handleUpdateMarks(sectionId, qId, suggestedMarks);
    setExistingQuestionRemarks(prev => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  // ─── CREATE QUESTION IN QUESTION BANK (Tab 1) ────────────────────────────
  const handleSaveQuestionToBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return alert('Please enter question prompt.');
    const { slug, headers } = getH();
    const effectiveSubjId = newQSubjectId || selectedSubjectId || undefined;
    const subjObj = allSubjects.find((s: any) => String(s.id) === String(effectiveSubjId) || String(s.code) === String(effectiveSubjId));
    const realSubjectId = subjObj?.id || effectiveSubjId;

    const parsedMainMarks = Math.round((parseFloat(String(newQMarks)) || (newQMode === 'MCQ' ? 1 : 10)) * 100) / 100;
    const subSum = newQHasSubParts
      ? Math.round(newQSubParts.reduce((s: number, p: any) => s + (parseFloat(String(p.marks)) || 0), 0) * 100) / 100
      : parsedMainMarks;
    const effectiveMaxMarks = (newQMode === 'DESC' && newQHasSubParts && subSum > 0) ? subSum : parsedMainMarks;

    const payload: any = {
      mode: newQMode,
      questionText: newQText.trim(),
      subjectId: realSubjectId || undefined,
      topicId: newQTopicId || undefined,
      topic: newQTopic || newQTopicName || undefined,
      competencyId: newQSubtopicId || undefined,
      competencyCode: newQSubtopicCode || undefined,
      difficultyLevel: newQDifficulty,
      maxMarks: effectiveMaxMarks,
    };

    if (newQMode === 'MCQ') {
      payload.optionA = newQOptionA || '';
      payload.optionB = newQOptionB || '';
      payload.optionC = newQOptionC || '';
      payload.optionD = newQOptionD || '';
      payload.correctOption = newQCorrectOption || 'option_a';
    } else {
      payload.hasSubQuestions = Boolean(newQHasSubParts);
      payload.subQuestions = newQHasSubParts
        ? newQSubParts.map((sp: any) => ({
            ...sp,
            marks: Math.round((parseFloat(String(sp.marks)) || 0) * 100) / 100,
          }))
        : [];
    }

    try {
      const res = await fetch(`${API_BASE}/exams/question-bank?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadQuestionBank();
        setIsAddQModalOpen(false);
        setNewQText('');
        setNewQTopic('');
        alert('🎉 Question successfully added to Question Bank and linked to subject!');
      } else {
        const err = await res.json().catch(() => ({}));
        const errDetails = Array.isArray(err.errors) ? err.errors.join('\n') : (err.message || 'Please check your inputs');
        alert(`Failed to save question to bank:\n${errDetails}`);
      }
    } catch (err: any) {
      alert(`Error saving question: ${err.message}`);
    }
  };

  const handleDeleteQuestionFromBank = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question from Question Bank?')) return;
    const { slug, headers } = getH();
    try {
      await fetch(`${API_BASE}/exams/question-bank/${qId}?tenant=${slug}`, {
        method: 'DELETE',
        headers,
      });
      await loadQuestionBank();
    } catch {
      alert('Failed to delete question.');
    }
  };

  // ─── START NEW OR EDIT PAPER (Tab 2) ────────────────────────────────────
  const startNewPaper = () => {
    setEditingPaperId(null);
    setPaperCode(`EXAM-${Date.now().toString().slice(-6)}`);
    setPaperTitle('Mid-Term Examination 2026-27');
    setDurationMinutes(60);
    setPassingMarks(20);
    setPaperType('THEORY');
    setPaperVersion(1);
    setHodRemarksHistory('');
    setExistingQuestionRemarks({});
    setSections([
      {
        id: 'sec-a',
        title: 'Section A: Multiple Choice Questions (MCQs)',
        type: 'MCQ',
        instructions: 'Answer all multiple choice questions. Each question carries 1 mark.',
        targetCount: 10,
        questions: [],
      },
      {
        id: 'sec-b',
        title: 'Section B: Descriptive & Analytical Questions',
        type: 'DESC',
        instructions: 'Answer all long-answer questions. Sub-parts must be clearly numbered.',
        targetCount: 3,
        questions: [],
      },
    ]);
    setActiveTab('design');
  };

  const startEditPaper = (p: any) => {
    setEditingPaperId(p.id);
    setPaperCode(p.code || '');
    setPaperTitle(p.name || '');
    setDurationMinutes(Number(p.duration_minutes || 60));
    setPassingMarks(Number(p.passing_marks || 20));
    setPaperType(p.type || 'THEORY');
    setPaperVersion(Number(p.version || 1));
    setHodRemarksHistory(p.hod_remarks || '');

    // Parse sections
    let parsedSections: any[] = [];
    if (typeof p.sections === 'string') {
      try { parsedSections = JSON.parse(p.sections); } catch {}
    } else if (Array.isArray(p.sections)) {
      parsedSections = p.sections;
    }
    setSections(parsedSections.length > 0 ? parsedSections : [
      { id: 'sec-a', title: 'Section A: MCQs', type: 'MCQ', questions: [] },
      { id: 'sec-b', title: 'Section B: Descriptive', type: 'DESC', questions: [] },
    ]);

    // Parse question remarks
    let qRemarks: Record<string, QuestionRemarkItem> = {};
    if (typeof p.question_remarks === 'string') {
      try { qRemarks = JSON.parse(p.question_remarks); } catch {}
    } else if (p.question_remarks) {
      qRemarks = p.question_remarks;
    }
    setExistingQuestionRemarks(qRemarks);

    if (p.colg_cd) setSelectedColgCd(p.colg_cd);
    if (p.course_cd) setSelectedCourseCd(p.course_cd);
    if (p.branch_cd) setSelectedBranchCd(p.branch_cd);
    if (p.batch_cd) setSelectedBatchCd(p.batch_cd);
    if (p.semester) setSelectedSemester(p.semester);
    if (p.section) setSelectedSection(p.section);
    if (p.subject_id) setSelectedSubjectId(p.subject_id);

    setActiveTab('design');
  };

  // ─── SAVE OR SUBMIT PAPER (Tab 2) ───────────────────────────────────────
  const handleSaveOrSubmit = async (status: 'DRAFT' | 'PENDING_HOD_APPROVAL') => {
    setSubmitting(true);
    const { slug, headers } = getH();

    const selectedSubjObj = allSubjects.find((s: any) => (s.id || s.code) === selectedSubjectId);
    const calculatedVersion = editingPaperId
      ? (status === 'PENDING_HOD_APPROVAL' && existingPaperHasChanges ? paperVersion + 1 : paperVersion)
      : 1;

    const payload: any = {
      id: editingPaperId || undefined,
      code: paperCode,
      name: paperTitle,
      subjectId: selectedSubjectId || undefined,
      batchId: selectedBatchCd || undefined,
      maxMarks: paperTotals.grandTotalMarks || 40,
      passingMarks: Number(passingMarks) || 20,
      durationMinutes: Number(durationMinutes) || 60,
      type: paperType,
      sections,
      status,
      colgCd: selectedColgCd,
      courseCd: selectedCourseCd,
      branchCd: selectedBranchCd,
      batchCd: selectedBatchCd,
      semester: selectedSemester,
      section: selectedSection,
      departmentId: selectedSubjObj?.department_id || undefined,
      version: calculatedVersion,
      questionRemarks: existingQuestionRemarks,
    };

    try {
      let savedPaper: any = null;
      let saveSuccess = false;

      // 1. Try local Next.js Route Handler first (direct DB save with full schema isolation)
      try {
        const localRes = await fetch(`/api/v1/exams/papers?tenant=${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug },
          body: JSON.stringify(payload),
        });
        if (localRes.ok) {
          const localData = await localRes.json();
          savedPaper = localData?.data || localData;
          saveSuccess = true;
        }
      } catch (localErr) {
        console.warn('Next.js route handler save attempt:', localErr);
      }

      // 2. If not saved via local route handler, try primary API_BASE
      if (!saveSuccess) {
        const res = await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          savedPaper = d?.data || d;
          saveSuccess = true;
        } else if (res.status === 400) {
          // If remote legacy backend rejects non-whitelisted fields, retry with clean payload
          const errData = await res.json().catch(() => ({}));
          const errStr = JSON.stringify(errData);
          if (errStr.includes('should not exist') || errStr.includes('Validation failed')) {
            const cleanPayload = {
              id: payload.id,
              code: payload.code,
              name: payload.name,
              subjectId: payload.subjectId,
              batchId: payload.batchId,
              maxMarks: payload.maxMarks,
              passingMarks: payload.passingMarks,
              durationMinutes: payload.durationMinutes,
              type: payload.type,
              sections: payload.sections,
              status: payload.status,
            };

            const res2 = await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, {
              method: 'POST',
              headers,
              body: JSON.stringify(cleanPayload),
            });

            if (res2.ok) {
              const d2 = await res2.json().catch(() => ({}));
              savedPaper = d2?.data || d2;
              saveSuccess = true;
            } else {
              const err2 = await res2.json().catch(() => ({}));
              throw new Error(err2.message || 'Validation failed on fallback');
            }
          } else {
            throw new Error(errData.message || 'Please check all required fields.');
          }
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Please check all required fields.');
        }
      }

      // 3. Sync full metadata (academic hierarchy, version, status) directly into PostgreSQL
      const targetId = savedPaper?.id || editingPaperId;
      try {
        await fetch(`/api/v1/exams/papers/sync-meta?tenant=${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-slug': slug },
          body: JSON.stringify({
            paperId: targetId,
            code: paperCode,
            status,
            colgCd: selectedColgCd,
            courseCd: selectedCourseCd,
            branchCd: selectedBranchCd,
            batchCd: selectedBatchCd,
            semester: selectedSemester,
            section: selectedSection,
            departmentId: selectedSubjObj?.department_id || undefined,
            version: calculatedVersion,
            questionRemarks: existingQuestionRemarks,
          }),
        });
      } catch (syncErr) {
        console.warn('Metadata sync fallback note:', syncErr);
      }

      await loadPapers();
      alert(status === 'PENDING_HOD_APPROVAL'
        ? '🎉 Question paper successfully submitted to Department HOD for approval!'
        : '💾 Question paper draft saved successfully.');
    } catch (e: any) {
      alert(`Failed to save question paper: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── PUBLISH EXAMINATION (Tab 3 — Mandatory HOD Approval) ────────────────
  const handlePublishExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaperToPublish) {
      return alert('Please select a question paper to publish.');
    }

    // MANDATORY HOD APPROVAL CHECK
    if (selectedPaperToPublish.status !== 'HOD_APPROVED' && selectedPaperToPublish.status !== 'PUBLISHED') {
      return alert(`🔒 HOD APPROVAL IS MANDATORY TO PUBLISH!\n\nThis paper is currently in '${selectedPaperToPublish.status || 'DRAFT'}' status.\nPlease submit the paper for HOD approval from Tab 2 and wait for HOD approval.`);
    }

    setPublishing(true);
    const { slug, headers } = getH();
    try {
      const finalColgCd = selectedColgCd || selectedPaperToPublish.colg_cd || '1';
      const finalCourseCd = selectedCourseCd || selectedPaperToPublish.course_cd || '';
      const finalBranchCd = selectedBranchCd || selectedPaperToPublish.branch_cd || '';
      const finalBatchCd = selectedBatchCd || selectedPaperToPublish.batch_cd || '';
      const finalSemester = selectedSemester || selectedPaperToPublish.semester || '';

      // 1. Persist complete cascading hierarchy (colg, course, branch, batch, semester) on paper
      try {
        await fetch(`${API_BASE}/exams/papers?tenant=${slug}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: selectedPaperToPublish.id,
            code: selectedPaperToPublish.code,
            name: selectedPaperToPublish.name,
            maxMarks: selectedPaperToPublish.max_marks || 40,
            passingMarks: selectedPaperToPublish.passing_marks || 20,
            colgCd: finalColgCd,
            courseCd: finalCourseCd,
            branchCd: finalBranchCd,
            batchCd: finalBatchCd,
            semester: finalSemester,
            examDate: publishDate,
            status: 'PUBLISHED',
          }),
        });
      } catch {}

      // 2. Publish examination paper with validated fields
      const payload: any = {
        paperId: selectedPaperToPublish.id,
        examDate: publishDate,
        startTime: publishStartTime,
        endTime: publishEndTime,
      };
      if (finalBatchCd) {
        payload.batchId = finalBatchCd;
        payload.batchCd = finalBatchCd;
      }
      if (finalColgCd) payload.colgCd = finalColgCd;
      if (finalCourseCd) payload.courseCd = finalCourseCd;
      if (finalBranchCd) payload.branchCd = finalBranchCd;
      if (finalSemester) payload.semester = finalSemester;

      let res = await fetch(`${API_BASE}/exams/publish?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // Fallback: If remote backend has strict DTO rejecting extra keys, retry with core whitelist
      if (!res.ok) {
        const minimalPayload = {
          paperId: selectedPaperToPublish.id,
          batchId: finalBatchCd || undefined,
          examDate: publishDate,
          startTime: publishStartTime,
          endTime: publishEndTime,
        };
        const retryRes = await fetch(`${API_BASE}/exams/publish?tenant=${slug}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(minimalPayload),
        });
        if (retryRes.ok) {
          res = retryRes;
        }
      }

      if (res.ok) {
        await loadPapers();
        alert(`🚀 Examination successfully scheduled and published for Batch ${finalBatchCd || 'Target'} on ${publishDate}!`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to publish: ${err.message || 'HOD approval required.'}`);
      }
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      const { slug, headers } = getH();
      await fetch(`${API_BASE}/exams/papers/${paperId}?tenant=${slug}`, {
        method: 'DELETE',
        headers,
      });
      await loadPapers();
    } catch {
      alert('Failed to delete paper.');
    }
  };

  const openPreview = (p: any, mode: 'preview' | 'clerk_view' | 'print' = 'preview') => {
    setPreviewPaper(p);
    setPreviewMode(mode);
    setPreviewModalOpen(true);
  };

  const existingPaperHasChanges = Object.values(existingQuestionRemarks).some(r => r.action && r.action !== 'ok');

  // Semester & Section-wise filtered papers for Publish & Queue
  const semesterSectionFilteredPapers = useMemo(() => {
    return papers.filter((p: any) => {
      if (publishSemesterFilter !== 'ALL' && p.semester && String(p.semester) !== String(publishSemesterFilter)) {
        return false;
      }
      if (publishSectionFilter !== 'ALL' && p.section && String(p.section) !== String(publishSectionFilter)) {
        return false;
      }
      return true;
    });
  }, [papers, publishSemesterFilter, publishSectionFilter]);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="clerk" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Question Paper Designer & Assessment Hub" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TOP PRIMARY TABS BAR: 1. Question Bank | 2. Design Paper | 3. Publish */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#5B4BFF]/10 text-[#5B4BFF] font-mono font-bold uppercase tracking-wider">
                  CLERK ASSESSMENT WORKFLOW
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                  HOD APPROVAL MANDATORY
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1B1E28] dark:text-white">
                Question Paper Designer &amp; Assessment Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design question papers from the bank, submit for HOD review, and publish after official approval.
              </p>
            </div>

            {/* Main Tabs Navigation */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {[
                { key: 'bank' as const, label: '1. Question Bank', icon: BookOpen, count: allBankQuestions.length },
                { key: 'design' as const, label: '2. Design Paper', icon: Edit3, count: papers.length },
                { key: 'publish' as const, label: '3. Publish', icon: Send, count: papers.filter(p => p.status === 'HOD_APPROVED').length },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#5B4BFF] text-white shadow-md shadow-[#5B4BFF]/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* GLOBAL ACADEMIC HIERARCHY CONTEXT (SHARED ACROSS ALL 3 TABS)         */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#5B4BFF]" />
                <h2 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                  Academic Hierarchy Context (College &rarr; Course &rarr; Branch &rarr; Batch &rarr; Semester &rarr; Section)
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  ⚡ Connected to Academic Registry
                </span>
                {currentSubjectQuestions.length > 0 ? (
                  <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                    ✅ {currentSubjectQuestions.length} Feeded Questions
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    0 Questions in Bank
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* College */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">College *</label>
                <select
                  value={selectedColgCd}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold focus:outline-none focus:border-[#5B4BFF]"
                >
                  {colleges.map((c: any) => (
                    <option key={c.colg_cd || c.id} value={String(c.colg_cd || c.id)}>
                      {c.colg_name || c.name || 'SRMS CET'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#5B4BFF] mb-1">Course *</label>
                <select
                  value={selectedCourseCd}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#5B4BFF]/5 dark:bg-slate-800 border-2 border-[#5B4BFF]/40 text-[#1B1E28] dark:text-white font-black focus:outline-none focus:border-[#5B4BFF]"
                >
                  {courses.map((c: any) => (
                    <option key={c.course_cd || c.code} value={String(c.course_cd || c.code)}>
                      {c.course_name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch / Dept */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-emerald-600 mb-1">Branch / Dept *</label>
                <select
                  value={selectedBranchCd}
                  onChange={(e) => setSelectedBranchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-500/5 dark:bg-slate-800 border-2 border-emerald-500/40 text-[#1B1E28] dark:text-white font-black focus:outline-none"
                >
                  {branches.map((b: any) => (
                    <option key={b.branch_cd || b.code} value={String(b.branch_cd || b.code)}>
                      {b.branch_name || b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Batch *</label>
                <select
                  value={selectedBatchCd}
                  onChange={(e) => setSelectedBatchCd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                >
                  {batches.map((b: any) => (
                    <option key={b.batch_cd || b.code} value={String(b.batch_cd || b.code)}>
                      {b.batch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Semester *</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Section *</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                >
                  {['Section A', 'Section B', 'Section C', 'Section D'].map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject Selector (Determines question bank linkage) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                  Subject (Filtered by Course &amp; Semester) *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500/30 text-[#1B1E28] dark:text-white font-black text-xs focus:outline-none"
                >
                  {availableSubjects.map((s: any) => (
                    <option key={s.id || s.code} value={s.id || s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Scope Indicator Pill */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Current Scope</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
                    {currentSubjectObj?.name || 'Selected Subject'}
                  </span>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-700 pl-3 flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Feeded Questions</span>
                  <span className="font-mono font-black text-[#5B4BFF]">
                    {currentSubjectQuestions.length} Questions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: QUESTION BANK                                                  */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              
              {/* Question Bank Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-[#5B4BFF]" />
                    <h2 className="text-base font-black text-[#1B1E28] dark:text-white">
                      Institutional Question Bank
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Repository of unit, topic, and competency linked MCQ and Descriptive questions.
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Active: <b className="text-[#5B4BFF]">{currentSubjectObj?.name || 'Subject'}</b> ({currentSubjectObj?.code || 'N/A'})
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">
                      Semester {selectedSemester} ({selectedSection})
                    </span>
                    {currentSubjectQuestions.length > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {currentSubjectQuestions.length} feeded questions ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        No questions feeded for this subject yet
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openAddQuestionModal}
                  className="px-4 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-extrabold transition-all shadow-sm shadow-[#5B4BFF]/30 flex items-center gap-2 cursor-pointer self-start sm:self-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Question to Bank</span>
                </button>
              </div>

              {/* Filters Toolbar */}
              <div className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                {/* Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={qbSearchQuery}
                    onChange={(e) => setQbSearchQuery(e.target.value)}
                    placeholder="Search by question text, topic, unit..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Mode Filter */}
                <div className="w-full md:w-44">
                  <select
                    value={qbModeFilter}
                    onChange={(e) => setQbModeFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                  >
                    <option value="ALL">All Modes (MCQ + DESC)</option>
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="DESC">Descriptive &amp; Analytical</option>
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div className="w-full md:w-40">
                  <select
                    value={qbDifficultyFilter}
                    onChange={(e) => setQbDifficultyFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                  >
                    <option value="ALL">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>

                {/* Scope Switcher: Active Subject Only vs All Questions */}
                <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setQbShowAllSubjects(false)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                      !qbShowAllSubjects
                        ? 'bg-[#5B4BFF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    🎯 Active Subject ({currentSubjectQuestions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQbShowAllSubjects(true)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                      qbShowAllSubjects
                        ? 'bg-[#5B4BFF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    🌐 All ({allBankQuestions.length})
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {qbLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-3 border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : displayedBankQuestions.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 p-6">
                  <span className="text-4xl block">📚</span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">
                    No questions found for {currentSubjectObj?.name || 'this subject'}.
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    There are currently no questions feeded for {currentSubjectObj?.name || 'this subject'} in Semester {selectedSemester}.
                    You can add questions directly using the button below, or switch to view all bank questions.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={openAddQuestionModal}
                      className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-bold shadow-sm cursor-pointer"
                    >
                      + Add First Question to Bank
                    </button>
                    {allBankQuestions.length > 0 && !qbShowAllSubjects && (
                      <button
                        type="button"
                        onClick={() => setQbShowAllSubjects(true)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        View All {allBankQuestions.length} Questions Across All Subjects
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayedBankQuestions.map((q: any, idx: number) => (
                    <div
                      key={q.id || idx}
                      className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#5B4BFF]/30 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            q.mode === 'MCQ' ? 'bg-[#5B4BFF]/10 text-[#5B4BFF]' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                          }`}>
                            {q.mode}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                            {q.unit_code || 'CO1'}
                          </span>
                          {q.topic && <span className="text-slate-500 font-medium">Topic: {q.topic}</span>}
                          {(q.subject_name || q.subject_code) && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                              {q.subject_name || q.subject_code}
                            </span>
                          )}
                          {q.semester && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-bold">
                              Sem {q.semester}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {q.difficulty_level || 'Medium'}
                          </span>
                          <span className="font-mono text-[#5B4BFF] font-black">
                            {Number(q.max_marks || (q.mode === 'MCQ' ? 1 : 10))} Marks
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestionFromBank(q.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 text-xs font-bold transition-all cursor-pointer"
                          title="Delete question from bank"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm font-bold text-[#1B1E28] dark:text-white leading-relaxed">
                        {q.question_text || q.questionText}
                      </p>

                      {/* MCQ Options Display */}
                      {q.mode === 'MCQ' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          {[
                            { key: 'option_a', label: 'A', text: q.option_a },
                            { key: 'option_b', label: 'B', text: q.option_b },
                            { key: 'option_c', label: 'C', text: q.option_c },
                            { key: 'option_d', label: 'D', text: q.option_d },
                          ].map(opt => (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                                q.correct_option === opt.key
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                q.correct_option === opt.key ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                              }`}>
                                {opt.label}
                              </span>
                              <span className="truncate">{opt.text || `Option ${opt.label}`}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Descriptive Subparts */}
                      {q.mode === 'DESC' && q.sub_questions && q.sub_questions.length > 0 && (
                        <div className="space-y-1.5 pt-1 pl-3 border-l-2 border-purple-300 dark:border-purple-800">
                          {q.sub_questions.map((sq: any) => (
                            <div key={sq.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                              <span><b className="text-purple-600 dark:text-purple-400 font-mono">{sq.label}</b> {sq.questionText}</span>
                              <span className="font-mono text-slate-400 font-bold">[{Number(sq.marks)}M]</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: DESIGN PAPER                                                   */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'design' && (
            <div className="space-y-6">

              {/* 2. EXAMINATION PAPER SPECIFICATIONS */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h2 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    2. Examination Paper Specifications
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">Version: v{paperVersion}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#5B4BFF]/10 text-[#5B4BFF]">
                      Total: {paperTotals.grandTotalMarks} Marks ({paperTotals.totalQuestions} Questions)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Paper Code *</label>
                    <input
                      type="text"
                      value={paperCode}
                      onChange={(e) => setPaperCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Paper Title *</label>
                    <input
                      type="text"
                      value={paperTitle}
                      onChange={(e) => setPaperTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Duration (minutes) *</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Passing Marks *</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                    />
                  </div>
                </div>

                {/* HOD Directives Banner if Changes Requested */}
                {existingPaperHasChanges && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-black text-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                      <span>HOD Revision Directives: {hodRemarksHistory || 'Please revise the flagged questions below.'}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Use the 1-click action buttons on highlighted question cards to <b>Replace from Question Bank</b>, <b>Apply Suggested Marks</b>, or <b>Remove</b> the question before re-submitting.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. DYNAMIC SECTIONS BUILDER */}
              <div className="space-y-4">
                {/* Section Controls Toolbar */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-sm text-[#1B1E28] dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#5B4BFF]" />
                      <span>Examination Paper Sections ({sections.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add and configure theory sections (MCQ/Descriptive) and practical/clinical assessment sections for this paper blueprint.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddSection('MCQ')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#5B4BFF]" />
                      <span>+ MCQ Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('DESC')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#F36C21]" />
                      <span>+ Descriptive Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('PRACTICAL')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🧪</span>
                      <span>+ Add Practical Section</span>
                    </button>
                  </div>
                </div>

                {sections.map((sec: any, secIdx: number) => {
                  const qList: any[] = sec.questions || [];
                  const secMarks = Math.round(qList.reduce((acc, q) => acc + (parseFloat(String(q.marks)) || 0), 0) * 100) / 100;
                  const isPractical = sec.type === 'PRACTICAL';

                  if (isPractical) {
                    const pList: any[] = sec.practicalComponents || [];
                    const practicalTotal = pList.length > 0
                      ? Math.round(pList.reduce((acc, p) => acc + (parseFloat(String(p.marks)) || 0), 0) * 100) / 100
                      : (parseFloat(String(sec.practicalMarks ?? 20)) || 20);

                    return (
                      <div
                        key={sec.id || secIdx}
                        className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 shadow-sm space-y-4"
                      >
                        {/* Practical Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 dark:border-purple-900/50 pb-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-white bg-purple-600 px-2.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
                                <span>🧪</span>
                                <span>PRACTICAL &amp; VIVA</span>
                              </span>
                              <input
                                type="text"
                                value={sec.title}
                                onChange={(e) => handleUpdateSectionTitle(sec.id, e.target.value)}
                                className="font-extrabold text-sm text-[#1B1E28] dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-purple-500 px-1 py-0.5"
                                placeholder="Section Title..."
                              />
                              {sections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSection(sec.id)}
                                  title="Remove Section"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-all cursor-pointer ml-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={sec.instructions || ''}
                              onChange={(e) => handleUpdateSectionInstructions(sec.id, e.target.value)}
                              placeholder="Instructions for faculty and students during practical evaluation..."
                              className="text-xs text-slate-500 italic w-full bg-transparent border-b border-slate-200 dark:border-slate-800 focus:outline-none px-1"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
                              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Max Practical Marks:</span>
                              <input
                                type="number"
                                step="any"
                                min={0.1}
                                value={sec.practicalMarks ?? practicalTotal}
                                onChange={(e) => handleUpdateSectionPracticalMarks(sec.id, parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 font-mono font-black text-xs text-center text-purple-700 dark:text-purple-300 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Practical Rubrics & Stations */}
                        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide flex items-center gap-1.5">
                                <span>🔬</span>
                                <span>Practical Assessment Stations &amp; Evaluation Rubrics</span>
                              </span>
                              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">
                                Faculty awards marks against these stations during student assessment.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddPracticalComponent(sec.id)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Station</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {pList.map((comp: any, cIdx: number) => (
                              <div
                                key={comp.id || cIdx}
                                className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                              >
                                <span className="font-mono font-bold text-purple-600 text-xs w-7 text-center">
                                  #{cIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={comp.name}
                                  onChange={(e) => handleUpdatePracticalComponent(sec.id, comp.id, 'name', e.target.value)}
                                  placeholder="Station name / Rubric (e.g. Lab Experiment, Spotting, Viva Voce)"
                                  className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white"
                                />
                                <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                                  <span className="text-[10px] font-bold text-slate-500">Weightage:</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min={0.1}
                                    value={comp.marks}
                                    onChange={(e) => handleUpdatePracticalComponent(sec.id, comp.id, 'marks', parseFloat(e.target.value) || 0)}
                                    className="w-14 text-xs font-mono font-black text-right text-purple-600 bg-transparent focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">M</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePracticalComponent(sec.id, comp.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                  title="Remove station"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs font-bold text-purple-800 dark:text-purple-300">
                            <span>Total Stations: {pList.length}</span>
                            <span>Total Practical Weightage: <strong className="font-mono text-purple-700 dark:text-purple-200 font-black">{practicalTotal} Marks</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={sec.id || secIdx}
                      className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-[#5B4BFF] bg-[#5B4BFF]/10 px-2 py-0.5 rounded">
                              {sec.type}
                            </span>
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => handleUpdateSectionTitle(sec.id, e.target.value)}
                              className="font-extrabold text-sm text-[#1B1E28] dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-[#5B4BFF] px-1 py-0.5"
                              placeholder="Section Title..."
                            />
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(sec.id)}
                                title="Remove Section"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 transition-all cursor-pointer ml-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={sec.instructions || ''}
                            onChange={(e) => handleUpdateSectionInstructions(sec.id, e.target.value)}
                            placeholder="Instructions for this section..."
                            className="text-xs text-slate-500 italic w-full bg-transparent border-b border-slate-200 dark:border-slate-800 focus:outline-none px-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-emerald-500/10 text-emerald-600">
                            {qList.length} Questions · {secMarks} Marks
                          </span>
                          <button
                            type="button"
                            onClick={() => openQuestionPicker(sec.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add from Bank</span>
                          </button>
                        </div>
                      </div>

                      {/* Questions in this Section */}
                      {qList.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                          No questions added to this section yet. Click <b>&ldquo;+ Add from Bank&rdquo;</b> above.
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {qList.map((q: any, qIdx: number) => {
                            const qId = q.questionId || q.id;
                            const hodRemark = existingQuestionRemarks[qId];
                            const isFlagged = hodRemark && hodRemark.action && hodRemark.action !== 'ok';

                            return (
                              <div
                                key={qId || qIdx}
                                className={`p-4 rounded-xl border transition-all space-y-2 ${
                                  isFlagged
                                    ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-sm'
                                    : 'bg-[#F6F8FC] dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                {isFlagged && (
                                  <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-200 font-bold">
                                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      <span>HOD Request: [{hodRemark.action.toUpperCase()}] &mdash; {hodRemark.remark}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {hodRemark.action === 'replace' && (
                                        <button
                                          type="button"
                                          onClick={() => openQuestionPicker(sec.id, qId)}
                                          className="px-2.5 py-1 rounded bg-[#5B4BFF] text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Replace from Q-Bank</span>
                                        </button>
                                      )}
                                      {hodRemark.action === 'adjust_marks' && hodRemark.suggestedMarks && (
                                        <button
                                          type="button"
                                          onClick={() => handleApplySuggestedMarks(sec.id, qId, Number(hodRemark.suggestedMarks))}
                                          className="px-2.5 py-1 rounded bg-amber-600 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1"
                                        >
                                          <Sparkles className="w-3 h-3" />
                                          <span>Apply {hodRemark.suggestedMarks} Marks</span>
                                        </button>
                                      )}
                                      {hodRemark.action === 'remove' && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveQuestionFromSection(sec.id, qId)}
                                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>Remove Question</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <span className="font-mono font-bold text-[#5B4BFF]">Q{qIdx + 1}</span>
                                      <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        {q.unit_code || 'CO1'}
                                      </span>
                                      {q.topic && <span className="text-slate-500">Topic: {q.topic}</span>}
                                    </div>
                                    <p className="text-xs font-bold text-[#1B1E28] dark:text-white">
                                      {q.questionText}
                                    </p>

                                    {/* MCQ Choices Preview */}
                                    {q.mode === 'MCQ' && (q.option_a || q.option_b || q.option_c || q.option_d) && (
                                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                        {q.option_a && <span className={q.correct_option === 'option_a' ? 'font-black text-emerald-600' : ''}>A) {q.option_a}</span>}
                                        {q.option_b && <span className={q.correct_option === 'option_b' ? 'font-black text-emerald-600' : ''}>B) {q.option_b}</span>}
                                        {q.option_c && <span className={q.correct_option === 'option_c' ? 'font-black text-emerald-600' : ''}>C) {q.option_c}</span>}
                                        {q.option_d && <span className={q.correct_option === 'option_d' ? 'font-black text-emerald-600' : ''}>D) {q.option_d}</span>}
                                      </div>
                                    )}

                                    {/* Sub-questions / Multi-part Weightage Re-editing */}
                                    {q.sub_questions && Array.isArray(q.sub_questions) && q.sub_questions.length > 0 && (
                                      <div className="pl-3 space-y-1.5 border-l-2 border-purple-300 dark:border-purple-700/60 my-2 pt-1">
                                        <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300 block">
                                          Sub-parts Weightage Breakdown:
                                        </span>
                                        {q.sub_questions.map((sp: any, spIdx: number) => (
                                          <div
                                            key={sp.id || spIdx}
                                            className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                                          >
                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                              <span className="font-mono font-black text-purple-600 text-xs shrink-0">{sp.label}</span>
                                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                                                {sp.questionText || sp.question_text || `Sub-question ${sp.label}`}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                                              <span className="text-[10px] text-slate-400 font-bold">Part Marks:</span>
                                              <input
                                                type="number"
                                                step="any"
                                                min={0.1}
                                                value={sp.marks ?? 1}
                                                onChange={(e) => handleUpdateSubQuestionMarks(sec.id, qId, sp.id, parseFloat(e.target.value) || 0)}
                                                className="w-14 text-xs font-mono font-bold text-right text-purple-600 bg-transparent focus:outline-none"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                      <span className="text-[10px] text-slate-500 font-bold">Marks:</span>
                                      <input
                                        type="number"
                                        step="any"
                                        min={0.1}
                                        value={q.marks || 1}
                                        onChange={(e) => handleUpdateMarks(sec.id, qId, parseFloat(e.target.value) || 0)}
                                        className="w-14 text-xs font-mono font-black text-right bg-transparent focus:outline-none"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveQuestionFromSection(sec.id, qId)}
                                      className="text-slate-400 hover:text-rose-500 p-1"
                                      title="Remove from paper"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Save Draft / Submit for HOD Approval */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-sm text-[#1B1E28] dark:text-white">
                    Paper Blueprint: {paperTotals.grandTotalMarks} Marks ({paperTotals.totalQuestions} Questions)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Status: <b className="text-[#5B4BFF]">{editingPaperId ? 'Editing Revision' : 'New Paper'}</b> (v{paperVersion})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveOrSubmit('DRAFT')}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition-all cursor-pointer"
                  >
                    💾 Save Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveOrSubmit('PENDING_HOD_APPROVAL')}
                    disabled={submitting || paperTotals.totalQuestions === 0}
                    className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <Send className="w-4 h-4" />
                    <span>🚀 Submit for HOD Approval</span>
                  </button>
                </div>
              </div>

              {/* Designed Papers Queue Table */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                      📋 Recent Designed Papers ({papers.length})
                    </h3>
                    <p className="text-xs text-slate-500">Track HOD approval status and revisions</p>
                  </div>
                  <button
                    onClick={startNewPaper}
                    className="px-3 py-1.5 rounded-xl bg-[#5B4BFF]/10 text-[#5B4BFF] font-extrabold text-xs hover:bg-[#5B4BFF]/20 transition-all"
                  >
                    + New Paper
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {papers.length === 0 ? (
                    <p className="py-6 text-center text-slate-400">No papers created yet.</p>
                  ) : (
                    papers.map((p: any) => {
                      const badge = STATUS_BADGE[p.status] || STATUS_BADGE.DRAFT;
                      return (
                        <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#5B4BFF] font-black">[{p.code}]</span>
                              <strong className="text-[#1B1E28] dark:text-white">{p.name}</strong>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badge.cls}`}>
                                {badge.label}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800">
                                v{p.version || 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-slate-500 text-[11px] pt-0.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{p.subject_name || 'Subject'}</span>
                              {p.course_cd && (
                                <>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/60 dark:border-purple-800 text-[10px]">
                                    {formatCourseName(p.course_cd, p.course_name)}
                                  </span>
                                </>
                              )}
                              {(p.semester || p.section) && (
                                <>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-blue-800 text-[10px]">
                                    {formatSemester(p.semester, p.section)}
                                  </span>
                                </>
                              )}
                              <span>·</span>
                              <span>{p.max_marks || 40}M</span>
                              <span>·</span>
                              <span>{p.duration_minutes || 60} min</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => openPreview(p, p.status === 'CHANGES_REQUESTED' ? 'clerk_view' : 'preview')}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => startEditPaper(p)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[#5B4BFF] font-bold text-[11px] hover:bg-[#5B4BFF] hover:text-white transition-all"
                            >
                              ✏️ Edit
                            </button>
                            {p.status === 'HOD_APPROVED' && (
                              <button
                                onClick={() => {
                                  setSelectedPaperToPublish(p);
                                  setActiveTab('publish');
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Publish &rarr;</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePaper(p.id)}
                              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-[11px] transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: PUBLISH (SEMESTER & SECTION WISE + MANDATORY HOD APPROVAL)     */}
          {/* ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'publish' && (
            <div className="space-y-6">

              {/* Semester & Section Filter Bar */}
              <div className="p-5 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-black text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#5B4BFF]" />
                    <span>Publish &amp; Schedule Official Examination</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Filter question paper sets by Semester and Section. <b>HOD Approval is strictly mandatory to publish.</b>
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Filter Semester</label>
                    <select
                      value={publishSemesterFilter}
                      onChange={(e) => setPublishSemesterFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                    >
                      <option value="ALL">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={String(s)}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Filter Section</label>
                    <select
                      value={publishSectionFilter}
                      onChange={(e) => setPublishSectionFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                    >
                      <option value="ALL">All Sections</option>
                      {['Section A', 'Section B', 'Section C', 'Section D'].map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Semester / Section Question Paper Sets Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Available Question Paper Sets ({semesterSectionFilteredPapers.length}) &mdash; Select Paper to Publish:
                </h3>

                {semesterSectionFilteredPapers.length === 0 ? (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-3xl">📋</span>
                    <p className="font-extrabold text-sm text-slate-600 dark:text-slate-300">
                      No question paper sets found for the selected Semester / Section filter.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {semesterSectionFilteredPapers.map((paper: any) => {
                      const isSelected = selectedPaperToPublish?.id === paper.id;
                      const isApproved = paper.status === 'HOD_APPROVED' || paper.status === 'PUBLISHED';
                      const badge = STATUS_BADGE[paper.status] || STATUS_BADGE.DRAFT;

                      return (
                        <div
                          key={paper.id}
                          onClick={() => setSelectedPaperToPublish(paper)}
                          className={`p-5 rounded-[22px] border-2 transition-all cursor-pointer space-y-3 ${
                            isSelected
                              ? 'border-[#5B4BFF] bg-[#5B4BFF]/5 shadow-lg'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#5B4BFF]/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono text-[11px] font-black text-[#5B4BFF]">
                                [{paper.code}]
                              </span>
                              <h4 className="font-black text-sm text-[#1B1E28] dark:text-white mt-0.5">
                                {paper.name}
                              </h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1">
                            <p>📚 <b>{paper.subject_name || 'Subject'}</b></p>
                            <p className="flex items-center gap-3">
                              <span>🎓 Sem {paper.semester || '3'} ({paper.section || 'Sec A'})</span>
                              <span>⏱️ {paper.duration_minutes || 60} mins</span>
                              <span>🎯 {paper.max_marks || 40}M</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="font-mono text-[11px] font-bold text-slate-400">v{paper.version || 1}</span>
                            <span className={`text-[11px] font-extrabold ${
                              isApproved ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {isApproved ? '✅ Verified for Publish' : '🔒 Requires HOD Approval'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Paper Publish Scheduling Form */}
              {selectedPaperToPublish && (
                <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border-2 border-[#5B4BFF] shadow-xl space-y-6">
                  
                  {/* Status Banner */}
                  {selectedPaperToPublish.status !== 'HOD_APPROVED' && selectedPaperToPublish.status !== 'PUBLISHED' ? (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                      <div className="flex items-center gap-2 font-black text-sm text-amber-800 dark:text-amber-300">
                        <Lock className="w-5 h-5 text-amber-600" />
                        <span>🔒 HOD APPROVAL IS MANDATORY TO PUBLISH THIS PAPER</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        This examination paper is currently in <b>&lsquo;{selectedPaperToPublish.status || 'DRAFT'}&rsquo;</b> status.
                        Under institution academic regulations, examination schedules cannot be published to students or faculty until the Department Head has officially reviewed and approved the questions.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          startEditPaper(selectedPaperToPublish);
                          setActiveTab('design');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Go to Tab 2 (Design Paper) to Submit to HOD &rarr;</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-black text-sm text-emerald-800 dark:text-emerald-300">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          <span>✅ OFFICIAL HOD APPROVAL VERIFIED &mdash; READY TO SCHEDULE</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          HOD Remarks: &ldquo;{selectedPaperToPublish.hod_remarks || 'Approved for examination schedule.'}&rdquo; (v{selectedPaperToPublish.version})
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openPreview(selectedPaperToPublish, 'print')}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>🖨️ Print Official Paper</span>
                      </button>
                    </div>
                  )}

                  <form onSubmit={handlePublishExam} className="space-y-5">
                    {/* Cascading Target Summary Strip */}
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Cascading Target:</span>
                      <span className="font-extrabold text-[#5B4BFF] dark:text-[#7867FF]">
                        🎓 {selectedBatchCd || selectedPaperToPublish.batch_cd || 'Batch (Cascading Selected)'}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Course: {courses.find(c => c.course_cd === selectedCourseCd || c.code === selectedCourseCd)?.name || selectedCourseCd || selectedPaperToPublish.course_cd}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Branch: {branches.find(b => b.branch_cd === selectedBranchCd || b.code === selectedBranchCd)?.name || selectedBranchCd || selectedPaperToPublish.branch_cd}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Sem: {selectedSemester || selectedPaperToPublish.semester}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Examination Date *</label>
                        <input
                          type="date"
                          value={publishDate}
                          onChange={(e) => setPublishDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-mono font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Start Time *</label>
                        <input
                          type="time"
                          value={publishStartTime}
                          onChange={(e) => setPublishStartTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-mono font-bold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">End Time *</label>
                        <input
                          type="time"
                          value={publishEndTime}
                          onChange={(e) => setPublishEndTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500">
                        Paper: <b className="text-[#1B1E28] dark:text-white">{selectedPaperToPublish.name}</b> [{selectedPaperToPublish.code}]
                      </span>

                      <button
                        type="submit"
                        disabled={
                          publishing ||
                          (selectedPaperToPublish.status !== 'HOD_APPROVED' && selectedPaperToPublish.status !== 'PUBLISHED')
                        }
                        className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center gap-2 ${
                          selectedPaperToPublish.status === 'HOD_APPROVED' || selectedPaperToPublish.status === 'PUBLISHED'
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 cursor-pointer'
                            : 'bg-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {publishing && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        <Send className="w-4 h-4" />
                        <span>🚀 Publish Examination to Students</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Published Examinations Ledger */}
              <div className="p-6 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                      📢 Published Examinations Ledger ({publishedLedger.length})
                    </h3>
                    <p className="text-xs text-slate-500">Official scheduled examinations released to students</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {publishedLedger.length === 0 ? (
                    <p className="py-6 text-center text-slate-400">No published examinations found.</p>
                  ) : (
                    publishedLedger.map((ex: any) => (
                      <div key={ex.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#F36C21] font-bold">[{ex.code}]</span>
                            <strong className="text-slate-900 dark:text-white">{ex.name}</strong>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                              PUBLISHED
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] flex items-center gap-3">
                            <span>📚 {ex.subject_name || 'Subject'}</span>
                            <span>🎓 {ex.batch_cd || ex.target_batch || 'Batch'}</span>
                            <span>📅 {ex.exam_date ? String(ex.exam_date).slice(0, 10) : 'Scheduled'}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openPreview(ex, 'print')}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Paper</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ADD QUESTION TO QUESTION BANK  (Cascading Unit→Topic→Sub)   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isAddQModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-[#1B1E28] dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#F36C21]" />
                <span>+ Add Question to Question Bank</span>
              </h3>
              <button onClick={() => setIsAddQModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 font-bold text-lg transition-all">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestionToBank} className="space-y-5 text-xs">

              {/* Context Banner */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-500">Target Context:</span>
                  <span className="font-mono font-bold text-[#5B4BFF]">{courses.find(c => String(c.course_cd || c.code) === String(selectedCourseCd))?.course_name || 'BCA'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{branches.find(b => String(b.branch_cd || b.code) === String(selectedBranchCd))?.branch_name || 'Dept'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Semester {selectedSemester} ({selectedSection})</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">⚡ Auto-Linked to Selected Subject</span>
              </div>

              {/* ── Question Mode Toggle ── */}
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wide">Question Mode:</span>
                <div className="flex items-center gap-1.5 bg-[#F6F8FC] dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={() => { setNewQMode('MCQ'); setNewQMarks(1); }}
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${newQMode === 'MCQ' ? 'bg-[#F36C21] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}>
                    Multiple Choice (MCQ)
                  </button>
                  <button type="button" onClick={() => { setNewQMode('DESC'); setNewQMarks(10); }}
                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${newQMode === 'DESC' ? 'bg-[#5B4BFF] text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}>
                    Descriptive &amp; Analytical
                  </button>
                </div>
              </div>

              {/* ── ROW 1: Subject + Semester ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subject *</label>
                  <select
                    value={newQSubjectId}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setNewQSubjectId(val);
                      setNewQUnitId(''); setNewQUnit('CO1');
                      setNewQTopicId(''); setNewQTopicName(''); setNewQTopic('');
                      setNewQSubtopicId(''); setNewQSubtopicName('');
                      setModalUnits([]); setModalTopics([]); setModalSubtopics([]);
                      const subjObj = allSubjects.find((s: any) => (s.id || s.code) === val);
                      const subjCode = subjObj?.code || subjObj?.subject_code || '';
                      if (subjCode) await loadModalUnits(String(subjCode));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                  >
                    {(availableSubjects.length > 0 ? availableSubjects : allSubjects).map((s: any) => (
                      <option key={s.id || s.code} value={s.id || s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Semester *</label>
                  <select
                    value={newQSemester}
                    onChange={(e) => setNewQSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold"
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={String(sem)}>Semester {sem}</option>)}
                  </select>
                </div>
              </div>

              {/* ── CASCADING: Unit (text & description displayed instead of code repetition) ── */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Unit
                  {unitsLoading && <span className="ml-2 text-[#5B4BFF] animate-pulse">Loading…</span>}
                  {!unitsLoading && modalUnits.length === 0 && <span className="ml-2 text-amber-500">(No units found — add via Admin Master)</span>}
                </label>
                <select
                  value={newQUnitId}
                  onChange={async (e) => {
                    const uid = e.target.value;
                    setNewQUnitId(uid);
                    const unitObj = modalUnits.find((u: any) => String(u.id) === uid);
                    const uCode = unitObj?.unit_code || unitObj?.code || '';
                    setNewQUnit(uCode);
                    setNewQTopicId(''); setNewQTopicName(''); setNewQTopic('');
                    setNewQSubtopicId(''); setNewQSubtopicName('');
                    setModalTopics([]); setModalSubtopics([]);
                    const subjObj = allSubjects.find((s: any) => (s.id || s.code) === newQSubjectId);
                    const subjCode = subjObj?.code || subjObj?.subject_code || '';
                    if (uCode && subjCode) await loadModalTopics(String(subjCode), uCode);
                  }}
                  disabled={modalUnits.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold disabled:opacity-50 text-xs sm:text-sm"
                >
                  {modalUnits.length === 0
                    ? <option value="">— No units found —</option>
                    : modalUnits.map((u: any) => (
                        <option key={u.id} value={String(u.id)} title={u.unit_description || u.description || ''}>
                          {formatUnitLabel(u)}
                        </option>
                      ))
                  }
                </select>

                {/* Rich Unit details callout: shows code badge + syllabus description */}
                {newQUnitId && (
                  (() => {
                    const activeUnit = modalUnits.find((u: any) => String(u.id) === newQUnitId);
                    const desc = activeUnit?.unit_description || activeUnit?.description;
                    const code = activeUnit?.unit_code || activeUnit?.code || newQUnit;
                    const name = activeUnit?.unit_name || activeUnit?.name;
                    return (
                      <div className="mt-1.5 p-2 rounded-lg bg-[#5B4BFF]/5 border border-[#5B4BFF]/15 text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-[#5B4BFF]/15 text-[#5B4BFF] font-mono font-bold px-2 py-0.5 rounded">{code}</span>
                          {name && name.toLowerCase() !== code.toLowerCase() && (
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{name}</span>
                          )}
                          <span className="text-[10px] text-slate-400">Unit linked to question</span>
                        </div>
                        {desc && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {desc}
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* ── CASCADING: Topic ── */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Topic
                  {topicsLoading && <span className="ml-2 text-[#5B4BFF] animate-pulse">Loading…</span>}
                  {!topicsLoading && modalUnits.length > 0 && modalTopics.length === 0 && <span className="ml-2 text-amber-500">(No topics for this unit)</span>}
                </label>
                <select
                  value={newQTopicId}
                  onChange={async (e) => {
                    const tid = e.target.value;
                    setNewQTopicId(tid);
                    const topicObj = modalTopics.find((t: any) => String(t.id) === tid);
                    const tName = topicObj?.topic_name || topicObj?.name || '';
                    setNewQTopicName(tName);
                    setNewQTopic(tName);
                    setNewQSubtopicId(''); setNewQSubtopicName('');
                    setModalSubtopics([]);
                    const subjObj = allSubjects.find((s: any) => (s.id || s.code) === newQSubjectId);
                    const subjCode = subjObj?.code || subjObj?.subject_code || '';
                    if (tid) await loadModalSubtopics(tid, newQUnit, subjCode, topicObj?.code || topicObj?.topic_code);
                  }}
                  disabled={modalTopics.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold disabled:opacity-50 text-xs sm:text-sm"
                >
                  {modalTopics.length === 0
                    ? <option value="">— Select a unit first —</option>
                    : modalTopics.map((t: any) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.topic_name || t.name}{t.code ? ` (${t.code})` : ''}
                        </option>
                      ))
                  }
                </select>
              </div>

              {/* ── CASCADING: Sub-Topic (Competency) ── */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Sub-Topic / Competency
                  {subtopicsLoading && <span className="ml-2 text-[#5B4BFF] animate-pulse">Loading subtopics…</span>}
                  {!subtopicsLoading && modalTopics.length > 0 && modalSubtopics.length === 0 && <span className="ml-2 text-slate-400">(No subtopics — question will be tagged to topic)</span>}
                </label>
                {modalSubtopics.length > 0 ? (
                  <select
                    value={newQSubtopicId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setNewQSubtopicId(sid);
                      const stObj = modalSubtopics.find((s: any) => String(s.id) === sid);
                      const sName = stObj?.competency_name || stObj?.name || stObj?.description || '';
                      setNewQSubtopicName(sName);
                      setNewQSubtopicCode(stObj?.code || stObj?.competency_code || '');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-xs sm:text-sm"
                  >
                    <option value="">— Tag to topic only (no subtopic) —</option>
                    {modalSubtopics.map((st: any) => {
                      const stName = st.competency_name || st.name || '';
                      const stDesc = st.description && st.description.trim() !== stName.trim() ? ` — ${st.description.trim()}` : '';
                      const stCode = st.code ? ` (${st.code})` : '';
                      return (
                        <option key={st.id} value={String(st.id)}>
                          {stName}{stDesc}{stCode}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-[11px] italic">
                    {subtopicsLoading ? 'Loading sub-topics / competencies…' : (newQTopicId ? 'No sub-topics found for this topic' : 'Select a topic to load sub-topics')}
                  </div>
                )}
              </div>

              {/* ── Difficulty Level + Marks ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Difficulty Level</label>
                  <div className="flex gap-2">
                    {(['Easy','Medium','Hard'] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNewQDifficulty(lvl)}
                        className={`flex-1 py-2 rounded-xl font-black text-xs transition-all border ${
                          newQDifficulty === lvl
                            ? lvl === 'Easy' ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : lvl === 'Medium' ? 'bg-amber-400 text-white border-amber-400 shadow-sm'
                            : 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-[#F6F8FC] dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {lvl === 'Easy' ? '🟢' : lvl === 'Medium' ? '🟡' : '🔴'} {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Marks</label>
                  <input
                    type="number"
                    step="any"
                    min={0.1}
                    max={100}
                    value={newQMarks}
                    onChange={(e) => setNewQMarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold text-center text-sm"
                  />
                </div>
              </div>

              {/* ── Question Prompt ── */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Question Prompt *</label>
                <textarea
                  rows={3}
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder={newQMode === 'MCQ' ? 'Enter the question prompt...' : 'Enter the long-answer / analytical question...'}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white font-bold resize-y"
                  required
                />
              </div>

              {/* ── MCQ Options ── */}
              {newQMode === 'MCQ' && (
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Options &amp; Correct Answer:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'option_a', label: 'A', val: newQOptionA, set: setNewQOptionA },
                      { key: 'option_b', label: 'B', val: newQOptionB, set: setNewQOptionB },
                      { key: 'option_c', label: 'C', val: newQOptionC, set: setNewQOptionC },
                      { key: 'option_d', label: 'D', val: newQOptionD, set: setNewQOptionD },
                    ].map(opt => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <input
                          type="radio" name="correctOption"
                          checked={newQCorrectOption === opt.key}
                          onChange={() => setNewQCorrectOption(opt.key as any)}
                          className="text-[#F36C21] focus:ring-0 cursor-pointer accent-[#F36C21]"
                        />
                        <span className={`font-black w-5 text-center text-sm ${ newQCorrectOption === opt.key ? 'text-[#F36C21]' : 'text-slate-400' }`}>{opt.label}:</span>
                        <input
                          type="text" value={opt.val}
                          onChange={(e) => opt.set(e.target.value)}
                          placeholder={`Option ${opt.label}`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1B1E28] dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Descriptive Sub-parts (Dynamic multi-subquestions with add/remove) ── */}
              {newQMode === 'DESC' && (() => {
                const numMainMarks = Math.round((parseFloat(String(newQMarks)) || 0) * 100) / 100;
                const subPartsTotalMarks = Math.round(
                  newQSubParts.reduce((sum: number, sp: any) => sum + (parseFloat(String(sp.marks)) || 0), 0) * 100
                ) / 100;
                const isMatching = Math.abs(subPartsTotalMarks - numMainMarks) < 0.01;
                return (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Sub-questions / Multi-part Question:</span>
                        <p className="text-[11px] text-slate-500">Enable to divide question into multiple sub-questions like a), b), c)...</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleSubParts}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm ${
                          newQHasSubParts
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {newQHasSubParts ? `✓ Sub-parts Enabled (${newQSubParts.length})` : '+ Enable Sub-parts'}
                      </button>
                    </div>

                    {newQHasSubParts && (
                      <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div className="space-y-2">
                          {newQSubParts.map((sp: any, idx: number) => (
                            <div key={sp.id || idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                              <span className="font-mono font-black text-purple-600 dark:text-purple-400 w-6 text-center text-sm">
                                {sp.label}
                              </span>
                              <input
                                type="text"
                                value={sp.questionText}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setNewQSubParts(prev => prev.map(p => p.id === sp.id ? { ...p, questionText: v } : p));
                                }}
                                placeholder={`Sub-question ${sp.label} prompt / requirements...`}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1E28] dark:text-white"
                              />
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="any"
                                  min={0.1}
                                  max={100}
                                  value={sp.marks}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setNewQSubParts(prev => prev.map(p => p.id === sp.id ? { ...p, marks: v } : p));
                                  }}
                                  className="w-16 px-2 py-1.5 rounded-lg bg-[#F6F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-xs font-bold"
                                />
                                <span className="text-[10px] text-slate-400">Marks</span>
                              </div>
                              {newQSubParts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubPart(sp.id)}
                                  title="Remove this sub-question"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all font-bold text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add more sub-questions button & marks counter */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={handleAddSubPart}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 flex items-center gap-1.5 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Sub-question ({String.fromCharCode(97 + (newQSubParts.length % 26))})</span>
                          </button>

                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-bold ${isMatching ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              Total: {subPartsTotalMarks} / {numMainMarks} M
                            </span>
                            {!isMatching && (
                              <button
                                type="button"
                                onClick={() => setNewQMarks(subPartsTotalMarks)}
                                className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[10px] hover:bg-amber-200 transition-all"
                              >
                                Set Main to {subPartsTotalMarks}M
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── Footer Actions ── */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddQModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F36C21] hover:bg-[#e05a10] text-white font-extrabold shadow-sm flex items-center gap-2 transition-all">
                  <span>💾</span> Save to Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: QUESTION PICKER MODAL (From Question Bank into Paper)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: QUESTION PICKER MODAL (Cascading Unit -> Topic -> SubTopic)  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {pickerOpen && (() => {
        const targetSection = sections.find(s => s.id === pickerTargetSectionId);
        const totalStagedMarks = Math.round(stagedQuestions.reduce((acc, q) => acc + (parseFloat(String(q.max_marks)) || 1), 0) * 100) / 100;

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 space-y-3.5 my-auto max-h-[92vh] flex flex-col">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-base text-[#1B1E28] dark:text-white flex items-center gap-2">
                    <span>🔍 Select Questions from Question Bank</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                    <span className="font-bold text-slate-500">Target Section:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#5B4BFF]/10 text-[#5B4BFF] font-mono font-bold">
                      {targetSection?.title || 'Section'}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold">
                      Mode: {targetSection?.type || 'All'}
                    </span>
                    {currentSubjectObj?.name && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                        📚 {currentSubjectObj.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-lg transition-all"
                >
                  ✕
                </button>
              </div>

              {/* ── 1. CASCADING HIERARCHY FILTER (Unit -> Topic -> Sub-Topic) ── */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#5B4BFF]" />
                    <span>Syllabus Hierarchy Filter (Select Unit ➔ Topic ➔ Sub-Topic)</span>
                  </span>
                  {(pickerUnitsLoading || pickerTopicsLoading || pickerSubtopicsLoading) && (
                    <span className="text-[10px] text-[#5B4BFF] font-bold animate-pulse">
                      Loading syllabus data...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* 1. Unit Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      1. Unit *
                    </label>
                    <select
                      value={pickerSelectedUnitId}
                      onChange={async (e) => {
                        const uId = e.target.value;
                        setPickerSelectedUnitId(uId);
                        const unitObj = pickerUnits.find(u => String(u.id) === uId);
                        const uCode = unitObj?.unit_code || unitObj?.code || '';
                        setPickerSelectedUnitCode(uCode);
                        setPickerSelectedTopicId('');
                        setPickerSelectedTopicName('');
                        setPickerSelectedSubtopicId('');
                        setPickerSelectedSubtopicCode('');
                        setPickerTopics([]);
                        setPickerSubtopics([]);
                        const subjCode = currentSubjectObj?.code || currentSubjectObj?.subject_code || selectedSubjectId;
                        if (uCode && subjCode) {
                          await loadPickerTopics(String(subjCode), uCode);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs"
                    >
                      <option value="">— Select Unit * —</option>
                      {pickerUnits.map(u => (
                        <option key={u.id} value={String(u.id)}>
                          {formatUnitLabel(u)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Topic Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      2. Topic *
                    </label>
                    <select
                      value={pickerSelectedTopicId}
                      disabled={!pickerSelectedUnitCode || pickerTopics.length === 0}
                      onChange={async (e) => {
                        const tId = e.target.value;
                        setPickerSelectedTopicId(tId);
                        const tObj = pickerTopics.find(t => String(t.id) === tId);
                        const tName = tObj?.topic_name || tObj?.name || '';
                        setPickerSelectedTopicName(tName);
                        setPickerSelectedSubtopicId('');
                        setPickerSelectedSubtopicCode('');
                        setPickerSubtopics([]);
                        const subjCode = currentSubjectObj?.code || currentSubjectObj?.subject_code || selectedSubjectId;
                        if (tId) {
                          await loadPickerSubtopics(tId, pickerSelectedUnitCode, String(subjCode), tObj?.code || tObj?.topic_code);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs disabled:opacity-50"
                    >
                      <option value="">— {!pickerSelectedUnitCode ? 'Select Unit First' : 'Select Topic *'} —</option>
                      {pickerTopics.map(t => (
                        <option key={t.id} value={String(t.id)}>
                          {t.code ? `[${t.code}] ` : ''}{t.topic_name || t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Sub-Topic / Competency Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      3. Sub-Topic / Competency
                    </label>
                    <select
                      value={pickerSelectedSubtopicId}
                      disabled={!pickerSelectedTopicId}
                      onChange={(e) => {
                        const stId = e.target.value;
                        setPickerSelectedSubtopicId(stId);
                        const stObj = pickerSubtopics.find(st => String(st.id) === stId);
                        setPickerSelectedSubtopicCode(stObj?.code || stObj?.competency_code || '');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 text-xs disabled:opacity-50"
                    >
                      <option value="">— All Sub-Topics in this Topic —</option>
                      {pickerSubtopics.map(st => (
                        <option key={st.id} value={String(st.id)}>
                          {st.code || st.competency_code ? `[${st.code || st.competency_code}] ` : ''}
                          {st.competency_name || st.name || st.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inline Search Bar */}
                <div className="relative pt-0.5">
                  <input
                    type="text"
                    value={qbSearchQuery}
                    onChange={(e) => setQbSearchQuery(e.target.value)}
                    placeholder="Search question keyword in selected topic..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* ── 2. FILTERED QUESTIONS LIST ── */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-[140px] max-h-[220px] pr-1">
                {!pickerSelectedUnitCode ? (
                  <div className="py-7 px-4 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <span className="text-2xl block">👆</span>
                    <p className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                      Step 1: Please select a Unit above to browse questions
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Questions are organized by syllabus hierarchy. Select the curriculum unit to load topics.
                    </p>
                  </div>
                ) : !pickerSelectedTopicId && !pickerSelectedTopicName ? (
                  <div className="py-7 px-4 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <span className="text-2xl block">🎯</span>
                    <p className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                      Step 2: Select a Topic under Unit {pickerSelectedUnitCode}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Choose a syllabus topic from the dropdown above to view its matching questions.
                    </p>
                  </div>
                ) : filteredPickerQuestions.length === 0 ? (
                  <div className="py-7 px-4 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-2xl block">📭</span>
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      No questions found for this topic matching mode ({targetSection?.type || 'Any'}).
                    </p>
                    <p className="text-[11px] text-slate-400">
                      You can create new questions in the Question Bank tab or select another Unit/Topic above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-slate-500">
                        Found <b>{filteredPickerQuestions.length}</b> questions in {pickerSelectedTopicName}:
                      </span>
                      {!replacingQuestionId && filteredPickerQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={handleStageAllFiltered}
                          className="text-[11px] text-[#5B4BFF] hover:underline font-bold cursor-pointer"
                        >
                          + Stage All {filteredPickerQuestions.length} Questions
                        </button>
                      )}
                    </div>

                    {filteredPickerQuestions.map((q: any) => {
                      const isStaged = stagedQuestions.some(sq => sq.id === q.id);
                      const alreadyInSection = (targetSection?.questions || []).some((sq: any) => (sq.questionId || sq.id) === q.id);

                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                            isStaged
                              ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                                q.mode === 'MCQ' ? 'bg-[#5B4BFF]/10 text-[#5B4BFF]' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                              }`}>
                                [{q.mode}]
                              </span>
                              <span className="font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                                {q.unit_code || 'CO1'}
                              </span>
                              {q.topic && <span className="text-slate-500 font-semibold">{q.topic}</span>}
                              {(q.sub_topic_code || q.competency_code) && (
                                <span className="font-mono text-slate-400">({q.sub_topic_code || q.competency_code})</span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-medium">
                                {q.difficulty_level || 'Medium'}
                              </span>
                            </div>
                            <span className="font-mono text-[#5B4BFF] font-black">{Number(q.max_marks || 1)} Marks</span>
                          </div>

                          <p className="text-xs font-bold text-[#1B1E28] dark:text-white leading-relaxed">
                            {q.question_text || q.questionText}
                          </p>

                          {/* Multi-part preview if descriptive */}
                          {q.mode === 'DESC' && q.has_sub_questions && q.sub_questions && q.sub_questions.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 p-1.5 rounded-lg">
                              <span className="font-bold">Sub-parts:</span>
                              {q.sub_questions.map((sp: any) => (
                                <span key={sp.id} className="font-mono">
                                  {sp.label} {sp.questionText ? sp.questionText.slice(0, 30) : ''}… [{Number(sp.marks)}M]
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Staging Action Button */}
                          <div className="flex justify-end pt-1">
                            {alreadyInSection ? (
                              <span className="text-[10px] text-slate-400 font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                                ✓ Already in Section
                              </span>
                            ) : isStaged ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStageQuestion(q)}
                                className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-200 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>✓ Staged in Tray</span>
                                <span className="text-[10px] text-purple-500">(Click to Remove)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStageQuestion(q)}
                                className="px-3 py-1 rounded-lg bg-[#5B4BFF] hover:bg-[#7867FF] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{replacingQuestionId ? 'Select for Replacement' : '+ Stage Question'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 3. TEMPORARY STAGING TRAY / TABLE ── */}
              <div className="pt-2 border-t-2 border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <span>📋</span>
                      <span>Temporary Staged Questions Tray ({stagedQuestions.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Browse and stage from multiple topics, then click &ldquo;Save to Section&rdquo; below
                    </span>
                  </div>
                  {stagedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStagedQuestions([])}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear Tray
                    </button>
                  )}
                </div>

                {stagedQuestions.length === 0 ? (
                  <div className="py-3 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    Temporary tray is empty. Select <b>Unit ➔ Topic ➔ Sub-Topic</b> above and click <b>&ldquo;+ Stage Question&rdquo;</b>.
                  </div>
                ) : (
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold uppercase text-slate-500 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-3 w-8">#</th>
                          <th className="py-1.5 px-2 w-16">Mode</th>
                          <th className="py-1.5 px-2 w-28">Unit / Topic</th>
                          <th className="py-1.5 px-3">Question Prompt</th>
                          <th className="py-1.5 px-2 w-16 text-center">Marks</th>
                          <th className="py-1.5 px-2 w-10 text-center">✕</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {stagedQuestions.map((sq: any, sIdx: number) => (
                          <tr key={sq.id || sIdx} className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20">
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-400">{sIdx + 1}</td>
                            <td className="py-1.5 px-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                sq.mode === 'MCQ' ? 'bg-[#5B4BFF]/10 text-[#5B4BFF]' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                              }`}>
                                {sq.mode}
                              </span>
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="flex flex-col text-[10px]">
                                <span className="font-mono font-bold text-emerald-600">{sq.unit_code || 'CO1'}</span>
                                <span className="text-slate-500 truncate max-w-[100px]">{sq.topic || 'General'}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-3">
                              <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                {sq.question_text || sq.questionText}
                              </p>
                              {sq.mode === 'DESC' && sq.has_sub_questions && sq.sub_questions && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {sq.sub_questions.map((sp: any) => (
                                    <div key={sp.id} className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded text-[10px] border border-purple-200 dark:border-purple-800">
                                      <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{sp.label}</span>
                                      <input
                                        type="number"
                                        step="any"
                                        min={0.1}
                                        value={sp.marks ?? 1}
                                        onChange={(e) => handleUpdateStagedSubQuestionMarks(sq.id, sp.id, parseFloat(e.target.value) || 0)}
                                        className="w-10 text-right font-mono font-bold bg-transparent text-purple-800 dark:text-purple-200 focus:outline-none"
                                      />
                                      <span className="text-slate-400 font-bold">M</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <div className="inline-flex items-center gap-1 bg-[#F6F8FC] dark:bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                <input
                                  type="number"
                                  step="any"
                                  min={0.1}
                                  value={sq.max_marks ?? sq.marks ?? 1}
                                  onChange={(e) => handleUpdateStagedQuestionMarks(sq.id, parseFloat(e.target.value) || 0)}
                                  className="w-12 text-xs font-mono font-bold text-center text-[#5B4BFF] bg-transparent focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 font-bold">M</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => setStagedQuestions(prev => prev.filter(item => item.id !== sq.id))}
                                title="Remove from temporary tray"
                                className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition-all text-xs cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── 4. FOOTER ACTIONS ── */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-bold">
                    Staged: <span className="text-purple-600 dark:text-purple-400 font-mono font-black">{stagedQuestions.length}</span> Questions
                  </span>
                  {stagedQuestions.length > 0 && (
                    <span className="text-slate-500 ml-2">
                      (Total: <b className="font-mono text-[#5B4BFF]">{totalStagedMarks}</b> Marks)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitStagedQuestionsToSection}
                    disabled={stagedQuestions.length === 0}
                    className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#7867FF] text-white text-xs font-black shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all"
                  >
                    <span>💾</span>
                    <span>{replacingQuestionId ? 'Replace Flagged Question' : `Save to ${targetSection?.title?.split(':')[0] || 'Section'} (${stagedQuestions.length})`}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: QUESTION PAPER REVIEW & PREVIEW MODAL                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {previewModalOpen && previewPaper && (
        <QuestionPaperReviewModal
          paper={previewPaper}
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setPreviewPaper(null);
          }}
          mode={previewMode}
          userRole="Clerk"
        />
      )}

    </div>
  );
}
