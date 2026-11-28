import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { formatDateKey, parseDateKey } from '@/lib/rotationEngine';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      dutyId,
      amount,
      paidByUserId,
      guestPayerName = '',
      shiftTurnOnGuest = false,
      paymentStatus = 'paid',
      note = '',
    } = body;

    if (!dutyId) {
      return NextResponse.json({ error: 'dutyId is required' }, { status: 400 });
    }

    const duty = await DutyAssignment.findById(dutyId).populate('assignedUserId', 'name');
    if (!duty) {
      return NextResponse.json({ error: 'Duty not found' }, { status: 404 });
    }

    const cleanGuestName = String(guestPayerName || '').trim();
    const isGuestPayment = Boolean(cleanGuestName);

    const currentUser = await User.findOne({ email: 'rahul@example.com' });
    const billAmount = Number(amount) || 100;
    const assignedUserObjId = duty.assignedUserId._id;
    const payerId = isGuestPayment ? undefined : paidByUserId || assignedUserObjId;

    // 1. Mark Duty as completed
    duty.status = 'completed';
    duty.notes = note || (isGuestPayment ? `Guest treat by ${cleanGuestName}` : duty.notes);
    await duty.save();

    // 2. Create or update ChaiEntry record
    const updatePayload: Record<string, unknown> = {
      groupId: duty.groupId,
      dutyAssignmentId: duty._id,
      dutyDate: duty.dutyDate,
      amount: billAmount,
      currency: 'INR',
      guestPayerName: isGuestPayment ? cleanGuestName : '',
      paymentStatus,
      dutyCompletionStatus: 'completed',
      note: note || (isGuestPayment ? `Guest treat by ${cleanGuestName}` : 'Chai & Snacks'),
      createdBy: currentUser ? currentUser._id : payerId || assignedUserObjId,
    };

    const updateOp = isGuestPayment
      ? { $set: updatePayload, $unset: { paidByUserId: 1 } }
      : { $set: { ...updatePayload, paidByUserId: payerId } };

    const entry = await ChaiEntry.findOneAndUpdate(
      { dutyAssignmentId: duty._id },
      updateOp,
      { upsert: true, new: true }
    );

    // 3. If Guest paid and user chose to preserve today's member turn, shift future non-completed turns by 1 working day
    if (isGuestPayment && shiftTurnOnGuest) {
      const group = await ChaiGroup.findById(duty.groupId);
      if (group) {
        const futureNonCompleted = await DutyAssignment.find({
          groupId: group._id,
          dutyDate: { $gt: duty.dutyDate },
          status: { $ne: 'completed' },
        })
          .sort({ dutyDate: 1 })
          .lean();

        const userQueue = [assignedUserObjId, ...futureNonCompleted.map((d) => d.assignedUserId)];

        await DutyAssignment.deleteMany({
          groupId: group._id,
          dutyDate: { $gt: duty.dutyDate },
          status: { $ne: 'completed' },
        });

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

          const lastQueuedUserId = userQueue[userQueue.length - 1]?.toString();
          const lastMemIdx = members.findIndex((m) => m.userId.toString() === lastQueuedUserId);
          let fallbackMemberIdx = lastMemIdx >= 0 ? (lastMemIdx + 1) % members.length : 0;

          const newAssignments = [];
          let queueIdx = 0;
          let seq = duty.rotationSequence + 1;
          const cursor = new Date(startDate);

          for (let i = 0; i < 30; i++) {
            const dayOfWeek = cursor.getDay();
            const dateKey = formatDateKey(cursor);

            if (!occupiedDates.has(dateKey) && workingDays.has(dayOfWeek) && !holidays.has(dateKey)) {
              let nextUid;
              if (queueIdx < userQueue.length) {
                nextUid = userQueue[queueIdx++];
              } else {
                nextUid = members[fallbackMemberIdx % members.length].userId;
                fallbackMemberIdx = (fallbackMemberIdx + 1) % members.length;
              }

              newAssignments.push({
                groupId: group._id,
                dutyDate: dateKey,
                assignedUserId: nextUid,
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
      }
    }

    // 4. Add to Audit Log
    let payerName = `${cleanGuestName} (Guest)`;
    if (!isGuestPayment && payerId) {
      const payer = await User.findById(payerId);
      payerName = payer ? payer.name : 'Member';
    }

    await AuditLog.create({
      groupId: duty.groupId,
      actorUserId: currentUser ? currentUser._id : payerId || assignedUserObjId,
      action: 'Chai Completed',
      entityType: 'ChaiEntry',
      entityId: entry._id.toString(),
      reason: `₹${billAmount} paid by ${payerName}`,
    });

    // 5. Send In-App Notification
    await Notification.create({
      userId: currentUser ? currentUser._id : payerId || assignedUserObjId,
      groupId: duty.groupId,
      type: 'payment_recorded',
      title: 'Payment Recorded',
      message: `₹${billAmount} (${payerName}) added for ${duty.dutyDate}.`,
      read: false,
      timeAgoText: 'just now',
    });

    return NextResponse.json({
      success: true,
      message: 'Duty marked as completed and chai bill recorded successfully!',
      duty,
      entry,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
