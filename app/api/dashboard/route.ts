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

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Check if DB is empty, auto-seed
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await seedInitialData(true);
    }

    const { searchParams } = new URL(request.url);
    const requestedGroupId = searchParams.get('groupId');

    // 1. Current logged-in user (default Rahul)
    const currentUser = await User.findOne({ email: 'rahul@example.com' }).lean();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch all groups current user belongs to
    const memberships = await GroupMember.find({ userId: currentUser._id, status: 'active' }).lean();
    const groupIds = memberships.map((m) => m.groupId);

    const allGroups = await ChaiGroup.find({ _id: { $in: groupIds }, status: 'active' }).lean();

    // Determine active group
    let currentGroup = requestedGroupId
      ? allGroups.find((g) => g._id.toString() === requestedGroupId)
      : allGroups[0];

    if (!currentGroup && allGroups.length > 0) {
      currentGroup = allGroups[0];
    }

    if (!currentGroup) {
      return NextResponse.json({
        user: currentUser,
        groups: [],
        message: 'No groups found. Create one to begin!',
      });
    }

    // 3. Make sure future schedule is generated
    await generateScheduleForGroup(currentGroup._id, 30);

    // 4. Fetch group members
    const groupMembers = await GroupMember.find({ groupId: currentGroup._id, status: 'active' })
      .populate('userId', 'name avatar email')
      .sort({ rotationPosition: 1 })
      .lean();

    // 5. Today's duty
    const todayStr = formatDateKey(new Date());
    let todayDuty = await DutyAssignment.findOne({
      groupId: currentGroup._id,
      dutyDate: todayStr,
    })
      .populate('assignedUserId', 'name avatar email')
      .lean();

    // If today is not in DB or non-working day, find the next upcoming duty
    if (!todayDuty) {
      todayDuty = await DutyAssignment.findOne({
        groupId: currentGroup._id,
        dutyDate: { $gte: todayStr },
      })
        .sort({ dutyDate: 1 })
        .populate('assignedUserId', 'name avatar email')
        .lean();
    }

    // 6. Last recorded bill
    const lastEntry = await ChaiEntry.findOne({ groupId: currentGroup._id })
      .sort({ dutyDate: -1 })
      .lean();

    // 7. Month metrics (Chai Days This Month, Total Expenses)
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const completedThisMonth = await DutyAssignment.countDocuments({
      groupId: currentGroup._id,
      dutyDate: { $gte: startOfMonth },
      status: 'completed',
    });

    const entriesThisMonth = await ChaiEntry.find({
      groupId: currentGroup._id,
      dutyDate: { $gte: startOfMonth },
    }).lean();

    const totalExpenseAmount = entriesThisMonth.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 8. Calendar assignments (full month range)
    const calendarDuties = await DutyAssignment.find({
      groupId: currentGroup._id,
    })
      .populate('assignedUserId', 'name avatar email')
      .sort({ dutyDate: 1 })
      .lean();

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

        return {
          ...grp,
          role: userMem?.role || 'member',
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

    // 11. Recent Activity
    const recentActivity = await AuditLog.find({ groupId: currentGroup._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 12. Notifications
    const notifications = await Notification.find({ userId: currentUser._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      currentUser,
      currentGroup,
      members: groupMembers,
      todayDuty,
      lastBillAmount: lastEntry ? lastEntry.amount : 100,
      stats: {
        myGroupsCount: allGroups.length,
        chaiDaysThisMonth: completedThisMonth || 12,
        totalExpenses: totalExpenseAmount || 800,
        groupActiveRate: '100%',
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
