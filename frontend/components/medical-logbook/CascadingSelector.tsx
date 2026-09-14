'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

export interface CascadingSelection {
  courseId: string;
  courseCode?: string;
  branchId: string;
  branchName?: string;
  batchId: string;
  batchCode?: string;
  professionalYearId: string;
  professionalYearName?: string;
  cbmeYearId: string;
  cbmeYearName?: string;
  subjectId: string;
  subjectName?: string;
  unitId: string;
  unitName?: string;
  topicId: string;
  topicName?: string;
  competencyId: string;
  competencyCode?: string;
  competencyTitle?: string;
}

interface CascadingSelectorProps {
  value?: Partial<CascadingSelection>;
  onChange?: (selection: CascadingSelection) => void;
  onComplete?: (selection: CascadingSelection) => void;
  programLevel?: 'UG' | 'PG';
  fixedProfessionalYearId?: string;
  disabledLevels?: string[];
  hideLevels?: string[];
}

export default function CascadingSelector({
  value,
  onChange,
  onComplete,
  programLevel = 'UG',
  fixedProfessionalYearId,
  disabledLevels = [],
  hideLevels = [],
}: CascadingSelectorProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [cbmeYears, setCbmeYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);

  // Selection states
  const [selectedCourse, setSelectedCourse] = useState(value?.courseId || '');
  const [selectedBranch, setSelectedBranch] = useState(value?.branchId || '');
  const [selectedBatch, setSelectedBatch] = useState(value?.batchId || '');
  const [selectedProf, setSelectedProf] = useState(fixedProfessionalYearId || value?.professionalYearId || '');
  const [selectedCbme, setSelectedCbme] = useState(value?.cbmeYearId || '');
  const [selectedSubject, setSelectedSubject] = useState(value?.subjectId || '');
  const [selectedUnit, setSelectedUnit] = useState(value?.unitId || '');
  const [selectedTopic, setSelectedTopic] = useState(value?.topicId || '');
  const [selectedCompetency, setSelectedCompetency] = useState(value?.competencyId || '');

  // Loading indicators
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const abortControllers = useRef<{ [key: string]: AbortController }>({});

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const rawSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || localStorage.getItem('selectedTenant') || 'srms-ims' : 'srms-ims';
    const slug = rawSlug.toLowerCase().trim().replace(/^tenant_/, '').replace(/^tenant-/, '');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-tenant-slug': slug,
      'tenant': slug,
    };
  }, []);

  const fetchWithAbort = async (key: string, url: string) => {
    if (abortControllers.current[key]) {
      abortControllers.current[key].abort();
    }
    const controller = new AbortController();
    abortControllers.current[key] = controller;

    setLoading(prev => ({ ...prev, [key]: true }));
    try {
      const h = getHeaders();
      const separator = url.includes('?') ? '&' : '?';
      const fullUrl = `${url}${separator}tenant=${h['x-tenant-slug']}`;
      const res = await fetch(fullUrl, {
        headers: h,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      console.warn(`[CascadingSelector] Fetch failed for ${key}:`, err.message);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // 1. Fetch initial Courses & Professionals
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [crsList, profList] = await Promise.all([
        fetchWithAbort('courses', `/api/v1/medical-logbook/lookups/courses?programLevel=${programLevel}`),
        fetchWithAbort('professionals', `/api/v1/medical-logbook/lookups/professionals`),
      ]);

      if (mounted) {
        if (crsList && crsList.length > 0) {
          setCourses(crsList);
          if (!selectedCourse) setSelectedCourse(crsList[0].id);
        }
        if (profList && profList.length > 0) {
          setProfessionals(profList);
          if (!selectedProf && !fixedProfessionalYearId) {
            setSelectedProf(profList[0].id);
          }
        }
      }
    })();
    return () => { mounted = false; };
  }, [programLevel]);

  // Sync fixedProfessionalYearId prop changes
  useEffect(() => {
    if (fixedProfessionalYearId && fixedProfessionalYearId !== selectedProf) {
      setSelectedProf(fixedProfessionalYearId);
    }
  }, [fixedProfessionalYearId]);

  // 2. Course changes -> Fetch Branches & Batches
  useEffect(() => {
    if (!selectedCourse) return;
    (async () => {
      const branchList = await fetchWithAbort('branches', `/api/v1/medical-logbook/lookups/branches?courseId=${selectedCourse}`);
      if (branchList && branchList.length > 0) {
        setBranches(branchList);
        if (!selectedBranch) setSelectedBranch(branchList[0].id);
      }
      const batchList = await fetchWithAbort('batches', `/api/v1/medical-logbook/lookups/batches?courseId=${selectedCourse}`);
      if (batchList && batchList.length > 0) {
        setBatches(batchList);
        if (!selectedBatch) setSelectedBatch(batchList[0].id);
      }
    })();
  }, [selectedCourse]);

  // 3. Professional Year changes -> Fetch CBME Years & Subjects
  useEffect(() => {
    if (!selectedProf) return;
    (async () => {
      const cbmeList = await fetchWithAbort('cbme', `/api/v1/medical-logbook/lookups/cbme-years?professionalYearId=${selectedProf}`);
      if (cbmeList && cbmeList.length > 0) {
        setCbmeYears(cbmeList);
        if (!selectedCbme) setSelectedCbme(cbmeList[0].id);
      }

      const subjList = await fetchWithAbort('subjects', `/api/v1/medical-logbook/lookups/subjects?professionalYearId=${selectedProf}`);
      if (subjList && subjList.length > 0) {
        setSubjects(subjList);
        setSelectedSubject(subjList[0].id);
      }
    })();
  }, [selectedProf]);

  // 4. Subject changes -> Fetch Units
  useEffect(() => {
    if (!selectedSubject) return;
    (async () => {
      const unitList = await fetchWithAbort('units', `/api/v1/medical-logbook/lookups/units?subjectId=${selectedSubject}`);
      if (unitList && unitList.length > 0) {
        setUnits(unitList);
        setSelectedUnit(unitList[0].id);
      } else {
        setUnits([]);
        setSelectedUnit('');
      }
    })();
  }, [selectedSubject]);

  // 5. Unit changes -> Fetch Topics
  useEffect(() => {
    if (!selectedUnit && !selectedSubject) return;
    (async () => {
      const topicList = await fetchWithAbort('topics', `/api/v1/medical-logbook/lookups/topics?unitId=${selectedUnit}&subjectId=${selectedSubject}`);
      if (topicList && topicList.length > 0) {
        setTopics(topicList);
        setSelectedTopic(topicList[0].id);
      } else {
        setTopics([]);
        setSelectedTopic('');
      }
    })();
  }, [selectedUnit, selectedSubject]);

  // 6. Topic changes -> Fetch Competencies
  useEffect(() => {
    if (!selectedTopic && !selectedSubject) return;
    (async () => {
      const compList = await fetchWithAbort('competencies', `/api/v1/medical-logbook/lookups/competencies?topicId=${selectedTopic}&subjectId=${selectedSubject}`);
      if (compList && compList.length > 0) {
        setCompetencies(compList);
        setSelectedCompetency(compList[0].id);
      } else {
        setCompetencies([]);
        setSelectedCompetency('');
      }
    })();
  }, [selectedTopic, selectedSubject]);

  // Notify parent on change
  useEffect(() => {
    const curCourse = courses.find(c => c.id === selectedCourse);
    const curBranch = branches.find(b => b.id === selectedBranch);
    const curBatch = batches.find(b => b.id === selectedBatch);
    const curProf = professionals.find(p => p.id === selectedProf);
    const curCbme = cbmeYears.find(c => c.id === selectedCbme);
    const curSubj = subjects.find(s => s.id === selectedSubject);
    const curUnit = units.find(u => u.id === selectedUnit);
    const curTopic = topics.find(t => t.id === selectedTopic);
    const curComp = competencies.find(c => c.id === selectedCompetency);

    const selection: CascadingSelection = {
      courseId: selectedCourse,
      courseCode: curCourse?.code,
      branchId: selectedBranch,
      branchName: curBranch?.name,
      batchId: selectedBatch,
      batchCode: curBatch?.code,
      professionalYearId: selectedProf,
      professionalYearName: curProf?.name,
      cbmeYearId: selectedCbme,
      cbmeYearName: curCbme?.name,
      subjectId: selectedSubject,
      subjectName: curSubj?.name,
      unitId: selectedUnit,
      unitName: curUnit?.name,
      topicId: selectedTopic,
      topicName: curTopic?.name,
      competencyId: selectedCompetency,
      competencyCode: curComp?.code,
      competencyTitle: curComp?.title || curComp?.name,
    };

    if (onChange) onChange(selection);

    if (
      selectedCourse &&
      selectedProf &&
      selectedSubject &&
      selectedCompetency &&
      onComplete
    ) {
      onComplete(selection);
    }
  }, [
    selectedCourse,
    selectedBranch,
    selectedBatch,
    selectedProf,
    selectedCbme,
    selectedSubject,
    selectedUnit,
    selectedTopic,
    selectedCompetency,
    courses,
    branches,
    batches,
    professionals,
    cbmeYears,
    subjects,
    units,
    topics,
    competencies,
  ]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-5 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#5B4BFF]/10 dark:bg-[#5B4BFF]/20 flex items-center justify-center text-[#5B4BFF]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-100">
              Medical Academic Hierarchy Selector
            </h4>
            <p className="text-[11px] text-[#4E5969] dark:text-slate-400">
              Course → Branch → Batch → Professional → CBME Year → Subject → Unit → Topic → Competency
            </p>
          </div>
        </div>
        {Object.values(loading).some(Boolean) && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5B4BFF] bg-[#5B4BFF]/10 px-2.5 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#5B4BFF]" />
            Updating Hierarchy...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* 1. Course */}
        {!hideLevels.includes('course') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              1. Course {loading.courses && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedCourse}
              onChange={e => {
                setSelectedCourse(e.target.value);
                setSelectedBranch('');
                setSelectedBatch('');
              }}
              disabled={disabledLevels.includes('course')}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all"
            >
              <option value="">— Select Course —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} ({c.name})</option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Branch */}
        {!hideLevels.includes('branch') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              2. Branch / Department {loading.branches && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              disabled={disabledLevels.includes('branch') || !selectedCourse}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-50"
            >
              <option value="">— Select Branch —</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Batch */}
        {!hideLevels.includes('batch') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              3. Batch {loading.batches && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              disabled={disabledLevels.includes('batch') || !selectedCourse}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-50"
            >
              <option value="">— Select Batch —</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.code} (Year {b.year})</option>
              ))}
            </select>
          </div>
        )}

        {/* 4. Professional Year */}
        {!hideLevels.includes('professionalYear') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5B4BFF] mb-1">
              4. Professional Year *
            </label>
            <select
              value={selectedProf}
              onChange={e => {
                setSelectedProf(e.target.value);
                setSelectedSubject('');
                setSelectedUnit('');
                setSelectedTopic('');
                setSelectedCompetency('');
              }}
              disabled={Boolean(fixedProfessionalYearId) || disabledLevels.includes('professionalYear')}
              className="w-full px-3 py-2 bg-[#5B4BFF]/5 dark:bg-[#5B4BFF]/10 border border-[#5B4BFF]/30 rounded-xl text-xs font-bold text-[#5B4BFF] dark:text-[#7867FF] focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-80"
            >
              <option value="">— Select Professional —</option>
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 5. CBME Year */}
        {!hideLevels.includes('cbmeYear') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              5. CBME Year {loading.cbme && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedCbme}
              onChange={e => setSelectedCbme(e.target.value)}
              disabled={disabledLevels.includes('cbmeYear') || !selectedProf}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-50"
            >
              <option value="">— Select CBME Year —</option>
              {cbmeYears.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 6. Subject */}
        {!hideLevels.includes('subject') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              6. Subject * {loading.subjects && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSelectedUnit('');
                setSelectedTopic('');
                setSelectedCompetency('');
              }}
              disabled={disabledLevels.includes('subject') || !selectedProf}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-50"
            >
              <option value="">— Select Subject —</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        )}

        {/* 7. Unit */}
        {!hideLevels.includes('unit') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              7. Unit {loading.units && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedUnit}
              onChange={e => {
                setSelectedUnit(e.target.value);
                setSelectedTopic('');
                setSelectedCompetency('');
              }}
              disabled={disabledLevels.includes('unit') || !selectedSubject}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-50"
            >
              <option value="">— Select Unit —</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 8. Topic */}
        {!hideLevels.includes('topic') && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4E5969] dark:text-slate-400 mb-1">
              8. Topic {loading.topics && <span className="text-[#5B4BFF]">⟳</span>}
            </label>
            <select
              value={selectedTopic}
              onChange={e => {
                setSelectedTopic(e.target.value);
                setSelectedCompetency('');
              }}
              disabled={disabledLevels.includes('topic') || (!selectedUnit && !selectedSubject)}
              className="w-full px-3 py-2 bg-[#F6F8FC] dark:bg-slate-800/80 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all disabled:opacity-50"
            >
              <option value="">— Select Topic —</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 9. Competency (Full Width with code — title) */}
      {!hideLevels.includes('competency') && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F36C21] mb-1.5 flex items-center justify-between">
            <span>9. Competency (Pre-Seeded Master) *</span>
            {loading.competencies && <span className="text-xs animate-spin">⟳</span>}
          </label>
          <select
            value={selectedCompetency}
            onChange={e => setSelectedCompetency(e.target.value)}
            disabled={disabledLevels.includes('competency') || !selectedSubject}
            className="w-full px-3.5 py-2.5 bg-[#FFF9F5] dark:bg-slate-800/90 border border-[#F36C21]/30 rounded-xl text-xs font-bold text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F36C21] transition-all disabled:opacity-50"
          >
            <option value="">— Select Competency (Code — Title) —</option>
            {competencies.map(c => (
              <option key={c.id} value={c.id}>
                {c.displayText || `${c.code} — ${c.title || c.name}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
