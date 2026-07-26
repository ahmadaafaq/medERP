'use client';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="h-16 glass-card border-b border-slate-800 px-6 flex items-center justify-between">
      <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          System Live
        </span>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
          U
        </div>
      </div>
    </header>
  );
}
