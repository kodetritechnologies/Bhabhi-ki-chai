'use client';

import React, { useState } from 'react';
import { LuX as X, LuRefreshCw as RefreshCw } from 'react-icons/lu';

interface SwapDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingDuties?: Array<{
    _id: string;
    dutyDate: string;
    assignedUserId: {
      _id: string;
      name: string;
    };
    status: string;
  }>;
  todayDutyId?: string;
  onSuccess?: () => void;
}

export default function SwapDutyModal({
  isOpen,
  onClose,
  upcomingDuties = [],
  todayDutyId,
  onSuccess,
}: SwapDutyModalProps) {
  const [dutyId1, setDutyId1] = useState(todayDutyId || (upcomingDuties[0]?._id ?? ''));
  const [dutyId2, setDutyId2] = useState(upcomingDuties[1]?._id ?? '');
  const [reason, setReason] = useState('Out of office');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyId1 || !dutyId2 || dutyId1 === dutyId2) {
      alert('Please select two distinct duties to swap');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/duty/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dutyId1, dutyId2, reason }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess?.();
        onClose();
      } else {
        alert(data.error || 'Failed to swap duty');
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl p-6 shadow-2xl text-[#2B211B] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F2E5D3] text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[#EEDFCA]">
          <div className="w-12 h-12 rounded-2xl bg-[#F4B52E]/30 text-[#8C4610] flex items-center justify-center font-bold text-2xl shadow-inner">
            🔄
          </div>
          <div>
            <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] leading-none">
              Swap Chai Turn
            </h3>
            <p className="text-xs text-[#734A29] mt-1 font-medium">
              Exchange turns with another group member
            </p>
          </div>
        </div>

        <form onSubmit={handleSwap} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              First Duty (Your Duty)
            </label>
            <select
              value={dutyId1}
              onChange={(e) => setDutyId1(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5BEA1] bg-white text-xs font-medium text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
            >
              {upcomingDuties.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.dutyDate} — {d.assignedUserId?.name} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Swap With Second Duty
            </label>
            <select
              value={dutyId2}
              onChange={(e) => setDutyId2(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5BEA1] bg-white text-xs font-medium text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
            >
              {upcomingDuties.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.dutyDate} — {d.assignedUserId?.name} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Reason for Swap
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D5BEA1] bg-white text-xs text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
              placeholder="e.g. Travel, urgent meeting"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-[#3B1B0D] hover:bg-[#4E2715] text-[#FFF4DF] font-bold text-sm shadow-xl flex items-center justify-center space-x-2 border-2 border-[#F4B52E] transition-all active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4 text-[#F4B52E]" />
              <span>{submitting ? 'Swapping...' : 'Confirm Swap 🔄'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
