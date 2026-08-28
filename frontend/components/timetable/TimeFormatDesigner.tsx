'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface TimeSlotConfig {
  id: string;
  start: string; // '08:30:00' or '08:30'
  end: string;   // '09:30:00' or '09:30'
  label: string; // '08.30-09.30'
  name?: string; // 'Period 1', 'Web Tech Lab', 'Tea Break', 'Lunch Break'
  isBreak?: boolean;
  labelBreak?: string; // 'TEA BREAK', 'LUNCH BREAK'
  type?: 'Lecture' | 'Practical' | 'Tutorial' | 'Tea Break' | 'Lunch Break' | 'Recess' | 'Seminar';
  color?: string;
}

interface TimeFormatDesignerProps {
  initialSlots?: TimeSlotConfig[];
  selectedCollege?: string;
  selectedCourse?: string;
  selectedDept?: string;
  selectedBatch?: string;
  collegeName?: string;
  courseName?: string;
  deptName?: string;
  onSaveTimeFormat: (slots: TimeSlotConfig[]) => void;
  onSwitchToDesignTab?: () => void;
}

// Convert "HH:MM:SS" or "HH:MM" to total minutes from 00:00
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
}

// Convert minutes to "HH:MM:00"
export function minutesToTimeStr(mins: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(mins)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

// Format "HH:MM:00" to readable "08.30-09.30" or "08:30 AM"
export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}.${pad(m)}`;
}

export function formatTimeRange(startStr: string, endStr: string): string {
  return `${formatTimeDisplay(startStr)}-${formatTimeDisplay(endStr)}`;
}

export function formatDuration(startStr: string, endStr: string): string {
  const diff = timeToMinutes(endStr) - timeToMinutes(startStr);
  if (diff <= 0) return '0 min';
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${mins} mins`;
}

