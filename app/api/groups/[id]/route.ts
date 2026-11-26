import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { formatDateKey, rebalanceUpcomingSchedule } from '@/lib/rotationEngine';

const MEMBER_COLORS = ['#3B82F6', '#10B981', '#EC4899', '#F97316', '#8B5CF6', '#EAB308'];
const DEFAULT_INVITE_CODES = ['CHAI-OFFICE-99', 'CHAI-DOST-77', 'CHAI-WKND-22'];

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userEmail = (searchParams.get('userEmail') || '').trim().toLowerCase();

    const group = await ChaiGroup.findById(id).lean();
    if (!group || group.status === 'archived') {
      return NextResponse.json({ success: false, error: 'Group nahi mila' }, { status: 404 });
    }

    const members = await GroupMember.find({ groupId: group._id, status: 'active' })
      .populate('userId', 'name email avatar')
      .sort({ rotationPosition: 1 })
      .lean();

    let canEdit = false;
    if (userEmail) {
      const currentUser = await User.findOne({ email: userEmail }).lean();
      if (currentUser) {
        const isCreator = group.createdBy?.toString() === currentUser._id.toString();
        const isAdminMember = members.some(
          (m) =>
            (m.userId as unknown as { _id?: { toString(): string } })?._id?.toString() ===
              currentUser._id.toString() && m.role === 'admin'
        );
        const isDefault = !!group.isDefault || DEFAULT_INVITE_CODES.includes(group.inviteCode || '');
        canEdit = !isDefault && (isCreator || isAdminMember);
      }
    }

    return NextResponse.json({
      success: true,
      canEdit,
      group: {
        _id: group._id,
        name: group.name,
        description: group.description || '',
        chaiTime: group.chaiTime || '10:30 AM',
        workingDays: group.workingDays || [1, 2, 3, 4, 5, 6],
        inviteCode: group.inviteCode,
        createdBy: group.createdBy?.toString() || '',
      },
      members: members.map((m) => {
        const u = m.userId as unknown as { _id: { toString(): string }; name: string; email: string; avatar?: string };
        return {
          userId: u?._id?.toString() || '',
          name: u?.name || 'Member',
          email: u?.email || '',
          avatar: u?.avatar || '/images/default-avatar.png',
          role: m.role,
          isCreator: group.createdBy?.toString() === u?._id?.toString(),
        };
      }),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const body = await request.json();
    const {
      userEmail = '',
      name,
      description,
      chaiTime,
      workingDays,
      addMemberEmails = [],
      removeUserIds = [],
    } = body;

    const cleanActorEmail = String(userEmail).trim().toLowerCase();
    if (!cleanActorEmail) {
      return NextResponse.json({ success: false, error: 'Login zaroori hai!' }, { status: 401 });
    }

    const actorUser = await User.findOne({ email: cleanActorEmail });
    if (!actorUser) {
      return NextResponse.json({ success: false, error: 'User nahi mila!' }, { status: 404 });
    }

    const group = await ChaiGroup.findById(id);
    if (!group || group.status === 'archived') {
      return NextResponse.json({ success: false, error: 'Group nahi mila!' }, { status: 404 });
    }

    if (group.isDefault || DEFAULT_INVITE_CODES.includes(group.inviteCode || '')) {
      return NextResponse.json(
        { success: false, error: 'Default group ko update nahi kiya ja sakta.' },
        { status: 403 }
      );
    }

    const actorMembership = await GroupMember.findOne({
      groupId: group._id,
      userId: actorUser._id,
      status: 'active',
    });
    const isCreator = group.createdBy?.toString() === actorUser._id.toString();
    if (!isCreator && actorMembership?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Sirf group admin hi group update kar sakta hai!' },
        { status: 403 }
      );
    }

    // 1. Update group fields
    if (typeof name === 'string' && name.trim()) {
      group.name = name.trim();
    }
    if (typeof description === 'string') {
      group.description = description.trim();
    }
    if (typeof chaiTime === 'string' && chaiTime.trim()) {
      group.chaiTime = chaiTime.trim();
    }
    if (Array.isArray(workingDays) && workingDays.length > 0) {
      group.workingDays = workingDays;
    }
    await group.save();

    // 2. Remove members (never remove group creator)
    const removedIds: string[] = [];
    if (Array.isArray(removeUserIds) && removeUserIds.length > 0) {
      for (const uid of removeUserIds) {
        if (!uid || uid === group.createdBy?.toString()) continue;
        const res = await GroupMember.findOneAndUpdate(
          { groupId: group._id, userId: uid, status: 'active' },
          { status: 'inactive' }
        );
        if (res) {
          removedIds.push(uid);
        }
      }
    }

    // 3. Add new members by email (auto-create user if needed)
    let addedCount = 0;
    if (Array.isArray(addMemberEmails) && addMemberEmails.length > 0) {
      let activeCount = await GroupMember.countDocuments({ groupId: group._id, status: 'active' });

      for (const rawEmail of addMemberEmails) {
        const cleanEmail = String(rawEmail || '').trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes('@')) continue;

        let memberUser = await User.findOne({ email: cleanEmail });
        if (!memberUser) {
          const namePart = cleanEmail.split('@')[0];
          const autoName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          memberUser = await User.create({
            name: autoName,
            email: cleanEmail,
            avatar: '/images/default-avatar.png',
          });
        }

        const existing = await GroupMember.findOne({
          groupId: group._id,
          userId: memberUser._id,
        });

        if (existing) {
          if (existing.status !== 'active') {
            existing.status = 'active';
            existing.rotationPosition = activeCount;
            await existing.save();
            addedCount++;
            activeCount++;
          }
        } else {
          await GroupMember.create({
            groupId: group._id,
            userId: memberUser._id,
            role: 'member',
            rotationPosition: activeCount,
            color: MEMBER_COLORS[activeCount % MEMBER_COLORS.length],
            status: 'active',
          });
          addedCount++;
          activeCount++;

          await Notification.create({
            userId: memberUser._id,
            groupId: group._id,
            title: 'Chai Group Me Add Hue! ☕',
            message: `${actorUser.name} ne aapko '${group.name}' group me add kiya hai.`,
            type: 'member_joined',
            read: false,
          });
        }
      }
    }

    // 4. If a removed member had today's pending automatic duty, reassign it to first active member
    if (removedIds.length > 0) {
      const todayStr = formatDateKey(new Date());
      const firstActive = await GroupMember.findOne({
        groupId: group._id,
        status: 'active',
      }).sort({ rotationPosition: 1 });

      if (firstActive) {
        await DutyAssignment.updateMany(
          {
            groupId: group._id,
            dutyDate: todayStr,
            status: 'pending',
            source: 'automatic',
            assignedUserId: { $in: removedIds },
          },
          { assignedUserId: firstActive.userId }
        );
      }
    }

    // 5. Rebalance future upcoming schedule
    await rebalanceUpcomingSchedule(group._id, 30);

    // 6. Audit Log
    await AuditLog.create({
      groupId: group._id,
      actorUserId: actorUser._id,
      action: 'group_updated',
      entityType: 'ChaiGroup',
      entityId: group._id.toString(),
      reason: `${actorUser.name} ne '${group.name}' group update kiya (+${addedCount} added, -${removedIds.length} removed).`,
    });

    return NextResponse.json({
      success: true,
      message: `'${group.name}' safaltapoorvak update ho gaya!`,
      group,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating group:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
