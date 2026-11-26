'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LuShieldCheck as ShieldCheck,
  LuUsers as Users,
  LuLayers as Layers,
  LuIndianRupee as Rupee,
  LuCircleCheck as CheckCircle2,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuBell as Bell,
  LuActivity as Activity,
  LuLogOut as LogOut,
  LuRefreshCw as RefreshCw,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuArrowLeft as ArrowLeft,
  LuX as X,
  LuClock as Clock,
} from 'react-icons/lu';

interface AdminStats {
  totalUsers: number;
  totalGroups: number;
  defaultGroupsCount: number;
  customGroupsCount: number;
  totalExpenses: number;
  completedDuties: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  groupsCount: number;
  createdAt: string;
}

interface AdminGroup {
  _id: string;
  name: string;
  description: string;
  chaiTime: string;
  workingDays: number[];
  inviteCode: string;
  bannerImage: string;
  status: string;
  isDefault: boolean;
  memberCount: number;
  createdBy?: { name?: string; email?: string } | null;
  createdAt: string;
}

interface AdminActivity {
  _id: string;
  action: string;
  reason?: string;
  actorUserId?: { name?: string; email?: string } | null;
  groupId?: { name?: string } | null;
  createdAt: string;
}

interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  userId?: { name?: string; email?: string } | null;
  groupId?: { name?: string } | null;
  createdAt: string;
}

const BANNER_OPTIONS = [
  { id: 'b1', label: 'Golden Hour Tapri', url: '/images/golden-hour-tapri.jpg' },
  { id: 'b2', label: 'Doston Ki Chai', url: '/images/doston-ki-chai-banner.jpg' },
  { id: 'b3', label: 'Cozy Tea Stall', url: '/images/cozy-tea-stall.jpg' },
  { id: 'b4', label: 'Chai Lovers', url: '/images/chai-lovers-banner.jpg' },
];

const WEEKDAY_LABELS = [
  { num: 1, label: 'Mon' },
  { num: 2, label: 'Tue' },
  { num: 3, label: 'Wed' },
  { num: 4, label: 'Thu' },
  { num: 5, label: 'Fri' },
  { num: 6, label: 'Sat' },
  { num: 0, label: 'Sun' },
];

