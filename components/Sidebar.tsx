'use client';

import React from 'react';
import {
  LuHouse as Home,
  LuUsers as Users,
  LuCalendar as Calendar,
  LuHistory as History,
  LuBell as Bell,
} from 'react-icons/lu';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  unreadCount?: number;
  isLoggedIn?: boolean;
  onCreateGroup?: () => void;
  onOpenGroups?: () => void;
  onOpenCalendar?: () => void;
  onOpenHistory?: () => void;
  onOpenNotifications?: () => void;
}

export default function Sidebar({
  activeTab = 'dashboard',
  onTabChange,
  unreadCount = 0,
  isLoggedIn = false,
  onOpenGroups,
  onOpenCalendar,
  onOpenHistory,
  onOpenNotifications,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => onTabChange?.('dashboard') },
    { id: 'groups', label: 'My Groups', icon: Users, action: () => { onTabChange?.('groups'); onOpenGroups?.(); } },
    { id: 'calendar', label: 'Chai Calendar', icon: Calendar, action: () => { onTabChange?.('calendar'); onOpenCalendar?.(); } },
    { id: 'history', label: 'History & Bills', icon: History, action: () => { onTabChange?.('history'); onOpenHistory?.(); } },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount, action: () => { onTabChange?.('notifications'); onOpenNotifications?.(); } },
  ];

  return (
    <aside className="hidden xl:flex flex-col justify-between w-60 h-screen max-h-screen bg-[#361D0D] text-[#FFF4DF] border-r border-[#4A2813] shadow-2xl shrink-0 fixed top-0 left-0 bottom-0 select-none z-30 overflow-hidden">
      {/* Navigation Menu */}
      <nav className="px-3.5 pt-4 pb-2 space-y-1 w-full shrink-0">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[12.5px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F4B52E] text-[#281308] shadow-md shadow-[#F4B52E]/20 font-bold'
                    : 'text-[#FFF4DF] hover:bg-[#482813]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#281308] stroke-[2.5]' : 'text-[#FFF4DF] stroke-[2]'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-[#E53935] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cozy Tapri Info Card when Not Logged In */}
        {!isLoggedIn && (
          <div className="pt-2 px-0.5">
            <div className="p-3 rounded-2xl bg-[#261206]/90 border border-[#F4B52E]/30 shadow-md">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">☕</span>
                <span className="font-kalam text-xs font-bold text-[#F4B52E] tracking-wide">
                  Office Chai Adda
                </span>
              </div>
              <p className="text-[10.5px] text-[#E0CDBC] leading-relaxed">
                Roz ki chai duty baanto, bills ka hisaab rakho, aur tapri par charcha karo!
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Section: Full Cutting Chai Glass Artwork + Kodetri Technologies Badge */}
      <div className="relative w-full h-[340px] sm:h-[360px] shrink-0 mt-auto flex flex-col justify-end overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#361D0D] via-[#361D0D]/40 to-transparent z-10 pointer-events-none" />

        <img
          src="/images/Chai%20Pe%20Charcha%20at%20Golden%20Hour.png"
          alt="Chai Pe Charcha at Golden Hour"
          className="absolute inset-0 w-full h-full object-cover object-[center_12%] pointer-events-none select-none"
        />

        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 p-3 w-full">
          <a
            href="https://kodetri.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-2.5 rounded-xl bg-[#1C0D05]/85 hover:bg-[#150903]/95 backdrop-blur-md border border-[#F4B52E]/35 hover:border-[#F4B52E]/80 transition-all duration-200 shadow-xl"
            title="Visit Kodetri Technologies"
          >
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-bold tracking-wider text-[#E5CCA8] group-hover:text-[#F4B52E] transition-colors uppercase flex items-center gap-1">
                <span>🤝</span> Partner By
              </span>
              <span className="text-[#E5CCA8] group-hover:text-[#F4B52E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150">
                ↗
              </span>
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className="font-sans font-bold text-xs text-[#FFF4DF] group-hover:text-[#F4B52E] transition-colors leading-tight truncate">
                Kodetri Technologies
              </span>
              <span className="text-[9px] font-mono text-[#D8BBA2]/80 group-hover:text-white transition-colors shrink-0">
                kodetri.com
              </span>
            </div>
          </a>
        </div>
      </div>
    </aside>
  );
}
