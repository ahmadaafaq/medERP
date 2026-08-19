'use client';

import { useState, useEffect, useCallback } from 'react';
import { TargetRule, NoticeGroupTemplate, useNoticeGroups } from '../../hooks/useNoticeGroups';

interface NoticeGroupBuilderProps {
  rules: TargetRule[];
  onChange: (rules: TargetRule[]) => void;
  onPreviewCount?: () => void;
  previewData?: {
    totalCount: number;
    breakdown: { students: number; faculty: number; clerks: number; wardens: number; admins: number };
    sampleRecipients?: any[];
  } | null;
  isPreviewLoading?: boolean;
}

const API_BASE = 'http://localhost:3001/api/v1';

export default function NoticeGroupBuilder({
  rules,
  onChange,
  onPreviewCount,
  previewData,
  isPreviewLoading,
}: NoticeGroupBuilderProps) {
  const { groups: savedTemplates, createGroup } = useNoticeGroups();

  const [targetType, setTargetType] = useState<TargetRule['target_type']>('all');
  const [targetValue, setTargetValue] = useState<string>('all');
  const [targetLabel, setTargetLabel] = useState<string>('Everyone in College');

  // Cascade Master Data
  const [courses, setCourses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ id: string; code: string; year: number }[]>([]);
  const [usersList, setUsersList] = useState<{ id: string; name: string; role: string; identifier?: string }[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Save template modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const tenantSlug = typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': tenantSlug,
    };
  }, []);

  const getTenantSlug = useCallback(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') || 'srms-ims' : 'srms-ims';
  }, []);

  // Fetch cascading master data
  useEffect(() => {
    const fetchMasterData = async () => {
      const slug = getTenantSlug();
      const headers = getHeaders();
      try {
        const [cRes, dRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/college-master/courses?tenant=${slug}`, { headers }),
          fetch(`${API_BASE}/admin-master/departments?tenant=${slug}`, { headers }),
          fetch(`${API_BASE}/college-master/batches?tenant=${slug}`, { headers }),
        ]);

        if (cRes.ok) {
          const json = await cRes.json();
          setCourses(json.data || json || []);
        }
        if (dRes.ok) {
          const json = await dRes.json();
          setDepartments(json.data || json || []);
        }
        if (bRes.ok) {
          const json = await bRes.json();
          setBatches(json.data || json || []);
        }
      } catch (err) {
        console.error('Failed to load cascade master data:', err);
      }
    };

    fetchMasterData();
  }, [getHeaders, getTenantSlug]);

  // Search users for specific user target
  useEffect(() => {
    if (targetType === 'user' && userSearch.length >= 2) {
      const searchUsers = async () => {
        const slug = getTenantSlug();
        try {
          const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(userSearch)}&tenant=${slug}`, {
            headers: getHeaders(),
          });
          if (res.ok) {
            const json = await res.json();
            const list = json.data || json.users || json || [];
            setUsersList(
              list.map((u: any) => ({
                id: u.id,
                name: u.student_name || u.faculty_name || u.name || u.email,
                role: u.role,
                identifier: u.registration_no || u.rollno || u.emp_id || u.email,
              })),
            );
          }
        } catch (e) {
          console.error(e);
        }
      };
      const t = setTimeout(searchUsers, 300);
      return () => clearTimeout(t);
    }
  }, [targetType, userSearch, getHeaders, getTenantSlug]);

  const handleTargetTypeChange = (type: TargetRule['target_type']) => {
    setTargetType(type);
    if (type === 'all') {
      setTargetValue('all');
      setTargetLabel('Everyone in College');
    } else if (type === 'role') {
      setTargetValue('STUDENT');
      setTargetLabel('All Students');
    } else if (type === 'course' && courses.length > 0) {
      setTargetValue(courses[0].code);
      setTargetLabel(`Course: ${courses[0].name} (${courses[0].code})`);
    } else if (type === 'branch' && departments.length > 0) {
      setTargetValue(departments[0].code);
      setTargetLabel(`Department: ${departments[0].name}`);
    } else if (type === 'batch_year' && batches.length > 0) {
      setTargetValue(batches[0].code);
      setTargetLabel(`Batch: ${batches[0].code}`);
    } else {
      setTargetValue('');
      setTargetLabel('');
    }
  };

  const addCurrentRule = () => {
    if (!targetValue) return;

    // Avoid duplicate rules
    const exists = rules.some((r) => r.target_type === targetType && r.target_value === targetValue);
    if (exists) return;

    const newRule: TargetRule = {
      target_type: targetType,
      target_value: targetValue,
      target_label: targetLabel || targetValue,
    };

    // If 'all' selected, it replaces others
    if (targetType === 'all') {
      onChange([newRule]);
    } else {
      const filtered = rules.filter((r) => r.target_type !== 'all');
      onChange([...filtered, newRule]);
    }
  };

  const removeRule = (idx: number) => {
    const updated = rules.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const loadTemplate = (tmpl: NoticeGroupTemplate) => {
    if (tmpl.target_rules && Array.isArray(tmpl.target_rules)) {
      onChange(tmpl.target_rules);
    }
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || rules.length === 0) return;
    try {
      setSaveLoading(true);
      await createGroup({
        name: templateName.trim(),
        description: templateDesc.trim(),
        target_rules: rules,
      });
      setIsSaveModalOpen(false);
      setTemplateName('');
      setTemplateDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-5">
      {/* Header & Quick Templates */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
        <div>
          <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]"></span>
            Target Audience Criteria
          </h3>
          <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
            Target specific batches, courses, roles, departments, or individual recipients
          </p>
        </div>

        {/* Saved Templates Selector */}
        {savedTemplates.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#4E5969] dark:text-slate-400 whitespace-nowrap">
              Saved Groups:
            </span>
            <select
              onChange={(e) => {
                const found = savedTemplates.find((t) => t.id === e.target.value);
                if (found) loadTemplate(found);
              }}
              defaultValue=""
              className="text-xs font-bold py-1.5 px-3 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="" disabled>
                -- Load Target Group --
              </option>
              {savedTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.target_rules?.length || 1} rules)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { type: 'all', label: 'Everyone', icon: '🌐' },
          { type: 'role', label: 'By Role', icon: '👥' },
          { type: 'batch_year', label: 'Batch / Year', icon: '🎓' },
          { type: 'course', label: 'Course', icon: '📚' },
          { type: 'branch', label: 'Department', icon: '🏥' },
          { type: 'user', label: 'Specific User', icon: '👤' },
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => handleTargetTypeChange(item.type as TargetRule['target_type'])}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
              targetType === item.type
                ? 'bg-[#5B4BFF] text-white border-[#5B4BFF] shadow-sm shadow-indigo-500/30'
                : 'bg-[#F6F8FC] dark:bg-slate-800/80 text-[#4E5969] dark:text-slate-300 border-[#E7EAF3] dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Cascading Parameter Inputs */}
      <div className="p-4 rounded-2xl bg-[#F6F8FC] dark:bg-slate-800/50 border border-[#E7EAF3] dark:border-slate-800 space-y-3">
        {targetType === 'all' && (
          <p className="text-xs font-semibold text-[#4E5969] dark:text-slate-300">
            ✅ Notice will broadcast to <strong>all registered students, faculty, wardens, and staff</strong> across the college.
          </p>
        )}

        {targetType === 'role' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white w-28 shrink-0">Select Role:</label>
            <select
              value={targetValue}
              onChange={(e) => {
                const val = e.target.value;
                setTargetValue(val);
                const labels: Record<string, string> = {
                  STUDENT: 'All Students',
                  FACULTY: 'All Faculty Members',
                  CLERK: 'All Clerks / Academic Staff',
                  WARDEN: 'All Hostel Wardens',
                  COLLEGE_ADMIN: 'College Administration',
                };
                setTargetLabel(labels[val] || val);
              }}
              className="flex-1 w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="STUDENT">Students (All Batches & Years)</option>
              <option value="FACULTY">Faculty (All Departments)</option>
              <option value="CLERK">Clerks & Administrative Staff</option>
              <option value="WARDEN">Hostel Wardens</option>
              <option value="COLLEGE_ADMIN">College Administration</option>
            </select>
          </div>
        )}

        {targetType === 'batch_year' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white w-28 shrink-0">Select Batch:</label>
            <select
              value={targetValue}
              onChange={(e) => {
                const val = e.target.value;
                setTargetValue(val);
                setTargetLabel(`Batch: ${val}`);
              }}
              className="flex-1 w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="2023-MBBS">2023 MBBS Batch (Phase II)</option>
              <option value="2024">2024 MBBS Batch (Phase I)</option>
              <option value="2025">2025 MBBS Batch (Foundation)</option>
              <option value="2022">2022 MBBS Batch (Phase III Part 1)</option>
              {batches.map((b) => (
                <option key={b.id} value={b.code}>
                  {b.code} ({b.year})
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'course' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white w-28 shrink-0">Select Course:</label>
            <select
              value={targetValue}
              onChange={(e) => {
                const val = e.target.value;
                setTargetValue(val);
                const c = courses.find((x) => x.code === val);
                setTargetLabel(`Course: ${c ? c.name : val}`);
              }}
              className="flex-1 w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="MBBS">MBBS — Bachelor of Medicine & Bachelor of Surgery</option>
              <option value="MD_GEN">MD — General Medicine</option>
              <option value="MS_SURG">MS — General Surgery</option>
              {courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'branch' && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs font-bold text-[#1B1E28] dark:text-white w-28 shrink-0">Department:</label>
            <select
              value={targetValue}
              onChange={(e) => {
                const val = e.target.value;
                setTargetValue(val);
                const d = departments.find((x) => x.code === val);
                setTargetLabel(`Department: ${d ? d.name : val}`);
              }}
              className="flex-1 w-full text-xs font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
            >
              <option value="PHY">Department of Physiology</option>
              <option value="ANA">Department of Anatomy</option>
              <option value="BIO">Department of Biochemistry</option>
              <option value="PATH">Department of Pathology</option>
              <option value="PHARM">Department of Pharmacology</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'user' && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="text-xs font-bold text-[#1B1E28] dark:text-white w-28 shrink-0">Search User:</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Type name, roll number, registration no, or employee ID..."
                className="flex-1 w-full text-xs font-semibold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
              />
            </div>
            {usersList.length > 0 && (
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-700 rounded-xl p-1">
                {usersList.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setTargetValue(u.id);
                      setTargetLabel(`${u.name} (${u.role} — ${u.identifier})`);
                      setUserSearch('');
                      setUsersList([]);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#F6F8FC] dark:hover:bg-slate-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#1B1E28] dark:text-white">{u.name}</p>
                      <p className="text-[10px] text-[#4E5969] dark:text-slate-400">
                        {u.role} • {u.identifier}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF]">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Target Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={addCurrentRule}
            className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Target Rule
          </button>
        </div>
      </div>

      {/* Active Rules List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
            Active Target Rules ({rules.length})
          </span>

          {rules.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                className="text-[11px] font-bold text-[#5B4BFF] hover:underline"
              >
                💾 Save as Template
              </button>
              {onPreviewCount && (
                <button
                  type="button"
                  onClick={onPreviewCount}
                  disabled={isPreviewLoading}
                  className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00C48C] border border-emerald-200 dark:border-emerald-800 text-[11px] font-black hover:bg-emerald-100 transition-all flex items-center gap-1"
                >
                  {isPreviewLoading ? 'Calculating...' : '🔍 Calculate Reach'}
                </button>
              )}
            </div>
          )}
        </div>

        {rules.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-[#E7EAF3] dark:border-slate-800 text-center text-xs text-[#4E5969] dark:text-slate-400">
            No targeting rules added. Please add at least one audience rule above.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rules.map((r, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200 text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                  {r.target_type}
                </span>
                <span>{r.target_label || r.target_value}</span>
                <button
                  type="button"
                  onClick={() => removeRule(idx)}
                  className="w-4 h-4 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Recipient Reach Preview Banner */}
      {previewData && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00C48C] text-white font-black flex items-center justify-center text-sm shadow-sm">
              ✓
            </div>
            <div>
              <p className="font-extrabold text-[#1B1E28] dark:text-white">
                Live Reach: <span className="text-[#00C48C] text-sm">{previewData.totalCount} Users</span>
              </p>
              <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium">
                {previewData.breakdown.students} Students • {previewData.breakdown.faculty} Faculty •{' '}
                {previewData.breakdown.clerks + previewData.breakdown.wardens + previewData.breakdown.admins} Staff
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto">
            Real Query Verified
          </span>
        </div>
      )}

      {/* Save Template Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
              Save Target Audience as Template
            </h4>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
              Save this combination of {rules.length} rule(s) to reuse in future notices.
            </p>

            <form onSubmit={handleSaveAsTemplate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Final Year MBBS Batch + Clinical Faculty"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="Notes about who this target audience group includes..."
                  className="w-full text-xs font-medium p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm"
                >
                  {saveLoading ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
