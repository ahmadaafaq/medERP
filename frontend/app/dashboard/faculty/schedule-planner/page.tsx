'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getTenantSlug } from '@/hooks/useTenantAcademicData';

const API_BASE = '/api/v1';
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getH() {
  if (typeof window === 'undefined') return { slug: '', headers: {} as any, facultyId: '', facultyEmpId: '', facultyName: '' };
  const slug = getTenantSlug();
  const token = localStorage.getItem('token') || '';

  let userObj: any = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) userObj = JSON.parse(raw);
  } catch {}

  const facultyId = localStorage.getItem('userId') || localStorage.getItem('facultyId') || userObj?.id || userObj?.userId || userObj?.usr_id || '';
  const facultyEmpId = localStorage.getItem('emp_id') || localStorage.getItem('empid') || localStorage.getItem('empId') || localStorage.getItem('facultyEmpId') || localStorage.getItem('employeeId') || userObj?.emp_id || userObj?.empId || userObj?.empid || '';
  const facultyName = localStorage.getItem('name') || localStorage.getItem('facultyName') || userObj?.name || userObj?.full_name || userObj?.userName || '';

  return {
    slug,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-tenant-slug': slug,
      'Content-Type': 'application/json',
    },
    facultyId,
    facultyEmpId,
    facultyName,
  };
}

