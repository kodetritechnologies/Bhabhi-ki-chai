'use client';

import React from 'react';
import {
  LuX as X,
  LuCircleCheck as CheckCircle2,
} from 'react-icons/lu';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities?: Array<{
    _id: string;
    action: string;
    reason?: string;
    createdAt?: string | Date;
  }>;
  totalExpenses?: number;
  totalChaiDays?: number;
}

export default function HistoryModal({
  isOpen,
  onClose,
  activities = [],
  totalExpenses = 0,
  totalChaiDays = 0,
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl p-6 shadow-2xl text-[#2B211B] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F2E5D3] text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[#EEDFCA]">
          <div className="w-12 h-12 rounded-2xl bg-[#F4B52E]/30 text-[#8C4610] flex items-center justify-center font-bold text-2xl shadow-inner">
            📜
          </div>
          <div>
            <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] leading-none">
              Chai History & Reports
            </h3>
            <p className="text-xs text-[#734A29] mt-1 font-medium">
              Complete audit trail of duties and expenses
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-[#FAF2E4] rounded-2xl border border-[#E8DAC2] text-center">
            <span className="text-xs text-gray-600 block">Chai Days This Month</span>
            <span className="text-2xl font-mono font-extrabold text-[#3B1B0D]">
              {totalChaiDays}
            </span>
          </div>
          <div className="p-3 bg-[#FAF2E4] rounded-2xl border border-[#E8DAC2] text-center">
            <span className="text-xs text-gray-600 block">Total Group Spend</span>
            <span className="text-2xl font-mono font-extrabold text-[#059669]">
              ₹{totalExpenses}
            </span>
          </div>
        </div>

        {/* Activity List */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
          {activities.length === 0 ? (
            <p className="text-center text-xs text-gray-500 py-6">No historical entries</p>
          ) : (
            activities.map((act) => (
              <div
                key={act._id}
                className="p-3 rounded-xl bg-[#FAF2E4] border border-[#E8DAC2] text-xs flex items-start space-x-3"
              >
                <div className="w-7 h-7 rounded-full bg-[#10B981]/20 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#3B1B0D]">{act.action}</p>
                  <p className="text-gray-600 text-[11px] mt-0.5">{act.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Export / Done */}
        <div className="mt-5 pt-3 border-t border-[#EEDFCA] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#3B1B0D] hover:bg-[#4E2715] text-[#FFF4DF] text-xs font-bold rounded-xl shadow-md"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
