'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LuX as X,
  LuCircleCheck as CheckCircle2,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuDownload as Download,
  LuIndianRupee as Rupee,
  LuClock as Clock,
} from 'react-icons/lu';

interface ActivityItem {
  _id: string;
  action: string;
  reason?: string;
  createdAt?: string | Date;
}

interface PaymentItem {
  _id: string;
  dutyDate: string;
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'not_recorded';
  note?: string;
  paidByUserId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | null;
}

interface MemberSummaryItem {
  userId: string;
  name: string;
  totalPaid: number;
  totalPending: number;
  count: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  activities?: ActivityItem[];
  totalExpenses?: number;
  totalChaiDays?: number;
  onPaymentUpdated?: () => void;
}

const PAGE_SIZE = 5;

function formatActionTitle(action: string): string {
  const map: Record<string, string> = {
    group_created: 'Group Created',
    member_joined: 'Member Joined',
    group_updated: 'Group Updated',
  };
  return map[action] || action;
}

function formatDateTime(dt?: string | Date): string {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function HistoryModal({
  isOpen,
  onClose,
  groupId,
  activities = [],
  totalExpenses = 0,
  totalChaiDays = 0,
  onPaymentUpdated,
}: HistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'activity'>('payments');

  // Activity Log state
  const [actPage, setActPage] = useState(1);
  const [actTotalPages, setActTotalPages] = useState(1);
  const [actTotalCount, setActTotalCount] = useState(0);
  const [actItems, setActItems] = useState<ActivityItem[]>([]);
  const [actLoading, setActLoading] = useState(false);

  // Payment History state
  const [payPage, setPayPage] = useState(1);
  const [payTotalPages, setPayTotalPages] = useState(1);
  const [payTotalCount, setPayTotalCount] = useState(0);
  const [payItems, setPayItems] = useState<PaymentItem[]>([]);
  const [memberSummary, setMemberSummary] = useState<MemberSummaryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [payLoading, setPayLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isDemo = !groupId || groupId.startsWith('demo-');

  useEffect(() => {
    if (isOpen) {
      setActPage(1);
      setPayPage(1);
    }
  }, [isOpen, groupId]);

  // Fetch Activity Log page
  useEffect(() => {
    if (!isOpen || activeTab !== 'activity') return;

    if (isDemo) {
      const start = (actPage - 1) * PAGE_SIZE;
      setActItems(activities.slice(start, start + PAGE_SIZE));
      setActTotalCount(activities.length);
      setActTotalPages(Math.max(1, Math.ceil(activities.length / PAGE_SIZE)));
      return;
    }

    let cancelled = false;
    const fetchPage = async () => {
      setActLoading(true);
      try {
        const res = await fetch(
          `/api/history?groupId=${encodeURIComponent(groupId!)}&page=${actPage}&limit=${PAGE_SIZE}`
        );
        const json = await res.json();
        if (!cancelled && json.success) {
          setActItems(json.activities || []);
          setActTotalCount(json.totalCount || 0);
          setActTotalPages(json.totalPages || 1);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        if (!cancelled) setActLoading(false);
      }
    };

    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, groupId, actPage, isDemo, activities]);

  // Fetch Payment History page
  const fetchPayments = useCallback(async () => {
    if (!isOpen || activeTab !== 'payments') return;

    if (isDemo) {
      const names = ['Rahul', 'Amit', 'Sandeep', 'Vikas'];
      const notes = [
        '4 Special Adrak Chai + Toast',
        '5 Cutting Chai + Samosa',
        '3 Masala Chai + Bun Maska',
        '6 Regular Chai + Biscuit',
      ];
      const demoPayments: PaymentItem[] = Array.from({ length: 12 }, (_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - idx);
        return {
          _id: `demo-p${idx + 1}`,
          dutyDate: d.toISOString().slice(0, 10),
          amount: 50 + (idx % 4) * 20,
          paymentStatus: idx % 3 === 1 ? 'pending' : 'paid',
          note: notes[idx % notes.length],
          paidByUserId: { name: names[idx % names.length] },
        };
      });
      const filtered =
        statusFilter === 'all'
          ? demoPayments
          : demoPayments.filter((p) => p.paymentStatus === statusFilter);
      const start = (payPage - 1) * PAGE_SIZE;
      setPayItems(filtered.slice(start, start + PAGE_SIZE));
      setPayTotalCount(filtered.length);
      setPayTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
      setMemberSummary([
        { userId: 'u1', name: 'Rahul', totalPaid: 150, totalPending: 0, count: 3 },
        { userId: 'u2', name: 'Amit', totalPaid: 140, totalPending: 70, count: 3 },
        { userId: 'u3', name: 'Sandeep', totalPaid: 270, totalPending: 0, count: 3 },
        { userId: 'u4', name: 'Vikas', totalPaid: 220, totalPending: 110, count: 3 },
      ]);
      return;
    }

    setPayLoading(true);
    try {
      const res = await fetch(
        `/api/payments?groupId=${encodeURIComponent(groupId!)}&page=${payPage}&limit=${PAGE_SIZE}&status=${statusFilter}`
      );
      const json = await res.json();
      if (json.success) {
        setPayItems(json.payments || []);
        setPayTotalCount(json.totalCount || 0);
        setPayTotalPages(json.totalPages || 1);
        setMemberSummary(json.memberSummary || []);
      }
    } catch (err) {
      console.error('Payments fetch error:', err);
    } finally {
      setPayLoading(false);
    }
  }, [isOpen, activeTab, isDemo, groupId, payPage, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleMarkPaid = async (entryId: string) => {
    if (isDemo) return;
    setUpdatingId(entryId);
    try {
      const res = await fetch('/api/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, paymentStatus: 'paid' }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchPayments();
        onPaymentUpdated?.();
      }
    } catch (err) {
      console.error('Mark paid error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl p-5 sm:p-6 shadow-2xl text-[#2B211B] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F2E5D3] text-gray-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-[#EEDFCA]">
          <div className="w-11 h-11 rounded-2xl bg-[#F4B52E]/30 text-[#8C4610] flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
            📜
          </div>
          <div>
            <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] leading-none">
              Chai History & Reports
            </h3>
            <p className="text-xs text-[#734A29] mt-1 font-medium">
              Kisne kab kitna pay kiya aur group activity trail
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2.5 bg-[#FAF2E4] rounded-2xl border border-[#E8DAC2] text-center">
            <span className="text-[11px] text-gray-600 block">Chai Days This Month</span>
            <span className="text-xl font-mono font-extrabold text-[#3B1B0D]">
              {totalChaiDays}
            </span>
          </div>
          <div className="p-2.5 bg-[#FAF2E4] rounded-2xl border border-[#E8DAC2] text-center">
            <span className="text-[11px] text-gray-600 block">Total Group Spend</span>
            <span className="text-xl font-mono font-extrabold text-[#059669]">
              ₹{totalExpenses}
            </span>
          </div>
        </div>

        {/* Tabs: Payment History vs Activity Log */}
        <div className="flex gap-2 mb-3 bg-[#F2E5D3] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#3B1B0D] text-[#F4B52E] shadow-xs'
                : 'text-[#6E492D] hover:text-[#3B1B0D]'
            }`}
          >
            💳 Payment History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-[#3B1B0D] text-[#F4B52E] shadow-xs'
                : 'text-[#6E492D] hover:text-[#3B1B0D]'
            }`}
          >
            📅 Activity Log
          </button>
        </div>

        {/* TAB 1: PAYMENT HISTORY */}
        {activeTab === 'payments' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter + CSV Export */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1">
                {(['all', 'paid', 'pending'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setPayPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize border cursor-pointer transition-colors ${
                      statusFilter === st
                        ? 'bg-[#8C4610] text-[#FFF4DF] border-[#8C4610]'
                        : 'bg-white text-[#6E492D] border-[#DFC39B] hover:bg-[#FAF2E4]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {!isDemo && payTotalCount > 0 && (
                <a
                  href={`/api/payments?groupId=${encodeURIComponent(groupId!)}&status=${statusFilter}&export=csv`}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF2E4] hover:bg-[#F2E5D3] border border-[#DFC39B] text-[#3B1B0D] text-[11px] font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> CSV
                </a>
              )}
            </div>

            {/* Member-wise Totals Strip */}
            {memberSummary.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {memberSummary.map((m) => (
                  <span
                    key={m.userId}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4CF96]/60 border border-[#DEB578] text-[#3B1B0D]"
                  >
                    {m.name}: ₹{m.totalPaid}
                    {m.totalPending > 0 ? ` (+₹${m.totalPending} pending)` : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Payment List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {payLoading ? (
                <p className="text-center text-xs text-gray-500 py-8">Payments load ho rahe hain...</p>
              ) : payItems.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-6">Koi payment record nahi mila</p>
              ) : (
                payItems.map((p) => {
                  const isPending = p.paymentStatus === 'pending';
                  return (
                    <div
                      key={p._id}
                      className="p-2.5 rounded-xl bg-[#FAF2E4] border border-[#E8DAC2] text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isPending
                              ? 'bg-[#F59E0B]/20 text-[#D97706]'
                              : 'bg-[#10B981]/20 text-[#059669]'
                          }`}
                        >
                          {isPending ? <Clock className="w-3.5 h-3.5" /> : <Rupee className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#3B1B0D]">
                              {p.paidByUserId?.name || 'Member'}
                            </span>
                            <span className="text-[10px] text-[#8C6042]">• {p.dutyDate}</span>
                          </div>
                          {p.note && (
                            <p className="text-[11px] text-gray-600 break-words mt-0.5">{p.note}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono font-extrabold text-sm text-[#3B1B0D]">
                          ₹{p.amount}
                        </span>
                        {isPending ? (
                          <button
                            type="button"
                            disabled={isDemo || updatingId === p._id}
                            onClick={() => handleMarkPaid(p._id)}
                            className="px-2 py-0.5 rounded-md bg-[#F59E0B] hover:bg-[#D97706] text-white text-[10px] font-bold cursor-pointer disabled:opacity-60"
                          >
                            {updatingId === p._id ? 'Saving...' : 'Mark Paid'}
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#059669] text-[10px] font-bold">
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {payTotalCount > PAGE_SIZE && (
              <div className="mt-3 pt-2 border-t border-[#EEDFCA] flex items-center justify-between text-xs text-[#734A29]">
                <span className="font-medium">
                  Page {payPage} of {payTotalPages} ({payTotalCount} entries)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPayPage((p) => Math.max(1, p - 1))}
                    disabled={payPage <= 1 || payLoading}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF2E4] border border-[#DFC39B] hover:bg-[#F2E5D3] text-[#3B1B0D] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayPage((p) => Math.min(payTotalPages, p + 1))}
                    disabled={payPage >= payTotalPages || payLoading}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF2E4] border border-[#DFC39B] hover:bg-[#F2E5D3] text-[#3B1B0D] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: ACTIVITY LOG */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
              {actLoading ? (
                <p className="text-center text-xs text-gray-500 py-8">History load ho rahi hai...</p>
              ) : actItems.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-6">No historical entries</p>
              ) : (
                actItems.map((act) => (
                  <div
                    key={act._id}
                    className="p-3 rounded-xl bg-[#FAF2E4] border border-[#E8DAC2] text-xs flex items-start space-x-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#10B981]/20 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-[#3B1B0D] leading-snug">
                          {formatActionTitle(act.action)}
                        </p>
                        {act.createdAt && (
                          <span className="text-[10px] text-[#8C6042] shrink-0 whitespace-nowrap">
                            {formatDateTime(act.createdAt)}
                          </span>
                        )}
                      </div>
                      {act.reason && (
                        <p className="text-gray-600 text-[11px] mt-0.5 break-words">{act.reason}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {actTotalCount > PAGE_SIZE && (
              <div className="mt-3 pt-2 border-t border-[#EEDFCA] flex items-center justify-between text-xs text-[#734A29]">
                <span className="font-medium">
                  Page {actPage} of {actTotalPages} ({actTotalCount} entries)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActPage((p) => Math.max(1, p - 1))}
                    disabled={actPage <= 1 || actLoading}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF2E4] border border-[#DFC39B] hover:bg-[#F2E5D3] text-[#3B1B0D] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setActPage((p) => Math.min(actTotalPages, p + 1))}
                    disabled={actPage >= actTotalPages || actLoading}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF2E4] border border-[#DFC39B] hover:bg-[#F2E5D3] text-[#3B1B0D] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export / Done */}
        <div className="mt-4 pt-3 border-t border-[#EEDFCA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#3B1B0D] hover:bg-[#4E2715] text-[#FFF4DF] text-xs font-bold rounded-xl shadow-md cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
