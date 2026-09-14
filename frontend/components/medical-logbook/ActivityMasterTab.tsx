'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CascadingSelector, { CascadingSelection } from './CascadingSelector';

export default function ActivityMasterTab() {
  const [cascade, setCascade] = useState<Partial<CascadingSelection>>({});
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [activityName, setActivityName] = useState('');
  const [selectedActivityType, setSelectedActivityType] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Table state
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Fetch Activity Types
  useEffect(() => {
    (async () => {
      try {
        const h = getHeaders();
        const res = await fetch(`/api/v1/medical-logbook/lookups/activity-types?tenant=${h['x-tenant-slug']}`, { headers: h });
        if (res.ok) {
          const json = await res.json();
          const types = json.data !== undefined ? json.data : json;
          if (Array.isArray(types)) {
            setActivityTypes(types);
            if (types.length > 0 && !selectedActivityType) {
              setSelectedActivityType(types[0].id || types[0].code);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load activity types', e);
      }
    })();
  }, []);

  // Fetch Activity Master table records
  const loadActivities = useCallback(async () => {
    setLoadingList(true);
    try {
      const h = getHeaders();
      let url = `/api/v1/medical-logbook/activity-master?tenant=${h['x-tenant-slug']}&page=${page}&limit=10`;
      if (cascade.professionalYearId) url += `&professionalYearId=${cascade.professionalYearId}`;
      if (cascade.subjectId) url += `&subjectId=${cascade.subjectId}`;
      if (cascade.competencyId) url += `&competencyId=${cascade.competencyId}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        setActivities(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to load activities', e);
    } finally {
      setLoadingList(false);
    }
  }, [page, cascade.professionalYearId, cascade.subjectId, cascade.competencyId, searchQuery, getHeaders]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cascade.competencyId || !activityName.trim() || !selectedActivityType) {
      setFeedback({ type: 'error', message: 'Please select Competency, Activity Type, and enter Activity Name.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const h = getHeaders();
      const matchedType = activityTypes.find(t => t.id === selectedActivityType || t.code === selectedActivityType);

      const payload = {
        course_id: cascade.courseId || null,
        branch_id: cascade.branchId || null,
        batch_id: cascade.batchId || null,
        professional_year_id: cascade.professionalYearId || null,
        cbme_year_id: cascade.cbmeYearId || null,
        subject_id: cascade.subjectId || null,
        unit_id: cascade.unitId || null,
        topic_id: cascade.topicId || null,
        competency_id: cascade.competencyId,
        activity_name: activityName.trim(),
        activity_type_id: matchedType?.id || null,
        activity_type_code: matchedType?.code || selectedActivityType,
      };

      let url = `/api/v1/medical-logbook/activity-master?tenant=${h['x-tenant-slug']}`;
      let method = 'POST';

      if (editingId) {
        url = `/api/v1/medical-logbook/activity-master/${editingId}?tenant=${h['x-tenant-slug']}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: h,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save Activity Master');
      }

      setFeedback({
        type: 'success',
        message: editingId ? 'Activity Master updated successfully!' : 'Activity Master created successfully!',
      });
      setActivityName('');
      setEditingId(null);
      loadActivities();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setActivityName(item.activity_name);
    if (item.activity_type_id) {
      setSelectedActivityType(item.activity_type_id);
    } else if (item.activity_type_code) {
      setSelectedActivityType(item.activity_type_code);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this activity?')) return;
    try {
      const h = getHeaders();
      const res = await fetch(`/api/v1/medical-logbook/activity-master/${id}?tenant=${h['x-tenant-slug']}`, {
        method: 'DELETE',
        headers: h,
      });
      if (res.ok) {
        loadActivities();
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  const isFormValid = Boolean(cascade.competencyId && activityName.trim() && selectedActivityType);

  return (
    <div className="space-y-6">
      {/* 1. Cascading Selector */}
      <CascadingSelector
        value={cascade}
        onChange={setCascade}
        programLevel="UG"
      />

      {/* 2. Activity Form */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-[#1B1E28] dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5B4BFF]" />
              {editingId ? 'Edit Activity Master Entry' : 'Add New Activity Master Entry'}
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
              Define practical, skills, lab, or AETCOM activities under the selected competency.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setActivityName('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Type */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Activity Type *
              </label>
              <select
                value={selectedActivityType}
                onChange={e => setSelectedActivityType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all"
              >
                <option value="">— Select Type —</option>
                {activityTypes.map(t => (
                  <option key={t.id || t.code} value={t.id || t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                From pre-seeded master lookup.
              </p>
            </div>

            {/* Activity Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Activity Name / Title *
              </label>
              <textarea
                rows={2}
                value={activityName}
                onChange={e => setActivityName(e.target.value)}
                placeholder="e.g. Demonstration of Blood Pressure by Palpatory and Auscultatory Methods under standard conditions..."
                className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              {cascade.competencyId ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Competency linked: {cascade.competencyCode}
                </span>
              ) : (
                <span className="text-amber-500 font-semibold">
                  ⚠ Please select a Competency in the cascading chain above to link.
                </span>
              )}
            </span>

            <button
              type="submit"
              disabled={!isFormValid || saving}
              className="px-6 py-2.5 bg-[#5B4BFF] hover:bg-[#4838EE] text-white font-bold text-xs rounded-xl shadow-md shadow-[#5B4BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingId ? 'Update Activity' : 'Save to Activity Master'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Results Table */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-[#1B1E28] dark:text-slate-100">
              Activity Master Directory ({totalCount} entries)
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
              Existing activities filterable by cascade and search query.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by activity name or code..."
              className="w-full sm:w-64 px-3 py-1.5 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
            <button
              onClick={() => loadActivities()}
              className="px-3 py-1.5 bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {loadingList ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Activity Master entries...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No Activity Master records found. Create an activity using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-3">Competency</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Activity Name</th>
                  <th className="py-3 px-3">Professional</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {activities.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#5B4BFF]">
                      {act.competency_code || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {act.subject_name || 'General'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F36C21]/10 text-[#F36C21]">
                        {act.activity_type_name || 'Practical'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#1B1E28] dark:text-slate-200 max-w-xs">
                      {act.activity_name}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {act.professional_year_name || 'MBBS'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(act)}
                        className="text-[#5B4BFF] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(act.id)}
                        className="text-red-500 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
