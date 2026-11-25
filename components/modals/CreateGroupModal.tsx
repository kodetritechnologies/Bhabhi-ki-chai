'use client';

import React, { useState } from 'react';
import {
  LuX as X,
  LuPlus as Plus,
  LuUsers as Users,
  LuClock as Clock,
  LuCalendar as Calendar,
} from 'react-icons/lu';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chaiTime, setChaiTime] = useState('10:30 AM');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mon to Sat
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const dayLabels = [
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
    { day: 0, label: 'Sun' },
  ];

  const toggleDay = (day: number) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          chaiTime,
          workingDays,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess?.(data.group._id);
        onClose();
      } else {
        alert(data.error || 'Failed to create group');
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
            ☕
          </div>
          <div>
            <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] leading-none">
              Create Chai Group
            </h3>
            <p className="text-xs text-[#734A29] mt-1 font-medium">
              Start a new chai circle with friends or colleagues
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Group Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5BEA1] bg-white text-sm font-semibold text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
              placeholder="e.g. Marketing Chai Gang"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D5BEA1] bg-white text-xs text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
              placeholder="e.g. Daily cutting chai break at 10:30 AM"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Chai Time
            </label>
            <input
              type="text"
              value={chaiTime}
              onChange={(e) => setChaiTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D5BEA1] bg-white text-xs text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
              placeholder="e.g. 10:30 AM"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
              Active Chai Days (Working Days)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {dayLabels.map(({ day, label }) => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      isSelected
                        ? 'bg-[#3B1B0D] text-[#FFF4DF] border-[#3B1B0D]'
                        : 'bg-white text-gray-600 border-[#D5BEA1]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Chai duty will only be scheduled on selected days.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-[#3B1B0D] hover:bg-[#4E2715] text-[#FFF4DF] font-bold text-sm shadow-xl flex items-center justify-center space-x-2 border-2 border-[#F4B52E] transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-[#F4B52E]" />
              <span>{submitting ? 'Creating Group...' : 'Create Chai Group ☕'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