function formatDateTime(dt?: string): string {
  if (!dt) return '';
  try {
    return new Date(dt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dt;
  }
}

export default function AdminPanelPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Login state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'users' | 'activities' | 'notifications'>('groups');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalGroups: 0,
    defaultGroupsCount: 0,
    customGroupsCount: 0,
    totalExpenses: 0,
    completedDuties: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<AdminNotification[]>([]);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Default Group Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newChaiTime, setNewChaiTime] = useState('10:30 AM');
  const [newWorkingDays, setNewWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [newBanner, setNewBanner] = useState(BANNER_OPTIONS[0].url);
  const [newIsDefault, setNewIsDefault] = useState(true);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchAdminDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setAuthenticated(true);
        setAdminEmail(json.admin?.email || '');
        setStats(json.stats);
        setUsers(json.users || []);
        setGroups(json.groups || []);
        setRecentActivities(json.recentActivities || []);
        setRecentNotifications(json.recentNotifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err);
    } finally {
      setLoadingData(false);
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminDashboard();
  }, [fetchAdminDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.error || 'Invalid credentials');
        return;
      }
      setAuthenticated(true);
      setAdminEmail(json.admin?.email || emailInput);
      await fetchAdminDashboard();
    } catch {
      setLoginError('Network error, please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthenticated(false);
    setAdminEmail('');
    setEmailInput('');
    setPasswordInput('');
  };

  const handleCreateDefaultGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim()) {
      setCreateError('Group ka naam likhna zaroori hai.');
      return;
    }
    setCreatingGroup(true);
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          chaiTime: newChaiTime,
          workingDays: newWorkingDays,
          bannerImage: newBanner,
          isDefault: newIsDefault,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setCreateError(json.error || 'Group create nahi ho paya');
        return;
      }
      setIsCreateModalOpen(false);
      setNewName('');
      setNewDesc('');
      await fetchAdminDashboard();
    } catch {
      setCreateError('Network error while creating group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setDeletingId(groupId);
    try {
      const res = await fetch(`/api/admin/groups?groupId=${encodeURIComponent(groupId)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setConfirmDeleteId(null);
        await fetchAdminDashboard();
      }
    } catch (err) {
      console.error('Delete group error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleWorkingDay = (dayNum: number) => {
    setNewWorkingDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FBE5CC] flex flex-col items-center justify-center gap-3">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#F4B52E] bg-[#2E1408] shadow-xl animate-pulse">
          <img
            src="/images/chai-pe-charcha-badge.png"
            alt="Chai Pe Charcha"
            className="w-full h-full object-contain"
          />
        </div>
        <p className="font-kalam text-xl font-bold text-[#4A2412]">Admin Tapri Khul Rahi Hai...</p>
      </div>
    );
  }

  // LOGIN SCREEN (Tapri Style)
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FBE5CC] flex flex-col items-center justify-center p-4 text-[#2B211B]">
        <div className="w-full max-w-md bg-[#FAF6EE] border-2 border-[#DFC08E] rounded-[28px] p-6 sm:p-8 shadow-[0_12px_36px_rgba(74,36,18,0.14)]">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#F4B52E] bg-[#2E1408] shadow-md mb-3">
              <img
                src="/images/chai-pe-charcha-badge.png"
                alt="Admin Tapri"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="px-3 py-0.5 rounded-full bg-[#FDB933]/30 border border-[#DFC08E] text-[11px] font-bold text-[#6E3B0C] mb-1.5">
              BhabhiKiChai Control Center
            </span>
            <h1 className="font-kalam text-3xl font-bold text-[#3B1B0D]">Admin Tapri Login</h1>
            <p className="text-xs text-[#734A29] mt-1">
              Default groups, customers, notifications &amp; activities manage karein
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-2.5 rounded-xl bg-[#FCE4E4] border border-[#F5C2C2] text-xs font-bold text-[#9E2A2B] text-center">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4A2412] mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@bhabhikichai.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFC08E] text-sm text-[#1C1006] focus:outline-none focus:ring-2 focus:ring-[#F4B52E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A2412] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#DFC08E] text-sm text-[#1C1006] focus:outline-none focus:ring-2 focus:ring-[#F4B52E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#734A29] hover:text-[#3B1B0D] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-xl bg-[#3B1B0D] hover:bg-[#522915] text-[#FFF4DF] font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-[#F4B52E]" />
              <span>{loginLoading ? 'Logging in...' : 'Login to Admin Panel'}</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E8D5B5] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C4610] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to BhabhiKiChai Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  const adminNavItems = [
    { id: 'groups' as const, label: `All Groups (${groups.length})`, icon: Layers },
    { id: 'users' as const, label: `Customers (${users.length})`, icon: Users },
    { id: 'activities' as const, label: `Activities (${recentActivities.length})`, icon: Activity },
    { id: 'notifications' as const, label: `Notifications (${recentNotifications.length})`, icon: Bell },
  ];

  return (
    <div className="min-h-screen flex flex-row bg-[#FBE5CC] text-[#2B211B] antialiased overflow-x-hidden">
      {/* Desktop Left Sidebar (Matching Frontend Tapri Sidebar) */}
      <aside className="hidden xl:flex flex-col justify-between w-60 h-screen max-h-screen bg-[#361D0D] text-[#FFF4DF] border-r border-[#4A2813] shadow-2xl shrink-0 fixed top-0 left-0 bottom-0 select-none z-40 overflow-hidden">
        <div className="px-3.5 pt-4 pb-2 space-y-3 w-full shrink-0">
          {/* Admin Brand Header */}
          <div className="flex items-center gap-2.5 px-2 pb-3 border-b border-[#4A2813]">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#F4B52E] bg-[#2E1408] shrink-0">
              <img
                src="/images/chai-pe-charcha-badge.png"
                alt="Admin"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-kalam text-base font-bold text-[#F4B52E] leading-none truncate">
                Admin Tapri
              </h2>
              <p className="text-[10px] text-[#CDB29B] truncate mt-0.5">{adminEmail}</p>
            </div>
          </div>

          {/* Admin Section Navigation */}
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F4B52E] text-[#281308] shadow-md shadow-[#F4B52E]/20 font-bold'
                      : 'text-[#FFF4DF] hover:bg-[#482813]/60 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#281308] stroke-[2.5]' : 'text-[#FFF4DF] stroke-[2]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-b border-[#4A2813]/80 mx-1" />

          {/* Quick Actions */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#F4B52E]/15 hover:bg-[#F4B52E]/25 text-[#F4B52E] border border-[#F4B52E]/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create Default Group</span>
            </button>
            <Link
              href="/"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E5CCA8] hover:bg-[#482813]/60 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Website</span>
            </Link>
          </div>
        </div>

        {/* Bottom Artwork + Logout */}
        <div className="relative w-full h-[270px] shrink-0 mt-auto flex flex-col justify-end overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-[#361D0D] via-[#361D0D]/40 to-transparent z-10 pointer-events-none" />
          <img
            src="/images/Chai%20Pe%20Charcha%20at%20Golden%20Hour.png"
            alt="Chai Pe Charcha"
            className="absolute inset-0 w-full h-full object-cover object-[center_12%] pointer-events-none select-none"
          />
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />
          <div className="relative z-20 p-3 w-full">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-[#DC2626]/90 hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 xl:pl-60 pb-10">
        {/* Top Tapri Admin Bar (Minimal) */}
        <header className="bg-[#3B1B0D] text-[#FFF4DF] border-b-4 border-[#F4B52E] shadow-md sticky top-0 z-30">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="font-kalam text-xl sm:text-2xl font-bold text-[#FFF4DF] leading-none">
                BhabhiKiChai Admin
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="xl:hidden px-3 py-1.5 rounded-xl bg-[#F4B52E] text-[#281308] text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Default Group</span>
              </button>
              <Link
                href="/"
                className="xl:hidden px-2.5 py-1.5 rounded-xl bg-[#522915] text-[#FFF4DF] text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={fetchAdminDashboard}
                disabled={loadingData}
                className="px-3 py-1.5 rounded-xl bg-[#522915] hover:bg-[#6A361C] text-[#F4B52E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="xl:hidden px-2.5 py-1.5 rounded-xl bg-[#DC2626] text-white text-xs font-bold flex items-center cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* 4 Summary Metric Cards (Matching Frontend MetricsRow Style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[20px] p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#DFE7F8] text-[#2C5697] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-2xl sm:text-3xl text-[#140F0B] block leading-none">
                {stats.totalUsers}
              </span>
              <span className="text-xs font-semibold text-[#54433A]">Total Customers</span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[20px] p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#E0F2E4] text-[#1E7238] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-2xl sm:text-3xl text-[#140F0B] block leading-none">
                {stats.totalGroups}
              </span>
              <span className="text-xs font-semibold text-[#54433A]">
                Groups ({stats.defaultGroupsCount} Default)
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[20px] p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#FDE4B8] text-[#3E2310] flex items-center justify-center shrink-0">
              <Rupee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-2xl sm:text-3xl text-[#140F0B] block leading-none">
                ₹{stats.totalExpenses.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-[#54433A]">Total Chai Spend</span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#FDF1E2] via-[#FCE4CB] to-[#F8D8B6] border border-[#E5CCA8] rounded-[20px] p-3.5 sm:p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#ECE3D2] text-[#462511] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-2xl sm:text-3xl text-[#140F0B] block leading-none">
                {stats.completedDuties}
              </span>
              <span className="text-xs font-semibold text-[#54433A]">Completed Duties</span>
            </div>
          </div>
        </div>

        {/* Mobile-only Tab Switcher (Desktop uses Left Sidebar) */}
        <div className="flex xl:hidden flex-wrap items-center gap-1.5 bg-[#FAF6EE] border border-[#EADBCA] rounded-2xl p-2 shadow-xs">
          {adminNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#3B1B0D] text-[#FFF4DF] shadow-xs'
                    : 'text-[#54433A] hover:bg-[#EFE3D2]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F4B52E]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ALL GROUPS (Default + Customer Groups) */}
        {activeTab === 'groups' && (
          <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D]">
                  All Chai Groups ({groups.length})
                </h2>
                <p className="text-xs text-[#734A29]">
                  Default groups aur customers ke banaye hue saare groups yahan manage karein
                </p>
              </div>
            </div>

            {groups.length === 0 ? (
              <p className="text-center text-sm text-[#734A29] py-10">Koi group nahi mila.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groups.map((grp) => (
                  <div
                    key={grp._id}
                    className="relative bg-[#2C1409] border border-[#5A2C16] rounded-2xl overflow-hidden text-[#FFF4DF] flex flex-col justify-between shadow-md"
                  >
                    <div className="relative h-28 w-full bg-[#1A0B04]">
                      {grp.bannerImage ? (
                        <Image
                          src={grp.bannerImage}
                          alt={grp.name}
                          fill
                          className="object-cover object-center"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#2C1409] to-transparent" />
                      <span
                        className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shadow-sm ${
                          grp.isDefault
                            ? 'bg-[#F4B52E] text-[#281308]'
                            : 'bg-[#3B82F6] text-white'
                        }`}
                      >
                        {grp.isDefault ? 'Default Group' : 'Customer Group'}
                      </span>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono text-[#FFF4DF]">
                        {grp.inviteCode}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-[#FFF4DF] truncate">{grp.name}</h3>
                        {grp.description && (
                          <p className="text-xs text-[#CDB29B] mt-0.5 line-clamp-2">{grp.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[#E6CCB2]">
                          <span>👥 {grp.memberCount} Members</span>
                          <span>⏰ {grp.chaiTime}</span>
                          <span>📅 {grp.workingDays.length} Days/Wk</span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#4A2412] flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-[#CDB29B] truncate">
                          By: <strong className="text-[#FFF4DF]">{grp.createdBy?.name || 'Admin'}</strong>
                        </span>

                        {confirmDeleteId === grp._id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-[#4A2412] text-[#FFF4DF] text-[10px] font-bold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === grp._id}
                              onClick={() => handleDeleteGroup(grp._id)}
                              className="px-2 py-1 rounded-lg bg-[#DC2626] text-white text-[10px] font-bold cursor-pointer"
                            >
                              {deletingId === grp._id ? '...' : 'Confirm'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(grp._id)}
                            className="px-2.5 py-1 rounded-lg bg-[#DC2626]/15 hover:bg-[#DC2626]/30 text-[#FCA5A5] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CUSTOMERS */}
        {activeTab === 'users' && (
          <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-4">
              Registered Customers ({users.length})
            </h2>
            {users.length === 0 ? (
              <p className="text-center text-sm text-[#734A29] py-10">Koi customer nahi mila.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B5] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#3B1B0D] text-[#F4B52E] font-bold text-sm flex items-center justify-center shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#1C1006] truncate">{u.name}</p>
                        <p className="text-xs text-[#734A29] truncate">{u.email}</p>
                        <p className="text-[10px] text-[#9E8C76] mt-0.5">
                          Joined {formatDateTime(u.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FDE4B8] text-[#6E3B0C] text-[11px] font-bold shrink-0">
                      {u.groupsCount} {u.groupsCount === 1 ? 'Group' : 'Groups'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECENT ACTIVITIES */}
        {activeTab === 'activities' && (
          <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-4">
              Recent Activities ({recentActivities.length})
            </h2>
            {recentActivities.length === 0 ? (
              <p className="text-center text-sm text-[#734A29] py-10">Abhi koi activity nahi hai.</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivities.map((act) => (
                  <div
                    key={act._id}
                    className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B5] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#3B1B0D] text-[#F4B52E] text-[10px] font-bold uppercase">
                          {act.action.replace(/_/g, ' ')}
                        </span>
                        {act.groupId?.name && (
                          <span className="text-xs font-bold text-[#8C4610]">{act.groupId.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#2B211B] mt-1">{act.reason || 'Action recorded'}</p>
                      <p className="text-[11px] text-[#734A29] mt-0.5">
                        By: {act.actorUserId?.name || 'System'} ({act.actorUserId?.email || '—'})
                      </p>
                    </div>
                    <span className="text-[11px] text-[#8A735E] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECENT NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-4">
              Recent Notifications ({recentNotifications.length})
            </h2>
            {recentNotifications.length === 0 ? (
              <p className="text-center text-sm text-[#734A29] py-10">Koi notification nahi hai.</p>
            ) : (
              <div className="space-y-2.5">
                {recentNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#E8D5B5] flex flex-wrap items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#1C1006]">{notif.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            notif.read
                              ? 'bg-[#E5E7EB] text-[#4B5563]'
                              : 'bg-[#D1F2DF] text-[#135E35]'
                          }`}
                        >
                          {notif.read ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A2412] mt-1">{notif.message}</p>
                      <p className="text-[11px] text-[#734A29] mt-0.5">
                        To: {notif.userId?.name || 'User'} ({notif.userId?.email || '—'})
                        {notif.groupId?.name ? ` • Group: ${notif.groupId.name}` : ''}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#8A735E] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      </div>

      {/* CREATE DEFAULT GROUP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl p-6 shadow-2xl text-[#2B211B] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#F2E5D3] text-[#4A2412] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-1">
              Create Default Chai Group
            </h3>
            <p className="text-xs text-[#734A29] mb-4">
              Admin dwara banaya gaya default group sabhi naye users ko dikhega aur user ise delete nahi kar payenge.
            </p>

            <form onSubmit={handleCreateDefaultGroup} className="space-y-4">
              {createError && (
                <div className="p-2.5 rounded-xl bg-[#FCE4E4] border border-[#F5C2C2] text-xs font-bold text-[#9E2A2B]">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Morning Tapri Club"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DFC08E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B52E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Daily adrak chai & discussions"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DFC08E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B52E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A2412] mb-1">Chai Time</label>
                  <input
                    type="text"
                    value={newChaiTime}
                    onChange={(e) => setNewChaiTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DFC08E] text-sm focus:outline-none focus:ring-2 focus:ring-[#F4B52E]"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#3B1B0D]">
                    <input
                      type="checkbox"
                      checked={newIsDefault}
                      onChange={(e) => setNewIsDefault(e.target.checked)}
                      className="w-4 h-4 accent-[#8C4610]"
                    />
                    <span>Mark as Default Group</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1.5">Working Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_LABELS.map((d) => {
                    const active = newWorkingDays.includes(d.num);
                    return (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => toggleWorkingDay(d.num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#3B1B0D] text-[#F4B52E] border-[#3B1B0D]'
                            : 'bg-white text-[#6D533E] border-[#DFC08E]'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1.5">Banner Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANNER_OPTIONS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setNewBanner(b.url)}
                      className={`relative h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        newBanner === b.url
                          ? 'border-[#8C4610] ring-2 ring-[#F4B52E]'
                          : 'border-[#E8D5B5] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Image src={b.url} alt={b.label} fill className="object-cover" unoptimized />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-bold py-0.5 px-1.5 truncate">
                        {b.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingGroup}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F4B52E] to-[#DE9008] text-[#281308] font-extrabold text-sm shadow-md cursor-pointer disabled:opacity-60"
              >
                {creatingGroup ? 'Creating...' : 'Create Default Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