const PRESET_TEMPLATES: { name: string; description: string; slots: TimeSlotConfig[] }[] = [
  {
    name: 'SRMS BCA Standard (60m Periods + Tea & Lunch Break)',
    description: 'Standard 7 lecture periods of 60 mins each, 20-min Tea Break at 10:30, 60-min Lunch Break at 13:50.',
    slots: [
      { id: 'p1', start: '08:30:00', end: '09:30:00', label: '08.30-09.30', name: 'Period 1 (Lecture)', type: 'Lecture' },
      { id: 'p2', start: '09:30:00', end: '10:30:00', label: '09.30-10.30', name: 'Period 2 (Lecture)', type: 'Lecture' },
      { id: 'tb', start: '10:30:00', end: '10:50:00', label: '10.30-10.50', name: 'Tea Break', isBreak: true, labelBreak: 'TEA BREAK', type: 'Tea Break' },
      { id: 'p3', start: '10:50:00', end: '11:50:00', label: '10.50-11.50', name: 'Period 3 (Lecture)', type: 'Lecture' },
      { id: 'p4', start: '11:50:00', end: '12:50:00', label: '11.50-12.50', name: 'Period 4 (Lecture)', type: 'Lecture' },
      { id: 'p5', start: '12:50:00', end: '13:50:00', label: '12.50-01.50', name: 'Period 5 (Lecture)', type: 'Lecture' },
      { id: 'lb', start: '13:50:00', end: '14:50:00', label: '01.50-02.50', name: 'Lunch Break', isBreak: true, labelBreak: 'LUNCH BREAK', type: 'Lunch Break' },
      { id: 'p6', start: '14:50:00', end: '15:50:00', label: '02.50-03.50', name: 'Period 6 (Lecture)', type: 'Lecture' },
      { id: 'p7', start: '15:50:00', end: '16:50:00', label: '03.50-04.50', name: 'Period 7 (Lecture)', type: 'Lecture' },
    ],
  },
  {
    name: 'Variable Dynamic Duration (90m Labs & 60m Lectures)',
    description: 'Dynamic lecture durations: 60m morning, 90m Lab block (10:30 to 12:00), Tea & Lunch breaks.',
    slots: [
      { id: 'p1', start: '08:30:00', end: '09:30:00', label: '08.30-09.30', name: 'Period 1 (Theory)', type: 'Lecture' },
      { id: 'p2', start: '09:30:00', end: '10:30:00', label: '09.30-10.30', name: 'Period 2 (Theory)', type: 'Lecture' },
      { id: 'p3_lab', start: '10:30:00', end: '12:00:00', label: '10.30-12.00', name: 'Lab / Practical Session (90m)', type: 'Practical' },
      { id: 'tb', start: '12:00:00', end: '12:20:00', label: '12.00-12.20', name: 'Tea Break', isBreak: true, labelBreak: 'TEA BREAK', type: 'Tea Break' },
      { id: 'p4', start: '12:20:00', end: '13:20:00', label: '12.20-01.20', name: 'Period 3 (Tutorial)', type: 'Tutorial' },
      { id: 'lb', start: '13:20:00', end: '14:20:00', label: '01.20-02.20', name: 'Lunch Break', isBreak: true, labelBreak: 'LUNCH BREAK', type: 'Lunch Break' },
      { id: 'p5_lab', start: '14:20:00', end: '16:20:00', label: '02.20-04.20', name: 'Afternoon Workshop (120m)', type: 'Practical' },
    ],
  },
  {
    name: 'Medical / MBBS Schedule (Clinical Postings & Theory)',
    description: 'MBBS format with Clinical Postings (09:00 - 12:00) and afternoon Lecture/DOAP sessions.',
    slots: [
      { id: 'med_1', start: '08:00:00', end: '09:00:00', label: '08.00-09.00', name: 'Foundation Lecture', type: 'Lecture' },
      { id: 'med_cp', start: '09:00:00', end: '12:00:00', label: '09.00-12.00', name: 'Clinical Posting / Hospital Ward (180m)', type: 'Practical' },
      { id: 'med_tea', start: '12:00:00', end: '12:30:00', label: '12.00-12.30', name: 'Tea / Refreshment', isBreak: true, labelBreak: 'TEA BREAK', type: 'Tea Break' },
      { id: 'med_sgt', start: '12:30:00', end: '13:30:00', label: '12.30-01.30', name: 'Small Group Teaching (SGT)', type: 'Tutorial' },
      { id: 'med_lunch', start: '13:30:00', end: '14:30:00', label: '01.30-02.30', name: 'Lunch Break', isBreak: true, labelBreak: 'LUNCH BREAK', type: 'Lunch Break' },
      { id: 'med_doap', start: '14:30:00', end: '16:30:00', label: '02.30-04.30', name: 'DOAP / Practical Lab (120m)', type: 'Practical' },
    ],
  },
  {
    name: 'Fast-Track 50-Minute Periods',
    description: 'High-density 50-minute periods with staggered breaks.',
    slots: [
      { id: 'ft1', start: '08:30:00', end: '09:20:00', label: '08.30-09.20', name: 'Period 1', type: 'Lecture' },
      { id: 'ft2', start: '09:20:00', end: '10:10:00', label: '09.20-10.10', name: 'Period 2', type: 'Lecture' },
      { id: 'ft3', start: '10:10:00', end: '11:00:00', label: '10.10-11.00', name: 'Period 3', type: 'Lecture' },
      { id: 'ft_tea', start: '11:00:00', end: '11:20:00', label: '11.00-11.20', name: 'Tea Break', isBreak: true, labelBreak: 'TEA BREAK', type: 'Tea Break' },
      { id: 'ft4', start: '11:20:00', end: '12:10:00', label: '11.20-12.10', name: 'Period 4', type: 'Lecture' },
      { id: 'ft5', start: '12:10:00', end: '13:00:00', label: '12.10-01.00', name: 'Period 5', type: 'Lecture' },
      { id: 'ft_lunch', start: '13:00:00', end: '14:00:00', label: '01.00-02.00', name: 'Lunch Break', isBreak: true, labelBreak: 'LUNCH BREAK', type: 'Lunch Break' },
      { id: 'ft6', start: '14:00:00', end: '14:50:00', label: '02.00-02.50', name: 'Period 6', type: 'Lecture' },
      { id: 'ft7', start: '14:50:00', end: '15:40:00', label: '02.50-03.40', name: 'Period 7', type: 'Lecture' },
    ],
  },
];

