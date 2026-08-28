'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../../../../components/Sidebar';
import Header from '../../../../../components/Header';
import NoticeGroupBuilder from '../../../../../components/notices/NoticeGroupBuilder';
import { useNoticeGroups, TargetRule, NoticeGroupTemplate } from '../../../../../hooks/useNoticeGroups';

export default function AdminNoticeGroupsPage() {
  const { groups, loading, createGroup, updateGroup, deleteGroup } = useNoticeGroups();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<NoticeGroupTemplate | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<TargetRule[]>([
    { target_type: 'role', target_value: 'STUDENT', target_label: 'All Students' },
  ]);
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setRules([{ target_type: 'role', target_value: 'STUDENT', target_label: 'All Students' }]);
    setEditingGroup(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (group: NoticeGroupTemplate) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || '');
    setRules(group.target_rules || []);
    setIsCreateModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rules.length === 0) return;
    setSaving(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: name.trim(),
          description: description.trim(),
          target_rules: rules,
        });
      } else {
        await createGroup({
          name: name.trim(),
          description: description.trim(),
          target_rules: rules,
        });
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save notice group template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (id: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete template "${groupName}"?`)) return;
    try {
      await deleteGroup(id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete template');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] dark:bg-slate-950 text-[#1B1E28] dark:text-slate-100 font-sans">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Notices & Circulars — Target Groups" />

        <main className="p-6 space-y-6 flex-1">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4E5969] dark:text-slate-400">
              <Link href="/dashboard/admin" className="hover:text-[#5B4BFF]">
                Admin Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/admin/notices/sent" className="hover:text-[#5B4BFF]">
                Notices
              </Link>
              <span>/</span>
              <span className="text-[#1B1E28] dark:text-white">Saved Target Groups</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/notices/sent"
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 text-xs font-extrabold text-[#1B1E28] dark:text-white shadow-soft hover:border-[#5B4BFF] transition-all"
              >
                📋 Sent Notices
              </Link>
              <button
                onClick={openCreateModal}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white text-xs font-black shadow-lg shadow-indigo-500/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5"
              >
                <span>+</span> Create Target Group
              </button>
            </div>
          </div>

          {/* Intro Card */}
          <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]"></span>
                Reusable Audience Groups
              </h3>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 font-medium">
                Save complex multi-level targeting criteria (e.g. 2023 MBBS batch + Cardiology faculty) as templates to reuse in one click.
              </p>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-[#5B4BFF] font-black text-xs border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
              {groups.length} Template(s) Saved
            </span>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                  <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-12 text-center space-y-3">
              <span className="text-3xl">👥</span>
              <h4 className="text-sm font-bold text-[#1B1E28] dark:text-white">No Target Groups Saved Yet</h4>
              <p className="text-xs text-[#4E5969] dark:text-slate-400 max-w-sm mx-auto">
                Create reusable audience groups like "All 1st Year MBBS" or "Cardiology & Pathology Faculty" to compose notices quickly.
              </p>
              <button
                onClick={openCreateModal}
                className="px-5 py-2 rounded-full bg-[#5B4BFF] text-white text-xs font-black shadow-md"
              >
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 shadow-soft space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#1B1E28] dark:text-white">{g.name}</h4>
                        <p className="text-[11px] text-[#4E5969] dark:text-slate-400 font-medium mt-0.5">
                          {g.description || 'No description provided'}
                        </p>
                      </div>

                      <span className="text-[10px] font-bold text-[#4E5969] dark:text-slate-400 shrink-0">
                        {formatDate(g.created_at)}
                      </span>
                    </div>

                    {/* Target Rules Tags */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-black uppercase text-[#4E5969] dark:text-slate-400 tracking-wider">
                        Criteria ({g.target_rules?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {g.target_rules && g.target_rules.length > 0 ? (
                          g.target_rules.map((r, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[10px] font-bold"
                            >
                              {r.target_label || r.target_value}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#4E5969]">No rules defined</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E7EAF3] dark:border-slate-800 gap-2">
                    <Link
                      href={`/dashboard/admin/notices/compose`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1"
                    >
                      ✉️ Use in Notice
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(g)}
                        className="px-3 py-1.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 hover:bg-slate-200 text-[#1B1E28] dark:text-white text-xs font-bold transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g.id, g.name)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all font-black text-xs"
                        title="Delete Group"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create / Edit Group Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-[#E7EAF3] dark:border-slate-800 rounded-[22px] p-6 max-w-3xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7EAF3] dark:border-slate-800">
                  <h3 className="text-sm font-black text-[#1B1E28] dark:text-white uppercase tracking-wider">
                    {editingGroup ? 'Edit Target Group Template' : 'Create New Target Group Template'}
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveGroup} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Group Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. 2023 MBBS Batch & Faculty"
                        className="w-full text-xs font-semibold p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#1B1E28] dark:text-white block mb-1">Description</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short notes about target group..."
                        className="w-full text-xs font-medium p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 border border-[#E7EAF3] dark:border-slate-700 text-[#1B1E28] dark:text-white focus:outline-none focus:border-[#5B4BFF]"
                      />
                    </div>
                  </div>

                  {/* Embedded Group Builder */}
                  <NoticeGroupBuilder rules={rules} onChange={setRules} />

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#E7EAF3] dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#F6F8FC] dark:bg-slate-800 text-[#4E5969] dark:text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4F46E5] text-white text-xs font-black shadow-sm"
                    >
                      {saving ? 'Saving...' : editingGroup ? 'Update Template' : 'Save Group Template'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
