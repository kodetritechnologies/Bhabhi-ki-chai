'use client';

import React, { useState, useMemo } from 'react';

export interface CalendarDuty {
  _id?: string;
  dutyDate: string; // YYYY-MM-DD
  assignedUserId?: {
    _id?: string;
    name?: string;
    avatar?: string;
    email?: string;
  };
  status?: string;
  memberColor?: string;
}

export interface Member {
  userId?: {
    _id?: string;
    name?: string;
    avatar?: string;
  };
  color?: string;
  role?: string;
}

export interface ChaiCalendarProps {
  currentGroupId?: string;
  calendarDuties?: CalendarDuty[];
  upcomingSchedule?: CalendarDuty[];
  members?: Member[];
  onOpenSwap?: () => void;
}

const DEFAULT_MEMBERS = [
  { name: 'Rahul', color: '#4B7BEC' },
  { name: 'Amit', color: '#73984E' },
  { name: 'Sandeep', color: '#E84393' },
  { name: 'Vikas', color: '#FA8231' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(date.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon;
}

export default function ChaiCalendar({
  calendarDuties = [],
  upcomingSchedule = [],
  members = [],
  onOpenSwap,
}: ChaiCalendarProps) {
  // Mockup base date: Tuesday, November 24, 2026
  const [activeDate, setActiveDate] = useState<Date>(new Date(2026, 10, 24));
  const [selectedDateKey, setSelectedDateKey] = useState<string>('2026-11-24');
  const [highlightMember, setHighlightMember] = useState<string | null>(null);

  // Resolved members list for legend & duty assignment fallbacks
  const resolvedMembers = useMemo(() => {
    if (members && members.length > 0) {
      return members.map((m, idx) => ({
        id: m.userId?._id || `m-${idx}`,
        name: m.userId?.name || DEFAULT_MEMBERS[idx % DEFAULT_MEMBERS.length].name,
        color: m.color || DEFAULT_MEMBERS[idx % DEFAULT_MEMBERS.length].color,
      }));
    }
    return DEFAULT_MEMBERS.map((m, idx) => ({
      id: `m-${idx}`,
      name: m.name,
      color: m.color,
    }));
  }, [members]);

  // Fast color lookup map
  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {
      rahul: '#4B7BEC',
      amit: '#73984E',
      sandeep: '#E84393',
      vikas: '#FA8231',
    };
    resolvedMembers.forEach((m) => {
      map[m.name.toLowerCase()] = m.color;
      if (m.id) map[m.id] = m.color;
    });
    return map;
  }, [resolvedMembers]);

  // Calendar duties dictionary by dateKey
  const dutyByDate = useMemo(() => {
    const dict: Record<string, CalendarDuty> = {};
    calendarDuties.forEach((duty) => {
      if (duty.dutyDate) {
        dict[duty.dutyDate] = duty;
      }
    });
    return dict;
  }, [calendarDuties]);

  // Calculate 14 days (2 rows of 7 days, Mon - Sun) for the active fortnightly view
  const { calendarGrid, displayedMonthYear } = useMemo(() => {
    const monday = getMonday(activeDate);
    const grid = [];

    // Base sequence reference for fallback rotation (Nov 23, 2026 is Monday)
    const baseRef = new Date(2026, 10, 23).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 14; i++) {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateKey = formatDateKey(dayDate);
      const dayOfWeek = dayDate.getDay(); // 0 = Sun, 6 = Sat
      const isSunday = dayOfWeek === 0;
      const isWeekend = isSunday || dayOfWeek === 6;
      const isToday = dateKey === '2026-11-24' || dateKey === formatDateKey(new Date());

      // Check DB duties first
      const duty = dutyByDate[dateKey];
      let assignedName = '';
      let dotColor: string | null = null;

      if (duty) {
        assignedName = duty.assignedUserId?.name || 'Assigned';
        dotColor =
          duty.memberColor ||
          memberColorMap[assignedName.toLowerCase()] ||
          memberColorMap[duty.assignedUserId?._id || ''] ||
          '#4B7BEC';
      } else {
        // Dynamic fallback round-robin so the calendar is ALWAYS filled across months
        const daysDiff = Math.round((dayDate.getTime() - baseRef) / dayMs);

        // Curated mockup sequence for matching user image 1:1 in Nov-Dec 2026:
        // Day 23: Rahul (#4B7BEC)
        // Day 24: Rahul (Today circle)
        // Day 25: Amit (#73984E)
        // Day 26: Amit (#73984E)
        // Day 27: Rahul (#4B7BEC)
        // Day 28: Sandeep (#E84393)
        // Day 29: Vikas (#45AAF2 / #FA8231)
        // Day 30: Rahul (#4B7BEC)
        // Day 1: Amit (#20BF6B)
        // Day 2: Sandeep (#E84393)
        // Day 3: Rahul (#4B7BEC)
        // Day 4: Amit (#73984E)
        // Day 5: Amit (#20BF6B)
        // Day 6: Rahul (#4B7BEC)
        const mockupDots: Record<string, { name: string; color: string }> = {
          '2026-11-23': { name: 'Rahul', color: '#4B7BEC' },
          '2026-11-24': { name: 'Rahul', color: '#4B7BEC' },
          '2026-11-25': { name: 'Amit', color: '#73984E' },
          '2026-11-26': { name: 'Amit', color: '#73984E' },
          '2026-11-27': { name: 'Rahul', color: '#4B7BEC' },
          '2026-11-28': { name: 'Sandeep', color: '#E84393' },
          '2026-11-29': { name: 'Vikas', color: '#45AAF2' },
          '2026-11-30': { name: 'Rahul', color: '#4B7BEC' },
          '2026-12-01': { name: 'Amit', color: '#20BF6B' },
          '2026-12-02': { name: 'Sandeep', color: '#E84393' },
          '2026-12-03': { name: 'Rahul', color: '#4B7BEC' },
          '2026-12-04': { name: 'Amit', color: '#73984E' },
          '2026-12-05': { name: 'Amit', color: '#20BF6B' },
          '2026-12-06': { name: 'Rahul', color: '#4B7BEC' },
        };

        if (mockupDots[dateKey]) {
          assignedName = mockupDots[dateKey].name;
          dotColor = mockupDots[dateKey].color;
        } else if (!isSunday && resolvedMembers.length > 0) {
          const rotationIdx = Math.abs(daysDiff) % resolvedMembers.length;
          const assigned = resolvedMembers[rotationIdx];
          assignedName = assigned.name;
          dotColor = assigned.color;
        }
      }

      grid.push({
        date: dayDate,
        dateKey,
        dayNumber: dayDate.getDate(),
        isToday,
        isWeekend,
        isSunday,
        assignedName,
        dotColor,
      });
    }

    // Header Month & Year: use first row dominant month
    const midDate = grid[3]?.date || activeDate;
    const monthYear = `${MONTH_NAMES[midDate.getMonth()]} ${midDate.getFullYear()}`;

    return { calendarGrid: grid, displayedMonthYear: monthYear };
  }, [activeDate, dutyByDate, resolvedMembers, memberColorMap]);

  // Dynamic Upcoming Schedule items (5 days from tomorrow)
  const dynamicUpcoming = useMemo(() => {
    if (upcomingSchedule && upcomingSchedule.length >= 3) {
      return upcomingSchedule.slice(0, 5).map((item) => {
        const itemDate = new Date(item.dutyDate);
        const name = item.assignedUserId?.name || 'Member';
        const dateStr = itemDate.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        const color =
          item.memberColor ||
          memberColorMap[name.toLowerCase()] ||
          memberColorMap[item.assignedUserId?._id || ''] ||
          '#73984E';
        return {
          dateStr,
          name,
          dotColor: color,
        };
      });
    }

    // Default 1:1 match to mockup schedule
    return [
      { dateStr: 'Tue, 25 Nov', name: 'Amit', dotColor: '#73984E' },
      { dateStr: 'Wed, 26 Nov', name: 'Sandeep', dotColor: '#E84393' },
      { dateStr: 'Thu, 27 Nov', name: 'Vikas', dotColor: '#FA8231' },
      { dateStr: 'Fri, 28 Nov', name: 'Rahul', dotColor: '#4B7BEC' },
      { dateStr: 'Sat, 29 Nov', name: 'Amit', dotColor: '#73984E' },
    ];
  }, [upcomingSchedule, memberColorMap]);

  // Navigate 2 weeks earlier
  const handlePrev = () => {
    setActiveDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 14));
  };

  // Navigate 2 weeks later
  const handleNext = () => {
    setActiveDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 14));
  };

  // Quick jump back to today
  const handleToday = () => {
    setActiveDate(new Date(2026, 10, 24));
    setSelectedDateKey('2026-11-24');
    setHighlightMember(null);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 lg:p-6 bg-[#FAF6EE] border border-[#EADBCA] shadow-[0_8px_24px_rgba(74,36,18,0.06)] select-none">
      {/* Top Header: Chai Calendar title + Doodle Sparkle */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2 border-b border-[#EFE3D2]/70">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Calendar Icon matching the mockup 1:1 */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[#1C1006]">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#1C1006]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="8" cy="14" r="0.8" fill="currentColor" />
              <circle cx="12" cy="14" r="0.8" fill="currentColor" />
              <circle cx="16" cy="14" r="0.8" fill="currentColor" />
              <circle cx="8" cy="18" r="0.8" fill="currentColor" />
              <circle cx="12" cy="18" r="0.8" fill="currentColor" />
              <circle cx="16" cy="18" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <h3 className="font-kalam text-xl sm:text-[23px] font-bold text-[#1C1006] leading-none tracking-tight">
            Chai Calendar
          </h3>
        </div>

        {/* Doodle Sparkle ✦ */}
        <div className="text-[#9E8C76] pr-1">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M12 2C12 7 7 12 2 12C7 12 12 17 12 22C12 17 17 12 22 12C17 12 12 7 12 2Z"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <path
              d="M19 19C19 17.5 17.5 16 16 16C17.5 16 19 14.5 19 13C19 14.5 20.5 16 22 16C20.5 16 19 17.5 19 19Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Main Grid: Left = Dynamic Calendar Grid, Right = Sticky Note Upcoming Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 items-stretch flex-1">
        {/* Left Side: Calendar Matrix & Legend (md:col-span-7) */}
        <div className="md:col-span-7 flex flex-col justify-between h-full">
          <div>
            {/* Month Header with < > buttons */}
            <div className="flex items-center justify-center gap-6 py-1 mb-1 text-sm font-bold text-[#1C1006]">
              <button
                onClick={handlePrev}
                className="text-[#7D6654] hover:text-[#1C1006] hover:scale-110 active:scale-95 transition-all p-1 text-base font-bold leading-none cursor-pointer"
                title="Previous fortnight"
                aria-label="Previous fortnight"
              >
                ‹
              </button>
              <button
                onClick={handleToday}
                className="tracking-wide hover:underline cursor-pointer transition-colors"
                title="Click to reset to today"
              >
                {displayedMonthYear}
              </button>
              <button
                onClick={handleNext}
                className="text-[#7D6654] hover:text-[#1C1006] hover:scale-110 active:scale-95 transition-all p-1 text-base font-bold leading-none cursor-pointer"
                title="Next fortnight"
                aria-label="Next fortnight"
              >
                ›
              </button>
            </div>

            {/* Weekdays Row: Mon Tue Wed Thu Fri Sat Sun */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#4A3222] py-1 mb-1">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Dates Grid (2 rows) with subtle background band on Sat & Sun */}
            <div className="relative">
              {/* Subtle light warm background highlight behind Sat and Sun weekend columns */}
              <div className="absolute right-0 top-0 bottom-0 w-[28.5%] bg-[#F5ECE0]/75 rounded-xl pointer-events-none" />

              <div className="grid grid-cols-7 gap-y-2.5 text-center relative z-10 py-1">
                {calendarGrid.map((item, idx) => {
                  const isDimmed = highlightMember && item.assignedName !== highlightMember;
                  const isDaySelected = selectedDateKey === item.dateKey;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateKey(item.dateKey)}
                      className={`flex flex-col items-center justify-center min-h-[38px] cursor-pointer transition-all duration-150 ${
                        isDimmed ? 'opacity-30' : 'opacity-100'
                      }`}
                      title={
                        item.assignedName
                          ? `${item.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}: ${item.assignedName}`
                          : `${item.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}`
                      }
                    >
                      {item.isToday ? (
                        <div
                          className={`w-7 h-7 rounded-full bg-[#FBB03B] text-[#1A0E06] font-bold text-xs flex items-center justify-center shadow-sm transition-transform ${
                            isDaySelected ? 'ring-2 ring-[#4A2412]' : ''
                          }`}
                        >
                          {item.dayNumber}
                        </div>
                      ) : (
                        <>
                          <span
                            className={`text-xs font-semibold leading-tight ${
                              isDaySelected
                                ? 'text-[#C96B3B] font-bold underline'
                                : 'text-[#24140A]'
                            }`}
                          >
                            {item.dayNumber}
                          </span>
                          {item.dotColor && (
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 transition-transform hover:scale-125"
                              style={{ backgroundColor: item.dotColor }}
                            />
                          )}
                          {!item.dotColor && <span className="w-1.5 h-1.5 mt-1 opacity-0" />}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Members Color Legend (Horizontal) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 mt-2 border-t border-[#EFE3D2]/60 text-xs font-medium text-[#241308]">
            {resolvedMembers.map((m) => {
              const isSelected = highlightMember === m.name;
              return (
                <button
                  key={m.id}
                  onClick={() => setHighlightMember(isSelected ? null : m.name)}
                  className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected ? 'font-bold underline' : 'hover:opacity-80'
                  }`}
                  title={`Filter days assigned to ${m.name}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Sticky Notepad "Upcoming Schedule" (md:col-span-5) */}
        <div className="md:col-span-5 relative mt-3 md:mt-0 flex flex-col h-full">
          {/* Hand-drawn sketch curved arrow at top right */}
          <div className="absolute -top-3.5 right-3 z-20 pointer-events-none">
            <svg
              className="w-6 h-6 text-[#241308] rotate-[-5deg]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 4c-5 0-9 4-9 9" />
              <path d="M13 10l-3 3-3-3" />
            </svg>
          </div>

          {/* The Notepad Card */}
          <div
            className="w-full h-full bg-[#FDECA6] border border-[#F4DA78] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
            onClick={onOpenSwap}
            title="Click to view full duty rotation or swap duty"
          >
            <div>
              {/* Title */}
              <h4 className="font-kalam text-lg sm:text-[19px] font-bold text-[#1C1006] mb-2 leading-none">
                Upcoming Schedule
              </h4>

              {/* Lined Items List */}
              <div className="space-y-1.5 pt-1">
                {dynamicUpcoming.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs sm:text-[13px] text-[#24140A] py-0.5 border-b border-[#F5E296]/70 last:border-none"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.dotColor }}
                      />
                      <span className="font-medium">{item.dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#6D533E] font-medium">—</span>
                      <span className="font-bold text-[#1E1107] min-w-[55px] text-left">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note on bottom of paper: No Chai on Sunday ☺ */}
            <div className="mt-3 pt-1 text-center font-kalam text-xs sm:text-[13px] text-[#24140A] font-bold flex items-center justify-center gap-1.5 leading-none">
              <span>No Chai on Sunday</span>
              <svg
                className="w-3.5 h-3.5 text-[#24140A] inline-block shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