function fmtDate(s: string) {
  if (!s) return '';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface AccumulatedCurriculumItem {
  id: string;
  unitId?: string;
  unitName: string;
  topic: string;
  subTopics: string[];
  competencyCodes?: string;
}

interface SlotDraft {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  subjectCode?: string;
  subjectId?: string;
  subject_id?: string;
  facultyName?: string;
  room?: string;
  slotType?: string;
  unitId?: string;
  unitName?: string;
  topic?: string;
  subTopics?: string;
  competencyCodes?: string;
  curriculumMappings?: AccumulatedCurriculumItem[];
  mappingStatus: 'PENDING' | 'LINKED';
  [k: string]: any;
}

interface WeekDraft {
  id: string;
  title: string;
  status: string;
  week_start?: string;
  week_end?: string;
  slots: SlotDraft[];
}

interface MasterUnit {
  id: string;
  code: string;
  name: string;
  description?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
}

interface MasterTopic {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit_id?: string;
  unit_code?: string;
  unit_name?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
}

interface MasterCompetency {
  id: string;
  code: string;
  name?: string;
  description?: string;
  topic_id?: string;
  topic_code?: string;
  topic_name?: string;
  unit_id?: string;
  unit_code?: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
}

export default function FacultySchedulePlannerPage() {
  const [weeks, setWeeks] = useState<WeekDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ draft: WeekDraft; slot: SlotDraft } | null>(null);
  const [linking, setLinking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Curriculum Master Data (Subject-specific only)
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [subjectUnits, setSubjectUnits] = useState<MasterUnit[]>([]);
  const [subjectTopics, setSubjectTopics] = useState<MasterTopic[]>([]);
  const [subjectCompetencies, setSubjectCompetencies] = useState<MasterCompetency[]>([]);

  // Accumulated Curriculum items for the active slot
  const [accumulatedItems, setAccumulatedItems] = useState<AccumulatedCurriculumItem[]>([]);

  // Builder Input States
  const [builderUnit, setBuilderUnit] = useState<MasterUnit | null>(null);
  const [unitInput, setUnitInput] = useState('');
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  const [builderTopic, setBuilderTopic] = useState<MasterTopic | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  const [subTopicSearch, setSubTopicSearch] = useState('');
  const [subTopicDropdownOpen, setSubTopicDropdownOpen] = useState(false);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);
  const [selectedCompetencyCodes, setSelectedCompetencyCodes] = useState<string[]>([]);
  const [customCompCode, setCustomCompCode] = useState('');

  // Dropdown refs for click-outside
  const unitRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<HTMLDivElement>(null);
  const subTopicRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (unitRef.current && !unitRef.current.contains(e.target as Node)) {
        setUnitDropdownOpen(false);
      }
      if (topicRef.current && !topicRef.current.contains(e.target as Node)) {
        setTopicDropdownOpen(false);
      }
      if (subTopicRef.current && !subTopicRef.current.contains(e.target as Node)) {
        setSubTopicDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMySchedule = useCallback(async () => {
    setLoading(true);
    const { slug, headers, facultyId, facultyEmpId, facultyName } = getH();
    try {
      const ts = Date.now();
      const url = `${API_BASE}/exams/timetable-drafts/faculty-schedule?tenant=${slug}&facultyId=${encodeURIComponent(facultyId)}&facultyEmpId=${encodeURIComponent(facultyEmpId)}&facultyName=${encodeURIComponent(facultyName)}&_=${ts}`;
      const res = await fetch(url, { headers, cache: 'no-store' });
      const raw = await res.json();
      const list: WeekDraft[] = (Array.isArray(raw) ? raw : (raw?.data || [])).map((d: any) => ({
        ...d,
        slots: typeof d.slots === 'string' ? JSON.parse(d.slots || '[]') : (d.slots || []),
      }));
      setWeeks(list);
      if (list.length > 0 && !expandedWeek) setExpandedWeek(list[0].id);
    } catch {
      showToast('Failed to load your schedule', 'error');
    } finally {
      setLoading(false);
    }
  }, [expandedWeek]);

  useEffect(() => {
    loadMySchedule();
  }, [loadMySchedule]);

  // Load curriculum metadata strictly for the slot's subject
  const loadSubjectCurriculum = useCallback(async (subCode: string, subName: string) => {
    setCurriculumLoading(true);
    const { slug, headers } = getH();
    try {
      const cleanCode = subCode.trim();
      const [uRes, tRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/admin-master/units?tenant=${slug}&subjectCode=${encodeURIComponent(cleanCode)}`, { headers, cache: 'no-store' }).catch(() => null),
        fetch(`${API_BASE}/admin-master/topics?tenant=${slug}&subjectCode=${encodeURIComponent(cleanCode)}`, { headers, cache: 'no-store' }).catch(() => null),
        fetch(`${API_BASE}/admin-master/competencies?tenant=${slug}&subjectCode=${encodeURIComponent(cleanCode)}`, { headers, cache: 'no-store' }).catch(() => null),
      ]);

      let uList: any[] = [];
      let tList: any[] = [];
      let cList: any[] = [];

      if (uRes && uRes.ok) {
        const uJson = await uRes.json();
        uList = Array.isArray(uJson) ? uJson : (uJson.data || []);
      }
      if (tRes && tRes.ok) {
        const tJson = await tRes.json();
        tList = Array.isArray(tJson) ? tJson : (tJson.data || []);
      }
      if (cRes && cRes.ok) {
        const cJson = await cRes.json();
        cList = Array.isArray(cJson) ? cJson : (cJson.data || []);
      }

      // Fallback: If querying with subjectCode returned 0 items, query all and filter strictly by subject code / id / name
      if (uList.length === 0 || tList.length === 0 || cList.length === 0) {
        const [allURes, allTRes, allCRes] = await Promise.all([
          uList.length === 0 ? fetch(`${API_BASE}/admin-master/units?tenant=${slug}`, { headers, cache: 'no-store' }).catch(() => null) : null,
          tList.length === 0 ? fetch(`${API_BASE}/admin-master/topics?tenant=${slug}`, { headers, cache: 'no-store' }).catch(() => null) : null,
          cList.length === 0 ? fetch(`${API_BASE}/admin-master/competencies?tenant=${slug}`, { headers, cache: 'no-store' }).catch(() => null) : null,
        ]);

        const subNameLower = subName.toLowerCase().trim();
        const matchItem = (x: any) => {
          if (!x) return false;
          const xCode = String(x.subject_code || '').trim();
          const xId = String(x.subject_id || '').trim();
          const xName = String(x.subject_name || '').toLowerCase().trim();
          return (
            (cleanCode && (xCode === cleanCode || xId === cleanCode)) ||
            (subNameLower && xName && (xName.includes(subNameLower) || subNameLower.includes(xName)))
          );
        };

        if (allURes && allURes.ok) {
          const json = await allURes.json();
          const raw = Array.isArray(json) ? json : (json.data || []);
          uList = raw.filter(matchItem);
        }
        if (allTRes && allTRes.ok) {
          const json = await allTRes.json();
          const raw = Array.isArray(json) ? json : (json.data || []);
          tList = raw.filter(matchItem);
        }
        if (allCRes && allCRes.ok) {
          const json = await allCRes.json();
          const raw = Array.isArray(json) ? json : (json.data || []);
          cList = raw.filter(matchItem);
        }
      }

      setSubjectUnits(uList);
      setSubjectTopics(tList);
      setSubjectCompetencies(cList);
    } catch (err) {
      console.warn('Failed to load subject curriculum data:', err);
    } finally {
      setCurriculumLoading(false);
    }
  }, []);

  const openLinkModal = (draft: WeekDraft, slot: SlotDraft) => {
    setSelectedSlot({ draft, slot });

    // Load pre-existing curriculum items if any
    let initialItems: AccumulatedCurriculumItem[] = [];
    if (slot.curriculumMappings && Array.isArray(slot.curriculumMappings) && slot.curriculumMappings.length > 0) {
      initialItems = slot.curriculumMappings.map((m: any, idx: number) => ({
        id: m.id || `item_${idx}`,
        unitId: m.unitId || '',
        unitName: m.unitName || '',
        topic: m.topic || '',
        subTopics: Array.isArray(m.subTopics)
          ? m.subTopics
          : m.subTopics
          ? String(m.subTopics).split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        competencyCodes: m.competencyCodes || '',
      }));
    } else if (slot.topic || slot.unitName || slot.unit_name) {
      const uName = slot.unitName || slot.unit_name || '';
      const top = slot.topic || '';
      const rawSubs = slot.subTopics || slot.sub_topics || '';
      const subList = rawSubs ? rawSubs.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const compCodes = slot.competencyCodes || slot.competency_codes || '';

      initialItems.push({
        id: 'initial_1',
        unitId: slot.unitId || slot.unit_id || '',
        unitName: uName,
        topic: top,
        subTopics: subList,
        competencyCodes: compCodes,
      });
    }

    if (initialItems.length === 1) {
      // Direct single topic editing: prefill builder so faculty doesn't have to hunt in a list!
      const single = initialItems[0];
      setUnitInput(single.unitName || '');
      setTopicInput(single.topic || '');
      setSelectedSubTopics(single.subTopics || []);
      setCustomCompCode(single.competencyCodes || '');
      setAccumulatedItems([]);
    } else {
      setAccumulatedItems(initialItems);
      setUnitInput('');
      setTopicInput('');
      setSelectedSubTopics([]);
      setCustomCompCode('');
    }

    // Reset Builder states
    setBuilderUnit(null);
    setUnitDropdownOpen(false);
    setBuilderTopic(null);
    setTopicDropdownOpen(false);
    setSelectedCompetencyCodes([]);
    setSubTopicSearch('');
    setSubTopicDropdownOpen(false);

    const subCode = String(slot.subjectCode || slot.subject_code || slot.subjectId || slot.subject_id || '').trim();
    const subName = String(slot.subjectName || slot.subject_name || '').trim();
    loadSubjectCurriculum(subCode, subName);
  };

  // Filtered Units for Subject (based on unitInput)
  const filteredUnits = useMemo(() => {
    if (!unitInput.trim()) return subjectUnits;
    const q = unitInput.toLowerCase();
    return subjectUnits.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.code && u.code.toLowerCase().includes(q)) ||
      (u.description && u.description.toLowerCase().includes(q))
    );
  }, [subjectUnits, unitInput]);

  // Available Topics for the currently selected/typed unit
  const availableTopicsForUnit = useMemo(() => {
    const activeUnitId = builderUnit?.id ? String(builderUnit.id) : '';
    const activeUnitName = (builderUnit?.name || unitInput || '').toLowerCase().trim();

    if (activeUnitId || activeUnitName) {
      const unitMatch = subjectTopics.filter(t =>
        (activeUnitId && (String(t.unit_id) === activeUnitId || String(t.unit_code) === activeUnitId)) ||
        (activeUnitName && (String(t.unit_name || '').toLowerCase() === activeUnitName || String(t.unit_code || '').toLowerCase() === activeUnitName))
      );
      if (unitMatch.length > 0) return unitMatch;
    }
    return subjectTopics;
  }, [subjectTopics, builderUnit, unitInput]);

  // Filtered Topics for Topic input
  const filteredTopics = useMemo(() => {
    if (!topicInput.trim()) return availableTopicsForUnit;
    const q = topicInput.toLowerCase();
    return availableTopicsForUnit.filter(t =>
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.code && t.code.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }, [availableTopicsForUnit, topicInput]);

  // Available Competencies / SubTopics for Topic
  const availableCompetenciesForTopic = useMemo(() => {
    const activeTopicName = (builderTopic?.name || topicInput || '').toLowerCase().trim();
    const activeTopicId = builderTopic?.id ? String(builderTopic.id) : '';

    if (activeTopicId || activeTopicName) {
      const match = subjectCompetencies.filter(c =>
        (activeTopicId && String(c.topic_id) === activeTopicId) ||
        (builderTopic?.code && c.topic_code && c.topic_code === builderTopic.code) ||
        (c.topic_name && c.topic_name.toLowerCase() === activeTopicName) ||
        (c.topic_code && activeTopicName.includes(c.topic_code.toLowerCase()))
      );
      if (match.length > 0) return match;
    }
    return subjectCompetencies;
  }, [subjectCompetencies, builderTopic, topicInput]);

  // Filtered SubTopics based on subTopicSearch
  const filteredCompetencies = useMemo(() => {
    if (!subTopicSearch.trim()) return availableCompetenciesForTopic;
    const q = subTopicSearch.toLowerCase();
    return availableCompetenciesForTopic.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  }, [availableCompetenciesForTopic, subTopicSearch]);

  // Unit selection from autocomplete
  const handleSelectUnit = (unit: MasterUnit) => {
    setBuilderUnit(unit);
    setUnitInput(unit.name || unit.code);
    setUnitDropdownOpen(false);
  };

  // Topic selection from autocomplete
  const handleSelectTopic = (top: MasterTopic) => {
    setBuilderTopic(top);
    setTopicInput(top.name || top.code);
    setTopicDropdownOpen(false);
  };

  // Toggle single or multiple subtopic
  const toggleSubTopic = (comp: MasterCompetency) => {
    const label = (comp.description || comp.name || comp.code || '').trim();
    if (!label) return;

    if (selectedSubTopics.includes(label)) {
      setSelectedSubTopics(prev => prev.filter(s => s !== label));
      if (comp.code) {
        setSelectedCompetencyCodes(prev => prev.filter(c => c !== comp.code));
      }
    } else {
      setSelectedSubTopics(prev => [...prev, label]);
      if (comp.code) {
        setSelectedCompetencyCodes(prev => Array.from(new Set([...prev, comp.code])));
      }
    }
  };

  const handleSelectAllSubTopics = () => {
    const allLabels = filteredCompetencies
      .map(c => (c.description || c.name || c.code || '').trim())
      .filter(Boolean);
    const allCodes = filteredCompetencies.map(c => c.code).filter(Boolean);

    setSelectedSubTopics(prev => Array.from(new Set([...prev, ...allLabels])));
    setSelectedCompetencyCodes(prev => Array.from(new Set([...prev, ...allCodes])));
  };

  const handleClearSubTopics = () => {
    setSelectedSubTopics([]);
    setSelectedCompetencyCodes([]);
  };

  const handleRemoveSubTopicChip = (tag: string) => {
    setSelectedSubTopics(prev => prev.filter(s => s !== tag));
    const comp = subjectCompetencies.find(c => (c.description || c.name || c.code) === tag);
    if (comp?.code) {
      setSelectedCompetencyCodes(prev => prev.filter(c => c !== comp.code));
    }
  };

  const handleAddCustomSubTopic = () => {
    const clean = subTopicSearch.trim();
    if (!clean) return;
    if (!selectedSubTopics.includes(clean)) {
      setSelectedSubTopics(prev => [...prev, clean]);
    }
    setSubTopicSearch('');
  };

  // Add Item to Accumulated List
  const handleAddAccumulatedItem = () => {
    const finalUnitName = (builderUnit?.name || builderUnit?.code || unitInput).trim();
    const finalTopicName = (builderTopic?.name || builderTopic?.code || topicInput).trim();

    if (!finalUnitName) {
      showToast('Please select or type a Unit Name', 'error');
      return;
    }
    if (!finalTopicName) {
      showToast('Please select or type a Topic', 'error');
      return;
    }

    const uniqueCodes = Array.from(new Set(selectedCompetencyCodes.filter(Boolean))).join(', ');

    const newItem: AccumulatedCurriculumItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      unitId: builderUnit?.id ? String(builderUnit.id) : '',
      unitName: finalUnitName,
      topic: finalTopicName,
      subTopics: [...selectedSubTopics],
      competencyCodes: uniqueCodes || customCompCode.trim() || '',
    };

    setAccumulatedItems(prev => [...prev, newItem]);

    // Reset Topic & Sub-topics for next entry (keep Unit to make adding more topics in same unit fast)
    setTopicInput('');
    setBuilderTopic(null);
    setTopicDropdownOpen(false);
    setSelectedSubTopics([]);
    setSelectedCompetencyCodes([]);
    setCustomCompCode('');
    setSubTopicSearch('');
    setSubTopicDropdownOpen(false);

    showToast(`Added "${finalTopicName}" to list ✓`);
  };

  // Remove Item from Accumulated List
  const handleRemoveAccumulatedItem = (itemId: string) => {
    setAccumulatedItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Edit Item: load into builder and remove from list
  const handleEditAccumulatedItem = (item: AccumulatedCurriculumItem) => {
    const foundUnit = subjectUnits.find(u => String(u.id) === String(item.unitId) || u.name === item.unitName);
    setBuilderUnit(foundUnit || null);
    setUnitInput(item.unitName);

    const foundTopic = subjectTopics.find(t => t.name === item.topic);
    setBuilderTopic(foundTopic || null);
    setTopicInput(item.topic);

    setSelectedSubTopics([...item.subTopics]);
    setCustomCompCode(item.competencyCodes || '');

    setAccumulatedItems(prev => prev.filter(i => i.id !== item.id));
  };

  // Final Save or Update
  const handleSaveCurriculum = async () => {
    if (!selectedSlot) return;

    let itemsToSave = [...accumulatedItems];
    const activeUnit = (builderUnit?.name || builderUnit?.code || unitInput).trim();
    const activeTopic = (builderTopic?.name || builderTopic?.code || topicInput).trim();

    // If builder currently has an active unit & topic, automatically include it!
    if (activeUnit && activeTopic) {
      const uniqueCodes = Array.from(new Set(selectedCompetencyCodes.filter(Boolean))).join(', ');
      const alreadyExists = itemsToSave.some(
        i => i.unitName.toLowerCase() === activeUnit.toLowerCase() && i.topic.toLowerCase() === activeTopic.toLowerCase()
      );
      if (!alreadyExists) {
        itemsToSave.push({
          id: `item_${Date.now()}`,
          unitId: builderUnit?.id ? String(builderUnit.id) : '',
          unitName: activeUnit,
          topic: activeTopic,
          subTopics: [...selectedSubTopics],
          competencyCodes: uniqueCodes || customCompCode.trim() || '',
        });
      }
    }

    if (itemsToSave.length === 0) {
      showToast('Please select or type a Unit and Topic before saving', 'error');
      return;
    }

    setLinking(true);
    const { slug, headers } = getH();
    const isEdit = selectedSlot.slot.mappingStatus === 'LINKED';

    // Compile combined strings for backwards compatibility & quick table rendering
    const combinedUnits = Array.from(new Set(itemsToSave.map(i => i.unitName).filter(Boolean))).join(', ');
    const combinedTopics = itemsToSave.map(i => i.topic).filter(Boolean).join(', ');
    const combinedSubTopics = Array.from(new Set(itemsToSave.flatMap(i => i.subTopics))).filter(Boolean).join(', ');
    const combinedCodes = Array.from(new Set(itemsToSave.map(i => i.competencyCodes).filter(Boolean))).join(', ');
    const primaryUnitId = itemsToSave.find(i => i.unitId)?.unitId || '';

    try {
      const res = await fetch(`${API_BASE}/exams/timetable-drafts/link-slot?tenant=${slug}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          draftId: selectedSlot.draft.id,
          slotId: selectedSlot.slot.id,
          unitId: primaryUnitId,
          unitName: combinedUnits,
          topic: combinedTopics,
          subTopics: combinedSubTopics,
          competencyCodes: combinedCodes,
          curriculumMappings: itemsToSave,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.message || 'Failed to link slot');
      showToast(isEdit ? 'Curriculum link updated successfully!' : 'Curriculum linked successfully! Status → LINKED ✓');
      setSelectedSlot(null);
      await loadMySchedule();
    } catch (err: any) {
      showToast(err.message || 'Failed to link slot', 'error');
    } finally {
      setLinking(false);
    }
  };

  const totalSlots = weeks.reduce((acc, w) => acc + (w.slots?.length || 0), 0);
  const pendingSlots = weeks.reduce((acc, w) => acc + (w.slots || []).filter(s => !s.mappingStatus || s.mappingStatus === 'PENDING').length, 0);
  const linkedSlots = weeks.reduce((acc, w) => acc + (w.slots || []).filter(s => s.mappingStatus === 'LINKED').length, 0);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100">
      <Sidebar role="faculty" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Schedule Planner" />
        <main className="p-4 sm:p-6 md:p-8 space-y-6 w-full max-w-[1920px] mx-auto flex-1 min-w-0">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
            </div>
          )}

          {/* Page header */}
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#F36C21]/10 text-[#F36C21] font-mono font-bold uppercase tracking-wider">FACULTY · SCHEDULE PLANNER</span>
                </div>
                <h1 className="text-xl font-black text-[#1B1E28] dark:text-white">Schedule Planner (Curriculum Mapping)</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link Unit → Topic → Sub-Topics to your scheduled slots. You can link multiple topics from the same or different units to any lecture.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-[#F6F8FC] dark:bg-slate-800 p-1 rounded-xl border border-[#E7EAF3] dark:border-slate-700 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'cards'
                        ? 'bg-[#5B4BFF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#5B4BFF]'
                    }`}
                  >
                    <span>🗂️</span>
                    <span>Cards View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-[#5B4BFF] text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#5B4BFF]'
                    }`}
                  >
                    <span>📋</span>
                    <span>Table View</span>
                  </button>
                </div>
                <button onClick={loadMySchedule}
                  className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-extrabold hover:border-[#5B4BFF] hover:text-[#5B4BFF] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
                  <span>↻</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Stats row */}
            {!loading && (
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[100px] bg-[#F6F8FC] dark:bg-slate-800 rounded-2xl p-3 text-center border border-[#E7EAF3] dark:border-slate-700">
                  <div className="text-2xl font-black text-[#1B1E28] dark:text-white">{weeks.length}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Weeks</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-[#F6F8FC] dark:bg-slate-800 rounded-2xl p-3 text-center border border-[#E7EAF3] dark:border-slate-700">
                  <div className="text-2xl font-black text-[#1B1E28] dark:text-white">{totalSlots}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Total Slots</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl p-3 text-center border border-amber-200/80 dark:border-amber-900/40">
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{pendingSlots}</div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400 font-bold uppercase tracking-wide">⏳ Pending</div>
                </div>
                <div className="flex-1 min-w-[100px] bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl p-3 text-center border border-emerald-200/80 dark:border-emerald-900/40">
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{linkedSlots}</div>
                  <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-bold uppercase tracking-wide">✓ Linked</div>
                </div>
              </div>
            )}
          </div>

          {/* Weeks list */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-[3px] border-[#5B4BFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weeks.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800">
              <span className="text-5xl">📅</span>
              <p className="text-lg font-extrabold text-slate-600 dark:text-slate-300">No submitted weeks found</p>
              <p className="text-sm text-slate-500">The Clerk must design and submit a week's timetable before you see slots here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeks.map((week) => {
                const wPending = (week.slots || []).filter(s => !s.mappingStatus || s.mappingStatus === 'PENDING').length;
                const wLinked = (week.slots || []).filter(s => s.mappingStatus === 'LINKED').length;
                const isExpanded = expandedWeek === week.id;
                const allLinked = wPending === 0 && week.slots.length > 0;

                return (
                  <div
                    key={week.id}
                    className={`rounded-[22px] transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-white dark:bg-slate-900 border-2 border-[#5B4BFF] shadow-lg shadow-[#5B4BFF]/10 ring-2 ring-[#5B4BFF]/10'
                        : 'bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 shadow-sm hover:border-[#5B4BFF]/40 hover:shadow-md'
                    }`}
                  >
                    {/* Week header */}
                    <button
                      className={`w-full px-5 py-4 flex items-center justify-between gap-4 transition-all cursor-pointer text-left ${
                        isExpanded
                          ? 'bg-gradient-to-r from-indigo-50/70 via-purple-50/20 to-white dark:from-slate-800/90 dark:via-slate-800/50 dark:to-slate-900 border-b border-[#E7EAF3] dark:border-slate-800'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                      }`}
                      onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${allLinked ? 'bg-emerald-500 shadow-xs' : 'bg-amber-400 shadow-xs'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm sm:text-base text-[#1B1E28] dark:text-white">{week.title || 'Untitled Week'}</span>
                            {isExpanded && (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#5B4BFF] text-white shadow-xs flex items-center gap-1.5 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Active Week
                              </span>
                            )}
                          </div>
                          {week.week_start && (
                            <div className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                              <span>📅</span>
                              <span>{fmtDate(week.week_start)} – {fmtDate(week.week_end || '')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full border bg-amber-50/90 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80 shadow-xs">⏳ {wPending} Pending</span>
                        <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">✓ {wLinked} Linked</span>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-[#5B4BFF]/10 text-[#5B4BFF]' : ''}`}>▾</span>
                      </div>
                    </button>

                    {/* Slots Section */}
                    {isExpanded && (
                      <div className="border-t border-[#E7EAF3] dark:border-slate-800">
                        {week.slots.length === 0 ? (
                          <div className="py-12 text-center text-sm text-slate-400">No slots assigned to you this week.</div>
                        ) : (
                          <>
                            {/* Slots Subheader with status summary */}
                            <div className="px-5 py-3 bg-[#F8F9FD] dark:bg-slate-800/40 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                                  Lecture Slots ({week.slots.length})
                                </span>
                                {wPending > 0 ? (
                                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/80 flex items-center gap-1.5">
                                    <span>⚠️</span>
                                    <span>{wPending} slot{wPending !== 1 ? 's' : ''} require curriculum mapping</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1.5">
                                    <span>✓</span>
                                    <span>All curriculum topics linked</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                                Click any row to link or update syllabus topics
                              </span>
                            </div>

                            {/* Full Width Tabular Form (Default & Flush, No Padding) */}
                            {viewMode === 'table' ? (
                              <div className="w-full overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-[#F8F9FD] dark:bg-slate-800/70 border-b border-[#E7EAF3] dark:border-slate-700/80">
                                      <th className="px-5 py-3 text-left font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px] whitespace-nowrap">Day & Time</th>
                                      <th className="px-5 py-3 text-left font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px]">Subject</th>
                                      <th className="px-5 py-3 text-left font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px] whitespace-nowrap">Type & Room</th>
                                      <th className="px-5 py-3 text-left font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px]">Unit</th>
                                      <th className="px-5 py-3 text-left font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px]">Topic</th>
                                      <th className="px-5 py-3 text-left font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px]">Sub-Topics</th>
                                      <th className="px-5 py-3 text-center font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px] whitespace-nowrap">Status</th>
                                      <th className="px-5 py-3 text-right font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px] whitespace-nowrap">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                                    {[...week.slots].sort((a, b) => {
                                      const dayDiff = (a.dayOfWeek || 0) - (b.dayOfWeek || 0);
                                      if (dayDiff !== 0) return dayDiff;
                                      return (a.startTime || '').localeCompare(b.startTime || '');
                                    }).map((slot) => {
                                      const isSlotActive = selectedSlot?.slot?.id === slot.id;
                                      const isLinked = slot.mappingStatus === 'LINKED';
                                      const uVal = slot.unitName || slot.unit_name || '';
                                      const topVal = slot.topic || '';
                                      const subVal = slot.subTopics || slot.sub_topics || '';

                                      return (
                                        <tr
                                          key={slot.id}
                                          onClick={() => openLinkModal(week, slot)}
                                          className={`transition-colors cursor-pointer ${
                                            isSlotActive
                                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-l-4 border-l-[#5B4BFF]'
                                              : isLinked
                                              ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                                              : 'hover:bg-amber-50/30 dark:hover:bg-amber-950/20'
                                          }`}
                                        >
                                          {/* Day & Time */}
                                          <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="font-extrabold text-xs text-[#2D2575] dark:text-indigo-300">
                                              {DAY_NAMES[(slot.dayOfWeek || 1) - 1] || '—'}
                                            </div>
                                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                              {(slot.startTime || '').slice(0, 5)} – {(slot.endTime || '').slice(0, 5)}
                                            </div>
                                          </td>

                                          {/* Subject */}
                                          <td className="px-5 py-3.5 min-w-[180px]">
                                            <div className="font-bold text-xs text-[#1B1E28] dark:text-white max-w-[220px] truncate" title={slot.subjectName}>
                                              {slot.subjectName || '—'}
                                            </div>
                                            {slot.subjectCode && (
                                              <span className="inline-block font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-0.5">
                                                #{slot.subjectCode}
                                              </span>
                                            )}
                                          </td>

                                          {/* Type & Room */}
                                          <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="text-slate-700 dark:text-slate-300 font-medium text-xs">{slot.slotType || 'Lecture'}</div>
                                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                              {slot.room ? `Room ${slot.room}` : '—'}
                                            </div>
                                          </td>

                                          {/* Unit */}
                                          <td className="px-5 py-3.5 min-w-[160px] max-w-[200px]">
                                            {uVal ? (
                                              <div className="flex flex-wrap gap-1">
                                                {uVal.split(',').map((u: string, idx: number) => (
                                                  <span key={idx} className="inline-block px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[10.5px] font-bold text-[#5B4BFF] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 truncate max-w-[180px]" title={u.trim()}>
                                                    {u.trim()}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-slate-400 italic text-[11px]">— No Unit</span>
                                            )}
                                          </td>

                                          {/* Topic */}
                                          <td className="px-5 py-3.5 min-w-[180px] max-w-[220px]">
                                            {topVal ? (
                                              <div className="font-semibold text-xs text-[#1B1E28] dark:text-slate-200 line-clamp-2 leading-tight" title={topVal}>
                                                {topVal}
                                              </div>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                                                ⚠️ Needs Topic
                                              </span>
                                            )}
                                          </td>

                                          {/* Sub-Topics */}
                                          <td className="px-5 py-3.5 min-w-[180px] max-w-[220px]">
                                            {subVal ? (
                                              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-0.5">
                                                {subVal.split(',').map((st: string, idx: number) => (
                                                  <span key={idx} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate max-w-[160px]" title={st.trim()}>
                                                    {st.trim()}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-slate-400 italic text-[11px]">—</span>
                                            )}
                                          </td>

                                          {/* Status */}
                                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                            <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                                              isLinked
                                                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                                                : 'bg-amber-50/90 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
                                            }`}>
                                              <span>{isLinked ? '✓' : '⏳'}</span>
                                              <span>{isLinked ? 'Linked' : 'Pending'}</span>
                                            </span>
                                          </td>

                                          {/* Action */}
                                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            {isLinked ? (
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openLinkModal(week, slot); }}
                                                className="text-xs px-3.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold cursor-pointer transition-all shadow-xs"
                                              >
                                                Edit Link
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); openLinkModal(week, slot); }}
                                                className="text-xs px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white font-bold cursor-pointer transition-all shadow-sm shadow-[#5B4BFF]/20"
                                              >
                                                Link →
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              /* Cards Grid View (Alternative View) */
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4.5 p-5">
                                {[...week.slots].sort((a, b) => {
                                  const dayDiff = (a.dayOfWeek || 0) - (b.dayOfWeek || 0);
                                  if (dayDiff !== 0) return dayDiff;
                                  return (a.startTime || '').localeCompare(b.startTime || '');
                                }).map((slot) => {
                                  const isSlotActive = selectedSlot?.slot?.id === slot.id;
                                  const isLinked = slot.mappingStatus === 'LINKED';
                                  const uVal = slot.unitName || slot.unit_name || '';
                                  const topVal = slot.topic || '';
                                  const subVal = slot.subTopics || slot.sub_topics || '';

                                  return (
                                    <div
                                      key={slot.id}
                                      onClick={() => openLinkModal(week, slot)}
                                      className={`group relative rounded-2xl p-4.5 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 ${
                                        isSlotActive
                                          ? 'bg-gradient-to-br from-indigo-50/95 via-white to-purple-50/50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-purple-950/40 border-2 border-[#5B4BFF] shadow-xl shadow-[#5B4BFF]/25 ring-4 ring-[#5B4BFF]/20 scale-[1.015]'
                                          : isLinked
                                          ? 'bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 hover:shadow-md'
                                          : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#5B4BFF] hover:shadow-md'
                                      }`}
                                    >
                                      <div className="space-y-2.5">
                                        {/* Top Bar: Day, Time & Status */}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-extrabold text-xs text-[#2D2575] dark:text-indigo-300">
                                              {DAY_NAMES[(slot.dayOfWeek || 1) - 1] || 'Day'}
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                              {(slot.startTime || '').slice(0, 5)}–{(slot.endTime || '').slice(0, 5)}
                                            </span>
                                          </div>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                            isLinked ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80'
                                          }`}>
                                            {isLinked ? '✓ Linked' : '⏳ Pending'}
                                          </span>
                                        </div>

                                        {/* Current Active Card Highlight Badge */}
                                        {isSlotActive && (
                                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5B4BFF] text-white text-[9.5px] font-black uppercase tracking-wider shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            Active Planning Card
                                          </div>
                                        )}

                                        {/* Subject Title & Details */}
                                        <div>
                                          <h4 className="font-extrabold text-sm text-[#1B1E28] dark:text-white line-clamp-1 group-hover:text-[#5B4BFF] transition-colors" title={slot.subjectName}>
                                            {slot.subjectName || 'Subject'}
                                          </h4>
                                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-1 flex-wrap">
                                            {slot.subjectCode && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{slot.subjectCode}</span>}
                                            {slot.room && <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Room: {slot.room}</span>}
                                            {slot.slotType && <span>{slot.slotType}</span>}
                                          </div>
                                        </div>

                                        {/* Curriculum Mapping Section */}
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                                          {uVal ? (
                                            <div className="flex items-center gap-1 text-[#5B4BFF] dark:text-indigo-400 font-bold truncate">
                                              <span>📦</span>
                                              <span className="truncate">{uVal}</span>
                                            </div>
                                          ) : (
                                            <div className="text-slate-400 italic">No Unit linked</div>
                                          )}

                                          {topVal ? (
                                            <div className="text-slate-700 dark:text-slate-200 font-semibold line-clamp-2 leading-tight">
                                              📖 {topVal}
                                            </div>
                                          ) : (
                                            <div className="text-amber-700 dark:text-amber-300 font-medium text-[11px] inline-flex items-center gap-1 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/60">
                                              ⚠️ Needs Topic link
                                            </div>
                                          )}

                                          {subVal && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                              {subVal.split(',').slice(0, 2).map((st: string, idx: number) => (
                                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[130px]" title={st.trim()}>
                                                  {st.trim()}
                                                </span>
                                              ))}
                                              {subVal.split(',').length > 2 && (
                                                <span className="text-[10px] text-slate-400 font-mono">+{subVal.split(',').length - 2} more</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Action Button */}
                                      <div className="pt-2">
                                        {isLinked ? (
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); openLinkModal(week, slot); }}
                                            className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                          >
                                            <span>✏️</span>
                                            <span>Edit Link</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); openLinkModal(week, slot); }}
                                            className="w-full py-2 px-3 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white text-xs font-bold shadow-md shadow-[#5B4BFF]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                          >
                                            <span>🔗</span>
                                            <span>Link Curriculum →</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ─── ENHANCED CURRICULUM LINK MODAL (AUTOCOMPLETE + MULTI-TOPIC ACCUMULATOR) ─── */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#E7EAF3] dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E7EAF3] dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-50/70 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedSlot.slot.mappingStatus === 'LINKED' ? '✏️' : '🔗'}</span>
                  <h2 className="text-lg font-black text-[#1B1E28] dark:text-white">
                    {selectedSlot.slot.mappingStatus === 'LINKED' ? 'Edit Curriculum Link' : 'Link Curriculum to Slot'}
                  </h2>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-[#5B4BFF] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {selectedSlot.slot.subjectName || 'Subject'} {selectedSlot.slot.subjectCode ? `(${selectedSlot.slot.subjectCode})` : ''}
                  </span>
                  <span>•</span>
                  <span className="font-bold">{DAY_NAMES[(selectedSlot.slot.dayOfWeek || 1) - 1]}</span>
                  <span>•</span>
                  <span className="font-mono">{(selectedSlot.slot.startTime || '').slice(0, 5)} – {(selectedSlot.slot.endTime || '').slice(0, 5)}</span>
                  {selectedSlot.slot.room && (
                    <>
                      <span>•</span>
                      <span>Room: {selectedSlot.slot.room}</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{selectedSlot.draft.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-all flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              
              {curriculumLoading && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-2.5 text-indigo-700 dark:text-indigo-300">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="font-bold text-xs">Fetching syllabus master data for {selectedSlot.slot.subjectName}...</span>
                </div>
              )}

              {/* ─── SECTION 1: TOPIC & SUBTOPIC BUILDER (AUTOCOMPLETE SELECTORS) ─── */}
              <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/50 border border-[#E7EAF3] dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[11px] font-black">1</span>
                    <h3 className="font-black text-xs text-[#1B1E28] dark:text-white uppercase tracking-wider">
                      Select Topic &amp; Sub-Topics
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Add topics from same or different units below
                  </span>
                </div>

                {/* 1.1: UNIT AUTOCOMPLETE */}
                <div className="space-y-1.5" ref={unitRef}>
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Unit *</span>
                      <span className="text-[10px] text-slate-400 font-normal">({subjectUnits.length} found for subject)</span>
                    </label>
                    {unitInput && (
                      <button
                        type="button"
                        onClick={() => { setUnitInput(''); setBuilderUnit(null); }}
                        className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Clear Unit
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">📦</span>
                    <input
                      type="text"
                      placeholder="Type or search Unit (e.g. Unit 1, CO1)..."
                      value={unitInput}
                      onChange={e => {
                        setUnitInput(e.target.value);
                        setBuilderUnit(null);
                        setUnitDropdownOpen(true);
                      }}
                      onFocus={() => setUnitDropdownOpen(true)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] transition-all"
                    />
                    {unitInput && (
                      <button
                        type="button"
                        onClick={() => { setUnitInput(''); setBuilderUnit(null); }}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}

                    {/* Unit Dropdown */}
                    {unitDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-1 animate-in fade-in duration-100">
                        {unitInput.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setBuilderUnit(null);
                              setUnitDropdownOpen(false);
                            }}
                            className="w-full p-2 text-left rounded-lg text-[11px] font-bold text-[#5B4BFF] hover:bg-[#5B4BFF]/10 flex items-center gap-1.5"
                          >
                            <span>➕ Use custom unit:</span>
                            <span className="underline truncate">"{unitInput.trim()}"</span>
                          </button>
                        )}

                        {filteredUnits.length === 0 && !unitInput.trim() && (
                          <div className="p-3 text-center text-slate-400 italic text-[11px]">
                            No pre-configured units found. Type above to use a custom unit.
                          </div>
                        )}

                        {filteredUnits.map((u) => {
                          const isSelected = builderUnit?.id === u.id || unitInput === (u.name || u.code);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectUnit(u)}
                              className={`w-full p-2 rounded-lg text-left text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-extrabold text-[11px] truncate">{u.name || u.code}</div>
                                {u.description && u.description !== u.name && (
                                  <div className="text-[10px] text-slate-400 truncate">{u.description}</div>
                                )}
                              </div>
                              {isSelected && <span className="text-[#5B4BFF] font-black text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 1.2: TOPIC AUTOCOMPLETE */}
                <div className="space-y-1.5" ref={topicRef}>
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Topic *</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({availableTopicsForUnit.length} available {builderUnit ? `for ${builderUnit.name || builderUnit.code}` : ''})
                      </span>
                    </label>
                    {topicInput && (
                      <button
                        type="button"
                        onClick={() => { setTopicInput(''); setBuilderTopic(null); }}
                        className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Clear Topic
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">📖</span>
                    <input
                      type="text"
                      placeholder="Type or search Topic..."
                      value={topicInput}
                      onChange={e => {
                        setTopicInput(e.target.value);
                        setBuilderTopic(null);
                        setTopicDropdownOpen(true);
                      }}
                      onFocus={() => setTopicDropdownOpen(true)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-[#5B4BFF] transition-all"
                    />
                    {topicInput && (
                      <button
                        type="button"
                        onClick={() => { setTopicInput(''); setBuilderTopic(null); }}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}

                    {/* Topic Dropdown */}
                    {topicDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-1 animate-in fade-in duration-100">
                        {topicInput.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setBuilderTopic(null);
                              setTopicDropdownOpen(false);
                            }}
                            className="w-full p-2 text-left rounded-lg text-[11px] font-bold text-[#5B4BFF] hover:bg-[#5B4BFF]/10 flex items-center gap-1.5"
                          >
                            <span>➕ Use custom topic:</span>
                            <span className="underline truncate">"{topicInput.trim()}"</span>
                          </button>
                        )}

                        {filteredTopics.length === 0 && !topicInput.trim() && (
                          <div className="p-3 text-center text-slate-400 italic text-[11px]">
                            No pre-configured topics found. Type above to enter a custom topic.
                          </div>
                        )}

                        {filteredTopics.map((t) => {
                          const isSelected = builderTopic?.id === t.id || topicInput === (t.name || t.code);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelectTopic(t)}
                              className={`w-full p-2 rounded-lg text-left text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] font-bold'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-extrabold text-[11px] truncate">{t.name || t.code}</div>
                                {t.code && <div className="text-[10px] text-slate-400 font-mono">{t.code}</div>}
                              </div>
                              {isSelected && <span className="text-[#5B4BFF] font-black text-xs">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 1.3: SUB-TOPICS AUTOCOMPLETE / MULTI-SELECT PICKER */}
                <div className="space-y-2" ref={subTopicRef}>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="font-extrabold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Sub-Topics</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Multiple selectable · {selectedSubTopics.length} selected)
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      {filteredCompetencies.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllSubTopics}
                          className="text-[10.5px] font-bold text-[#5B4BFF] hover:underline cursor-pointer"
                        >
                          Select All ({filteredCompetencies.length})
                        </button>
                      )}
                      {selectedSubTopics.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSubTopics}
                          className="text-[10.5px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search / Multi-Select Input */}
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">📝</span>
                    <input
                      type="text"
                      placeholder="Search sub-topics or type custom and press Enter..."
                      value={subTopicSearch}
                      onChange={e => {
                        setSubTopicSearch(e.target.value);
                        setSubTopicDropdownOpen(true);
                      }}
                      onFocus={() => setSubTopicDropdownOpen(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSubTopic();
                        }
                      }}
                      className="w-full pl-9 pr-20 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#5B4BFF] transition-all"
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                      {subTopicSearch.trim() && (
                        <button
                          type="button"
                          onClick={handleAddCustomSubTopic}
                          className="px-2 py-1 rounded bg-[#5B4BFF] text-white text-[10px] font-bold cursor-pointer"
                        >
                          + Add
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSubTopicDropdownOpen(!subTopicDropdownOpen)}
                        className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        {subTopicDropdownOpen ? '▲' : '▼'}
                      </button>
                    </div>

                    {/* SubTopic Dropdown List */}
                    {subTopicDropdownOpen && (
                      <div className="absolute z-40 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto p-1.5 space-y-1 animate-in fade-in duration-100">
                        {/* Sticky Header with Selection Counter & Done button */}
                        <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 rounded-t-lg">
                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                            {selectedSubTopics.length} selected
                          </span>
                          <div className="flex items-center gap-1.5">
                            {filteredCompetencies.length > 0 && (
                              <button
                                type="button"
                                onClick={handleSelectAllSubTopics}
                                className="text-[10.5px] text-[#5B4BFF] hover:underline font-bold px-1"
                              >
                                Select All ({filteredCompetencies.length})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSubTopicDropdownOpen(false)}
                              className="px-2.5 py-1 text-[11px] font-black bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white rounded-lg shadow-sm cursor-pointer transition-all flex items-center gap-1"
                            >
                              <span>Done</span>
                              <span>✓</span>
                            </button>
                          </div>
                        </div>

                        {subTopicSearch.trim() && !selectedSubTopics.includes(subTopicSearch.trim()) && (
                          <button
                            type="button"
                            onClick={handleAddCustomSubTopic}
                            className="w-full p-2 text-left rounded-lg text-[11px] font-bold text-[#5B4BFF] hover:bg-[#5B4BFF]/10 flex items-center gap-1.5"
                          >
                            <span>➕ Add custom sub-topic:</span>
                            <span className="underline truncate">"{subTopicSearch.trim()}"</span>
                          </button>
                        )}

                        {filteredCompetencies.length === 0 && !subTopicSearch.trim() ? (
                          <div className="p-3 text-center text-slate-400 italic text-[11px]">
                            No pre-configured sub-topics found. Type custom sub-topic in the input above.
                          </div>
                        ) : (
                          filteredCompetencies.map((c) => {
                            const label = (c.description || c.name || c.code || '').trim();
                            const isSelected = selectedSubTopics.includes(label);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleSubTopic(c)}
                                className={`w-full p-2 rounded-lg text-left text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-[#5B4BFF]/10 text-[#5B4BFF] font-bold'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${isSelected ? 'bg-[#5B4BFF] text-white font-bold' : 'border border-slate-300 dark:border-slate-600'}`}>
                                    {isSelected ? '✓' : ''}
                                  </div>
                                  <span className="truncate max-w-[340px]">{label}</span>
                                </div>
                                {c.code && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex-shrink-0">
                                    {c.code}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}

                        {/* Sticky Footer Button to Close */}
                        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-1.5 pb-0.5 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setSubTopicDropdownOpen(false)}
                            className="w-full py-1.5 text-center text-xs font-black bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white rounded-lg cursor-pointer transition-all shadow-sm"
                          >
                            Done Selecting Sub-Topics (✓)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected SubTopics Chips Display */}
                  {selectedSubTopics.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      <div className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                        Selected Sub-Topics ({selectedSubTopics.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {selectedSubTopics.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold"
                          >
                            <span className="truncate max-w-[240px]">{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubTopicChip(tag)}
                              className="hover:text-rose-500 font-bold ml-0.5 cursor-pointer"
                              title="Remove sub-topic"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 1.4: ADD ANOTHER TOPIC QUICK ACTION */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700/60 flex-wrap">
                  <div className="text-[11px] text-slate-500">
                    💡 Want to link multiple topics to this single lecture?
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAccumulatedItem}
                    disabled={!unitInput.trim() || !topicInput.trim()}
                    className="px-4 py-2 rounded-xl border border-[#5B4BFF] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-[#5B4BFF] dark:text-indigo-300 text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>Add Another Topic</span>
                  </button>
                </div>
              </div>

              {/* ─── SECTION 2: QUEUED TOPICS (WHEN MULTIPLE TOPICS ARE LINKED) ─── */}
              {accumulatedItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#5B4BFF] text-white flex items-center justify-center text-[11px] font-black">2</span>
                      <h3 className="font-black text-xs text-[#1B1E28] dark:text-white uppercase tracking-wider">
                        Queued Topics for this Slot
                      </h3>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {accumulatedItems.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAccumulatedItems([])}
                      className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear Queue
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {accumulatedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-[#E7EAF3] dark:border-slate-800 bg-[#F6F8FC]/50 dark:bg-slate-800/40 hover:border-indigo-300 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              #{idx + 1}
                            </span>
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-[#5B4BFF] dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              📦 {item.unitName}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                              📖 {item.topic}
                            </span>
                          </div>

                          {/* SubTopics */}
                          {item.subTopics && item.subTopics.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400">Sub-Topics:</span>
                              {item.subTopics.map((st, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">No sub-topics specified</div>
                          )}

                          {item.competencyCodes && (
                            <div className="text-[9.5px] font-mono text-slate-400">
                              Codes: {item.competencyCodes}
                            </div>
                          )}
                        </div>

                        {/* Actions for Item */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditAccumulatedItem(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title="Edit this item in builder"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAccumulatedItem(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                            title="Remove topic"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions - Sticky & Always Visible */}
            <div className="p-4 bg-[#F6F8FC] dark:bg-slate-950 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 z-20">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddAccumulatedItem}
                  disabled={!unitInput.trim() || !topicInput.trim()}
                  className="px-4 py-2.5 rounded-xl border border-[#5B4BFF] bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/50 text-[#5B4BFF] dark:text-indigo-300 text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  title="Queue current topic and select another topic for this slot"
                >
                  <span>➕</span>
                  <span>Add Another Topic</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCurriculum}
                  disabled={linking || (accumulatedItems.length === 0 && (!unitInput.trim() || !topicInput.trim()))}
                  className="px-6 py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4a3dd4] text-white text-xs font-black shadow-md shadow-[#5B4BFF]/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {linking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Saving Link…</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedSlot.slot.mappingStatus === 'LINKED' ? '💾' : '🔗'}</span>
                      <span>{selectedSlot.slot.mappingStatus === 'LINKED' ? 'Update Link' : 'Save Link'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
