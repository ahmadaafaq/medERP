'use client';

import { useState } from 'react';
import { TargetRule } from '../../hooks/useNoticeGroups';

interface NoticeGroupBuilderProps {
  rules: TargetRule[];
  onChange: (rules: TargetRule[]) => void;
}

export default function NoticeGroupBuilder({ rules, onChange }: NoticeGroupBuilderProps) {
  const [targetType, setTargetType] = useState<string>('role');
  const [targetValue, setTargetValue] = useState<string>('STUDENT');
  const [targetLabel, setTargetLabel] = useState<string>('All Students');

  const handleTypeChange = (type: string) => {
    setTargetType(type);
    if (type === 'all') {
      setTargetValue('ALL');
      setTargetLabel('Entire Institution');
    } else if (type === 'role') {
      setTargetValue('STUDENT');
      setTargetLabel('All Students');
    } else if (type === 'batch_year') {
      setTargetValue('2023-MBBS');
      setTargetLabel('Batch 2023 (MBBS / B.Tech)');
    } else if (type === 'department') {
      setTargetValue('ANAT');
      setTargetLabel('Department: Anatomy / CSE');
    } else if (type === 'course') {
      setTargetValue('MBBS');
      setTargetLabel('Course: MBBS');
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

      {/* Selected Rules Pills */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800">
        {rules.length === 0 ? (
          <span className="text-xs text-[#4E5969] dark:text-slate-500 italic flex items-center">
            No targeting rules added. Please add at least one audience rule below.
          </span>
        ) : (
          rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs font-bold shadow-xs"
            >
              <span className="text-[10px] font-black text-[#5B4BFF] uppercase tracking-wider mr-0.5">
                {rule.target_type}:
              </span>
              <span>{rule.target_label || rule.target_value}</span>
              <button
                type="button"
                onClick={() => handleRemoveRule(idx)}
                className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center text-[10px] font-black hover:bg-rose-200 transition-colors ml-1"
                title="Remove Rule"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Rule Selector Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {/* Type Picker */}
        <div>
          <label className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 block mb-1">Target Dimension</label>
          <select
            value={targetType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
          >
            <option value="all">Entire Institution (All)</option>
            <option value="role">By User Role</option>
            <option value="batch_year">By Batch / Year</option>
            <option value="department">By Department</option>
            <option value="course">By Course</option>
            <option value="hostel">By Hostel Block</option>
          </select>
        </div>

        {/* Value Specific Selector */}
        <div>
          <label className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 block mb-1">Target Option</label>
          {targetType === 'all' ? (
            <input
              type="text"
              disabled
              value="All Students, Faculty & Staff"
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#4E5969]"
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
                setTargetLabel(`Batch ${e.target.value}`);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="2023-MBBS">2023 MBBS Batch</option>
              <option value="2024-MBBS">2024 MBBS Batch</option>
              <option value="2025-MBBS">2025 MBBS Batch</option>
              <option value="2023">Batch 2023 (Engineering / Other)</option>
              <option value="2024">Batch 2024 (Engineering / Other)</option>
              <option value="2025">Batch 2025 (Engineering / Other)</option>
              <option value="2026">Batch 2026</option>
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
              <option value="ANAT">Human Anatomy</option>
              <option value="PHYS">Human Physiology</option>
              <option value="BIOC">Biochemistry</option>
              <option value="PATH">Pathology</option>
              <option value="PHAR">Pharmacology</option>
              <option value="MICRO">Microbiology</option>
              <option value="COMM">Community Medicine</option>
              <option value="CSE">Computer Science & Engg</option>
              <option value="ECE">Electronics & Comm Engg</option>
              <option value="MECH">Mechanical Engg</option>
            </select>
          ) : targetType === 'course' ? (
            <select
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                setTargetLabel(`Course: ${e.target.value}`);
              }}
              className="w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="MBBS">MBBS</option>
              <option value="MD">MD / MS (Postgraduate)</option>
              <option value="BTECH">B.Tech</option>
              <option value="MCA">MCA</option>
              <option value="MBA">MBA</option>
              <option value="PHARM">B.Pharm</option>
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
            className="w-full py-2.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>+</span> Add to Audience
          </button>
        </div>
      </div>
    </div>
  );
}
