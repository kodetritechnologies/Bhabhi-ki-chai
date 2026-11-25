'use client';

import React from 'react';
import {
  LuHouse as Home,
  LuUsers as Users,
  LuSquarePlus as SquarePlus,
  LuUserPlus as UserPlus,
  LuBell as Bell,
} from 'react-icons/lu';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  unreadCount?: number;
  onCreateGroup?: () => void;
  onOpenNotifications?: () => void;
}

export default function Sidebar({
  activeTab = 'dashboard',
  onTabChange,
  unreadCount = 3,
  onCreateGroup,
  onOpenNotifications,
}: SidebarProps) {
  const topMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => onTabChange?.('dashboard') },
    { id: 'groups', label: 'My Groups', icon: Users, action: () => onTabChange?.('groups') },
    { id: 'create', label: 'Create Group', icon: SquarePlus, action: onCreateGroup },
    { id: 'join', label: 'Join Group', icon: UserPlus, action: onCreateGroup },
  ];

  const bottomMenuItems = [
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount, action: onOpenNotifications },
  ];

  const renderMenuItem = (item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    action?: () => void;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
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
  };

  return (
    <aside className="hidden xl:flex flex-col justify-between w-60 h-screen max-h-screen bg-[#361D0D] text-[#FFF4DF] border-r border-[#4A2813] shadow-2xl shrink-0 fixed top-0 left-0 bottom-0 select-none z-30 overflow-hidden">
      {/* Navigation Menu */}
      <nav className="px-3.5 pt-4 pb-2 space-y-1 w-full shrink-0">
        {/* Top Group: Dashboard, My Groups, Create Group, Join Group */}
        <div className="space-y-1">
          {topMenuItems.map(renderMenuItem)}
        </div>

        {/* Subtle Horizontal Divider Line */}
        <div className="py-2">
          <div className="border-b border-[#4A2813]/80 mx-1" />
        </div>

        {/* Bottom Group: Notifications (with red badge 3), Settings */}
        <div className="space-y-1">
          {bottomMenuItems.map(renderMenuItem)}
        </div>
      </nav>

      {/* Bottom Section: Full Cutting Chai Glass Artwork + Kodetri Technologies Badge at the Bottom */}
      <div className="relative w-full flex-1 min-h-[160px] flex flex-col justify-end overflow-hidden">
        {/* Top Fade Gradient for seamless melt from dark sidebar background into artwork */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#361D0D] via-[#361D0D]/65 to-transparent z-10 pointer-events-none" />

        {/* The Golden Hour Cutting Chai Glass Artwork - Centered right on the glass cup! */}
        <img
          src="/images/Chai%20Pe%20Charcha%20at%20Golden%20Hour.png"
          alt="Chai Pe Charcha at Golden Hour"
          className="absolute inset-0 w-full h-full object-cover object-[center_46%] pointer-events-none select-none"
        />

        {/* Bottom Vignette gradient behind badge for sharp contrast & legibility */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />

        {/* Kodetri Technologies Company Branding Pill at the Bottom */}
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
