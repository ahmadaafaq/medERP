'use client';

import React from 'react';
import { BookOpen, User, MapPin, Layers, FileText, CheckCircle2, Clock } from 'lucide-react';

interface MedicalHoverPreviewProps {
  entry: any;
  position: { x: number; y: number };
}

export default function MedicalHoverPreview({ entry, position }: MedicalHoverPreviewProps) {
  if (!entry) return null;

  let competencyCodes: string[] = [];
  if (entry.competency_codes) {
    competencyCodes = String(entry.competency_codes)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  // Adjust positioning to avoid going off right edge of viewport
  const left = typeof window !== 'undefined' && position.x + 320 > window.innerWidth
    ? Math.max(16, position.x - 320)
    : position.x + 12;

  const top = typeof window !== 'undefined' && position.y + 240 > window.innerHeight
    ? Math.max(16, position.y - 240)
    : position.y + 12;

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{ left: `${left}px`, top: `${top}px`, width: '310px' }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 text-xs space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-2.5">
          <div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
              {entry.department_name || 'Medical Department'}
            </div>
            <div className="text-sm font-extrabold text-white leading-tight mt-0.5">
              {entry.subject_name || 'Subject'}
            </div>
            {entry.linked_subject_name && (
              <div className="text-[11px] text-amber-300 font-medium mt-0.5 flex items-center gap-1">
                <span>+ Linked: {entry.linked_subject_name}</span>
              </div>
            )}
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
            {entry.session_type || 'Lecture'}
          </span>
        </div>

        {/* Time & Room & Faculty */}
        <div className="grid grid-cols-2 gap-2 text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-white">
              {entry.start_time} - {entry.end_time}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{entry.room || 'LH-1'}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium text-slate-200 truncate">
              {entry.faculty_name ? `Dr. ${entry.faculty_name}` : 'Faculty: Not Assigned (TBD)'}
            </span>
          </div>
        </div>

        {/* Unit & Topic */}
        {(entry.unit_name || entry.topic_name) && (
          <div className="bg-slate-800/80 rounded-xl p-2.5 space-y-1.5 border border-slate-700/40">
            {entry.unit_name && (
              <div className="flex items-start gap-1.5 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">
                  <strong className="text-slate-200">Unit:</strong> {entry.unit_name}
                </span>
              </div>
            )}
            {entry.topic_name && (
              <div className="flex items-start gap-1.5 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  <strong className="text-slate-200">Topic:</strong> {entry.topic_name}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Competency Badges */}
        {competencyCodes.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>NMC Competencies</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {competencyCodes.map((code, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
