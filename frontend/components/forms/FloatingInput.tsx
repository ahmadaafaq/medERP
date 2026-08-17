'use client';

import React, { useState } from 'react';

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export default function FloatingInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  id,
  value,
  defaultValue,
  placeholder = ' ',
  disabled,
  ...props
}: FloatingInputProps) {
  const inputId = id || `med-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value || defaultValue));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(Boolean(e.target.value));
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className={`relative w-full ${containerClassName}`}>
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8794] pointer-events-none z-10">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(Boolean(e.target.value));
            props.onBlur?.(e);
          }}
          onChange={handleChange}
          className={`peer w-full h-12 ${
            leftIcon ? 'pl-11' : 'pl-4'
          } ${rightIcon ? 'pr-11' : 'pr-4'} pt-3 pb-1 text-sm font-medium rounded-[16px] border bg-white dark:bg-[#0F172A] text-[#1B1E28] dark:text-white transition-all duration-200 focus:outline-none ${
            error
              ? 'border-[#F04438] focus:border-[#F04438] focus:ring-4 focus:ring-[#F04438]/15'
              : 'border-[#E7EAF3] dark:border-slate-700 focus:border-[#5B4BFF] focus:ring-4 focus:ring-[#5B4BFF]/15'
          } disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:text-slate-400 ${className}`}
          {...props}
        />

        <label
          htmlFor={inputId}
          className={`absolute ${
            leftIcon ? 'left-11' : 'left-4'
          } text-[#7B8794] duration-200 transform pointer-events-none select-none origin-[0] ${
            isFocused || hasValue || (value !== undefined && value !== '')
              ? 'top-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5B4BFF] dark:text-[#7867FF]'
              : 'top-3.5 text-xs font-semibold'
          } ${error ? '!text-[#F04438]' : ''}`}
        >
          {label}
        </label>

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8794] z-10">
            {rightIcon}
          </div>
        )}
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
