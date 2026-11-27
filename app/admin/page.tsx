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
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
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

function to12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

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

const ADMIN_PAGE_SIZE = 10;

function PaginationBar({
  page,
  totalItems,
  pageSize = ADMIN_PAGE_SIZE,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (nextPage: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-4 pt-3 border-t border-[#E8D5B5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#734A29]">
      <span className="font-medium">
        Showing <strong className="text-[#3B1B0D]">{start}–{end}</strong> of{' '}
        <strong className="text-[#3B1B0D]">{totalItems}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] border border-[#DFC39B] hover:bg-[#F4E6D2] text-[#3B1B0D] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="px-2.5 py-1 font-bold text-[#3B1B0D]">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] border border-[#DFC39B] hover:bg-[#F4E6D2] text-[#3B1B0D] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminPanelPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Login / Setup state
  const [needsSetup, setNeedsSetup] = useState(false);
  const [nameInput, setNameInput] = useState('Tapri Admin');
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

  // Pagination state per tab
  const [groupsPage, setGroupsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [notificationsPage, setNotificationsPage] = useState(1);

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Default Group Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newChaiTime, setNewChaiTime] = useState('10:30 AM');
  const [newChaiTime24, setNewChaiTime24] = useState('10:30');
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
        try {
          const authRes = await fetch('/api/admin/auth');
          const authJson = await authRes.json();
          setNeedsSetup(Boolean(authJson.needsSetup));
        } catch {
          setNeedsSetup(false);
        }
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
        body: JSON.stringify(
          needsSetup
            ? { action: 'setup', name: nameInput, email: emailInput, password: passwordInput }
            : { email: emailInput, password: passwordInput }
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.error || 'Invalid credentials');
        return;
      }
      setNeedsSetup(false);
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
            <h1 className="font-kalam text-3xl font-bold text-[#3B1B0D]">
              {needsSetup ? 'Create Admin Account' : 'Admin Tapri Login'}
            </h1>
            <p className="text-xs text-[#734A29] mt-1">
              {needsSetup
                ? 'Database me pehla admin account banayein (admins collection)'
                : 'Default groups, customers, notifications & activities manage karein'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-2.5 rounded-xl bg-[#FCE4E4] border border-[#F5C2C2] text-xs font-bold text-[#9E2A2B] text-center">
                {loginError}
              </div>
            )}

            {needsSetup && (
              <div>
                <label className="block text-xs font-bold text-[#4A2412] mb-1">Admin Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Tapri Admin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFC08E] text-sm text-[#1C1006] focus:outline-none focus:ring-2 focus:ring-[#F4B52E]"
                />
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
              <span>
                {loginLoading
                  ? needsSetup
                    ? 'Creating Admin...'
                    : 'Logging in...'
                  : needsSetup
                  ? 'Create Admin & Login'
                  : 'Login to Admin Panel'}
              </span>
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

        {/* TAB 1: ALL GROUPS (Table + Pagination) */}
        {activeTab === 'groups' && (() => {
          const pagedGroups = groups.slice(
            (groupsPage - 1) * ADMIN_PAGE_SIZE,
            groupsPage * ADMIN_PAGE_SIZE
          );
          return (
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
                <>
                  <div className="overflow-x-auto rounded-2xl border border-[#E8D5B5] bg-[#FFFDF9]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5E6D0] text-[#4A2412] border-b border-[#E8D5B5]">
                          <th className="py-3 px-3.5 font-extrabold">Group</th>
                          <th className="py-3 px-3 font-extrabold">Type</th>
                          <th className="py-3 px-3 font-extrabold">Invite Code</th>
                          <th className="py-3 px-3 font-extrabold">Schedule</th>
                          <th className="py-3 px-3 font-extrabold text-center">Members</th>
                          <th className="py-3 px-3 font-extrabold">Created By</th>
                          <th className="py-3 px-3.5 font-extrabold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE1CA]">
                        {pagedGroups.map((grp) => (
                          <tr key={grp._id} className="hover:bg-[#FAF2E4]/70 transition-colors">
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5 min-w-[160px]">
                                <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#2C1409] shrink-0">
                                  {grp.bannerImage ? (
                                    <Image
                                      src={grp.bannerImage}
                                      alt={grp.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm">☕</div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#1C1006] truncate">{grp.name}</p>
                                  {grp.description && (
                                    <p className="text-[11px] text-[#734A29] truncate max-w-[200px]">
                                      {grp.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  grp.isDefault
                                    ? 'bg-[#F4B52E] text-[#281308]'
                                    : 'bg-[#E0ECFF] text-[#1E40AF]'
                                }`}
                              >
                                {grp.isDefault ? 'Default' : 'Customer'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#4A2412] whitespace-nowrap">
                              {grp.inviteCode}
                            </td>
                            <td className="py-3 px-3 text-[#54433A] whitespace-nowrap">
                              {grp.chaiTime} • {grp.workingDays.length}d/wk
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-[#1C1006]">
                              {grp.memberCount}
                            </td>
                            <td className="py-3 px-3 text-[#54433A] whitespace-nowrap">
                              {grp.createdBy?.name || 'Admin'}
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              {confirmDeleteId === grp._id ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 rounded-lg bg-[#EFE1CA] text-[#3B1B0D] text-[10px] font-bold cursor-pointer"
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
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    page={groupsPage}
                    totalItems={groups.length}
                    onPageChange={setGroupsPage}
                  />
                </>
              )}
            </div>
          );
        })()}

        {/* TAB 2: CUSTOMERS (Table + Pagination) */}
        {activeTab === 'users' && (() => {
          const pagedUsers = users.slice(
            (usersPage - 1) * ADMIN_PAGE_SIZE,
            usersPage * ADMIN_PAGE_SIZE
          );
          return (
            <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
              <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-4">
                Registered Customers ({users.length})
              </h2>
              {users.length === 0 ? (
                <p className="text-center text-sm text-[#734A29] py-10">Koi customer nahi mila.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-[#E8D5B5] bg-[#FFFDF9]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5E6D0] text-[#4A2412] border-b border-[#E8D5B5]">
                          <th className="py-3 px-3.5 font-extrabold">Customer</th>
                          <th className="py-3 px-3 font-extrabold">Email</th>
                          <th className="py-3 px-3 font-extrabold text-center">Groups</th>
                          <th className="py-3 px-3.5 font-extrabold text-right">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE1CA]">
                        {pagedUsers.map((u) => (
                          <tr key={u._id} className="hover:bg-[#FAF2E4]/70 transition-colors">
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#3B1B0D] text-[#F4B52E] font-bold text-xs flex items-center justify-center shrink-0">
                                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="font-bold text-[#1C1006]">{u.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#54433A]">{u.email}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FDE4B8] text-[#6E3B0C] text-[11px] font-bold">
                                {u.groupsCount} {u.groupsCount === 1 ? 'Group' : 'Groups'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right text-[#734A29] whitespace-nowrap">
                              {formatDateTime(u.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    page={usersPage}
                    totalItems={users.length}
                    onPageChange={setUsersPage}
                  />
                </>
              )}
            </div>
          );
        })()}

        {/* TAB 3: RECENT ACTIVITIES (Table + Pagination) */}
        {activeTab === 'activities' && (() => {
          const pagedActivities = recentActivities.slice(
            (activitiesPage - 1) * ADMIN_PAGE_SIZE,
            activitiesPage * ADMIN_PAGE_SIZE
          );
          return (
            <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
              <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-4">
                Recent Activities ({recentActivities.length})
              </h2>
              {recentActivities.length === 0 ? (
                <p className="text-center text-sm text-[#734A29] py-10">Abhi koi activity nahi hai.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-[#E8D5B5] bg-[#FFFDF9]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5E6D0] text-[#4A2412] border-b border-[#E8D5B5]">
                          <th className="py-3 px-3.5 font-extrabold">Action</th>
                          <th className="py-3 px-3 font-extrabold">Group</th>
                          <th className="py-3 px-3 font-extrabold">Details</th>
                          <th className="py-3 px-3 font-extrabold">Actor</th>
                          <th className="py-3 px-3.5 font-extrabold text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE1CA]">
                        {pagedActivities.map((act) => (
                          <tr key={act._id} className="hover:bg-[#FAF2E4]/70 transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-[#3B1B0D] text-[#F4B52E] text-[10px] font-bold uppercase">
                                {act.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-[#8C4610] whitespace-nowrap">
                              {act.groupId?.name || '—'}
                            </td>
                            <td className="py-3 px-3 text-[#2B211B] max-w-xs break-words">
                              {act.reason || 'Action recorded'}
                            </td>
                            <td className="py-3 px-3 text-[#54433A] whitespace-nowrap">
                              {act.actorUserId?.name || 'System'}
                            </td>
                            <td className="py-3 px-3.5 text-right text-[#734A29] whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(act.createdAt)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    page={activitiesPage}
                    totalItems={recentActivities.length}
                    onPageChange={setActivitiesPage}
                  />
                </>
              )}
            </div>
          );
        })()}

        {/* TAB 4: RECENT NOTIFICATIONS (Table + Pagination) */}
        {activeTab === 'notifications' && (() => {
          const pagedNotifications = recentNotifications.slice(
            (notificationsPage - 1) * ADMIN_PAGE_SIZE,
            notificationsPage * ADMIN_PAGE_SIZE
          );
          return (
            <div className="bg-[#FAF6EE] border border-[#EADBCA] rounded-3xl p-4 sm:p-6 shadow-sm">
              <h2 className="font-kalam text-2xl font-bold text-[#3B1B0D] mb-4">
                Recent Notifications ({recentNotifications.length})
              </h2>
              {recentNotifications.length === 0 ? (
                <p className="text-center text-sm text-[#734A29] py-10">Koi notification nahi hai.</p>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-2xl border border-[#E8D5B5] bg-[#FFFDF9]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#F5E6D0] text-[#4A2412] border-b border-[#E8D5B5]">
                          <th className="py-3 px-3.5 font-extrabold">Title</th>
                          <th className="py-3 px-3 font-extrabold">Message</th>
                          <th className="py-3 px-3 font-extrabold">Recipient</th>
                          <th className="py-3 px-3 font-extrabold">Group</th>
                          <th className="py-3 px-3 font-extrabold text-center">Status</th>
                          <th className="py-3 px-3.5 font-extrabold text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE1CA]">
                        {pagedNotifications.map((notif) => (
                          <tr key={notif._id} className="hover:bg-[#FAF2E4]/70 transition-colors">
                            <td className="py-3 px-3.5 font-bold text-[#1C1006] whitespace-nowrap">
                              {notif.title}
                            </td>
                            <td className="py-3 px-3 text-[#4A2412] max-w-xs break-words">
                              {notif.message}
                            </td>
                            <td className="py-3 px-3 text-[#54433A] whitespace-nowrap">
                              {notif.userId?.name || 'User'}
                            </td>
                            <td className="py-3 px-3 text-[#8C4610] font-semibold whitespace-nowrap">
                              {notif.groupId?.name || '—'}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  notif.read
                                    ? 'bg-[#E5E7EB] text-[#4B5563]'
                                    : 'bg-[#D1F2DF] text-[#135E35]'
                                }`}
                              >
                                {notif.read ? 'Read' : 'Unread'}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right text-[#734A29] whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(notif.createdAt)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationBar
                    page={notificationsPage}
                    totalItems={recentNotifications.length}
                    onPageChange={setNotificationsPage}
                  />
                </>
              )}
            </div>
          );
        })()}
      </main>
      </div>

      {/* CREATE DEFAULT GROUP MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#FFF9ED] border-4 border-[#8B502C] rounded-3xl shadow-2xl text-[#2B211B] max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Fixed Header */}
            <div className="px-5 py-4 border-b border-[#EEDFCA] flex items-start justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-kalam text-2xl font-bold text-[#3B1B0D] leading-tight">
                  Create Default Chai Group
                </h3>
                <p className="text-xs text-[#734A29] mt-0.5">
                  Admin dwara banaya gaya default group demo/template ke roop me save hoga.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F2E5D3] text-[#4A2412] cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateDefaultGroup} className="flex-1 flex flex-col min-h-0">
              <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#4A2412]">Chai Time</label>
                      <span className="text-[11px] font-bold text-[#8C4610]">{newChaiTime}</span>
                    </div>
                    <input
                      type="time"
                      value={newChaiTime24}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setNewChaiTime24(val);
                          setNewChaiTime(to12Hour(val));
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DFC08E] text-sm font-bold text-[#3B1B0D] focus:outline-none focus:ring-2 focus:ring-[#F4B52E] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-end pb-2">
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
              </div>

              {/* Fixed Footer Submit */}
              <div className="px-5 py-3.5 border-t border-[#EEDFCA] bg-[#FFF9ED] shrink-0">
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F4B52E] to-[#DE9008] text-[#281308] font-extrabold text-sm shadow-md cursor-pointer disabled:opacity-60"
                >
                  {creatingGroup ? 'Creating...' : 'Create Default Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
