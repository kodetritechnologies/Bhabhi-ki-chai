import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import { formatDateKey, parseDateKey } from '@/lib/rotationEngine';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { dutyId, userEmail } = body;

    if (!dutyId) {
      return NextResponse.json({ success: false, error: 'dutyId is required' }, { status: 400 });
    }

    const duty = await DutyAssignment.findById(dutyId).populate('assignedUserId', 'name');
    if (!duty) {
      return NextResponse.json({ success: false, error: 'Duty not found' }, { status: 404 });
    }

    if (duty.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Completed duty par holiday mark nahi ho sakta.' },
        { status: 400 }
      );
    }

    if (duty.status === 'skipped') {
      return NextResponse.json(
        { success: false, error: 'Yeh din pehle se Holiday / No Chai mark hai.' },
        { status: 400 }
      );
    }

    const group = await ChaiGroup.findById(duty.groupId);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    // 1. Add this date to group.holidays so future regenerations respect it
    if (!group.holidays.includes(duty.dutyDate)) {
      group.holidays.push(duty.dutyDate);
      await group.save();
    }

    // 2. Capture all non-completed duties from this date onwards to shift their turns forward
    const futureNonCompleted = await DutyAssignment.find({
      groupId: group._id,
      dutyDate: { $gte: duty.dutyDate },
      status: { $ne: 'completed' },
    })
      .sort({ dutyDate: 1 })
      .lean();

    const userQueue = futureNonCompleted.map((d) => d.assignedUserId);
    const startSeq = futureNonCompleted[0]?.rotationSequence ?? duty.rotationSequence;

    // 3. Mark today's duty as skipped (Holiday)
    duty.status = 'skipped';
    duty.source = 'manual';
    duty.notes = 'Holiday / No Chai Today';
    await duty.save();

    // 4. Delete future non-completed duties after today
    await DutyAssignment.deleteMany({
      groupId: group._id,
      dutyDate: { $gt: duty.dutyDate },
      status: { $ne: 'completed' },
    });

    // 5. Re-assign future working days starting tomorrow, preserving the exact userQueue
    const members = await GroupMember.find({ groupId: group._id, status: 'active' }).sort({
      rotationPosition: 1,
    });

    if (members.length > 0) {
      const workingDays = new Set(group.workingDays || [1, 2, 3, 4, 5, 6]);
      const holidays = new Set(group.holidays || []);

      const existingCompleted = await DutyAssignment.find({
        groupId: group._id,
        dutyDate: { $gt: duty.dutyDate },
      })
        .select('dutyDate')
        .lean();
      const occupiedDates = new Set(existingCompleted.map((d) => d.dutyDate));

      const startDate = parseDateKey(duty.dutyDate);
      startDate.setDate(startDate.getDate() + 1);

      const newAssignments = [];
      let queueIdx = 0;
      let seq = startSeq + 1;

      // Determine fallback round-robin start index after the last queued user
      const lastQueuedUserId = userQueue[userQueue.length - 1]?.toString();
      const lastMemIdx = members.findIndex((m) => m.userId.toString() === lastQueuedUserId);
      let fallbackMemberIdx = lastMemIdx >= 0 ? (lastMemIdx + 1) % members.length : 0;

      const cursor = new Date(startDate);
      for (let i = 0; i < 30; i++) {
        const dayOfWeek = cursor.getDay();
        const dateKey = formatDateKey(cursor);

        if (!occupiedDates.has(dateKey) && workingDays.has(dayOfWeek) && !holidays.has(dateKey)) {
          let assignedUserId;
          if (queueIdx < userQueue.length) {
            assignedUserId = userQueue[queueIdx++];
          } else {
            assignedUserId = members[fallbackMemberIdx % members.length].userId;
            fallbackMemberIdx = (fallbackMemberIdx + 1) % members.length;
          }

          newAssignments.push({
            groupId: group._id,
            dutyDate: dateKey,
            assignedUserId,
            status: 'upcoming' as const,
            rotationSequence: seq++,
            source: 'automatic' as const,
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      if (newAssignments.length > 0) {
        await DutyAssignment.insertMany(newAssignments);
      }
    }

    const actor = userEmail
      ? await User.findOne({ email: userEmail.trim().toLowerCase() })
      : null;
    const prevName = (duty.assignedUserId as unknown as { name?: string })?.name || 'Member';

    await AuditLog.create({
      groupId: group._id,
      actorUserId: actor ? actor._id : duty.assignedUserId._id,
      action: 'Holiday / No Chai Today',
      entityType: 'DutyAssignment',
      entityId: duty._id.toString(),
      reason: `${duty.dutyDate} ko Holiday mark kiya gaya. ${prevName} ki baari next working day par shift ho gayi.`,
    });

    return NextResponse.json({
      success: true,
      message: `${duty.dutyDate} Holiday mark ho gaya! ${prevName} ki baari next working day par shift kar di gayi hai.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Holiday shift error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
