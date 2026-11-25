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

export default function ChaiManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeMobileTab, setActiveMobileTab] = useState('home');

  // Modal States
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async (groupId?: string) => {
    try {
      setLoading(true);
      const url = groupId ? `/api/dashboard?groupId=${groupId}` : '/api/dashboard';
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
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSelectGroup = (grpId: string) => {
    setSelectedGroupId(grpId);
    fetchDashboardData(grpId);
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
      <div className="min-h-screen bg-[#FBF5E8] flex flex-col items-center justify-center space-y-4">
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
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onOpenNotifications={() => setIsHistoryModalOpen(true)}
      />

      {/* 2. MAIN CONTENT COLUMN (Spanning full height and width next to sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 xl:pl-60">
        {/* Real Mockup Tapri Counter Header Banner */}
        <TapriHeader
          currentUser={currentUser}
          currentGroup={currentGroup}
          groups={groups}
          notifications={notifications}
          unreadCount={unreadNotificationsCount}
          onSelectGroup={handleSelectGroup}
          onOpenCreateGroup={() => setIsCreateGroupModalOpen(true)}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 pt-0 pb-3 xl:pb-1">
          {/* Row 1: 4 Metrics Cards */}
          <MetricsRow
            stats={stats}
            onManageGroups={() => setIsCreateGroupModalOpen(true)}
            onOpenCalendar={() => document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' })}
            onOpenExpenses={() => setIsHistoryModalOpen(true)}
          />

          {/* Row 2: Today's Chai Duty + Chai Calendar (2 Columns side by side like Mockup) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 my-5 items-stretch">
            {/* Left: Today's Chai Duty Card */}
            <div id="today-duty-section" className="xl:col-span-5 flex flex-col h-full">
              <TodayDutyCard
                assignedUser={todayDuty?.assignedUserId || currentUser}
                groupName={currentGroup?.name || 'Office Chai Group'}
                dutyDateStr={todayDuty?.dutyDate ? `${todayDuty.dutyDate}` : 'Monday, 24 Nov'}
                status={todayDuty?.status || 'pending'}
                totalMembers={members.length || 4}
                lastBill={lastBillAmount}
                onMarkCompleted={() => setIsCompleteModalOpen(true)}
              />
            </div>

            {/* Right: Chai Calendar & Upcoming Schedule Card */}
            <div id="calendar-section" className="xl:col-span-7 flex flex-col h-full">
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
          <div id="groups-section" className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5 mb-2">
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

        {/* Footer Ribbon with Heritage Doodles */}
        <FooterRibbon />
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (for small screens) */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={handleMobileTabChange}
      />

      {/* 4. MODALS */}
      {todayDuty && (
        <CompleteDutyModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          duty={todayDuty}
          members={members}
          onSuccess={() => fetchDashboardData(selectedGroupId)}
        />
      )}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(newId) => handleSelectGroup(newId)}
      />

      <SwapDutyModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        upcomingDuties={calendarDuties.filter((d: any) => d.status !== 'completed')}
        todayDutyId={todayDuty?._id}
        onSuccess={() => fetchDashboardData(selectedGroupId)}
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
