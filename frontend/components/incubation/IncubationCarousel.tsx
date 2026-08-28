'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Layers,
  Flame
} from 'lucide-react';

export interface IncubatedProjectAlert {
  id: number | string;
  title: string;
  incubationStatus: string;
  score: number;
  grade: string;
  fundingAmount?: number;
  mentorAssigned?: string;
  incubationNotes?: string;
  techStack?: string[];
  screenshots?: string[];
}

interface IncubationCarouselProps {
  projects: IncubatedProjectAlert[];
  autoSlideInterval?: number; // In milliseconds, default 6000ms
  className?: string;
}

export default function IncubationCarousel({
  projects = [],
  autoSlideInterval = 6000,
  className = '',
}: IncubationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // Group projects into chunks of 2 (2 incubation items per slide)
  const itemsPerSlide = 2;
  const slides: IncubatedProjectAlert[][] = [];
  for (let i = 0; i < projects.length; i += itemsPerSlide) {
    slides.push(projects.slice(i, i + itemsPerSlide));
  }

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // Auto-play timer with progress bar
  useEffect(() => {
    if (!isPlaying || isHovered || totalSlides <= 1) {
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / autoSlideInterval) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, totalSlides, autoSlideInterval, nextSlide]);

  if (!projects || projects.length === 0) {
    return null;
  }

  const currentSlideItems = slides[currentIndex] || [];
  const startItemIdx = currentIndex * itemsPerSlide + 1;
  const endItemIdx = Math.min((currentIndex + 1) * itemsPerSlide, projects.length);

  return (
    <div
      className={`relative w-full space-y-3 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🧭 Carousel Control & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-2">
        {/* Left: Total Count & Current Slide Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-[#F36C21]/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
            <Flame className="w-3.5 h-3.5 text-[#F36C21] animate-pulse" />
            <span>Golden Opportunities</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#F36C21] text-white text-[10px]">
              {projects.length} Total
            </span>
          </span>

          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#5B4BFF]" />
            <span>
              Showing projects <strong className="text-[#5B4BFF] dark:text-indigo-400">{startItemIdx}-{endItemIdx}</strong> of{' '}
              <strong>{projects.length}</strong> (Slide {currentIndex + 1}/{totalSlides})
            </span>
          </span>
        </div>

        {/* Right: Manual Slide Navigation & Auto Play Controls */}
        {totalSlides > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Auto Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause Auto-slide' : 'Resume Auto-slide'}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            >
              {isPlaying && !isHovered ? (
                <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>

            {/* Previous Slide Button */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Slide Pagination Indicator Dots */}
            <div className="flex items-center gap-1.5 px-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-7 bg-gradient-to-r from-amber-500 to-[#F36C21] shadow-sm'
                      : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            {/* Next Slide Button */}
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next Slide"
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ⏳ Auto-Slide Progress Bar */}
      {totalSlides > 1 && (
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-[#F36C21] to-[#5B4BFF] transition-all duration-75 ease-linear"
            style={{ width: `${isPlaying && !isHovered ? progress : 0}%` }}
          />
        </div>
      )}

      {/* 🚀 Active Carousel Slide Container (Displays exactly 2 incubation items) */}
      <div className="relative overflow-hidden rounded-[22px]">
        <div
          key={currentIndex}
          className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300"
        >
          {currentSlideItems.map((p) => {
            const isFunded = p.incubationStatus === 'Funded';
            const isSelected = p.incubationStatus === 'Selected';
            const isIncubated = p.incubationStatus === 'Incubated';

            return (
              <div
                key={p.id}
                className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-amber-500 via-[#F36C21] to-[#5B4BFF] text-white shadow-xl relative overflow-hidden border-2 border-amber-300 transition-all duration-300 hover:shadow-2xl hover:border-amber-200"
              >
                {/* Decorative Background Glows */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-3xl">
                    {/* Status & Grade Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-white text-slate-900 font-black text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>🚀 GOLDEN OPPORTUNITY: INCUBATION SHORTLISTED</span>
                      </span>

                      <span className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/30 text-white font-bold text-xs">
                        Status: <strong>{p.incubationStatus || 'Selected'}</strong> {isFunded ? '💰' : '🌟'}
                      </span>

                      <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-xs">
                        Faculty Score: {p.score}% (Grade {p.grade})
                      </span>
                    </div>

                    {/* Congratulatory Project Title */}
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      <span>🎉 Congratulations! Selected Project: &quot;{p.title}&quot;</span>
                    </h2>

                    {/* Explanatory Description */}
                    <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium">
                      🌟 You are a genius! Your repository project <strong>&quot;{p.title}&quot;</strong> has achieved top faculty marks and has been officially selected by the College Administration for the <strong>SRMS Venture Incubation Cell & Corporate Commercialization Pipeline</strong>.
                    </p>

                    {/* Seed Funding / Mentor Tagline / Notes */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {(p.fundingAmount || 0) > 0 && (
                        <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black flex items-center gap-1.5">
                          <span>💰 Seed Grant Approved:</span>
                          <span className="text-amber-200">₹{Number(p.fundingAmount).toLocaleString('en-IN')}</span>
                        </span>
                      )}

                      {p.mentorAssigned && (
                        <span className="px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium">
                          👨‍🏫 <strong>Venture Mentor:</strong> {p.mentorAssigned}
                        </span>
                      )}

                      {p.incubationNotes ? (
                        <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white/90 italic text-[11px]">
                          &quot;{p.incubationNotes}&quot;
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white/90 italic text-[11px]">
                          &quot;Nominated directly from Academic Repository by College Administrator for Venture Incubation & Company Placement&quot;
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    <Link
                      href="/dashboard/student/repository"
                      className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs shadow-lg transition-all text-center flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
                    >
                      <FolderGit2 className="w-4 h-4 text-[#5B4BFF]" />
                      <span>View Project 📂</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
