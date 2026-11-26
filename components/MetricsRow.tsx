'use client';

import React from 'react';
import { HiUsers } from 'react-icons/hi2';
import { LuCalendar } from 'react-icons/lu';
import { FaMugHot } from 'react-icons/fa6';

interface MetricsRowProps {
  stats?: {
    myGroupsCount: number;
    chaiDaysThisMonth: number;
    totalExpenses: number;
    groupActiveRate: string;
  };
  onManageGroups?: () => void;
  onOpenCalendar?: () => void;
  onOpenExpenses?: () => void;
  className?: string;
}

export default function MetricsRow({
  stats = {
    myGroupsCount: 0,
    chaiDaysThisMonth: 0,
    totalExpenses: 0,
    groupActiveRate: '0%',
  },
  onManageGroups,
  onOpenCalendar,
  onOpenExpenses,
  className,
}: MetricsRowProps) {
  return (
    <div className={className || "relative w-full -mt-6 sm:-mt-9 lg:-mt-11 z-20"}>
      {/* 4 Responsive Dynamic Metric Cards (Matching User Mockup 1:1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 select-none lg:mr-28 xl:mr-36 2xl:mr-44">
        {/* 1. My Groups */}
        <div
          onClick={onManageGroups}
          className="relative bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[18px] sm:rounded-[22px] p-2.5 sm:px-4 sm:py-3.5 flex items-center gap-2 sm:gap-3.5 shadow-[0_4px_16px_rgba(70,40,15,0.08),0_1px_3px_rgba(70,40,15,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_8px_24px_rgba(70,40,15,0.14)] hover:-translate-y-0.5 transition-all duration-200 min-h-[76px] sm:min-h-[88px] cursor-pointer group"
        >
          {/* Soft Blue Icon Circle */}
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#DFE7F8] flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1px_3px_rgba(44,86,151,0.12)] group-hover:scale-105 transition-transform">
            <HiUsers className="w-4 h-4 sm:w-6 sm:h-6 text-[#2C5697]" />
          </div>

          {/* Value & Label */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-[22px] sm:text-[33px] text-[#140F0B] tracking-tight leading-none">
              {stats.myGroupsCount}
            </span>
            <span className="text-[11px] sm:text-[13px] font-semibold text-[#54433A] leading-tight mt-0.5 sm:mt-1 whitespace-nowrap">
              My Groups
            </span>
          </div>
        </div>

        {/* 2. Chai Days This Month */}
        <div
          onClick={onOpenCalendar}
          className="relative bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[18px] sm:rounded-[22px] p-2.5 sm:px-4 sm:py-3.5 flex items-center gap-2 sm:gap-3.5 shadow-[0_4px_16px_rgba(70,40,15,0.08),0_1px_3px_rgba(70,40,15,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_8px_24px_rgba(70,40,15,0.14)] hover:-translate-y-0.5 transition-all duration-200 min-h-[76px] sm:min-h-[88px] cursor-pointer group"
        >
          {/* Soft Mint Green Icon Circle */}
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#E0F2E4] flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1px_3px_rgba(30,114,56,0.12)] group-hover:scale-105 transition-transform">
            <LuCalendar className="w-4 h-4 sm:w-6 sm:h-6 text-[#1E7238] stroke-[2.2]" />
          </div>

          {/* Value & Label */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-[22px] sm:text-[33px] text-[#140F0B] tracking-tight leading-none">
              {stats.chaiDaysThisMonth}
            </span>
            <div className="mt-0.5 sm:mt-1 leading-[1.15]">
              <span className="text-[11px] sm:text-[13px] font-semibold text-[#54433A] block whitespace-nowrap">
                Chai Days
              </span>
              <span className="text-[9px] sm:text-[11px] text-[#7A695E] font-medium block whitespace-nowrap">
                This Month
              </span>
            </div>
          </div>
        </div>

        {/* 3. Total Expenses */}
        <div
          onClick={onOpenExpenses}
          className="relative bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[18px] sm:rounded-[22px] p-2.5 sm:px-4 sm:py-3.5 flex items-center gap-2 sm:gap-3.5 shadow-[0_4px_16px_rgba(70,40,15,0.08),0_1px_3px_rgba(70,40,15,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_8px_24px_rgba(70,40,15,0.14)] hover:-translate-y-0.5 transition-all duration-200 min-h-[76px] sm:min-h-[88px] cursor-pointer group"
        >
          {/* Soft Peach / Yellow Icon Circle */}
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#FDE4B8] flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1px_3px_rgba(180,110,30,0.15)] group-hover:scale-105 transition-transform">
            <span className="text-base sm:text-2xl font-bold text-[#3E2310] leading-none select-none">
              ₹
            </span>
          </div>

          {/* Value & Label */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-[22px] sm:text-[33px] text-[#140F0B] tracking-tight leading-none">
              ₹{stats.totalExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] sm:text-[13px] font-semibold text-[#54433A] leading-tight mt-0.5 sm:mt-1 whitespace-nowrap">
              Total Expenses
            </span>
          </div>
        </div>

        {/* 4. Group Active */}
        <div className="relative bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[18px] sm:rounded-[22px] p-2.5 sm:px-4 sm:py-3.5 flex items-center gap-2 sm:gap-3.5 shadow-[0_4px_16px_rgba(70,40,15,0.08),0_1px_3px_rgba(70,40,15,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] hover:shadow-[0_8px_24px_rgba(70,40,15,0.14)] hover:-translate-y-0.5 transition-all duration-200 min-h-[76px] sm:min-h-[88px] group">
          {/* Soft Warm Beige Icon Circle with Steaming Chai Cup */}
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#ECE3D2] flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1px_3px_rgba(70,37,17,0.12)] group-hover:scale-105 transition-transform">
            <FaMugHot className="w-4 h-4 sm:w-6 sm:h-6 text-[#462511]" />
          </div>

          {/* Value & Label */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-extrabold text-[22px] sm:text-[33px] text-[#140F0B] tracking-tight leading-none">
              {stats.groupActiveRate}
            </span>
            <div className="mt-0.5 sm:mt-1">
              <span className="text-[11px] sm:text-[13px] font-semibold text-[#54433A] leading-tight block">
                Group Active
              </span>
              {/* Hand-drawn Green Underline */}
              <svg
                className="w-8 sm:w-11 h-1.5 text-[#3FA653] mt-0.5"
                viewBox="0 0 44 6"
                fill="none"
              >
                <path
                  d="M1.5 3.5C9 1.5 24 1.2 42.5 4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Sepia Cottage Beneath a Shaded Tree (Larger & Exactly Styled) */}
      <div className="hidden lg:flex items-end justify-center absolute -right-1 sm:-right-2 xl:right-0 -bottom-2 sm:-bottom-3 xl:-bottom-4 w-36 sm:w-44 xl:w-52 2xl:w-60 pointer-events-none select-none z-10">
        <img
          src="/images/Sepia Cottage Beneath a Shaded Tree.png"
          alt="Sepia Cottage Beneath a Shaded Tree"
          className="w-full h-auto max-h-[105px] sm:max-h-[120px] xl:max-h-[135px] 2xl:max-h-[145px] object-contain opacity-95 drop-shadow-sm"
        />
      </div>
    </div>
  );
}
