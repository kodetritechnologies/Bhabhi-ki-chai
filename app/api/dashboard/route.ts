import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';
import { seedInitialData } from '@/lib/seedData';
import { formatDateKey, generateScheduleForGroup } from '@/lib/rotationEngine';

function buildDemoDashboardData(requestedGroupId?: string | null) {
  const now = new Date();
  const todayStr = formatDateKey(now);

  const demoMembers = [
    { userId: { _id: 'demo-u1', name: 'Rahul', avatar: '/images/default-avatar.png', email: 'rahul@example.com' }, color: '#4B7BEC', role: 'admin' },
    { userId: { _id: 'demo-u2', name: 'Amit', avatar: '/images/default-avatar.png', email: 'amit@example.com' }, color: '#73984E', role: 'member' },
    { userId: { _id: 'demo-u3', name: 'Sandeep', avatar: '/images/default-avatar.png', email: 'sandeep@example.com' }, color: '#E84393', role: 'member' },
    { userId: { _id: 'demo-u4', name: 'Vikas', avatar: '/images/default-avatar.png', email: 'vikas@example.com' }, color: '#FA8231', role: 'member' },
  ];

  const demoGroups = [
    {
      _id: 'demo-office',
      name: 'Office Chai Group',
      description: 'Daily cutting chai & tech charcha with the core team',
      role: 'member' as const,
      isDefault: true,
      canDelete: false,
      memberCount: 4,
      workingDaysCount: 6,
      workingDays: [1, 2, 3, 4, 5, 6],
      bannerImage: '/images/golden-hour-tapri.jpg',
      inviteCode: 'CHAI-OFFICE-99',
      nextDuty: { date: todayStr, assignedTo: 'Rahul', isUser: false },
    },
    {
      _id: 'demo-friends',
      name: 'Friends Chai Club',
      description: 'Sham ki tapri baazi with old college buddies',
      role: 'member' as const,
      isDefault: true,
      canDelete: false,
      memberCount: 4,
      workingDaysCount: 7,
      workingDays: [0, 1, 2, 3, 4, 5, 6],
      bannerImage: '/images/doston-ki-chai-banner.jpg',
      inviteCode: 'CHAI-DOST-77',
      nextDuty: { date: todayStr, assignedTo: 'Amit', isUser: false },
    },
    {
      _id: 'demo-weekend',
      name: 'Weekend Chai',
      description: 'Sat-Sun special bun maska & chai',
      role: 'member' as const,
      isDefault: true,
      canDelete: false,
      memberCount: 4,
      workingDaysCount: 2,
      workingDays: [0, 6],
      bannerImage: '/images/cozy-tea-stall.jpg',
      inviteCode: 'CHAI-WKND-22',
      nextDuty: { date: todayStr, assignedTo: 'Sandeep', isUser: false },
    },
  ];

  const currentGroup = demoGroups.find((g) => g._id === requestedGroupId) || demoGroups[0];

  const calendarDuties = Array.from({ length: 14 }, (_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 4 + idx);
    const dateKey = formatDateKey(d);
    const m = demoMembers[idx % demoMembers.length];
    return {
      _id: `demo-duty-${idx}`,
      dutyDate: dateKey,
      assignedUserId: m.userId,
      status: idx < 4 ? 'completed' : idx === 4 ? 'pending' : 'upcoming',
      memberColor: m.color,
    };
  });

  const todayDuty = calendarDuties.find((d) => d.dutyDate === todayStr) || calendarDuties[4];
  const upcomingSchedule = calendarDuties.filter((d) => d.dutyDate > todayStr).slice(0, 5);

  return {
    success: true,
    currentUser: { _id: 'demo-guest', name: 'Rahul', email: '', avatar: '/images/default-avatar.png' },
    currentGroup,
    members: demoMembers,
    todayDuty,
    lastBillAmount: 80,
    stats: {
      myGroupsCount: demoGroups.length,
      chaiDaysThisMonth: 12,
      totalExpenses: 800,
      groupActiveRate: '100%',
    },
    calendarDuties,
    upcomingSchedule,
    groups: demoGroups,
    recentActivity: [
      { _id: 'demo-act-1', action: 'Chai Completed', reason: '4 Special Adrak Chai + Toast (₹80)', createdAt: now.toISOString() },
      { _id: 'demo-act-2', action: 'Duty Assigned', reason: 'Aaj ki chai duty assign ki gayi', createdAt: now.toISOString() },
    ],
    notifications: [
      { _id: 'demo-n1', title: 'Chai Time Reminder ☕', message: 'Aaj ki chai duty Rahul ki hai.', read: false, timeAgoText: 'just now' },
    ],
    unreadNotificationsCount: 1,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedGroupId = searchParams.get('groupId');
    const requestedUserEmail = searchParams.get('userEmail');

    // When logged out (no userEmail), never return real DB user/group data — return static demo data
    if (!requestedUserEmail || !requestedUserEmail.trim()) {
      return NextResponse.json(buildDemoDashboardData(requestedGroupId));
    }

    await connectToDatabase();

    // 1. Current logged-in user
    const currentUser = await User.findOne({ email: requestedUserEmail.trim().toLowerCase() }).lean();
    if (!currentUser) {
      return NextResponse.json({
        ...buildDemoDashboardData(requestedGroupId),
        userNotFound: true,
      });
    }

    // 2. Fetch all groups current user belongs to
    const memberships = await GroupMember.find({ userId: currentUser._id, status: 'active' }).lean();
    const groupIds = memberships.map((m) => m.groupId);

    let allGroups = await ChaiGroup.find({ _id: { $in: groupIds }, status: 'active' }).lean();

    // If user is new and has no groups yet, provide default/existing active groups to view
    const DEFAULT_INVITE_CODES = ['CHAI-OFFICE-99', 'CHAI-DOST-77', 'CHAI-WKND-22'];
    if (allGroups.length === 0) {
      allGroups = await ChaiGroup.find({
        status: 'active',
        $or: [{ isDefault: true }, { inviteCode: { $in: DEFAULT_INVITE_CODES } }],
      }).lean();
      if (allGroups.length === 0) {
        allGroups = await ChaiGroup.find({ status: 'active' }).limit(3).lean();
      }
    }

    // Determine active group
    let currentGroup = requestedGroupId
      ? (allGroups.find((g) => g._id.toString() === requestedGroupId) || (await ChaiGroup.findById(requestedGroupId).lean()))
      : allGroups[0];

    if (!currentGroup && allGroups.length > 0) {
      currentGroup = allGroups[0];
    }

    if (!currentGroup) {
      return NextResponse.json({
        success: true,
        currentUser,
        groups: [],
        stats: {
          myGroupsCount: 0,
          chaiDaysThisMonth: 0,
          totalExpenses: 0,
          groupActiveRate: '0%',
        },
        message: 'No groups found. Create one to begin!',
      });
    }

    // 3. Ensure future schedule exists, then fetch all group data in parallel
    await generateScheduleForGroup(currentGroup._id, 30);

    const todayStr = formatDateKey(new Date());
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = `${yearMonth}-01`;
    const endOfMonth = `${yearMonth}-31`;

    const [
      groupMembers,
      todayDutyExact,
      lastEntry,
      dutiesThisMonth,
      entriesThisMonth,
      calendarDuties,
      recentActivity,
      notifications,
    ] = await Promise.all([
      GroupMember.find({ groupId: currentGroup._id, status: 'active' })
        .populate('userId', 'name avatar email')
        .sort({ rotationPosition: 1 })
        .lean(),
      DutyAssignment.findOne({
        groupId: currentGroup._id,
        dutyDate: todayStr,
      })
        .populate('assignedUserId', 'name avatar email')
        .lean(),
      ChaiEntry.findOne({ groupId: currentGroup._id })
        .sort({ dutyDate: -1 })
        .lean(),
      DutyAssignment.find({
        groupId: currentGroup._id,
        dutyDate: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
      ChaiEntry.find({
        groupId: currentGroup._id,
        dutyDate: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
      DutyAssignment.find({
        groupId: currentGroup._id,
      })
        .populate('assignedUserId', 'name avatar email')
        .sort({ dutyDate: 1 })
        .lean(),
      AuditLog.find({ groupId: currentGroup._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Notification.find({ userId: currentUser._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    let todayDuty = todayDutyExact;
    if (!todayDuty) {
      todayDuty = await DutyAssignment.findOne({
        groupId: currentGroup._id,
        dutyDate: { $gte: todayStr },
      })
        .sort({ dutyDate: 1 })
        .populate('assignedUserId', 'name avatar email')
        .lean();
    }

    const completedThisMonth = dutiesThisMonth.filter((d) => d.status === 'completed').length;
    const eligibleDuties = dutiesThisMonth.filter(
      (d) => d.dutyDate < todayStr || d.status === 'completed' || d.status === 'skipped'
    );
    const groupActivePercent =
      eligibleDuties.length > 0
        ? Math.round((completedThisMonth / eligibleDuties.length) * 100)
        : 0;

    const totalExpenseAmount = entriesThisMonth.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Map member colors to duties
    const memberColorMap: Record<string, string> = {};
    groupMembers.forEach((gm) => {
      if (gm.userId && (gm.userId as unknown as { _id: string })._id) {
        memberColorMap[(gm.userId as unknown as { _id: string })._id.toString()] = gm.color;
      }
    });

    const enrichedCalendarDuties = calendarDuties.map((duty) => {
      const assignedId = (duty.assignedUserId as unknown as { _id: string })?._id?.toString() || '';
      return {
        ...duty,
        memberColor: memberColorMap[assignedId] || '#F59E0B',
      };
    });

    // 9. Upcoming schedule (next 5 days)
    const upcomingSchedule = enrichedCalendarDuties
      .filter((d) => d.dutyDate >= todayStr && d.dutyDate !== todayDuty?.dutyDate)
      .slice(0, 5);

    // 10. Groups card data enriched with member count and next duty
    const enrichedGroups = await Promise.all(
      allGroups.map(async (grp) => {
        const memCount = await GroupMember.countDocuments({ groupId: grp._id, status: 'active' });
        const userMem = memberships.find((m) => m.groupId.toString() === grp._id.toString());
        const nextDuty = await DutyAssignment.findOne({
          groupId: grp._id,
          dutyDate: { $gte: todayStr },
        })
          .sort({ dutyDate: 1 })
          .populate('assignedUserId', 'name')
          .lean();

        const isDefaultGroup =
          !!grp.isDefault || DEFAULT_INVITE_CODES.includes(grp.inviteCode || '');
        const canDelete =
          !isDefaultGroup && grp.createdBy?.toString() === currentUser._id.toString();

        return {
          ...grp,
          role: userMem?.role || 'member',
          isDefault: isDefaultGroup,
          canDelete,
          memberCount: memCount,
          workingDaysCount: grp.workingDays ? grp.workingDays.length : 6,
          nextDuty: nextDuty
            ? {
                date: nextDuty.dutyDate,
                assignedTo: (nextDuty.assignedUserId as unknown as { name: string })?.name || 'Pending',
                isUser:
                  (nextDuty.assignedUserId as unknown as { _id: string })?._id?.toString() ===
                  currentUser._id.toString(),
              }
            : null,
        };
      })
    );

    const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      currentUser,
      currentGroup,
      members: groupMembers,
      todayDuty,
      lastBillAmount: lastEntry ? lastEntry.amount : 0,
      stats: {
        myGroupsCount: allGroups.length,
        chaiDaysThisMonth: completedThisMonth,
        totalExpenses: totalExpenseAmount,
        groupActiveRate: `${groupActivePercent}%`,
      },
      calendarDuties: enrichedCalendarDuties,
      upcomingSchedule,
      groups: enrichedGroups,
      recentActivity,
      notifications,
      unreadNotificationsCount,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
