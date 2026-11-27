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
  workingDays?: number[];
  onOpenSwap?: () => void;
}

const FALLBACK_COLORS = ['#4B7BEC', '#73984E', '#E84393', '#FA8231', '#20BF6B', '#8854D0'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
}

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
  workingDays = [1, 2, 3, 4, 5, 6],
  onOpenSwap,
}: ChaiCalendarProps) {
  const todayKey = formatDateKey(new Date());
  const [activeDate, setActiveDate] = useState<Date>(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  // Resolved members list for legend from actual group members
  const resolvedMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
    return members.map((m, idx) => ({
      id: m.userId?._id || `m-${idx}`,
      name: m.userId?.name || 'Member',
      color: m.color || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
    }));
  }, [members]);

  // Fast color lookup map
  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
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

    for (let i = 0; i < 14; i++) {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateKey = formatDateKey(dayDate);
      const dayOfWeek = dayDate.getDay(); // 0 = Sun, 6 = Sat
      const isSunday = dayOfWeek === 0;
      const isWeekend = isSunday || dayOfWeek === 6;
      const isToday = dateKey === todayKey;

      // Read directly from DB duties
      const duty = dutyByDate[dateKey];
      let assignedName = '';
      let dotColor: string | null = null;
      let status = '';

      if (duty) {
        assignedName = duty.assignedUserId?.name || 'Assigned';
        status = duty.status || 'upcoming';
        dotColor =
          duty.memberColor ||
          memberColorMap[assignedName.toLowerCase()] ||
          memberColorMap[duty.assignedUserId?._id || ''] ||
          '#4B7BEC';
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
        status,
      });
    }

    // Header Month & Year: use first row dominant month
    const midDate = grid[3]?.date || activeDate;
    const monthYear = `${MONTH_NAMES[midDate.getMonth()]} ${midDate.getFullYear()}`;

    return { calendarGrid: grid, displayedMonthYear: monthYear };
  }, [activeDate, dutyByDate, memberColorMap, todayKey]);

  // Selected date details for mobile & desktop tap feedback
  const selectedDayDetails = useMemo(() => {
    const dateObj = parseLocalDate(selectedDateKey);
    const duty = dutyByDate[selectedDateKey];
    const assignedName = duty?.assignedUserId?.name || '';
    const dotColor = assignedName
      ? duty?.memberColor ||
        memberColorMap[assignedName.toLowerCase()] ||
        memberColorMap[duty?.assignedUserId?._id || ''] ||
        '#4B7BEC'
      : null;

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return {
      dateKey: selectedDateKey,
      isToday: selectedDateKey === todayKey,
      formattedDate,
      assignedName,
      dotColor,
      status: duty?.status || '',
    };
  }, [selectedDateKey, dutyByDate, memberColorMap, todayKey]);

  // Dynamic off-days note from group workingDays
  const offDaysNote = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const offDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !workingDays.includes(d));
    if (offDays.length === 0) return 'Chai Every Day!';
    if (offDays.length === 1) return `No Chai on ${dayNames[offDays[0]]}`;
    if (offDays.length === 2) return `No Chai on ${dayNames[offDays[0]].slice(0, 3)} & ${dayNames[offDays[1]].slice(0, 3)}`;
    return `${workingDays.length} Chai Days / Week`;
  }, [workingDays]);

  // Dynamic Upcoming Schedule items (next 5 duties from DB)
  const dynamicUpcoming = useMemo(() => {
    if (!upcomingSchedule || upcomingSchedule.length === 0) return [];
    return upcomingSchedule.slice(0, 5).map((item) => {
      const itemDate = parseLocalDate(item.dutyDate);
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
    const now = new Date();
    setActiveDate(now);
    setSelectedDateKey(formatDateKey(now));
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between rounded-[22px] sm:rounded-[26px] p-3.5 sm:p-5 lg:p-6 pb-8 sm:pb-10 bg-[#FAF6EE] border border-[#EADBCA] shadow-[0_8px_24px_rgba(74,36,18,0.06)] select-none">
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
        {/* Left Side: Calendar Matrix & Selected Date Card (md:col-span-7) */}
        <div className="md:col-span-7 flex flex-col justify-center h-full">
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
                  const isDaySelected = selectedDateKey === item.dateKey;
                  const isCompleted = item.status === 'completed';

                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedDateKey(item.dateKey)}
                      className="group flex flex-col items-center justify-center min-h-[42px] cursor-pointer transition-all duration-150"
                      title={
                        item.assignedName
                          ? `${item.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}: ${item.assignedName}${isCompleted ? ' (Completed)' : ''}`
                          : `${item.date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })} (Off Day)`
                      }
                    >
                      {item.isToday ? (
                        <div
                          className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shadow-sm transition-all ${
                            isCompleted
                              ? 'bg-[#279958] text-white'
                              : 'bg-[#FBB03B] text-[#1A0E06]'
                          } ${
                            isDaySelected
                              ? isCompleted
                                ? 'ring-2 ring-[#14532D] ring-offset-1 ring-offset-[#FAF6EE] scale-105'
                                : 'ring-2 ring-[#3B1B0D] ring-offset-1 ring-offset-[#FAF6EE] scale-105'
                              : 'group-hover:scale-105'
                          }`}
                        >
                          {item.dayNumber}
                        </div>
                      ) : (
                        <>
                          <span
                            className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                              isCompleted
                                ? isDaySelected
                                  ? 'bg-[#1E7E45] text-white font-bold shadow-xs scale-105 ring-2 ring-[#14532D]/40'
                                  : 'bg-[#D1F2DF] text-[#135E35] border border-[#7ED4A3] font-bold group-hover:bg-[#BCEAD0]'
                                : isDaySelected
                                  ? 'bg-[#3B1B0D] text-[#FFF9ED] font-bold shadow-xs scale-105'
                                  : 'text-[#24140A] group-hover:bg-[#EFE3D2]/80'
                            }`}
                          >
                            {item.dayNumber}
                          </span>
                          {item.dotColor ? (
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 transition-transform group-hover:scale-125"
                              style={{ backgroundColor: item.dotColor }}
                            />
                          ) : (
                            <span className="w-1.5 h-1.5 mt-0.5 opacity-0" />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Duty Card (Tapri-styled for Desktop & Mobile) */}
            <div className="mt-3 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#FFF8EA] to-[#FDECA6]/55 border border-[#EAD7B7] shadow-[0_2px_8px_rgba(74,36,18,0.04)] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/80 shadow-xs"
                  style={{
                    backgroundColor: selectedDayDetails.assignedName
                      ? selectedDayDetails.dotColor || '#4B7BEC'
                      : '#CBB9A1',
                  }}
                />
                <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                  <span className="text-[11px] sm:text-xs font-semibold text-[#6D533E] shrink-0">
                    {selectedDayDetails.formattedDate}
                    {selectedDayDetails.isToday ? ' · Today' : ''}
                  </span>
                  <span className="text-[#B8A28A] text-xs shrink-0">•</span>
                  {selectedDayDetails.assignedName ? (
                    <span className="font-kalam text-sm sm:text-[15px] font-bold text-[#1C1006] truncate leading-none">
                      {selectedDayDetails.assignedName}
                    </span>
                  ) : (
                    <span className="font-kalam text-xs sm:text-sm font-semibold text-[#8A735E] truncate leading-none">
                      Off Day (No Chai)
                    </span>
                  )}
                </div>
              </div>

              {selectedDayDetails.assignedName && selectedDayDetails.status && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 border ${
                    selectedDayDetails.status === 'completed'
                      ? 'bg-[#E2F6EB] text-[#146C3B] border-[#B7E4CA]'
                      : selectedDayDetails.status === 'skipped'
                        ? 'bg-[#FCE4E4] text-[#9E2A2B] border-[#F5C2C2]'
                        : 'bg-[#FDB933]/25 text-[#6E3B0C] border-[#F4C973]'
                  }`}
                >
                  {selectedDayDetails.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Sticky Notepad "Upcoming Schedule" (md:col-span-5) */}
        <div className="md:col-span-5 relative mt-5 md:mt-0 mb-4 md:mb-0 flex flex-col h-full">
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
            className="w-full h-full bg-[#FDECA6] border border-[#F4DA78] rounded-2xl p-4 sm:p-5 pb-7 sm:pb-9 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
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
                {dynamicUpcoming.length === 0 ? (
                  <p className="text-xs text-[#6D533E] py-3 text-center font-medium">
                    No upcoming duties scheduled
                  </p>
                ) : (
                  dynamicUpcoming.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 text-xs sm:text-[13px] text-[#24140A] py-1 border-b border-[#F5E296]/70 last:border-none"
                    >
                      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.dotColor }}
                        />
                        <span className="font-medium whitespace-nowrap">{item.dateStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[#6D533E] font-medium shrink-0">—</span>
                        <span
                          className="font-bold text-[#1E1107] truncate"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dynamic off-days note on bottom of paper */}
            <div className="mt-6 pt-2 pb-4 mb-2 text-center font-kalam text-xs sm:text-[13px] text-[#24140A] font-bold flex items-center justify-center gap-1.5 leading-none">
              <span>{offDaysNote}</span>
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
