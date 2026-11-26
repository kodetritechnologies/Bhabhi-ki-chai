'use client';

import React, { useState } from 'react';
import {
  LuBell as Bell,
  LuChevronDown as ChevronDown,
  LuCheck as Check,
  LuPlus as Plus,
  LuUsers as Users,
  LuHistory as HistoryIcon,
  LuLogOut as LogOut,
  LuUser as UserIcon,
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
  isLoggedIn?: boolean;
  onSelectGroup?: (groupId: string) => void;
  onOpenCreateGroup?: () => void;
  onMarkNotificationsRead?: () => void;
  onOpenHistory?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
}

export default function TapriHeader({
  currentUser = { name: 'Rahul', avatar: '/images/default-avatar.png', email: 'rahul@example.com' },
  currentGroup,
  groups = [],
  notifications = [],
  unreadCount = 3,
  isLoggedIn = false,
  onSelectGroup,
  onOpenCreateGroup,
  onMarkNotificationsRead,
  onOpenHistory,
  onOpenAuthModal,
  onLogout,
}: TapriHeaderProps) {
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const avatarSrc = currentUser?.avatar || '/images/default-avatar.png';
  const isAnyMenuOpen = showGroupMenu || showNotifMenu || showUserMenu;

  const renderProfileDropdown = () => (
    <div className="absolute right-0 mt-2 w-[calc(100vw-20px)] sm:w-80 max-w-[340px] sm:max-w-none bg-[#FFF9ED] text-[#2B211B] rounded-2xl shadow-2xl border border-[#E6D2B5] py-2 z-50 overflow-hidden select-none animate-in fade-in slide-in-from-top-1 duration-150">
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
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-[#3B1B0D] truncate">
              {currentUser?.name || 'Rahul'}
            </span>
            <span className="text-[10px] bg-[#F4B52E]/30 text-[#8C4610] font-bold px-1.5 py-0.5 rounded-md shrink-0">
              Chai Admin
            </span>
          </div>
          <p className="text-[11px] text-[#7A695E] truncate">
            {currentUser?.email || 'rahul@example.com'}
          </p>
        </div>
      </div>

      {/* Quick Chai Circle Info */}
      <div className="px-3.5 py-2 bg-[#FAF0E1]/80 border-b border-[#EEDFCA] flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5 text-[#54433A] shrink-0">
          <span className="text-sm">☕</span>
          <span className="font-semibold text-[11px]">Active Circle:</span>
        </div>
        <span className="font-bold text-[11px] text-[#8C4610] bg-[#FCE4CB] px-2 py-0.5 rounded-full truncate max-w-[150px]">
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
          className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 text-[#3B1B0D] hover:bg-[#F4E3C7] transition-colors cursor-pointer"
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
          className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 text-[#3B1B0D] hover:bg-[#F4E3C7] transition-colors cursor-pointer"
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
          className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 text-[#3B1B0D] hover:bg-[#F4E3C7] transition-colors cursor-pointer"
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
        {onLogout && (
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(false);
              onLogout();
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 text-red-700 hover:bg-red-50/80 transition-colors cursor-pointer border-t border-[#EEDFCA]"
          >
            <LogOut className="w-4 h-4 text-red-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-bold block truncate">Logout</span>
              <span className="text-[10px] text-red-500/80 block truncate">Account se log out karein</span>
            </div>
          </button>
        )}
      </div>

      {/* Footer Tagline */}
      <div className="border-t border-[#EEDFCA] mt-1 pt-2 px-3.5 pb-1 flex items-center justify-between text-[11px] text-[#8C6042]">
        <span className="font-hand italic">Chai pe charcha, roz ka maja! ☕</span>
        <span className="text-[10px] text-[#1E7238] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E7238]" /> Active
        </span>
      </div>
    </div>
  );

  const renderNotificationsDropdown = () => (
    <div className="absolute -right-[70px] sm:right-0 mt-2 w-[calc(100vw-20px)] sm:w-88 max-w-[340px] sm:max-w-none bg-[#FFF9ED] text-[#2B211B] rounded-2xl shadow-2xl border border-[#E6D2B5] py-2 z-50 overflow-hidden select-none animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="px-4 py-2.5 border-b border-[#EEDFCA] flex items-center justify-between bg-[#FDF2E2]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🔔</span>
          <span className="font-bold text-xs text-[#4A2412]">Notifications</span>
        </div>
        {unreadCount > 0 ? (
          <span className="text-[10px] font-bold text-[#8C4610] bg-[#F4B52E]/30 px-2 py-0.5 rounded-full">
            {unreadCount} new
          </span>
        ) : (
          <span className="text-[10px] font-medium text-[#7A695E] bg-[#EADCC8] px-2 py-0.5 rounded-full">
            0 new
          </span>
        )}
      </div>
      <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-[#F0E4D2]">
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#7A695E]">
            <span className="text-xl block mb-1">☕</span>
            No new notifications
          </div>
        ) : (
          notifications.slice(0, 4).map((n) => (
            <div key={n._id} className="p-3 sm:p-3.5 text-xs hover:bg-[#FAF0E1] transition-colors">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-[#3B1B0D] leading-snug">{n.title}</p>
                {n.timeAgoText && (
                  <span className="text-[10px] text-[#8C6042] shrink-0">{n.timeAgoText}</span>
                )}
              </div>
              <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">{n.message}</p>
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && onMarkNotificationsRead && (
        <div className="border-t border-[#EEDFCA] px-3.5 pt-2 pb-0.5 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={onMarkNotificationsRead}
            className="text-[11px] font-semibold text-[#8C4610] hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
          <span className="text-[10px] text-[#A08875] italic">Chai Duty Alerts</span>
        </div>
      )}
    </div>
  );

  return (
    <header className={`w-full relative select-none ${isAnyMenuOpen ? 'z-50' : 'z-20'}`}>
      {/* Click Outside Backdrop for All Dropdowns */}
      {(showGroupMenu || showNotifMenu || showUserMenu) && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={() => {
            setShowGroupMenu(false);
            setShowNotifMenu(false);
            setShowUserMenu(false);
          }}
        />
      )}

      {/* REAL AUTHENTIC TAPRI COUNTER HERO BANNER */}
      <div className="relative w-full">
        {/* Master Tapri Counter Hero Banner Image (clipped image container) */}
        <div className="relative w-full aspect-[2172/724] min-h-[160px] sm:min-h-[220px] max-h-[380px] overflow-hidden bg-[#261207]">
          <img
            src="/images/Bhabhi%20Ki%20Chai_%20Cozy%20Tea%20Stall%20Banner.png"
            alt="Bhabhi Ki Chai - Cozy Tea Stall Banner"
            className="w-full h-full object-cover object-center pointer-events-none select-none"
          />

          {/* Subtle warm ambient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/25 pointer-events-none" />
        </div>

        {/* 1. Mobile View: Real Authentic Torn-Edge Banner (Derived from Vintage Torn-Edge Parchment Banner, perfectly blended) */}
        <div className="block sm:hidden absolute -bottom-[1px] left-0 right-0 w-full pointer-events-none select-none z-10 leading-none overflow-hidden">
          <img
            src="/images/Vintage%20Torn-Edge%20Parchment%20Banner.mobile.png"
            alt="Vintage Torn-Edge Parchment Banner"
            className="w-full h-11 object-cover object-top block pointer-events-none"
          />
        </div>

        {/* 2. Desktop & Tablet View: 100% Original Exact Code & Styling (Unchanged) */}
        <div className="hidden sm:block absolute sm:-bottom-12 lg:-bottom-16 left-0 right-0 w-full pointer-events-none select-none z-10 leading-none">
          <img
            src="/images/Vintage%20Torn-Edge%20Parchment%20Banner.png"
            alt="Vintage Torn-Edge Parchment Banner"
            className="w-full h-auto block pointer-events-none"
          />
        </div>

        {/* Top Floating Controls on Desktop & Mobile */}
        <div className="absolute top-2 sm:top-3.5 right-2 sm:right-6 z-50 flex items-center space-x-1.5 sm:space-x-3">
          {/* Group Selector Dropdown (Shown only when logged in) */}
          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowGroupMenu(!showGroupMenu);
                  setShowUserMenu(false);
                  setShowNotifMenu(false);
                }}
                className="hidden md:flex items-center space-x-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-[#FFF4DF] px-3 py-1.5 rounded-full border border-[#F4B52E]/50 text-xs font-semibold transition-all shadow-lg cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#F4B52E]" />
                <span className="max-w-[130px] truncate">{currentGroup?.name || 'Office Chai Group'}</span>
                <ChevronDown className="w-3 h-3 text-[#EAD1B2]" />
              </button>

              {showGroupMenu && (
                <div className="absolute -right-[70px] md:right-0 mt-2 w-64 max-w-[calc(100vw-20px)] bg-[#FFF9ED] text-[#2B211B] rounded-2xl shadow-2xl border border-[#E6D2B5] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
                      <span>Create or Join Group</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Bell (Shown only when logged in) */}
          {isLoggedIn && (
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
          )}

          {/* User Profile or Create Account / Login Button */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifMenu(false);
                  setShowGroupMenu(false);
                }}
                className="flex items-center space-x-2 bg-black/60 hover:bg-black/80 backdrop-blur-md p-1 pr-3 rounded-full border border-[#F4B52E]/50 transition-all shadow-lg cursor-pointer"
                title={`${currentUser?.name || 'User'}'s Profile`}
              >
                <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#F4B52E] bg-[#F4B52E]">
                  <Image
                    src={avatarSrc}
                    alt={currentUser?.name || 'User'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-bold text-[#FFF4DF] hidden sm:inline-block">
                  {currentUser?.name || 'User'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[#EAD1B2] transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && renderProfileDropdown()}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-[#F4B52E] hover:bg-[#E0A220] active:scale-95 text-[#281308] font-black text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-[#F4B52E] transition-all cursor-pointer"
              title="Customer Registration / Login"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#281308]" />
              <span className="tracking-wide">Create Account</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
