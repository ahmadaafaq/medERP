'use client';

import React from 'react';
import { X, GitCompare, Check, AlertCircle } from 'lucide-react';

interface PaperVersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousVersion: any;
  currentDraft: any;
}

export default function PaperVersionDiffModal({
  isOpen,
  onClose,
  previousVersion,
  currentDraft,
}: PaperVersionDiffModalProps) {
  if (!isOpen || !previousVersion || !currentDraft) return null;

  const prevVersionNum = previousVersion.version || 1;
  const nextVersionNum = prevVersionNum + 1;

  const diffItems = [
    {
      label: 'Paper Name / Title',
      oldVal: previousVersion.name,
      newVal: currentDraft.name,
      changed: previousVersion.name !== currentDraft.name,
    },
    {
      label: 'Duration (Minutes)',
      oldVal: `${previousVersion.duration_minutes || 60} mins`,
      newVal: `${currentDraft.duration_minutes || 60} mins`,
      changed:
        Number(previousVersion.duration_minutes) !==
        Number(currentDraft.duration_minutes),
    },
    {
      label: 'Effective Max Marks',
      oldVal: `${previousVersion.max_marks} marks`,
      newVal: `${currentDraft.max_marks} marks`,
      changed: Number(previousVersion.max_marks) !== Number(currentDraft.max_marks),
    },
    {
      label: 'Paper Set',
      oldVal: previousVersion.paper_set || 'Set A',
      newVal: currentDraft.paper_set || 'Set A',
      changed: previousVersion.paper_set !== currentDraft.paper_set,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden border border-[#E7EAF3] dark:border-slate-800">
        <div className="px-6 py-4 border-b border-[#E7EAF3] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#2D2575] to-[#5B4BFF] text-white">
          <div className="flex items-center gap-2">
            <GitCompare size={20} className="text-[#F36C21]" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                Paper Version History &amp; Diff
              </h3>
              <p className="text-[11px] text-white/80">
                Comparing Version {prevVersionNum} (Published/Locked) &rarr; Version{' '}
                {nextVersionNum} (New Draft)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              Published question papers are immutable. Edits automatically
              generate Version {nextVersionNum} and require re-review before
              publishing.
            </span>
          </div>

          <div className="rounded-xl border border-[#E7EAF3] dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#F8FAFC] dark:bg-slate-800 text-[#4E5969] uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Attribute</th>
                  <th className="p-3">Previous (v{prevVersionNum})</th>
                  <th className="p-3">New Draft (v{nextVersionNum})</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7EAF3] dark:divide-slate-800">
                {diffItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      item.changed
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : 'bg-white dark:bg-slate-900'
                    }
                  >
                    <td className="p-3 font-bold text-[#1B1E28] dark:text-slate-200">
                      {item.label}
                    </td>
                    <td className="p-3 text-slate-500 line-through">
                      {item.oldVal}
                    </td>
                    <td className="p-3 font-black text-[#5B4BFF]">
                      {item.newVal}
                    </td>
                    <td className="p-3">
                      {item.changed ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800">
                          Modified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400">
                          Unchanged
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E7EAF3] dark:border-slate-800 flex items-center justify-end bg-[#F8FAFC] dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4E3EFF] text-white font-bold text-xs shadow transition-all"
          >
            Close Diff
          </button>
        </div>
      </div>
    </div>
  );
}

