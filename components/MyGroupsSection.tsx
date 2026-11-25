'use client';

import React from 'react';
import Image from 'next/image';
import {
  LuUsers as Users,
  LuPlus as Plus,
  LuArrowRight as ArrowRight,
  LuShieldCheck as ShieldCheck,
  LuUserCheck as UserCheck,
} from 'react-icons/lu';

interface GroupCardData {
  _id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
  memberCount: number;
  workingDaysCount: number;
  bannerImage?: string;
  nextDuty?: {
    date: string;
    assignedTo: string;
    isUser: boolean;
  } | null;
}

interface MyGroupsSectionProps {
  groups?: GroupCardData[];
  currentGroupId?: string;
  onSelectGroup?: (id: string) => void;
  onCreateGroup?: () => void;
}

export default function MyGroupsSection({
  groups = [],
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
}: MyGroupsSectionProps) {
  return (
    <div className="tapri-dark-card p-5 rounded-3xl border border-[#522915] shadow-xl h-full flex flex-col justify-between">
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#522915]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#F4B52E]/20 text-[#F4B52E] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-kalam text-xl font-bold text-[#FFF4DF] leading-none">
                My Groups
              </h3>
            </div>
          </div>

          <button
            onClick={onCreateGroup}
            className="text-xs font-bold text-[#F4B52E] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Group Cards Grid / Horizontal view */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {groups.slice(0, 3).map((grp) => {
            const isSelected = currentGroupId === grp._id;
            return (
              <div
                key={grp._id}
                onClick={() => onSelectGroup?.(grp._id)}
                className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'border-[#F4B52E] ring-1 ring-[#F4B52E]/40 bg-[#422010]'
                    : 'border-[#5A2C16] hover:border-[#F4B52E]/60 bg-[#2C1409]'
                }`}
              >
                {/* Banner Preview */}
                <div className="relative h-16 w-full bg-[#1A0B04] overflow-hidden">
                  {grp.bannerImage ? (
                    <Image
                      src={grp.bannerImage}
                      alt={grp.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">☕</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C1409] to-transparent opacity-80" />
                  <span
                    className={`absolute top-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                      grp.role === 'admin' ? 'bg-[#10B981] text-white' : 'bg-[#3B82F6] text-white'
                    }`}
                  >
                    {grp.role}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-2 text-left">
                  <h5 className="font-bold text-[#FFF4DF] text-xs truncate group-hover:text-[#F4B52E]">
                    {grp.name}
                  </h5>
                  <p className="text-[10px] text-[#CDB29B]">
                    {grp.memberCount} M • {grp.workingDaysCount} D/W
                  </p>
                  <p className="text-[9px] text-[#F4B52E] font-semibold mt-1 truncate">
                    Next: {grp.nextDuty?.isUser ? 'You' : grp.nextDuty?.assignedTo || 'Pending'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create New Group Button */}
      <div className="mt-3 pt-2 border-t border-[#4A2412]">
        <button
          onClick={onCreateGroup}
          className="w-full py-1.5 rounded-xl border border-dashed border-[#6B371E] hover:border-[#F4B52E] text-[#F4B52E] text-xs font-bold hover:bg-[#3D1E0E] transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create New Group</span>
        </button>
      </div>
    </div>
  );
}
