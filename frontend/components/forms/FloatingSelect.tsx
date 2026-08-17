'use client';

import React, { useState } from 'react';

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  helperText?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

export default function FloatingSelect({
  label,
  options = [],
  error,
  helperText,
  isLoading = false,
  leftIcon,
  containerClassName = '',
  className = '',
  id,
  value,
  defaultValue,
  disabled,
  ...props
}: FloatingSelectProps) {
  const selectId = id || `med-select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const [isFocused, setIsFocused] = useState(false);
  const [currentVal, setCurrentVal] = useState(value || defaultValue || '');

  const hasValue = Boolean(currentVal || value || defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentVal(e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className={`relative w-full ${containerClassName}`}>
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8794] pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        <select
          id={selectId}
          disabled={disabled || isLoading}
          value={value !== undefined ? value : currentVal}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={handleChange}
          className={`peer w-full h-12 ${
            leftIcon ? 'pl-11' : 'pl-4'
          } pr-10 pt-3 pb-1 text-sm font-medium rounded-[16px] border bg-white dark:bg-[#0F172A] text-[#1B1E28] dark:text-white appearance-none cursor-pointer transition-all duration-200 focus:outline-none ${
            error
              ? 'border-[#F04438] focus:border-[#F04438] focus:ring-4 focus:ring-[#F04438]/15'
              : 'border-[#E7EAF3] dark:border-slate-700 focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/15'
          } disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-400 ${className}`}
          {...props}
        >
          <option value="" disabled hidden>
            {isLoading ? 'Loading options...' : ''}
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-white dark:bg-slate-900 text-[#1B1E28] dark:text-white py-2"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <label
          htmlFor={selectId}
          className={`absolute ${
            leftIcon ? 'left-11' : 'left-4'
          } text-[#7B8794] duration-200 transform pointer-events-none select-none origin-[0] ${
            isFocused || hasValue
              ? 'top-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5B4BFF] dark:text-[#7867FF]'
              : 'top-3.5 text-xs font-semibold'
          } ${error ? '!text-[#F04438]' : ''}`}
        >
          {label}
        </label>

        {/* Custom Chevron Indicator or Spinner */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#7B8794]">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-[#5B4BFF]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-[#F04438] font-semibold flex items-center gap-1 pl-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-[#7B8794] font-medium pl-1">{helperText}</p>
      ) : null}
    </div>
  );
}
