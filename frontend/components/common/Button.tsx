'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
  };

  // Variant styles adhering to MedERP Theme
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] text-white shadow-md shadow-[#5B4BFF]/25 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
    secondary:
      'bg-white dark:bg-slate-800 text-[#1B1E28] dark:text-white border border-[#E7EAF3] dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
    outline:
      'bg-transparent border-2 border-[#5B4BFF] text-[#5B4BFF] hover:bg-[#5B4BFF]/10 active:scale-95',
    accent:
      'bg-gradient-to-r from-[#F36C21] to-[#FF8533] text-white shadow-md shadow-[#F36C21]/25 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
    danger:
      'bg-gradient-to-r from-[#F04438] to-[#F97066] text-white shadow-md shadow-[#F04438]/25 hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
    ghost:
      'bg-transparent text-[#4E5969] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95',
  };

  return (
    <button
      type={props.type || 'button'}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-tight select-none transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 shrink-0 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
