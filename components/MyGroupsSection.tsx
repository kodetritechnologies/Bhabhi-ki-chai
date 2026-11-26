'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  LuUsers as Users,
  LuPlus as Plus,
  LuCopy as Copy,
  LuCheck as Check,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuTrash2 as Trash2,
} from 'react-icons/lu';

export interface GroupCardData {
  _id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
  isDefault?: boolean;
  canDelete?: boolean;
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
  onDeleteGroup?: (id: string) => Promise<void> | void;
}

export default function MyGroupsSection({
  groups = [],
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
}: MyGroupsSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const scrollAmount = Math.max(sliderRef.current.clientWidth * 0.75, 220);
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleConfirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteGroup) return;
    setDeletingId(id);
    try {
      await onDeleteGroup(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCopyInvite = (e: React.MouseEvent, code?: string, id?: string) => {
    e.stopPropagation();
    if (!code || !id) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="tapri-dark-card p-5 rounded-3xl border border-[#522915] shadow-xl h-full flex flex-col justify-between select-none">
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[#522915]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-[#F4B52E]/20 text-[#F4B52E] flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-kalam text-lg sm:text-xl font-bold text-[#FFF4DF] leading-none truncate">
              My Chai Circles
            </h3>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[#F4B52E] bg-[#F4B52E]/15 px-2.5 py-0.5 rounded-full border border-[#F4B52E]/30 whitespace-nowrap">
              {groups.length} {groups.length === 1 ? 'Circle' : 'Circles'}
            </span>

            {groups.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="w-6 h-6 rounded-full bg-[#3A1C0D] hover:bg-[#522915] border border-[#6E391D] text-[#F4B52E] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Slide left"
                  title="Previous circles"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="w-6 h-6 rounded-full bg-[#3A1C0D] hover:bg-[#522915] border border-[#6E391D] text-[#F4B52E] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Slide right"
                  title="Next circles"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
          /* Group Cards Horizontal Slider */
          <div
            ref={sliderRef}
            className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {groups.map((grp) => {
              const isSelected = currentGroupId === grp._id;
              const isCopied = copiedId === grp._id;

              return (
                <div
                  key={grp._id}
                  onClick={() => onSelectGroup?.(grp._id)}
                  className={`group relative shrink-0 snap-start w-[78%] xs:w-[62%] sm:w-[calc(33.333%-7px)] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
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

                    {/* Role / Default Badge */}
                    <span
                      className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                        grp.isDefault
                          ? 'bg-[#F4B52E] text-[#281308] shadow-[#F4B52E]/30'
                          : grp.role === 'admin'
                            ? 'bg-[#10B981] text-white shadow-[#10B981]/30'
                            : 'bg-[#3B82F6] text-white shadow-[#3B82F6]/30'
                      }`}
                    >
                      {grp.isDefault ? 'Default' : grp.role}
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

                    {/* Invite Code Quick Copy & Admin Delete */}
                    <div className="mt-2 pt-1.5 border-t border-[#4A2412] flex items-center justify-between gap-1 text-[9px] text-[#D4B298]">
                      {grp.inviteCode ? (
                        <div
                          onClick={(e) => handleCopyInvite(e, grp.inviteCode, grp._id)}
                          className="flex items-center gap-1 hover:text-[#FFF4DF] transition-colors cursor-pointer group/copy min-w-0"
                          title="Click to copy invite code"
                        >
                          <span className="font-mono truncate">Code: {grp.inviteCode}</span>
                          {isCopied ? (
                            <span className="text-[#10B981] font-bold flex items-center gap-0.5 shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60 group-hover/copy:opacity-100 shrink-0" />
                          )}
                        </div>
                      ) : (
                        <span />
                      )}

                      {grp.canDelete && onDeleteGroup && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(grp._id);
                          }}
                          className="p-1 rounded-md text-[#FCA5A5]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors cursor-pointer shrink-0"
                          title={`Delete ${grp.name}`}
                          aria-label={`Delete ${grp.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Delete Confirmation Overlay */}
                  {confirmDeleteId === grp._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 z-20 bg-[#1A0B04]/95 backdrop-blur-xs p-3 flex flex-col items-center justify-center text-center gap-2.5"
                    >
                      <p className="text-[11px] font-bold text-[#FFF4DF] leading-snug">
                        &ldquo;{grp.name}&rdquo; delete karein?
                      </p>
                      <div className="flex items-center gap-2 w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          disabled={deletingId === grp._id}
                          className="flex-1 py-1.5 rounded-lg bg-[#3A1C0D] hover:bg-[#4D2612] text-[#E6CCB2] text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleConfirmDelete(e, grp._id)}
                          disabled={deletingId === grp._id}
                          className="flex-1 py-1.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-60"
                        >
                          {deletingId === grp._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
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
