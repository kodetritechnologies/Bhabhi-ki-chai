'use client';

import React from 'react';
import {
  LuHouse as Home,
  LuCalendar as Calendar,
  LuUsers as Users,
  LuHistory as History,
  LuBell as Bell,
} from 'react-icons/lu';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileBottomNav({
  activeTab = 'home',
  onTabChange,
}: MobileBottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'notifications', label: 'Alerts', icon: Bell },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#33180B] border-t border-[#522915] xl:hidden px-1.5 sm:px-3 py-1 sm:py-1.5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-xl transition-all min-w-[48px] sm:min-w-[56px] min-h-[44px] sm:min-h-[48px] cursor-pointer ${
                isActive
                  ? 'text-[#F4B52E] font-bold'
                  : 'text-[#D8BBA2] hover:text-[#FFF4DF]'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-[#F4B52E] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
