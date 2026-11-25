'use client';

import React from 'react';
import Image from 'next/image';
import {
  LuClock as Clock,
  LuCircleCheck as CheckCircle,
  LuUsers as Users,
} from 'react-icons/lu';

interface TodayDutyCardProps {
  assignedUser?: {
    name: string;
    avatar?: string;
  };
  groupName?: string;
  dutyDateStr?: string;
  status?: string;
  totalMembers?: number;
  lastBill?: number;
  onMarkCompleted?: () => void;
}

function formatDisplayDate(dateInput?: string): string {
  if (!dateInput) return 'Monday, 24 Nov';
  if (/[a-zA-Z]/.test(dateInput) && !dateInput.includes('T')) {
    return dateInput;
  }
  try {
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday}, ${day} ${monthStr}`;
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const day = d.getDate();
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      return `${weekday}, ${day} ${monthStr}`;
    }
  } catch {
    // fallback
  }
  return dateInput;
}

export default function TodayDutyCard({
  assignedUser = { name: 'Rahul' },
  groupName = 'Office Chai Group',
  dutyDateStr = 'Monday, 24 Nov',
  status = 'pending',
  totalMembers = 4,
  lastBill = 100,
  onMarkCompleted,
}: TodayDutyCardProps) {
  const isCompleted = status === 'completed';
  const userName = assignedUser?.name || 'Rahul';
  const displayDate = formatDisplayDate(dutyDateStr);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden rounded-[24px] sm:rounded-[26px] p-5 sm:p-6 bg-[#FBD6A1] border border-[#DFC08E] shadow-[0_8px_24px_rgba(74,36,18,0.08)] select-none transition-all">
      {/* Background authentic aged parchment texture gradient matching exact mockup */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[24px] sm:rounded-[26px]"
        style={{
          background: `
            radial-gradient(ellipse at 85% 45%, rgba(254, 212, 152, 0.45) 0%, transparent 60%),
            radial-gradient(ellipse at 15% 20%, rgba(255, 225, 175, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 75% 85%, rgba(242, 188, 120, 0.3) 0%, transparent 45%),
            #FBD6A1
          `,
        }}
      />

      {/* Subtle tea drop stains / authentic tapri paper specks */}
      <div className="absolute top-3 right-20 w-3 h-3 rounded-full bg-[#E5AA6A]/30 pointer-events-none blur-[1px]" />
      <div className="absolute bottom-4 left-1/3 w-2 h-2 rounded-full bg-[#DCA060]/35 pointer-events-none" />
      <div className="absolute top-1/2 left-3 w-3.5 h-3.5 rounded-full bg-[#E8AF72]/20 pointer-events-none blur-[2px]" />

      <div className="relative z-10 flex flex-col justify-between h-full flex-1">
        {/* Top Badges Row: Today's Chai Duty + Pending side-by-side */}
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          {/* Today's Chai Duty Badge */}
          <div className="bg-[#FDB933] text-[#1E1107] px-3.5 py-0.5 sm:py-1 rounded-full font-kalam font-bold text-xs sm:text-[13px] tracking-tight shadow-xs inline-flex items-center">
            Today&apos;s Chai Duty
          </div>

          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold shadow-xs transition-colors ${
              isCompleted
                ? 'bg-[#A8E6CF] text-[#135E35]'
                : 'bg-[#FDC03D]/85 text-[#2C1507]'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Pending</span>
              </>
            )}
          </div>
        </div>

        {/* Main Body: Left Content + Right Large Chai Glass */}
        <div className="flex items-end justify-between gap-2 my-auto pt-1 relative">
          {/* Left Column: Greeting, Quote, Stats & CTA Button */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 z-10">
            {/* Person Name with Cute Hand-Drawn Doodle Crown */}
            <div className="flex items-center gap-1.5">
              <h2 className="font-kalam text-[28px] xs:text-[32px] sm:text-[36px] lg:text-[40px] font-bold text-[#140B05] leading-none tracking-tight">
                {userName}
              </h2>
              {/* Cute hand-drawn doodle crown in warm golden-orange outline */}
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#DE8E26] rotate-[15deg] -translate-y-1 shrink-0 drop-shadow-xs"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 17l2.5-9 4.5 4.5 4-7 3 7 2 4.5H4z" />
                <circle cx="6.5" cy="8" r="1.2" fill="currentColor" />
                <circle cx="15" cy="5.5" r="1.2" fill="currentColor" />
                <circle cx="11" cy="12.5" r="1.2" fill="currentColor" />
              </svg>
            </div>

            {/* Subtitle: Group & Date (Single line, no awkward wrapping) */}
            <p className="text-[11px] sm:text-[12px] font-medium text-[#2F1D11] mt-1 flex items-center gap-1.5 whitespace-nowrap leading-none">
              <span className="font-semibold">{groupName}</span>
              <span className="text-[#66432A] font-bold">•</span>
              <span className="font-medium text-[#422917]">{displayDate}</span>
            </p>

            {/* Handwritten Hindi Quote */}
            <div className="my-2 sm:my-2.5 font-kalam text-[#1A0E06] text-xs xs:text-[13px] sm:text-[14px] lg:text-[15px] font-bold leading-snug">
              <p className="italic">Bhai, aaj aapki baari hai!</p>
              <p className="italic flex items-center gap-1.5 mt-0.5">
                <span>Chai ki tayari ready rakho</span>
                {/* Hand-drawn doodle smiley face */}
                <svg
                  className="w-3.5 h-3.5 inline-block text-[#1A0E06] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2.5 4 2.5 4-2.5 4-2.5" />
                  <circle cx="9" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </p>
            </div>

            {/* Stats: Total Members & Last Bill */}
            <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
              {/* Total Members Pill Box */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-[#F4CF96]/75 border border-[#DEB578]/70 rounded-xl px-1.5 sm:px-2.5 py-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] shrink-0">
                <Users className="w-3.5 h-3.5 text-[#2E180B] shrink-0" />
                <div className="leading-tight">
                  <span className="text-[9px] sm:text-[10px] text-[#63432B] font-medium block whitespace-nowrap">Total Members</span>
                  <span className="text-xs font-bold text-[#1A0E06] leading-none">{totalMembers}</span>
                </div>
              </div>

              {/* Last Bill Pill Box */}
              <div className="flex items-center gap-1 bg-[#F4CF96]/75 border border-[#DEB578]/70 rounded-xl px-1.5 sm:px-2.5 py-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] shrink-0">
                <span className="text-[#2E180B] font-bold text-xs leading-none pl-0.5">₹</span>
                <div className="leading-tight">
                  <span className="text-[9px] sm:text-[10px] text-[#63432B] font-medium block whitespace-nowrap">Last Bill</span>
                  <span className="text-xs font-bold text-[#1A0E06] leading-none">₹{lastBill}</span>
                </div>
              </div>
            </div>

            {/* Mark as Completed CTA Button */}
            <div className="mt-2.5">
              <button
                onClick={onMarkCompleted}
                disabled={isCompleted}
                className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-[11px] sm:text-xs lg:text-[13px] flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                  isCompleted
                    ? 'bg-[#2E7D32] text-white cursor-default'
                    : 'bg-[#1C140E] hover:bg-[#331E12] text-white'
                }`}
              >
                <span>{isCompleted ? 'Chai Completed' : 'Mark as Completed'}</span>
                <span className="text-sm font-bold">✓</span>
              </button>
            </div>
          </div>

          {/* Right Column: Much Larger, Hero Chai Glass filling the circled right side */}
          <div className="shrink-0 flex items-end justify-center relative select-none pointer-events-none -mr-1 sm:-mr-2 -mb-1">
            <div className="relative w-32 h-44 xs:w-36 xs:h-48 sm:w-44 sm:h-56 lg:w-48 lg:h-60">
              <Image
                src="/images/Radiant Glass of Chai.png"
                alt="Radiant Glass of Chai"
                fill
                className="object-contain object-bottom"
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