export default function TimeFormatDesigner({
  initialSlots,
  selectedCollege = '1',
  selectedCourse = '13',
  selectedDept = '',
  selectedBatch = '2',
  collegeName = 'SRMS CET, BAREILLY',
  courseName = 'BCA',
  deptName = 'BCA DEPARTMENT',
  onSaveTimeFormat,
  onSwitchToDesignTab,
}: TimeFormatDesignerProps) {
  // Day Start and End Bounds
  const [dayStartTime, setDayStartTime] = useState<string>('08:30');
  const [dayEndTime, setDayEndTime] = useState<string>('17:00');

  // Slots List
  const [configuredSlots, setConfiguredSlots] = useState<TimeSlotConfig[]>(() => {
    if (initialSlots && initialSlots.length > 0) return initialSlots;
    return PRESET_TEMPLATES[0].slots;
  });

  // Active Selected / Editing Slot
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Quick Break Settings State
  const [teaBreakStart, setTeaBreakStart] = useState<string>('10:30');
  const [teaBreakEnd, setTeaBreakEnd] = useState<string>('10:50');
  const [lunchBreakStart, setLunchBreakStart] = useState<string>('13:50');
  const [lunchBreakEnd, setLunchBreakEnd] = useState<string>('14:50');

  // Interactive Timeline Mouse Drag State
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [dragStartMins, setDragStartMins] = useState<number | null>(null);
  const [dragCurrentMins, setDragCurrentMins] = useState<number | null>(null);

  // Dragging / Resizing an existing slot
  const [activeResizing, setActiveResizing] = useState<{
    slotId: string;
    edge: 'start' | 'end' | 'move';
    initialMouseX: number;
    initialStartMins: number;
    initialEndMins: number;
  } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Day Range in Minutes
  const dayStartMins = useMemo(() => timeToMinutes(dayStartTime), [dayStartTime]);
  const dayEndMins = useMemo(() => timeToMinutes(dayEndTime), [dayEndTime]);
  const dayTotalMins = useMemo(() => Math.max(60, dayEndMins - dayStartMins), [dayStartMins, dayEndMins]);

  // Load Saved Time Format for active College + Course + Dept from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `srms_time_format_${selectedCollege}_${selectedCourse}_${selectedDept || 'all'}`;
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('srms_time_format_default');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConfiguredSlots(parsed);
            // Update day start and end based on slots
            const firstSlot = parsed[0];
            const lastSlot = parsed[parsed.length - 1];
            if (firstSlot?.start) setDayStartTime(firstSlot.start.slice(0, 5));
            if (lastSlot?.end) setDayEndTime(lastSlot.end.slice(0, 5));

            const tea = parsed.find(s => s.isBreak && s.type === 'Tea Break');
            if (tea) {
              setTeaBreakStart(tea.start.slice(0, 5));
              setTeaBreakEnd(tea.end.slice(0, 5));
            }
            const lunch = parsed.find(s => s.isBreak && s.type === 'Lunch Break');
            if (lunch) {
              setLunchBreakStart(lunch.start.slice(0, 5));
              setLunchBreakEnd(lunch.end.slice(0, 5));
            }
          }
        } catch (e) {
          console.warn('Failed to parse saved time format', e);
        }
      }
    }
  }, [selectedCollege, selectedCourse, selectedDept]);

  // Sort slots by start time
  const sortedSlots = useMemo(() => {
    return [...configuredSlots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }, [configuredSlots]);

  // Total teaching minutes vs break minutes
  const stats = useMemo(() => {
    let lectureMins = 0;
    let breakMins = 0;
    let lectureCount = 0;
    let breakCount = 0;

    sortedSlots.forEach(s => {
      const duration = Math.max(0, timeToMinutes(s.end) - timeToMinutes(s.start));
      if (s.isBreak) {
        breakMins += duration;
        breakCount++;
      } else {
        lectureMins += duration;
        lectureCount++;
      }
    });

    return { lectureMins, breakMins, lectureCount, breakCount };
  }, [sortedSlots]);

  // Helper: Snap minutes to 5-minute intervals
  const snapMinutes = (mins: number, snap = 5): number => {
    return Math.round(mins / snap) * snap;
  };

  // Convert clientX to minutes within the day timeline
  const getMinutesFromClientX = (clientX: number): number => {
    if (!timelineRef.current) return dayStartMins;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const mins = dayStartMins + ratio * dayTotalMins;
    return snapMinutes(mins, 5);
  };

  // ==========================================
  // Mouse Drag Events for Creating New Slot
  // ==========================================
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle if clicked directly on the track
    if (activeResizing) return;
    if ((e.target as HTMLElement).closest('.slot-card-interactive')) return;

    const clickMins = getMinutesFromClientX(e.clientX);
    setIsDraggingNew(true);
    setDragStartMins(clickMins);
    setDragCurrentMins(clickMins + 60); // Default 1 hr initial hover
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingNew && dragStartMins !== null) {
        const current = getMinutesFromClientX(e.clientX);
        setDragCurrentMins(current);
      }

      if (activeResizing && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const deltaX = e.clientX - activeResizing.initialMouseX;
        const deltaMins = snapMinutes((deltaX / rect.width) * dayTotalMins, 5);

        setConfiguredSlots(prev => prev.map(s => {
          if (s.id !== activeResizing.slotId) return s;

          let newStartMins = activeResizing.initialStartMins;
          let newEndMins = activeResizing.initialEndMins;

          if (activeResizing.edge === 'start') {
            newStartMins = Math.min(activeResizing.initialEndMins - 15, Math.max(dayStartMins, activeResizing.initialStartMins + deltaMins));
          } else if (activeResizing.edge === 'end') {
            newEndMins = Math.max(activeResizing.initialStartMins + 15, Math.min(dayEndMins, activeResizing.initialEndMins + deltaMins));
          } else if (activeResizing.edge === 'move') {
            const duration = activeResizing.initialEndMins - activeResizing.initialStartMins;
            newStartMins = Math.max(dayStartMins, Math.min(dayEndMins - duration, activeResizing.initialStartMins + deltaMins));
            newEndMins = newStartMins + duration;
          }

          const startStr = minutesToTimeStr(newStartMins);
          const endStr = minutesToTimeStr(newEndMins);
          return {
            ...s,
            start: startStr,
            end: endStr,
            label: formatTimeRange(startStr, endStr),
          };
        }));
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingNew && dragStartMins !== null && dragCurrentMins !== null) {
        const start = Math.min(dragStartMins, dragCurrentMins);
        const end = Math.max(dragStartMins, dragCurrentMins);
        const duration = end - start;

        if (duration >= 15) {
          const startStr = minutesToTimeStr(start);
          const endStr = minutesToTimeStr(end);
          const newSlot: TimeSlotConfig = {
            id: `custom_slot_${Date.now()}`,
            start: startStr,
            end: endStr,
            label: formatTimeRange(startStr, endStr),
            name: `Period ${sortedSlots.filter(s => !s.isBreak).length + 1} (${duration >= 90 ? 'Extended/Lab' : 'Lecture'})`,
            type: duration >= 90 ? 'Practical' : 'Lecture',
          };

          setConfiguredSlots(prev => [...prev, newSlot].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
          setSelectedSlotId(newSlot.id);
          showToast('success', `Created slot: ${formatTimeDisplay(startStr)} - ${formatTimeDisplay(endStr)} (${formatDuration(startStr, endStr)})`);
        }
        setIsDraggingNew(false);
        setDragStartMins(null);
        setDragCurrentMins(null);
      }

      if (activeResizing) {
        setActiveResizing(null);
        showToast('info', 'Slot updated dynamically.');
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingNew, dragStartMins, dragCurrentMins, activeResizing, dayStartMins, dayEndMins, dayTotalMins, sortedSlots]);

  // Start edge resize
  const handleEdgeDragStart = (e: React.MouseEvent, slotId: string, edge: 'start' | 'end' | 'move') => {
    e.stopPropagation();
    const slot = configuredSlots.find(s => s.id === slotId);
    if (!slot) return;

    setActiveResizing({
      slotId,
      edge,
      initialMouseX: e.clientX,
      initialStartMins: timeToMinutes(slot.start),
      initialEndMins: timeToMinutes(slot.end),
    });
  };

  // Add / Insert New Slot manually
  const handleAddSlot = (type: 'Lecture' | 'Practical' | 'Tutorial' | 'Tea Break' | 'Lunch Break') => {
    // Find next available gap or append after last slot
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    let startMins = lastSlot ? timeToMinutes(lastSlot.end) : dayStartMins;
    let duration = type === 'Tea Break' ? 20 : (type === 'Practical' ? 90 : 60);

    if (startMins + duration > dayEndMins) {
      startMins = dayStartMins;
    }
    const endMins = Math.min(dayEndMins, startMins + duration);

    const isBreak = type === 'Tea Break' || type === 'Lunch Break';
    const startStr = minutesToTimeStr(startMins);
    const endStr = minutesToTimeStr(endMins);

    const newSlot: TimeSlotConfig = {
      id: `slot_${Date.now()}`,
      start: startStr,
      end: endStr,
      label: formatTimeRange(startStr, endStr),
      name: isBreak ? (type === 'Tea Break' ? 'Tea Break' : 'Lunch Break') : `Period ${sortedSlots.filter(s => !s.isBreak).length + 1}`,
      isBreak,
      labelBreak: isBreak ? (type === 'Tea Break' ? 'TEA BREAK' : 'LUNCH BREAK') : undefined,
      type,
    };

    setConfiguredSlots(prev => [...prev, newSlot].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    setSelectedSlotId(newSlot.id);
    showToast('success', `Added ${newSlot.name} (${formatTimeDisplay(startStr)} - ${formatTimeDisplay(endStr)})`);
  };

  // Update specific field of a slot
  const handleUpdateSlotField = (id: string, updates: Partial<TimeSlotConfig>) => {
    setConfiguredSlots(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      if (updates.start || updates.end) {
        updated.label = formatTimeRange(updated.start, updated.end);
      }
      return updated;
    }).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
  };

  // Delete a slot
  const handleDeleteSlot = (id: string) => {
    setConfiguredSlots(prev => prev.filter(s => s.id !== id));
    if (selectedSlotId === id) setSelectedSlotId(null);
    showToast('info', 'Slot removed from time format.');
  };

  // Apply a Preset Template
  const handleApplyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setConfiguredSlots(preset.slots);
    if (preset.slots.length > 0) {
      setDayStartTime(preset.slots[0].start.slice(0, 5));
      setDayEndTime(preset.slots[preset.slots.length - 1].end.slice(0, 5));
    }
    showToast('success', `Applied preset: "${preset.name}"`);
  };

  // Save Config & Persist
  const handleSaveAndApply = () => {
    if (configuredSlots.length === 0) {
      showToast('error', 'Please configure at least one time slot before saving.');
      return;
    }

    if (typeof window !== 'undefined') {
      const storageKey = `srms_time_format_${selectedCollege}_${selectedCourse}_${selectedDept || 'all'}`;
      localStorage.setItem(storageKey, JSON.stringify(sortedSlots));
      localStorage.setItem('srms_time_format_default', JSON.stringify(sortedSlots));
    }

    onSaveTimeFormat(sortedSlots);
    showToast('success', 'Time Format saved! Timetable Grid is now synchronized with this structure.');

    if (onSwitchToDesignTab) {
      setTimeout(() => {
        onSwitchToDesignTab();
      }, 600);
    }
  };

  // Quick Apply Breaks directly
  const handleApplyQuickBreaks = () => {
    const teaSlot: TimeSlotConfig = {
      id: 'tea_break_config',
      start: `${teaBreakStart}:00`,
      end: `${teaBreakEnd}:00`,
      label: formatTimeRange(`${teaBreakStart}:00`, `${teaBreakEnd}:00`),
      name: 'Tea Break',
      isBreak: true,
      labelBreak: 'TEA BREAK',
      type: 'Tea Break',
    };

    const lunchSlot: TimeSlotConfig = {
      id: 'lunch_break_config',
      start: `${lunchBreakStart}:00`,
      end: `${lunchBreakEnd}:00`,
      label: formatTimeRange(`${lunchBreakStart}:00`, `${lunchBreakEnd}:00`),
      name: 'Lunch Break',
      isBreak: true,
      labelBreak: 'LUNCH BREAK',
      type: 'Lunch Break',
    };

    // Filter existing breaks and add updated breaks
    setConfiguredSlots(prev => {
      const nonBreaks = prev.filter(s => !s.isBreak);
      return [...nonBreaks, teaSlot, lunchSlot].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    });

    showToast('success', 'Updated Tea & Lunch Breaks on timeline.');
  };

  // Auto-fill timeline gaps with lectures
  const handleFillGaps = () => {
    const filled: TimeSlotConfig[] = [];
    let currentCursor = dayStartMins;

    sortedSlots.forEach((slot, idx) => {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);

      if (slotStart > currentCursor + 10) {
        // There is a gap
        const gapDuration = slotStart - currentCursor;
        filled.push({
          id: `gap_fill_${idx}_${Date.now()}`,
          start: minutesToTimeStr(currentCursor),
          end: minutesToTimeStr(slotStart),
          label: formatTimeRange(minutesToTimeStr(currentCursor), minutesToTimeStr(slotStart)),
          name: `Period ${filled.filter(s => !s.isBreak).length + 1} (${gapDuration}m)`,
          type: gapDuration >= 90 ? 'Practical' : 'Lecture',
        });
      }
      filled.push(slot);
      currentCursor = Math.max(currentCursor, slotEnd);
    });

    if (currentCursor < dayEndMins - 15) {
      const gapDuration = dayEndMins - currentCursor;
      filled.push({
        id: `gap_fill_end_${Date.now()}`,
        start: minutesToTimeStr(currentCursor),
        end: minutesToTimeStr(dayEndMins),
        label: formatTimeRange(minutesToTimeStr(currentCursor), minutesToTimeStr(dayEndMins)),
        name: `Period ${filled.filter(s => !s.isBreak).length + 1} (${gapDuration}m)`,
        type: 'Lecture',
      });
    }

    setConfiguredSlots(filled.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)));
    showToast('success', 'Auto-filled unallocated timeline gaps with lecture slots.');
  };

  // Timeline Hour Ruler Markers
  const rulerTicks = useMemo(() => {
    const ticks: { mins: number; label: string; leftPercent: number }[] = [];
    const firstHour = Math.floor(dayStartMins / 60) * 60;
    const lastHour = Math.ceil(dayEndMins / 60) * 60;

    for (let m = firstHour; m <= lastHour; m += 30) {
      if (m >= dayStartMins && m <= dayEndMins) {
        const leftPercent = ((m - dayStartMins) / dayTotalMins) * 100;
        const h = Math.floor(m / 60);
        const minsPart = m % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        const label = `${displayH}:${String(minsPart).padStart(2, '0')} ${ampm}`;
        ticks.push({ mins: m, label, leftPercent });
      }
    }
    return ticks;
  }, [dayStartMins, dayEndMins, dayTotalMins]);

  // Color generator based on slot type
  const getSlotColor = (slot: TimeSlotConfig) => {
    if (slot.isBreak) {
      return slot.type === 'Tea Break'
        ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200'
        : 'bg-emerald-500/20 border-emerald-500 text-emerald-900 dark:text-emerald-200';
    }
    if (slot.type === 'Practical') {
      return 'bg-purple-500/20 border-purple-500 text-purple-900 dark:text-purple-200';
    }
    if (slot.type === 'Tutorial') {
      return 'bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-cyan-200';
    }
    return 'bg-[#5B4BFF]/20 border-[#5B4BFF] text-indigo-900 dark:text-indigo-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-extrabold transition-all shadow-lg animate-fade-in flex items-center justify-between gap-3 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
            : notification.type === 'info'
            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30'
            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✅' : notification.type === 'info' ? 'ℹ️' : '⚠️'}</span>
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Card: Context & Overall Schedule Times */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B4BFF] uppercase tracking-wider mb-1">
              <span>⏱️ Academic Structure</span>
              <span>•</span>
              <span>{collegeName}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Course & Department Time Format Designer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure daily operating hours, custom variable lecture lengths (e.g. 60m, 90m, 120m), tea breaks, and lunch recess. Click & drag on the interactive timeline below to customize period blocks!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleFillGaps}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-all flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
              title="Auto-fill unallocated time gaps with lecture slots"
            >
              <span>⚡</span>
              <span>Auto-Fill Gaps</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-[#7867FF] hover:from-[#4939E6] hover:to-[#6756EC] text-white font-extrabold text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>💾</span>
              <span>Save & Apply to Timetable</span>
            </button>
          </div>
        </div>

        {/* Global Schedule Boundary Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              🌅 Day Start Time
            </label>
            <input
              type="time"
              value={dayStartTime}
              onChange={(e) => setDayStartTime(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-black text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              🌇 Day End Time
            </label>
            <input
              type="time"
              value={dayEndTime}
              onChange={(e) => setDayEndTime(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-black text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              📊 Total Academic Duration
            </label>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 font-black text-xs text-[#5B4BFF] flex items-center justify-between">
              <span>{Math.floor(dayTotalMins / 60)} hrs {dayTotalMins % 60} mins</span>
              <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                {dayTotalMins}m
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              📚 Teaching vs Breaks
            </label>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-between">
              <span className="text-indigo-600 dark:text-indigo-400">{stats.lectureCount} Lectures ({Math.floor(stats.lectureMins / 60)}h {stats.lectureMins % 60}m)</span>
              <span className="text-amber-600 dark:text-amber-400">{stats.breakCount} Breaks ({stats.breakMins}m)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Library Quick Buttons */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            🎯 Load Standard Format Presets:
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_TEMPLATES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-3 text-left rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-[#5B4BFF] transition-all group active:scale-[0.98]"
            >
              <div className="font-black text-xs text-slate-900 dark:text-white group-hover:text-[#5B4BFF] transition-colors">
                {preset.name}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Break Configuration Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span>☕</span>
          <span>Break Configuration (Tea & Lunch Recess)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
              🍵 Tea Break Start
            </label>
            <input
              type="time"
              value={teaBreakStart}
              onChange={(e) => setTeaBreakStart(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1">
              🍵 Tea Break End
            </label>
            <input
              type="time"
              value={teaBreakEnd}
              onChange={(e) => setTeaBreakEnd(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              🍱 Lunch Break Start
            </label>
            <input
              type="time"
              value={lunchBreakStart}
              onChange={(e) => setLunchBreakStart(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              🍱 Lunch Break End
            </label>
            <input
              type="time"
              value={lunchBreakEnd}
              onChange={(e) => setLunchBreakEnd(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-bold"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyQuickBreaks}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>✨</span>
            <span>Update Breaks</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Interactive Drag Left-to-Right Visual Timeline Ribbon & Slot Resizer */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] border-2 border-indigo-200 dark:border-indigo-900/60 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🖱️</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Interactive Visual Timeline Ribbon
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <strong>Drag left to right</strong> across any empty space to create a lecture/lab slot spanning that exact time (e.g. 10:30 to 12:00). <strong>Drag the left/right handles</strong> on any card to resize duration!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddSlot('Lecture')}
              className="px-3 py-1.5 bg-[#5B4BFF] hover:bg-[#4939E6] text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <span>➕</span>
              <span>Add Lecture (60m)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddSlot('Practical')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <span>🔬</span>
              <span>Add Lab Block (90m)</span>
            </button>
          </div>
        </div>

        {/* Timeline Ruler Header */}
        <div className="relative w-full h-7 select-none border-b border-slate-300 dark:border-slate-700">
          {rulerTicks.map((tick, i) => (
            <div
              key={i}
              className="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
              style={{ left: `${tick.leftPercent}%` }}
            >
              <span className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400">
                {tick.label}
              </span>
              <div className="w-0.5 h-1.5 bg-slate-300 dark:bg-slate-700 mt-0.5" />
            </div>
          ))}
        </div>

        {/* Timeline Track Ribbon Container */}
        <div
          ref={timelineRef}
          onMouseDown={handleTimelineMouseDown}
          className="relative w-full h-36 bg-slate-100 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden cursor-crosshair select-none p-1.5 shadow-inner"
        >
          {/* Subtle Grid Lines at every hour */}
          {rulerTicks.map((tick, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800/80 pointer-events-none"
              style={{ left: `${tick.leftPercent}%` }}
            />
          ))}

          {/* New Slot Drag Selection Box */}
          {isDraggingNew && dragStartMins !== null && dragCurrentMins !== null && (
            <div
              className="absolute top-2 bottom-2 rounded-xl bg-indigo-500/40 border-2 border-[#5B4BFF] z-30 pointer-events-none flex flex-col items-center justify-center text-white shadow-lg animate-pulse"
              style={{
                left: `${((Math.min(dragStartMins, dragCurrentMins) - dayStartMins) / dayTotalMins) * 100}%`,
                width: `${(Math.abs(dragCurrentMins - dragStartMins) / dayTotalMins) * 100}%`,
              }}
            >
              <span className="font-extrabold text-xs drop-shadow bg-[#5B4BFF] px-2 py-0.5 rounded-md">
                {formatTimeDisplay(minutesToTimeStr(Math.min(dragStartMins, dragCurrentMins)))} - {formatTimeDisplay(minutesToTimeStr(Math.max(dragStartMins, dragCurrentMins)))}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100">
                ({formatDuration(minutesToTimeStr(Math.min(dragStartMins, dragCurrentMins)), minutesToTimeStr(Math.max(dragStartMins, dragCurrentMins)))})
              </span>
            </div>
          )}

          {/* Render Configured Slot Blocks on the Timeline */}
          {sortedSlots.map((slot) => {
            const startMins = timeToMinutes(slot.start);
            const endMins = timeToMinutes(slot.end);
            const leftPercent = Math.max(0, ((startMins - dayStartMins) / dayTotalMins) * 100);
            const widthPercent = Math.max(1, ((endMins - startMins) / dayTotalMins) * 100);
            const isSelected = selectedSlotId === slot.id;

            return (
              <div
                key={slot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSlotId(slot.id);
                }}
                className={`slot-card-interactive absolute top-2 bottom-2 rounded-xl border-2 shadow-sm transition-all flex flex-col justify-between p-2 cursor-grab active:cursor-grabbing group select-none ${getSlotColor(slot)} ${
                  isSelected ? 'ring-4 ring-[#5B4BFF] z-20 shadow-md scale-[1.01]' : 'hover:brightness-95 z-10'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                {/* Left Resize Handle */}
                <div
                  onMouseDown={(e) => handleEdgeDragStart(e, slot.id, 'start')}
                  className="absolute left-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-slate-400/40 hover:bg-[#5B4BFF] cursor-ew-resize rounded-l-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-30"
                  title="Drag left/right to adjust start time"
                >
                  <div className="w-0.5 h-4 bg-white rounded-full" />
                </div>

                {/* Card Content */}
                <div className="flex items-start justify-between gap-1 overflow-hidden pointer-events-none">
                  <div className="truncate">
                    <div className="font-extrabold text-[11px] leading-tight truncate">
                      {slot.name || slot.label}
                    </div>
                    <div className="text-[10px] font-mono font-bold opacity-80 truncate">
                      {slot.label}
                    </div>
                  </div>
                  <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/40 shrink-0">
                    {formatDuration(slot.start, slot.end)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider opacity-75 pointer-events-none">
                  <span>{slot.type || 'Lecture'}</span>
                  <span>{slot.isBreak ? '☕ Break' : '📚 Session'}</span>
                </div>

                {/* Right Resize Handle */}
                <div
                  onMouseDown={(e) => handleEdgeDragStart(e, slot.id, 'end')}
                  className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-3.5 bg-slate-400/40 hover:bg-[#5B4BFF] cursor-ew-resize rounded-r-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-30"
                  title="Drag left/right to adjust end time"
                >
                  <div className="w-0.5 h-4 bg-white rounded-full" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#5B4BFF]" /> Theory Lecture</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Lab / Practical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Tea Break</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Lunch Break</span>
          </div>
          <span>Total {configuredSlots.length} Periods & Breaks</span>
        </div>
      </div>

      {/* Slots List & Property Editor Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[22px] border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span>
              <span>Configured Periods & Breaks List</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and fine-tune start and end times, labels, and types for every period.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddSlot('Tea Break')}
              className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl font-bold text-xs hover:bg-amber-200 transition-all flex items-center gap-1"
            >
              <span>🍵</span>
              <span>Add Tea Break</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddSlot('Lunch Break')}
              className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-all flex items-center gap-1"
            >
              <span>🍱</span>
              <span>Add Lunch Break</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 rounded-l-xl">Order</th>
                <th className="p-3">Period / Slot Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Start Time</th>
                <th className="p-3">End Time</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Grid Column Label</th>
                <th className="p-3 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {sortedSlots.map((slot, idx) => {
                const isSelected = selectedSlotId === slot.id;
                return (
                  <tr
                    key={slot.id}
                    className={`transition-colors ${isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={slot.name || ''}
                        onChange={(e) => handleUpdateSlotField(slot.id, { name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white"
                        placeholder="e.g. Period 1 / Lab Session"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={slot.type || (slot.isBreak ? 'Tea Break' : 'Lecture')}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const isBreak = val === 'Tea Break' || val === 'Lunch Break' || val === 'Recess';
                          handleUpdateSlotField(slot.id, {
                            type: val,
                            isBreak,
                            labelBreak: isBreak ? (val === 'Tea Break' ? 'TEA BREAK' : 'LUNCH BREAK') : undefined,
                          });
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="Lecture">Lecture (Theory)</option>
                        <option value="Practical">Practical / Lab Block</option>
                        <option value="Tutorial">Tutorial / SGT</option>
                        <option value="Seminar">Seminar / Presentation</option>
                        <option value="Tea Break">Tea Break (Column Break)</option>
                        <option value="Lunch Break">Lunch Break (Column Break)</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="time"
                        value={slot.start.slice(0, 5)}
                        onChange={(e) => handleUpdateSlotField(slot.id, { start: `${e.target.value}:00` })}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="time"
                        value={slot.end.slice(0, 5)}
                        onChange={(e) => handleUpdateSlotField(slot.id, { end: `${e.target.value}:00` })}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-[#5B4BFF]">
                      {formatDuration(slot.start, slot.end)}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {slot.label}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors font-bold text-xs"
                        title="Delete slot"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
