'use client';

import { useState, useEffect } from 'react';
import { TargetRule } from '../../hooks/useNoticeGroups';

interface NoticeGroupBuilderProps {
  rules: TargetRule[];
  onChange: (rules: TargetRule[]) => void;
}

interface DynamicOption {
  code: string;
  name: string;
}

export default function NoticeGroupBuilder({ rules, onChange }: NoticeGroupBuilderProps) {
  const [targetType, setTargetType] = useState<string>('role');
  const [targetValue, setTargetValue] = useState<string>('STUDENT');
  const [targetLabel, setTargetLabel] = useState<string>('All Students');

  const [courses, setCourses] = useState<DynamicOption[]>([]);
  const [batches, setBatches] = useState<DynamicOption[]>([]);
  const [departments, setDepartments] = useState<DynamicOption[]>([]);

  useEffect(() => {
    loadDynamicOptions();
  }, []);

  const loadDynamicOptions = async () => {
    const slug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-cet-bareilly' : 'srms-cet-bareilly';
    const isMed = slug.includes('ims') || slug.includes('med');
    const defaultColg = isMed ? '11' : '1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    try {
      // 1. Fetch live courses
      const crsRes = await fetch(`/api/srms/courses?colgcd=${defaultColg}&tenant=${slug}`).catch(() => null);
      if (crsRes && crsRes.ok) {
        const cJson = await crsRes.json();
        const list = Array.isArray(cJson) ? cJson : cJson.data || [];
        const mapped = list.map((c: any) => ({
          code: String(c.course_cd || c.code || '1'),
          name: String(c.course_name || c.name || 'Course'),
        }));
        if (mapped.length > 0) setCourses(mapped);
      }

      // 2. Fetch live batches for all primary courses
      const btRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'}/college-master/batches?tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (btRes && btRes.ok) {
        const bJson = await btRes.json();
        const list = Array.isArray(bJson.data) ? bJson.data : Array.isArray(bJson) ? bJson : [];
        const mapped = list.map((b: any) => ({
          code: String(b.batch_cd || b.code || b.year),
          name: `${b.name || `Batch ${b.year || b.code}`} (${b.course_name || 'Academic'})`,
        }));
        if (mapped.length > 0) setBatches(mapped);
      }

      // 3. Fetch departments
      const deptRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1'}/college-master/departments?tenant=${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (deptRes && deptRes.ok) {
        const dJson = await deptRes.json();
        const list = Array.isArray(dJson.data) ? dJson.data : Array.isArray(dJson) ? dJson : [];
        const mapped = list.map((d: any) => ({
          code: String(d.code || d.id),
          name: String(d.name || d.code),
        }));
        if (mapped.length > 0) setDepartments(mapped);
      }
    } catch (err) {
      console.warn('Failed to load notice dynamic options:', err);
    }
  };

  const handleTypeChange = (type: string) => {
    setTargetType(type);
    if (type === 'all') {
      setTargetValue('ALL');
      setTargetLabel('Entire Institution');
    } else if (type === 'role') {
      setTargetValue('STUDENT');
      setTargetLabel('All Students');
    } else if (type === 'batch_year') {
      const initial = batches[0];
      setTargetValue(initial ? initial.code : '2');
      setTargetLabel(initial ? initial.name : 'Batch 2025');
    } else if (type === 'department') {
      const initial = departments[0];
      setTargetValue(initial ? initial.code : '1');
      setTargetLabel(initial ? `Dept: ${initial.name}` : 'Department');
    } else if (type === 'course') {
      const initial = courses[0];
      setTargetValue(initial ? initial.code : '13');
      setTargetLabel(initial ? `Course: ${initial.name}` : 'Course');
    } else if (type === 'hostel') {
      setTargetValue('BH-1');
      setTargetLabel('Boys Hostel Block 1');
    }
  };

  const handleAddRule = () => {
    // Prevent duplicate
    const exists = rules.some((r) => r.target_type === targetType && r.target_value === targetValue);
    if (exists) return;

    const newRules = [
      ...rules,
      {
        target_type: targetType,
        target_value: targetValue,
        target_label: targetLabel || targetValue,
      },
    ];
    onChange(newRules);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, idx) => idx !== index);
    onChange(newRules);
  };

  const fallbackCourses = [
    { code: '13', name: 'BCA' },
    { code: '1', name: 'B.Tech' },
    { code: '4', name: 'MCA' },
    { code: '3', name: 'MBA' },
    { code: '2', name: 'B.Pharm' },
  ];

  const fallbackBatches = [
    { code: '2', name: 'Batch 2025 (BCA)' },
    { code: '18', name: 'Batch 2025 (B.Tech)' },
    { code: '16', name: 'Batch 2025 (MCA)' },
    { code: '1', name: 'Batch 2024 (BCA)' },
    { code: '17', name: 'Batch 2024 (B.Tech)' },
  ];

  const fallbackDepts = [
    { code: '1', name: 'Computer Applications' },
    { code: '2', name: 'Computer Science & Engineering' },
    { code: '3', name: 'Information Technology' },
    { code: '4', name: 'Pharmacy' },
  ];

  const activeCourses = courses.length > 0 ? courses : fallbackCourses;
  const activeBatches = batches.length > 0 ? batches : fallbackBatches;
  const activeDepts = departments.length > 0 ? departments : fallbackDepts;

  return (
    <div className="space-y-3 bg-[#F8FAFC] dark:bg-slate-850 p-4 rounded-2xl border border-[#E7EAF3] dark:border-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase text-[#1B1E28] dark:text-white tracking-wider">
          Target Audience Rules ({rules.length})
        </label>
        <span className="text-[11px] text-[#4E5969] dark:text-slate-400 font-semibold">
          Add one or multiple rules
        </span>
      </div>

      {/* Rules Chips Display */}
      {rules.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {rules.map((rule, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5B4BFF]/10 dark:bg-[#5B4BFF]/20 text-[#5B4BFF] dark:text-[#7867FF] border border-[#5B4BFF]/30"
            >
              <span>{rule.target_label || `${rule.target_type}: ${rule.target_value}`}</span>
              <button
                type="button"
                onClick={() => handleRemoveRule(idx)}
                className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 hover:text-white text-slate-500 flex items-center justify-center text-[10px] transition-all cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#4E5969] dark:text-slate-400 italic">
          No audience rules added yet. Notice will be sent to the selected default target.
        </p>
      )}

      {/* Add New Rule Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E7EAF3] dark:border-slate-800">
        {/* Step 1: Target Type */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-[#4E5969] dark:text-slate-400 mb-1">
            Target Dimension
          </label>
          <select
            value={targetType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
          >
            <option value="all">Entire Institution</option>
            <option value="role">By Role</option>
            <option value="batch_year">By Academic Batch</option>
            <option value="course">By Course (B.Tech, BCA, MCA)</option>
            <option value="department">By Department</option>
            <option value="hostel">By Hostel Block</option>
          </select>
        </div>

        {/* Step 2: Specific Value */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-[#4E5969] dark:text-slate-400 mb-1">
            Specific Target
          </label>

          {targetType === 'all' ? (
            <input
              type="text"
              disabled
              value="All Users & Cohorts"
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-slate-400"
            />
          ) : targetType === 'role' ? (
            <select
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                const labelMap: Record<string, string> = {
                  STUDENT: 'All Students',
                  FACULTY: 'All Faculty Members',
                  CLERK: 'Data Entry Clerks',
                  WARDEN: 'Hostel Wardens',
                  COLLEGE_ADMIN: 'College Administrators',
                };
                setTargetLabel(labelMap[e.target.value] || e.target.value);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="STUDENT">All Students</option>
              <option value="FACULTY">All Faculty</option>
              <option value="CLERK">Clerks & Office Staff</option>
              <option value="WARDEN">Hostel Wardens</option>
              <option value="COLLEGE_ADMIN">College Administrators</option>
            </select>
          ) : targetType === 'batch_year' ? (
            <select
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                setTargetLabel(e.target.options[e.target.selectedIndex].text);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              {activeBatches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : targetType === 'department' ? (
            <select
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                setTargetLabel(`Dept: ${e.target.options[e.target.selectedIndex].text}`);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              {activeDepts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : targetType === 'course' ? (
            <select
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                setTargetLabel(`Course: ${e.target.options[e.target.selectedIndex].text}`);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              {activeCourses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                setTargetLabel(e.target.options[e.target.selectedIndex].text);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="BH-1">Boys Hostel Block 1</option>
              <option value="BH-2">Boys Hostel Block 2</option>
              <option value="GH-1">Girls Hostel Block 1</option>
              <option value="GH-2">Girls Hostel Block 2</option>
            </select>
          )}
        </div>

        {/* Add Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddRule}
            className="w-full py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Add to Audience
          </button>
        </div>
      </div>
    </div>
  );
}
