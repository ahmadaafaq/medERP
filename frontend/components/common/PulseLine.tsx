'use client';

import React from 'react';

interface PulseLineProps {
  className?: string;
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
}

/**
 * PulseLine — Signature Medical ERP ECG / Heartbeat trace motif
 * Designed for subtle placement on purple surfaces (Sidebar footer, Header, Hero banners)
 */
export default function PulseLine({
  className = 'w-full h-8 opacity-20',
  color = '#FFFFFF',
  strokeWidth = 1.75,
  animated = false,
}: PulseLineProps) {
  return (
    <svg
      viewBox="0 0 400 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none pointer-events-none ${className}`}
      preserveAspectRatio="none"
    >
      <path
        d="M0 30 H70 L80 30 L90 15 L100 48 L110 5 L120 40 L130 30 L180 30 L190 30 L200 15 L210 48 L220 5 L230 40 L240 30 L310 30 L320 20 L330 30 H400"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-[dash_3s_linear_infinite]' : ''}
      />
    </svg>
  );
}
