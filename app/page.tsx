'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TapriHeader from '@/components/TapriHeader';
import MetricsRow from '@/components/MetricsRow';
import TodayDutyCard from '@/components/TodayDutyCard';
import ChaiCalendar from '@/components/ChaiCalendar';
import MyGroupsSection from '@/components/MyGroupsSection';
import { RecentActivityCard, NotificationsCard } from '@/components/RecentActivitySection';
import FooterRibbon from '@/components/FooterRibbon';
import MobileBottomNav from '@/components/MobileBottomNav';

import CompleteDutyModal from '@/components/modals/CompleteDutyModal';
import CreateGroupModal from '@/components/modals/CreateGroupModal';
import SwapDutyModal from '@/components/modals/SwapDutyModal';
import HistoryModal from '@/components/modals/HistoryModal';
import CustomerAuthModal from '@/components/modals/CustomerAuthModal';
import GuestWelcomeView from '@/components/landing/GuestWelcomeView';

interface DutyItem {
  _id: string;
  dutyDate: string;
  status: string;
  assignedUserId: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  timeAgoText?: string;
}

interface ActivityItem {
  _id: string;
  action: string;
  reason?: string;
  createdAt?: string | Date;
}

interface DashboardData {
  currentUser?: {
    name: string;
    avatar: string;
    email: string;
  };
  currentGroup?: {
    _id: string;
    name: string;
    description?: string;
    role: string;
    inviteCode?: string;
  };
  members?: Array<{
    userId: {
      _id: string;
      name: string;
      avatar?: string;
    };
  }>;
  todayDuty?: {
    _id: string;
    dutyDate: string;
    status?: string;
    assignedUserId?: {
      _id: string;
      name: string;
      avatar?: string;
    };
  };
  lastBillAmount?: number;
  stats?: {
    myGroupsCount: number;
    chaiDaysThisMonth: number;
    totalExpenses: number;
    groupActiveRate: string;
  };
  calendarDuties?: DutyItem[];
  upcomingSchedule?: Array<{ dutyDate: string; assignedUserId?: { name: string } }>;
  groups?: Array<{
    _id: string;
    name: string;
    description?: string;
    role: 'admin' | 'member';
    memberCount: number;
    workingDaysCount: number;
    bannerImage?: string;
    nextDuty?: {
      date: string;
      assignedTo: string;
      isUser: boolean;
    } | null;
  }>;
  recentActivity?: ActivityItem[];
  notifications?: NotificationItem[];
  unreadNotificationsCount?: number;
}

