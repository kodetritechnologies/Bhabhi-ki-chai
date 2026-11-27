import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { GroupMember } from '@/models/GroupMember';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { ChaiGroup } from '@/models/ChaiGroup';
import { Notification } from '@/models/Notification';
import { sendPushToUsers } from '@/lib/webPush';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { dutyId, reason = 'Member unavailable' } = body;

    if (!dutyId) {
      return NextResponse.json({ error: 'dutyId is required' }, { status: 400 });
    }

    const duty = await DutyAssignment.findById(dutyId).populate('assignedUserId', 'name');
    if (!duty) {
      return NextResponse.json({ error: 'Duty not found' }, { status: 404 });
    }

    if (duty.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Completed duty skip nahi ki ja sakti.' },
        { status: 400 }
      );
    }

    const prevUserId = duty.assignedUserId._id;
    const prevUserName = (duty.assignedUserId as unknown as { name?: string })?.name || 'Member';

    // Smart Auto-Swap: Find the next upcoming non-completed duty assigned to a DIFFERENT member
    const nextDifferentDuty = await DutyAssignment.findOne({
      groupId: duty.groupId,
      dutyDate: { $gt: duty.dutyDate },
      status: { $ne: 'completed' },
      assignedUserId: { $ne: prevUserId },
    })
      .sort({ dutyDate: 1 })
      .populate('assignedUserId', 'name');

    const currentUser = await User.findOne({ email: 'rahul@example.com' });

    if (nextDifferentDuty) {
      const nextUserId = nextDifferentDuty.assignedUserId._id;
      const nextUserName =
        (nextDifferentDuty.assignedUserId as unknown as { name?: string })?.name || 'Next Member';

      // Swap today's duty with the next different member's duty
      duty.assignedUserId = nextUserId;
      duty.status = 'reassigned';
      duty.source = 'swap';
      duty.notes = `Skipped by ${prevUserName} (${reason}) — Auto-swapped with ${nextUserName} (${nextDifferentDuty.dutyDate})`;

      nextDifferentDuty.assignedUserId = prevUserId;
      nextDifferentDuty.source = 'swap';
      nextDifferentDuty.notes = `Auto-swapped from ${duty.dutyDate} (${prevUserName} skipped: ${reason})`;

      await Promise.all([duty.save(), nextDifferentDuty.save()]);

      await AuditLog.create({
        groupId: duty.groupId,
        actorUserId: currentUser ? currentUser._id : nextUserId,
        action: 'Duty Skipped & Auto-Swapped',
        entityType: 'DutyAssignment',
        entityId: `${duty._id}_${nextDifferentDuty._id}`,
        reason: `${prevUserName} skipped on ${duty.dutyDate} (${reason}). Auto-swapped with ${nextUserName} (${nextDifferentDuty.dutyDate}).`,
      });

      const [group, activeMembers] = await Promise.all([
        ChaiGroup.findById(duty.groupId).lean(),
        GroupMember.find({ groupId: duty.groupId, status: 'active' }).lean(),
      ]);
      const memberIds = activeMembers.map((m) => m.userId.toString());
      if (memberIds.length > 0) {
        const title = `🏃 Chutti Pe Gaye! (${group?.name || 'Chai Group'})`;
        const body = `${prevUserName} aaj chutti par hain (${reason}) — ab unki jagah ${nextUserName} chai pilayenge!`;
        await Promise.all([
          Notification.insertMany(
            memberIds.map((uid) => ({
              userId: uid,
              groupId: duty.groupId,
              type: 'duty_swapped',
              title,
              message: body,
              read: false,
              timeAgoText: 'just now',
            }))
          ),
          sendPushToUsers(memberIds, {
            title,
            body,
            url: '/',
            tag: `chai-skip-${duty._id}`,
          }),
        ]);
      }

      return NextResponse.json({
        success: true,
        message: `${prevUserName} ki duty skip hui aur ${nextUserName} (${nextDifferentDuty.dutyDate}) ke saath auto-swap ho gayi.`,
        duty,
        swappedWithDate: nextDifferentDuty.dutyDate,
      });
    }

    // Fallback: if no future duty exists yet, reassign to next active member in rotation queue
    const members = await GroupMember.find({ groupId: duty.groupId, status: 'active' }).sort({
      rotationPosition: 1,
    });

    if (members.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 members to reassign' }, { status: 400 });
    }

    const currentIndex = members.findIndex(
      (m) => m.userId.toString() === prevUserId.toString()
    );
    const nextMember = members[(currentIndex + 1) % members.length];

    duty.assignedUserId = nextMember.userId;
    duty.status = 'reassigned';
    duty.source = 'manual';
    duty.notes = `Skipped by ${prevUserName}: ${reason}`;
    await duty.save();

    await AuditLog.create({
      groupId: duty.groupId,
      actorUserId: currentUser ? currentUser._id : nextMember.userId,
      action: 'Duty Skipped & Reassigned',
      entityType: 'DutyAssignment',
      entityId: duty._id.toString(),
      reason: `Turn skipped on ${duty.dutyDate} (${reason}). Reassigned to next in queue.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Duty skipped and reassigned to next member.',
      duty,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
