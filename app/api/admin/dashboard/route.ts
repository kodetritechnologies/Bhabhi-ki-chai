import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAdminSession } from '@/lib/adminAuth';
import { User } from '@/models/User';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';

const DEFAULT_INVITE_CODES = ['CHAI-OFFICE-99', 'CHAI-DOST-77', 'CHAI-WKND-22'];

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const [
      users,
      groups,
      memberships,
      completedDutiesCount,
      allEntries,
      recentActivities,
      recentNotifications,
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }).lean(),
      ChaiGroup.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).lean(),
      GroupMember.find({ status: 'active' }).lean(),
      DutyAssignment.countDocuments({ status: 'completed' }),
      ChaiEntry.find().lean(),
      AuditLog.find()
        .populate('actorUserId', 'name email')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
      Notification.find()
        .populate('userId', 'name email')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
    ]);

    // Count members per group and groups per user
    const groupMemberCounts: Record<string, number> = {};
    const userGroupCounts: Record<string, number> = {};
    memberships.forEach((m) => {
      const gid = m.groupId?.toString();
      const uid = m.userId?.toString();
      if (gid) groupMemberCounts[gid] = (groupMemberCounts[gid] || 0) + 1;
      if (uid) userGroupCounts[uid] = (userGroupCounts[uid] || 0) + 1;
    });

    const enrichedUsers = users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      groupsCount: userGroupCounts[u._id.toString()] || 0,
      createdAt: u.createdAt,
    }));

    const enrichedGroups = groups.map((g) => {
      const isDefault = !!g.isDefault || DEFAULT_INVITE_CODES.includes(g.inviteCode || '');
      return {
        _id: g._id.toString(),
        name: g.name,
        description: g.description || '',
        chaiTime: g.chaiTime,
        workingDays: g.workingDays || [],
        inviteCode: g.inviteCode,
        bannerImage: g.bannerImage || '',
        status: g.status,
        isDefault,
        memberCount: groupMemberCounts[g._id.toString()] || 0,
        createdBy: g.createdBy as unknown as { name?: string; email?: string } | null,
        createdAt: g.createdAt,
      };
    });

    const totalExpenses = allEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const defaultGroupsCount = enrichedGroups.filter((g) => g.isDefault).length;

    return NextResponse.json({
      success: true,
      admin: session,
      stats: {
        totalUsers: enrichedUsers.length,
        totalGroups: enrichedGroups.length,
        defaultGroupsCount,
        customGroupsCount: enrichedGroups.length - defaultGroupsCount,
        totalExpenses,
        completedDuties: completedDutiesCount,
      },
      users: enrichedUsers,
      groups: enrichedGroups,
      recentActivities,
      recentNotifications,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Admin dashboard error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
