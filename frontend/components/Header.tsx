'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('mederp_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('mederp_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="h-16 bg-gradient-to-r from-white/95 via-white/85 to-white/95 dark:from-slate-900/95 dark:via-slate-950/85 dark:to-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-6 flex items-center justify-between sticky top-0 z-30 transition-all shadow-[0_1px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_15px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-3">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]"></span>
        <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-wider uppercase font-sans">{title}</h2>
      </div>
      
      <div className="flex items-center gap-3.5">
        {/* System Status Pill */}
        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm shadow-emerald-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          System Live
        </span>

        {/* Custom SVG Icon Theme Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-xs shadow-md shadow-indigo-600/25 hover:scale-105 transition-all cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
}
