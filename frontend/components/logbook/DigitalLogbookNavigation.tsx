'use client';

import React from 'react';
import {
  LayoutDashboard,
  User,
  FolderGit2,
  CalendarDays,
  Presentation,
  BookOpenCheck,
  Award,
  Layers,
  FileArchive,
  MessageSquareQuote,
  GraduationCap,
} from 'lucide-react';

export type LogbookTabKey =
  | 'DASHBOARD'
  | 'ACTIVITY_LOGBOOK'
  | 'PROFILE'
  | 'MINI_PROJECT'
  | 'WEEKLY_LOG'
  | 'SEMINARS'
  | 'TUTORIALS'
  | 'TECHNICAL_ACTIVITIES'
  | 'REVIEWS'
  | 'DOCUMENTS'
  | 'FACULTY_REMARKS'
  | 'FINAL_EVALUATION';

interface TabItem {
  key: LogbookTabKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string | number;
}

export const LOGBOOK_TABS: TabItem[] = [
  { key: 'DASHBOARD', label: 'Dashboard', shortLabel: 'Overview', icon: LayoutDashboard },
  { key: 'PROFILE', label: 'Student Profile', shortLabel: 'Profile', icon: User },
  { key: 'MINI_PROJECT', label: 'Mini Project & Tech Stack', shortLabel: 'Project', icon: FolderGit2 },
  { key: 'WEEKLY_LOG', label: 'Weekly Log', shortLabel: 'Weekly', icon: CalendarDays },
  { key: 'SEMINARS', label: 'Seminars', shortLabel: 'Seminars', icon: Presentation },
  { key: 'TUTORIALS', label: 'Tutorials', shortLabel: 'Tutorials', icon: BookOpenCheck },
  { key: 'TECHNICAL_ACTIVITIES', label: 'Technical Activities', shortLabel: 'Activities', icon: Award },
  { key: 'REVIEWS', label: 'Progress Reviews', shortLabel: 'Reviews', icon: Layers },
  { key: 'DOCUMENTS', label: 'Documents', shortLabel: 'Docs', icon: FileArchive },
  { key: 'FACULTY_REMARKS', label: 'Faculty Remarks', shortLabel: 'Remarks', icon: MessageSquareQuote },
  { key: 'FINAL_EVALUATION', label: 'Final Evaluation', shortLabel: 'Evaluation', icon: GraduationCap },
];

interface Props {
  activeTab: LogbookTabKey;
  onTabChange: (tab: LogbookTabKey) => void;
  stats?: {
    weeklyCount?: number;
    seminarsCount?: number;
    tutorialsCount?: number;
    techCount?: number;
    remarksCount?: number;
  };
}

export default function DigitalLogbookNavigation({ activeTab, onTabChange, stats }: Props) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[22px] p-2 sm:p-2.5 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 overflow-hidden">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1">
        {LOGBOOK_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          let countBadge: number | undefined;
          if (tab.key === 'WEEKLY_LOG') countBadge = stats?.weeklyCount;
          if (tab.key === 'SEMINARS') countBadge = stats?.seminarsCount;
          if (tab.key === 'TUTORIALS') countBadge = stats?.tutorialsCount;
          if (tab.key === 'TECHNICAL_ACTIVITIES') countBadge = stats?.techCount;
          if (tab.key === 'FACULTY_REMARKS') countBadge = stats?.remarksCount;

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 select-none ${
                isActive
                  ? 'bg-[#2D2575] text-white shadow-md shadow-[#2D2575]/20 font-semibold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#F36C21]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof countBadge === 'number' && countBadge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    isActive
                      ? 'bg-[#F36C21] text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {countBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
