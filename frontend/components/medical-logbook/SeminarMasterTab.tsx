'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CascadingSelector, { CascadingSelection } from './CascadingSelector';

export default function SeminarMasterTab() {
  const [cascade, setCascade] = useState<Partial<CascadingSelection>>({});
  const [category, setCategory] = useState('Central Seminar');
  const [title, setTitle] = useState('');
  const [seminarDate, setSeminarDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState('');
  const [presenterName, setPresenterName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Listing state
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const categories = ['Central Seminar', 'Journal Club', 'PG Seminar', 'UG Academic'];

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

  const loadSeminars = useCallback(async () => {
    setLoadingList(true);
    try {
      const h = getHeaders();
      let url = `/api/v1/medical-logbook/seminar-master?tenant=${h['x-tenant-slug']}&page=${page}&limit=10`;
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (cascade.professionalYearId) url += `&professionalYearId=${cascade.professionalYearId}`;

      const res = await fetch(url, { headers: h });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        setSeminars(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to load seminars', e);
    } finally {
      setLoadingList(false);
    }
  }, [page, filterCategory, searchQuery, cascade.professionalYearId, getHeaders]);

  useEffect(() => {
    loadSeminars();
  }, [loadSeminars]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) {
      setFeedback({ type: 'error', message: 'Please enter a Presentation Title and select Category.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const h = getHeaders();
      const payload = {
        course_id: cascade.courseId || null,
        branch_id: cascade.branchId || null,
        batch_id: cascade.batchId || null,
        professional_year_id: cascade.professionalYearId || null,
        cbme_year_id: cascade.cbmeYearId || null,
        subject_id: cascade.subjectId || null,
        unit_id: cascade.unitId || null,
        topic_id: cascade.topicId || null,
        competency_id: cascade.competencyId || null,
        category,
        title: title.trim(),
        seminar_date: seminarDate || null,
        venue: venue.trim() || null,
        presenter_name: presenterName.trim() || null,
        remarks: remarks.trim() || null,
      };

      let url = `/api/v1/medical-logbook/seminar-master?tenant=${h['x-tenant-slug']}`;
      let method = 'POST';

      if (editingId) {
        url = `/api/v1/medical-logbook/seminar-master/${editingId}?tenant=${h['x-tenant-slug']}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: h,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to save Seminar Master');
      }

      setFeedback({
        type: 'success',
        message: editingId ? 'Seminar Master updated successfully!' : 'Seminar Master created successfully!',
      });
      setTitle('');
      setVenue('');
      setPresenterName('');
      setRemarks('');
      setEditingId(null);
      loadSeminars();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setCategory(item.category || 'Central Seminar');
    setTitle(item.title || '');
    setSeminarDate(item.seminar_date ? item.seminar_date.split('T')[0] : '');
    setVenue(item.venue || '');
    setPresenterName(item.presenter_name || '');
    setRemarks(item.remarks || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this seminar?')) return;
    try {
      const h = getHeaders();
      const res = await fetch(`/api/v1/medical-logbook/seminar-master/${id}?tenant=${h['x-tenant-slug']}`, {
        method: 'DELETE',
        headers: h,
      });
      if (res.ok) loadSeminars();
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cascading Selector */}
      <CascadingSelector
        value={cascade}
        onChange={setCascade}
        programLevel="UG"
      />

      {/* 2. Seminar Form */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-[#1B1E28] dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5B4BFF]" />
              {editingId ? 'Edit Seminar / Journal Club Master' : 'Add New Seminar / Journal Club Master'}
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
              Category options: Central Seminar, Journal Club, PG Seminar, UG Academic.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Seminar Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Presentation Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Date of Presentation *
              </label>
              <input
                type="date"
                value={seminarDate}
                onChange={e => setSeminarDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            {/* Venue */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Venue / Hall
              </label>
              <input
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g. LT-1, Pathology Demo Room"
                className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Seminar / Case Presentation Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Molecular Mechanisms of Insulin Resistance in Type 2 Diabetes"
                className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>

            {/* Presenter / Moderator */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
                Presenter / Faculty In-Charge
              </label>
              <input
                type="text"
                value={presenterName}
                onChange={e => setPresenterName(e.target.value)}
                placeholder="e.g. Dr. A. K. Sharma (Guide: Prof. P. K. Verma)"
                className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1E28] dark:text-slate-200 mb-1.5">
              Remarks / Agenda Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Key discussion points, learning objectives, or participant guidelines..."
              className="w-full px-3.5 py-2 bg-[#F6F8FC] dark:bg-slate-800/90 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#1B1E28] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5B4BFF] resize-none"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-6 py-2.5 bg-[#5B4BFF] hover:bg-[#4838EE] text-white font-bold text-xs rounded-xl shadow-md shadow-[#5B4BFF]/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingId ? 'Update Seminar' : 'Save Seminar Master'}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Results Table */}
      <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div>
            <h3 className="text-sm font-bold text-[#1B1E28] dark:text-slate-100">
              Seminar & Journal Club Directory ({totalCount} entries)
            </h3>
            <p className="text-xs text-[#4E5969] dark:text-slate-400 mt-0.5">
              Scheduled clinical seminars, presentation schedules, and academic conferences.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title..."
              className="w-48 px-3 py-1.5 text-xs bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
            />
          </div>
        </div>

        {loadingList ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-[#5B4BFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading Seminar Master entries...
          </div>
        ) : seminars.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No Seminar Master records found. Create one using the form above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Title / Topic</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Presenter</th>
                  <th className="py-3 px-3">Venue</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {seminars.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5B4BFF]/10 text-[#5B4BFF]">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#1B1E28] dark:text-slate-200 max-w-xs">
                      {s.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {s.seminar_date ? s.seminar_date.split('T')[0] : 'TBD'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {s.presenter_name || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {s.venue || '—'}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-[#5B4BFF] hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
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
      </div>
    </div>
  );
}
