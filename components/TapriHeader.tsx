'use client';

import React, { useState } from 'react';
import {
  LuBell as Bell,
  LuChevronDown as ChevronDown,
  LuCheck as Check,
  LuPlus as Plus,
  LuUsers as Users,
  LuHistory as HistoryIcon,
} from 'react-icons/lu';
import Image from 'next/image';

interface TapriHeaderProps {
  currentUser?: {
    name: string;
    avatar: string;
    email: string;
  };
  currentGroup?: {
    _id: string;
    name: string;
    inviteCode?: string;
  };
  groups?: Array<{
    _id: string;
    name: string;
    role: string;
  }>;
  notifications?: Array<{
    _id: string;
    title: string;
    message: string;
    read: boolean;
    timeAgoText?: string;
  }>;
  unreadCount?: number;
  onSelectGroup?: (groupId: string) => void;
  onOpenCreateGroup?: () => void;
  onMarkNotificationsRead?: () => void;
  onOpenHistory?: () => void;
}

export default function TapriHeader({
  currentUser = { name: 'Rahul', avatar: '/images/default-avatar.png', email: 'rahul@example.com' },
  currentGroup,
  groups = [],
  notifications = [],
  unreadCount = 3,
  onSelectGroup,
  onOpenCreateGroup,
  onMarkNotificationsRead,
  onOpenHistory,
}: TapriHeaderProps) {
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const avatarSrc = currentUser?.avatar || '/images/default-avatar.png';
  const isAnyMenuOpen = showGroupMenu || showNotifMenu || showUserMenu;

  const renderProfileDropdown = () => (
    <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-[#FFF9ED] text-[#2B211B] rounded-2xl shadow-2xl border border-[#E6D2B5] py-2 z-50 overflow-hidden select-none animate-in fade-in slide-in-from-top-1 duration-150">
      {/* Profile Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#FDE8CE] via-[#FCE3C8] to-[#FFF3DF] border-b border-[#EEDFCA] flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-[#F4B52E] shadow-sm shrink-0 bg-[#361D0D]">
          <Image
            src={avatarSrc}
            alt={currentUser?.name || 'Rahul'}
            fill
            className="object-cover"
            unoptimized
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] rounded-full ring-2 ring-white"
            title="Online"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-[#3B1B0D] truncate">
              {currentUser?.name || 'Rahul'}
            </span>
            <span className="text-[10px] bg-[#F4B52E]/30 text-[#8C4610] font-bold px-1.5 py-0.2 rounded-md">
              Chai Admin
            </span>
          </div>
          <p className="text-[11px] text-[#7A695E] truncate">
            {currentUser?.email || 'rahul@example.com'}
          </p>
        </div>
      </div>

      {/* Quick Chai Circle Info */}
      <div className="px-3.5 py-2 bg-[#FAF0E1]/80 border-b border-[#EEDFCA] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#54433A]">
          <span className="text-sm">☕</span>
          <span className="font-semibold text-[11px]">Active Circle:</span>
        </div>
        <span className="font-bold text-[11px] text-[#8C4610] bg-[#FCE4CB] px-2 py-0.5 rounded-full truncate max-w-[140px]">
          {currentGroup?.name || 'Office Chai Group'}
        </span>
      </div>

      {/* Menu Options */}
      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            setShowUserMenu(false);
            setShowGroupMenu(true);
          }}
          className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-[#3B1B0D] hover:bg-[#F4E3C7] transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4 text-[#8C4610] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block truncate">My Chai Circles</span>
            <span className="text-[10px] text-[#7A695E] block truncate">Switch or create chai groups</span>
          </div>
          <span className="text-[10px] bg-[#E8DAC0] text-[#4A2412] font-bold px-1.5 py-0.5 rounded-full shrink-0">
            {groups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowUserMenu(false);
            onOpenHistory?.();
          }}
          className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-[#3B1B0D] hover:bg-[#F4E3C7] transition-colors cursor-pointer"
        >
          <HistoryIcon className="w-4 h-4 text-[#8C4610] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block truncate">Duty History & Logs</span>
            <span className="text-[10px] text-[#7A695E] block truncate">Past duties, expenses & rota</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifMenu(true);
          }}
          className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 text-[#3B1B0D] hover:bg-[#F4E3C7] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4 text-[#8C4610] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block truncate">Chai Notifications</span>
            <span className="text-[10px] text-[#7A695E] block truncate">Duty turn alerts & reminders</span>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[#EF4444] text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Footer Tagline */}
      <div className="border-t border-[#EEDFCA] mt-1 pt-1.5 px-3 pb-1 flex items-center justify-between text-[11px] text-[#8C6042]">
        <span className="font-hand italic">Chai pe charcha, roz ka maja! ☕</span>
        <span className="text-[10px] text-[#1E7238] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E7238]" /> Active
        </span>
      </div>
    </div>
  );

  const renderNotificationsDropdown = () => (
    <div className="absolute right-0 mt-2 w-72 sm:w-88 max-w-[calc(100vw-24px)] bg-[#FFF9ED] text-[#2B211B] rounded-2xl shadow-2xl border border-[#E6D2B5] py-2 z-50">
      <div className="px-4 py-2 border-b border-[#EEDFCA] flex items-center justify-between">
        <span className="font-bold text-xs text-[#4A2412]">🔔 Notifications</span>
        <span className="text-[10px] font-semibold text-[#8C6042] bg-[#F4E3C7] px-2 py-0.5 rounded-full">
          {unreadCount} new
        </span>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-[#F0E4D2]">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">No new notifications</div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="p-3 text-xs hover:bg-[#FAF0E1]">
              <p className="font-bold text-[#3B1B0D]">{n.title}</p>
              <p className="text-gray-600 text-[11px] mt-0.5">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <header className={`w-full relative select-none ${isAnyMenuOpen ? 'z-40' : 'z-10'}`}>
      {/* Click Outside Backdrop for All Dropdowns */}
      {(showGroupMenu || showNotifMenu || showUserMenu) && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[0.5px]"
          onClick={() => {
            setShowGroupMenu(false);
            setShowNotifMenu(false);
            setShowUserMenu(false);
          }}
        />
      )}

      {/* REAL AUTHENTIC TAPRI COUNTER HERO BANNER (With Mini-Header Removed on Mobile) */}
      <div className="relative w-full">
        {/* Master Tapri Counter Hero Banner Image */}
        <div className="relative w-full aspect-[2172/724] min-h-[160px] sm:min-h-[220px] max-h-[380px] overflow-hidden bg-[#261207]">
          <img
            src="/images/Bhabhi%20Ki%20Chai_%20Cozy%20Tea%20Stall%20Banner.png"
            alt="Bhabhi Ki Chai - Cozy Tea Stall Banner"
            className="w-full h-full object-cover object-center pointer-events-none select-none"
          />

          {/* Subtle warm ambient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/25 pointer-events-none" />

          {/* Top Floating Controls on Desktop & Tablet (Group Selector, Notifications & Rahul Profile) */}
          <div className="absolute top-2 sm:top-3.5 right-2 sm:right-6 z-50 flex items-center space-x-1.5 sm:space-x-3">
            {/* Group Selector Dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setShowGroupMenu(!showGroupMenu);
                  setShowUserMenu(false);
                  setShowNotifMenu(false);
                }}
                className="flex items-center space-x-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-[#FFF4DF] px-3 py-1.5 rounded-full border border-[#F4B52E]/50 text-xs font-semibold transition-all shadow-lg cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#F4B52E]" />
                <span className="max-w-[130px] truncate">{currentGroup?.name || 'Office Chai Group'}</span>
                <ChevronDown className="w-3 h-3 text-[#EAD1B2]" />
              </button>

              {showGroupMenu && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-32px)] bg-[#FFF9ED] text-[#2B211B] rounded-2xl shadow-2xl border border-[#E6D2B5] py-2 z-50">
                  <div className="px-3.5 py-1 text-[11px] font-bold text-[#8C6042] uppercase tracking-wider border-b border-[#EEDFCA]">
                    My Chai Circles
                  </div>
                  {groups.map((grp) => (
                    <button
                      key={grp._id}
                      onClick={() => {
                        onSelectGroup?.(grp._id);
                        setShowGroupMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#F4E3C7] cursor-pointer"
                    >
                      <span>{grp.name}</span>
                      {currentGroup?._id === grp._id && <Check className="w-3.5 h-3.5 text-[#5C8B55]" />}
                    </button>
                  ))}
                  <div className="border-t border-[#EEDFCA] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowGroupMenu(false);
                        onOpenCreateGroup?.();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[#9E4D1A] font-bold hover:bg-[#F4E3C7] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create New Group</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowUserMenu(false);
                  setShowGroupMenu(false);
                  if (!showNotifMenu) onMarkNotificationsRead?.();
                }}
                className="relative p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-[#FFF4DF] border border-[#F4B52E]/50 transition-all shadow-lg cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F4B52E]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-black">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && renderNotificationsDropdown()}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifMenu(false);
                  setShowGroupMenu(false);
                }}
                className="flex items-center space-x-2 bg-black/60 hover:bg-black/80 backdrop-blur-md p-1 pr-3 rounded-full border border-[#F4B52E]/50 transition-all shadow-lg cursor-pointer"
                title="Rahul's Profile"
              >
                <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#F4B52E] bg-[#F4B52E]">
                  <Image
                    src={avatarSrc}
                    alt={currentUser?.name || 'Rahul'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-bold text-[#FFF4DF] hidden sm:inline-block">
                  {currentUser?.name || 'Rahul'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[#EAD1B2] transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && renderProfileDropdown()}
            </div>
          </div>
        </div>

        {/* Vintage Torn-Edge Parchment Banner - Seamlessly Blended into Background */}
        <div className="absolute -bottom-8 sm:-bottom-12 lg:-bottom-16 left-0 right-0 w-full pointer-events-none select-none z-10 leading-none">
          <img
            src="/images/Vintage%20Torn-Edge%20Parchment%20Banner.png"
            alt="Vintage Torn-Edge Parchment Banner"
            className="w-full h-auto block pointer-events-none"
          />
        </div>
      </div>
    </header>
  );
}
