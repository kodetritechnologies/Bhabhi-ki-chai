'use client';

import React, { useState, useEffect } from 'react';
import {
  LuX as X,
  LuCheck as Check,
  LuCreditCard as CreditCard,
} from 'react-icons/lu';
import confetti from 'canvas-confetti';

interface CompleteDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  duty?: {
    _id: string;
    dutyDate: string;
    assignedUserId?: {
      _id: string;
      name: string;
    };
  };
  members?: Array<{
    userId: {
      _id: string;
      name: string;
    };
  }>;
  onSuccess?: () => void;
}

export default function CompleteDutyModal({
  isOpen,
  onClose,
  duty,
  members = [],
  onSuccess,
}: CompleteDutyModalProps) {
  const [amount, setAmount] = useState('100');
  const [paidByUserId, setPaidByUserId] = useState(duty?.assignedUserId?._id || '');
  const [guestPayerName, setGuestPayerName] = useState('');
  const [shiftTurnOnGuest, setShiftTurnOnGuest] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [note, setNote] = useState('4 Special Cutting Chai');
  const [submitting, setSubmitting] = useState(false);

  const isGuestSelected = paidByUserId === '__guest__';

  useEffect(() => {
    if (isOpen) {
      setAmount('100');
      setPaidByUserId(duty?.assignedUserId?._id || '');
      setGuestPayerName('');
      setShiftTurnOnGuest(true);
      setPaymentStatus('paid');
      setNote('4 Special Cutting Chai');
    }
  }, [isOpen, duty?._id, duty?.assignedUserId?._id]);

  if (!isOpen || !duty) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuestSelected && !guestPayerName.trim()) {
      alert('Kripya guest / bahar wale payer ka naam enter karein.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/duty/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dutyId: duty._id,
          amount: Number(amount) || 100,
          paidByUserId: isGuestSelected ? undefined : paidByUserId || duty.assignedUserId?._id,
          guestPayerName: isGuestSelected ? guestPayerName.trim() : '',
          shiftTurnOnGuest: isGuestSelected ? shiftTurnOnGuest : false,
          paymentStatus,
          note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F4B52E', '#C96B3B', '#5C8B55', '#4A2412'],
          });
        } catch {
          // ignore if canvas not supported
        }

        onSuccess?.();
        onClose();
      } else {
        alert(data.error || 'Failed to complete duty');
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
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F2E5D3] text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[#EEDFCA]">
          <div className="w-12 h-12 rounded-2xl bg-[#F4B52E]/30 text-[#8C4610] flex items-center justify-center font-bold text-2xl shadow-inner">
            ☕
          </div>
          <div>
            <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] leading-none">
              Mark Chai Completed
            </h3>
            <p className="text-xs text-[#734A29] mt-1 font-medium">
              Record bill & payment for {duty.dutyDate}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bill Amount */}
          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Chai Bill Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#8C4610]">
                ₹
              </span>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D5BEA1] bg-white font-mono font-bold text-lg text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
                placeholder="100"
              />
            </div>
          </div>

          {/* Paid By Member / Guest */}
          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Paid By
            </label>
            <select
              value={paidByUserId || duty.assignedUserId?._id || ''}
              onChange={(e) => setPaidByUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5BEA1] bg-white text-xs font-medium text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
            >
              {members.map((m) => (
                <option key={m.userId?._id} value={m.userId?._id}>
                  {m.userId?.name}
                </option>
              ))}
              <option value="__guest__">👤 Guest / Bahar ka Banda (Other)</option>
            </select>

            {isGuestSelected && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAF2E4] border border-[#E2CAA7] space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A2412] mb-1">
                    Guest / Payer ka Naam *
                  </label>
                  <input
                    type="text"
                    required
                    value={guestPayerName}
                    onChange={(e) => setGuestPayerName(e.target.value)}
                    placeholder="e.g. Ramesh Sir / Client"
                    className="w-full px-3 py-2 rounded-lg border border-[#D5BEA1] bg-white text-xs text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
                  />
                </div>
                <label className="flex items-start gap-2 text-[11px] text-[#5E2B08] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftTurnOnGuest}
                    onChange={(e) => setShiftTurnOnGuest(e.target.checked)}
                    className="mt-0.5 accent-[#8C4610] cursor-pointer"
                  />
                  <span>
                    Aaj wale member ({duty.assignedUserId?.name || 'Member'}) ki baari kal shift karein (kyunki treat guest ne di hai)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Payment Status (PRD crucial requirement: Separate from duty status!) */}
          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1.5">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  paymentStatus === 'paid'
                    ? 'bg-[#10B981] text-white border-[#059669] shadow-sm'
                    : 'bg-[#F9EDE0] text-gray-700 border-[#DFC9B2]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Paid by Member</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  paymentStatus === 'pending'
                    ? 'bg-[#F59E0B] text-white border-[#D97706] shadow-sm'
                    : 'bg-[#F9EDE0] text-gray-700 border-[#DFC9B2]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment Pending</span>
              </button>
            </div>
          </div>

          {/* Note / Chai Details */}
          <div>
            <label className="block text-xs font-bold text-[#4A2412] mb-1">
              Tapri Note / Items
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D5BEA1] bg-white text-xs text-[#3B1B0D] focus:ring-2 focus:ring-[#F4B52E] outline-none"
              placeholder="e.g. 4 Adrak Chai + Bun Maska"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-[#3B1B0D] hover:bg-[#4E2715] text-[#FFF4DF] font-bold text-sm shadow-xl flex items-center justify-center space-x-2 border-2 border-[#F4B52E] transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4 text-[#F4B52E]" />
              <span>{submitting ? 'Recording...' : 'Confirm & Mark Completed ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
