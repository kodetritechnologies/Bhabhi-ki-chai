'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  LuUsers as Users,
  LuPlus as Plus,
  LuCopy as Copy,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
} from 'react-icons/lu';

export interface GroupCardData {
  _id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
  memberCount: number;
  workingDaysCount: number;
  bannerImage?: string;
  inviteCode?: string;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleCopyInvite = (e: React.MouseEvent, code?: string, id?: string) => {
    e.stopPropagation();
    if (!code || !id) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const displayedGroups = showAll ? groups : groups.slice(0, 3);

  return (
    <div className="tapri-dark-card p-5 rounded-3xl border border-[#522915] shadow-xl h-full flex flex-col justify-between select-none">
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#522915]">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#F4B52E]/20 text-[#F4B52E] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-kalam text-xl font-bold text-[#FFF4DF] leading-none">
                My Chai Circles
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#F4B52E] bg-[#F4B52E]/15 px-2 py-0.5 rounded-full border border-[#F4B52E]/30">
              {groups.length} {groups.length === 1 ? 'Circle' : 'Circles'}
            </span>

            {groups.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-[11px] font-bold text-[#F4B52E] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{showAll ? 'Show Less' : 'View All'}</span>
                {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Empty State when user has 0 groups */}
        {groups.length === 0 ? (
          <div className="py-8 text-center bg-[#240F06]/60 rounded-2xl border border-[#4A2412] p-4">
            <span className="text-3xl block mb-2">☕</span>
            <h4 className="font-kalam text-lg font-bold text-[#FFF4DF]">
              Koi Chai Circle Nahi Mila!
            </h4>
            <p className="text-xs text-[#CDB29B] mt-1 max-w-xs mx-auto">
              Apni office team ya friends ke sath daily chai duty manage karne ke liye naya group banayein.
            </p>
          </div>
        ) : (
          /* Group Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {displayedGroups.map((grp) => {
              const isSelected = currentGroupId === grp._id;
              const isCopied = copiedId === grp._id;

              return (
                <div
                  key={grp._id}
                  onClick={() => onSelectGroup?.(grp._id)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#F4B52E] ring-2 ring-[#F4B52E]/50 bg-[#422010]'
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#381B0C] to-[#1A0B04] text-xl">
                        ☕
                      </div>
                    )}
                    {/* Subtle bottom edge gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#2C1409] to-transparent pointer-events-none" />

                    {/* Role Badge */}
                    <span
                      className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                        grp.role === 'admin'
                          ? 'bg-[#10B981] text-white shadow-[#10B981]/30'
                          : 'bg-[#3B82F6] text-white shadow-[#3B82F6]/30'
                      }`}
                    >
                      {grp.role}
                    </span>

                    {/* Active Indicator Pin */}
                    {isSelected && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-[#F4B52E] text-[#281308] shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A0B04] animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-2.5 text-left flex-1 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-[#FFF4DF] text-xs truncate group-hover:text-[#F4B52E] transition-colors">
                        {grp.name}
                      </h5>
                      <p className="text-[10px] text-[#CDB29B] mt-0.5">
                        {grp.memberCount} Members • {grp.workingDaysCount} Days/Wk
                      </p>
                      <p className="text-[9px] text-[#F4B52E] font-semibold mt-1 truncate">
                        Next: {grp.nextDuty?.isUser ? 'You' : grp.nextDuty?.assignedTo || 'Pending'}
                      </p>
                    </div>

                    {/* Invite Code Quick Copy */}
                    {grp.inviteCode && (
                      <div
                        onClick={(e) => handleCopyInvite(e, grp.inviteCode, grp._id)}
                        className="mt-2 pt-1.5 border-t border-[#4A2412] flex items-center justify-between text-[9px] text-[#D4B298] hover:text-[#FFF4DF] transition-colors cursor-pointer group/copy"
                        title="Click to copy invite code"
                      >
                        <span className="font-mono truncate">Code: {grp.inviteCode}</span>
                        {isCopied ? (
                          <span className="text-[#10B981] font-bold flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Copied!
                          </span>
                        ) : (
                          <Copy className="w-2.5 h-2.5 opacity-60 group-hover/copy:opacity-100" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          <span>Create or Join Chai Group</span>
        </button>
      </div>
    </div>
  );
}