export default function ChaiManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeMobileTab, setActiveMobileTab] = useState('home');

  // Customer Auth & Modal States
  const [loggedInUser, setLoggedInUser] = useState<{
    _id: string;
    name: string;
    email: string;
    avatar: string;
  } | null>(null);
  const [isDemoPreview, setIsDemoPreview] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState<'login' | 'register'>('register');

  // Modal States
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async (groupId?: string, userEmail?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (groupId) params.append('groupId', groupId);
      if (userEmail) params.append('userEmail', userEmail);
      
      const queryStr = params.toString();
      const url = queryStr ? `/api/dashboard?${queryStr}` : '/api/dashboard';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.currentGroup?._id) {
          setSelectedGroupId(json.currentGroup._id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initDashboard() {
      try {
        // Check if user is saved in localStorage
        let savedEmail: string | undefined;
        try {
          const stored = localStorage.getItem('bhabhi_chai_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.email) {
              setLoggedInUser(parsed);
              savedEmail = parsed.email;
            }
          }
        } catch {
          // ignore localStorage parsing errors
        }

        const url = savedEmail ? `/api/dashboard?userEmail=${encodeURIComponent(savedEmail)}` : '/api/dashboard';
        const res = await fetch(url);
        const json = await res.json();
        if (!ignore && json.success) {
          setData(json);
          if (json.currentGroup?._id) {
            setSelectedGroupId(json.currentGroup._id);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    initDashboard();
    return () => {
      ignore = true;
    };
  }, []);

  const handleLoginSuccess = (user: { _id: string; name: string; email: string; avatar: string }) => {
    setLoggedInUser(user);
    setIsDemoPreview(false);
    try {
      localStorage.setItem('bhabhi_chai_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    fetchDashboardData(selectedGroupId, user.email);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsDemoPreview(false);
    try {
      localStorage.removeItem('bhabhi_chai_user');
    } catch {
      // ignore
    }
    fetchDashboardData(selectedGroupId, undefined);
  };

  const openCustomerAuthModal = () => {
    setCustomerModalMode('register');
    setIsCustomerModalOpen(true);
  };

  const handleSelectGroup = (grpId: string) => {
    setSelectedGroupId(grpId);
    fetchDashboardData(grpId, loggedInUser?.email);
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (data) {
        setData({ ...data, unreadNotificationsCount: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMobileTabChange = (tab: string) => {
    setActiveMobileTab(tab);
    if (tab === 'history') {
      setIsHistoryModalOpen(true);
    } else if (tab === 'calendar') {
      const el = document.getElementById('calendar-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'groups') {
      const el = document.getElementById('groups-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && !data) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FBF5E8] flex flex-col items-center justify-center space-y-4 overflow-hidden select-none">
        <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-2xl border-2 border-[#F4B52E] bg-[#2E1408] animate-pulse">
          <img
            src="/images/chai-pe-charcha-badge.png"
            alt="Chai Pe Charcha"
            className="w-full h-full object-contain"
          />
        </div>
        <p className="font-kalam text-2xl font-bold text-[#4A2412]">
          Garam Chai Ban Rahi Hai...
        </p>
      </div>
    );
  }

  const {
    currentUser,
    currentGroup,
    members = [],
    todayDuty,
    lastBillAmount = 100,
    stats = {
      myGroupsCount: 3,
      chaiDaysThisMonth: 12,
      totalExpenses: 800,
      groupActiveRate: '100%',
    },
    calendarDuties = [],
    upcomingSchedule = [],
    groups = [],
    recentActivity = [],
    notifications = [],
    unreadNotificationsCount = 3,
  } = data || {};

  return (
    <div className="min-h-screen flex flex-row bg-[#FBE5CC] text-[#2B211B] antialiased overflow-x-hidden">
      {/* 1. LEFT SIDEBAR (Desktop - Matching desktop-mockup.jpg 1:1) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'create') setIsCreateGroupModalOpen(true);
          if (tab === 'notifications') setIsHistoryModalOpen(true);
        }}
        unreadCount={unreadNotificationsCount}
        isLoggedIn={!!loggedInUser}
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onOpenNotifications={() => setIsHistoryModalOpen(true)}
      />

      {/* 2. MAIN CONTENT COLUMN (Spanning full height and width next to sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 xl:pl-60">
        {/* Real Mockup Tapri Counter Header Banner */}
        <TapriHeader
          currentUser={loggedInUser || currentUser}
          currentGroup={currentGroup}
          groups={groups}
          notifications={notifications}
          unreadCount={unreadNotificationsCount}
          isLoggedIn={!!loggedInUser}
          onSelectGroup={handleSelectGroup}
          onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          onOpenAuthModal={openCustomerAuthModal}
          onLogout={handleLogout}
        />

        {/* Main Content Body */}
        {!loggedInUser && !isDemoPreview ? (
          <GuestWelcomeView
            onOpenAuth={(mode) => {
              setCustomerModalMode(mode || 'register');
              setIsCustomerModalOpen(true);
            }}
            onExploreDemo={() => setIsDemoPreview(true)}
          />
        ) : (
          <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 pt-0 pb-1 xl:pb-1">
            {/* Demo Mode Notice Banner if in demo mode */}
            {isDemoPreview && !loggedInUser && (
              <div className="mt-4 sm:mt-8 lg:mt-10 mb-4 p-3 sm:p-3.5 bg-[#FFF3DF] border-2 border-[#8B502C]/40 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-md text-xs sm:text-sm text-[#4A2412] z-30 relative">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span><strong>Demo Preview Mode:</strong> Ye sample tapri data hai. Apna real chai circle banane ke liye login karein.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setCustomerModalMode('register');
                      setIsCustomerModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#8C4610] text-[#FFF4DF] rounded-xl font-bold hover:bg-[#703509] transition-colors cursor-pointer text-xs"
                  >
                    Login / Register
                  </button>
                  <button
                    onClick={() => setIsDemoPreview(false)}
                    className="px-2.5 py-1.5 text-[#7A5A40] font-bold hover:underline cursor-pointer text-xs"
                  >
                    Exit Demo
                  </button>
                </div>
              </div>
            )}

            {/* Row 1: 4 Metrics Cards */}
            <MetricsRow
              stats={stats}
              className={isDemoPreview && !loggedInUser ? "relative w-full mt-1 sm:mt-2 z-20" : undefined}
              onManageGroups={() => setIsCreateGroupModalOpen(true)}
              onOpenCalendar={() => document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' })}
              onOpenExpenses={() => setIsHistoryModalOpen(true)}
            />

            {/* Row 2: Today's Chai Duty + Chai Calendar (2 Columns side by side like Mockup) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-7 xl:gap-5 mt-5 mb-10 sm:mb-12 items-stretch">
              {/* Left: Today's Chai Duty Card */}
              <div id="today-duty-section" className="xl:col-span-5 flex flex-col h-full">
                <TodayDutyCard
                  assignedUser={todayDuty?.assignedUserId || currentUser}
                  isUserDuty={loggedInUser ? todayDuty?.assignedUserId?._id === loggedInUser._id || todayDuty?.assignedUserId?.name === loggedInUser.name : false}
                  groupName={currentGroup?.name || 'Office Chai Group'}
                  dutyDateStr={todayDuty?.dutyDate ? `${todayDuty.dutyDate}` : 'Monday, 24 Nov'}
                  status={todayDuty?.status || 'pending'}
                  totalMembers={members.length || 4}
                  lastBill={lastBillAmount}
                  onMarkCompleted={() => setIsCompleteModalOpen(true)}
                />
              </div>

              {/* Right: Chai Calendar & Upcoming Schedule Card */}
              <div id="calendar-section" className="xl:col-span-7 flex flex-col h-full mb-3 xl:mb-0">
                <ChaiCalendar
                  currentGroupId={currentGroup?._id}
                  calendarDuties={calendarDuties}
                  upcomingSchedule={upcomingSchedule}
                  members={members}
                  onOpenSwap={() => setIsSwapModalOpen(true)}
                />
              </div>
            </div>

            {/* Row 3: Bottom 3 Cards (My Groups, Recent Activity, Notifications - exact match!) */}
            <div id="groups-section" className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-8 sm:mt-10 mb-4">
              {/* Card 1: My Groups */}
              <div className="md:col-span-12 xl:col-span-5">
                <MyGroupsSection
                  groups={groups}
                  currentGroupId={currentGroup?._id}
                  onSelectGroup={handleSelectGroup}
                  onCreateGroup={() => setIsCreateGroupModalOpen(true)}
                />
              </div>

              {/* Card 2: Recent Activity */}
              <div className="md:col-span-6 xl:col-span-4">
                <RecentActivityCard
                  recentActivity={recentActivity}
                  onViewHistory={() => setIsHistoryModalOpen(true)}
                />
              </div>

              {/* Card 3: Notifications */}
              <div className="md:col-span-6 xl:col-span-3">
                <NotificationsCard
                  notifications={notifications}
                  onClearNotifications={handleMarkNotificationsRead}
                />
              </div>
            </div>
          </main>
        )}

        {/* Footer Ribbon with Heritage Doodles */}
        <FooterRibbon />
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (for small screens) */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={handleMobileTabChange}
      />

      {/* 4. MODALS */}
      <CustomerAuthModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={handleLoginSuccess}
        initialMode={customerModalMode}
      />

      {todayDuty && (
        <CompleteDutyModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          duty={todayDuty}
          members={members}
          onSuccess={() => fetchDashboardData(selectedGroupId, loggedInUser?.email)}
        />
      )}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(newId) => handleSelectGroup(newId)}
        userEmail={loggedInUser?.email}
      />

      <SwapDutyModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        upcomingDuties={calendarDuties.filter((d) => d.status !== 'completed')}
        todayDutyId={todayDuty?._id}
        onSuccess={() => fetchDashboardData(selectedGroupId, loggedInUser?.email)}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        activities={recentActivity}
        totalExpenses={stats.totalExpenses}
        totalChaiDays={stats.chaiDaysThisMonth}
      />
    </div>
  );
}
