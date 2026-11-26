'use client';

import React, { useState, useRef } from 'react';
import {
  LuCircleCheck as CheckCircle2,
  LuBell as Bell,
  LuUserPlus as UserPlus,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
} from 'react-icons/lu';

interface ActivityItem {
  _id: string;
  action: string;
  reason?: string;
  createdAt?: string | Date;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  timeAgoText?: string;
}

function formatActionTitle(action: string): string {
  const map: Record<string, string> = {
    group_created: 'Group Created',
    member_joined: 'Member Joined',
    group_updated: 'Group Updated',
  };
  return map[action] || action;
}

function formatActivityTime(dt?: string | Date): string {
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

export function RecentActivityCard({
  recentActivity = [],
  onViewHistory,
}: {
  recentActivity?: ActivityItem[];
  onViewHistory?: () => void;
}) {
  return (
    <div className="tapri-card p-5 bg-[#FFF9ED] border-2 border-[#E2CAA7] rounded-3xl shadow-lg h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#EEDFCA]">
          <h4 className="font-kalam text-xl font-bold text-[#3B1B0D] flex items-center gap-2">
            <span>📅</span> Recent Activity
          </h4>
          <button
            onClick={onViewHistory}
            className="text-xs font-bold text-[#9E4D1A] hover:underline"
          >
            View History →
          </button>
        </div>

        <div className="mt-3.5 space-y-2.5">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No recent activity yet</p>
          ) : (
            recentActivity.slice(0, 3).map((act) => {
              const isChai = act.action.includes('Chai');
              const isReminder = act.action.includes('Reminder');

              return (
                <div
                  key={act._id}
                  className="flex items-start space-x-2.5 text-xs p-2.5 rounded-xl bg-[#FAF2E4] border border-[#E8DAC2]"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isChai
                        ? 'bg-[#10B981]/15 text-[#059669]'
                        : isReminder
                        ? 'bg-[#F59E0B]/15 text-[#D97706]'
                        : 'bg-[#3B82F6]/15 text-[#2563EB]'
                    }`}
                  >
                    {isChai ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isReminder ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-[#3B1B0D] leading-snug break-words">
                        {formatActionTitle(act.action)}
                      </p>
                      {act.createdAt && (
                        <span className="text-[9px] text-[#8C6042] shrink-0 whitespace-nowrap">
                          {formatActivityTime(act.createdAt)}
                        </span>
                      )}
                    </div>
                    {act.reason && (
                      <p className="text-gray-600 text-[11px] leading-snug break-words mt-0.5">
                        {act.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationsCard({
  notifications = [],
  onClearNotifications,
}: {
  notifications?: NotificationItem[];
  onClearNotifications?: () => void;
}) {
  const recentNotifications = notifications.slice(0, 4);
  const unreadCount = recentNotifications.filter((n) => !n.read).length;

  return (
    <div className="tapri-dark-card p-5 rounded-3xl border border-[#522915] shadow-lg h-full flex flex-col justify-between select-none">
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#522915]">
          <h4 className="font-kalam text-lg sm:text-xl font-bold text-[#FFF4DF] flex items-center gap-1.5 min-w-0">
            <span className="shrink-0">🔔</span>
            <span className="truncate">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-[#EF4444] text-white px-1.5 py-0.5 rounded-full font-sans font-bold shrink-0">
                {unreadCount}
              </span>
            )}
          </h4>

          {unreadCount > 0 && onClearNotifications && (
            <button
              type="button"
              onClick={onClearNotifications}
              className="text-[11px] font-bold text-[#F4B52E] hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              Mark Read
            </button>
          )}
        </div>

        {recentNotifications.length === 0 ? (
          <p className="text-xs text-[#CDB29B] py-8 text-center">No notifications yet</p>
        ) : (
          <div className="mt-3.5 space-y-2">
            {recentNotifications.map((n) => (
              <div
                key={n._id}
                className={`p-2.5 rounded-xl border text-xs flex items-start space-x-2.5 transition-colors ${
                  !n.read
                    ? 'bg-[#4E2715]/70 border-[#F4B52E]/40 text-[#FFF4DF]'
                    : 'bg-[#2E150A] border-[#4A2412] text-[#D8BBA2]'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#F4B52E]/20 text-[#F4B52E] flex items-center justify-center shrink-0 mt-0.5 text-xs">
                  ☕
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#FFF4DF] leading-tight truncate">{n.title}</p>
                  <p className="text-[11px] text-[#D8BBA2] mt-0.5 truncate">{n.message}</p>
                  <span className="text-[9px] text-[#A68770] mt-1 inline-block">
                    {n.timeAgoText || 'recently'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecentActivityAndNotifications({
  recentActivity = [],
  notifications = [],
  onViewHistory,
  onClearNotifications,
}: {
  recentActivity?: ActivityItem[];
  notifications?: NotificationItem[];
  onViewHistory?: () => void;
  onClearNotifications?: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RecentActivityCard recentActivity={recentActivity} onViewHistory={onViewHistory} />
      <NotificationsCard notifications={notifications} onClearNotifications={onClearNotifications} />
    </div>
  );
}
