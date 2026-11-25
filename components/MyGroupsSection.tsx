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
                <div className="relative h-24 sm:h-20 lg:h-24 w-full bg-[#1A0B04] overflow-hidden">
                  {grp.bannerImage ? (
                    <Image
                      src={grp.bannerImage}
                      alt={grp.name}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#381B0C] to-[#1A0B04] text-xl">☕</div>
                  )}
                  {/* Subtle bottom edge gradient so image is crisp and clear */}
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#2C1409] to-transparent pointer-events-none" />
                  <span
                    className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                      grp.role === 'admin' ? 'bg-[#10B981] text-white shadow-[#10B981]/30' : 'bg-[#3B82F6] text-white shadow-[#3B82F6]/30'
                    }`}
                  >
                    {grp.role}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-2.5 text-left">
                  <h5 className="font-bold text-[#FFF4DF] text-xs truncate group-hover:text-[#F4B52E] transition-colors">
                    {grp.name}
                  </h5>
                  <p className="text-[10px] text-[#CDB29B] mt-0.5">
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
      <div className="mt-4 pt-3 border-t border-[#522915]">
        <button
          onClick={onCreateGroup}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F4B52E] via-[#F2A81B] to-[#DE9008] hover:from-[#F6C04E] hover:to-[#ECA318] text-[#281308] text-xs font-extrabold tracking-wide shadow-md hover:shadow-lg shadow-[#F4B52E]/15 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-5 h-5 rounded-full bg-[#281308]/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span>Create New Group</span>
        </button>
      </div>
    </div>
  );
}
