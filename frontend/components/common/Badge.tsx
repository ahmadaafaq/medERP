'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'primary',
  dot = false,
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[#5B4BFF]/10 text-[#5B4BFF] border-[#5B4BFF]/25',
    accent: 'bg-[#F36C21]/10 text-[#F36C21] border-[#F36C21]/25',
    success: 'bg-[#00C48C]/10 text-[#00A374] dark:text-[#34D399] border-[#00C48C]/25',
    warning: 'bg-[#FFB020]/10 text-[#D97706] dark:text-[#FBBF24] border-[#FFB020]/25',
    danger: 'bg-[#F04438]/10 text-[#F04438] border-[#F04438]/25',
    muted: 'bg-slate-100 dark:bg-slate-800 text-[#7B8794] dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  const dotColors = {
    primary: 'bg-[#5B4BFF]',
    accent: 'bg-[#F36C21]',
    success: 'bg-[#00C48C]',
    warning: 'bg-[#FFB020]',
    danger: 'bg-[#F04438]',
    muted: 'bg-[#7B8794]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border select-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
}
