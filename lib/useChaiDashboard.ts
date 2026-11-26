'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LoggedInUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface DashboardData {
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
    workingDays?: number[];
  };
  members?: Array<{
    userId: {
      _id: string;
      name: string;
      avatar?: string;
    };
    color?: string;
    role?: string;
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
  calendarDuties?: Array<{
    _id: string;
    dutyDate: string;
    status: string;
    memberColor?: string;
    assignedUserId: {
      _id: string;
      name: string;
      avatar?: string;
    };
  }>;
  upcomingSchedule?: Array<{
    dutyDate: string;
    memberColor?: string;
    assignedUserId?: { _id?: string; name: string };
  }>;
  groups?: Array<{
    _id: string;
    name: string;
    description?: string;
    role: 'admin' | 'member';
    isDefault?: boolean;
    canDelete?: boolean;
    memberCount: number;
    workingDaysCount: number;
    bannerImage?: string;
    inviteCode?: string;
    nextDuty?: {
      date: string;
      assignedTo: string;
      isUser: boolean;
    } | null;
  }>;
  recentActivity?: Array<{
    _id: string;
    action: string;
    reason?: string;
    createdAt?: string | Date;
  }>;
  notifications?: Array<{
    _id: string;
    title: string;
    message: string;
    read: boolean;
    timeAgoText?: string;
    createdAt?: string | Date;
  }>;
  unreadNotificationsCount?: number;
}

export function useChaiDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const requestSeqRef = useRef(0);

  const fetchDashboardData = useCallback(async (groupId?: string, userEmail?: string) => {
    const seq = ++requestSeqRef.current;
    try {
      const params = new URLSearchParams();
      if (groupId) params.append('groupId', groupId);
      if (userEmail) params.append('userEmail', userEmail);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/dashboard${query}`);
      const json = await res.json();
      if (seq !== requestSeqRef.current) return;
      if (json.success) {
        setData(json);
        if (json.currentGroup && !groupId) {
          setSelectedGroupId(json.currentGroup._id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let savedUserEmail: string | undefined;
    try {
      const saved = localStorage.getItem('bhabhi_chai_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          setLoggedInUser(parsed);
          savedUserEmail = parsed.email;
        }
      }
    } catch {
      // ignore
    }
    fetchDashboardData(undefined, savedUserEmail);
  }, [fetchDashboardData]);

  const handleSelectGroup = (grpId: string) => {
    setSelectedGroupId(grpId);
    fetchDashboardData(grpId, loggedInUser?.email);
  };

  const handleDeleteGroup = async (grpId: string) => {
    try {
      const email = loggedInUser?.email || data?.currentUser?.email || '';
      const res = await fetch(
        `/api/groups?groupId=${encodeURIComponent(grpId)}&userEmail=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (json.success) {
        const nextGroupId = grpId === selectedGroupId ? '' : selectedGroupId;
        if (grpId === selectedGroupId) {
          setSelectedGroupId('');
        }
        await fetchDashboardData(nextGroupId, loggedInUser?.email);
      }
    } catch (err) {
      console.error('Error deleting group:', err);
    }
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

  const handleLogout = () => {
    setLoggedInUser(null);
    try {
      localStorage.removeItem('bhabhi_chai_user');
    } catch {
      // ignore
    }
    fetchDashboardData(selectedGroupId, undefined);
  };

  const handleAuthSuccess = (user: LoggedInUser) => {
    setLoggedInUser(user);
    try {
      localStorage.setItem('bhabhi_chai_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    fetchDashboardData('', user.email);
  };

  return {
    loading,
    data,
    selectedGroupId,
    loggedInUser,
    fetchDashboardData,
    handleSelectGroup,
    handleDeleteGroup,
    handleMarkNotificationsRead,
    handleLogout,
    handleAuthSuccess,
  };
}
