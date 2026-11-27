import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { sendPushToUsers } from '@/lib/webPush';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      dutyId,
      amount,
      paidByUserId,
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

    const currentUser = await User.findOne({ email: 'rahul@example.com' });
    const billAmount = Number(amount) || 100;
    const payerId = paidByUserId || duty.assignedUserId;

    // 1. Mark Duty as completed
    duty.status = 'completed';
    duty.notes = note || duty.notes;
    await duty.save();

    // 2. Create or update ChaiEntry record (payment tracking separate from duty completion!)
    const entry = await ChaiEntry.findOneAndUpdate(
      { dutyAssignmentId: duty._id },
      {
        groupId: duty.groupId,
        dutyAssignmentId: duty._id,
        dutyDate: duty.dutyDate,
        amount: billAmount,
        currency: 'INR',
        paidByUserId: payerId,
        paymentStatus: paymentStatus, // 'paid', 'pending', or 'not_recorded'
        dutyCompletionStatus: 'completed',
        note: note || 'Chai & Snacks',
        createdBy: currentUser ? currentUser._id : payerId,
      },
      { upsert: true, new: true }
    );

    // 3. Add to Audit Log
    const [payer, group, activeMembers] = await Promise.all([
      User.findById(payerId),
      ChaiGroup.findById(duty.groupId).lean(),
      GroupMember.find({ groupId: duty.groupId, status: 'active' }).lean(),
    ]);
    const payerName = payer ? payer.name : 'Member';
    const assignedObj = duty.assignedUserId as unknown as { _id?: { toString(): string }; name?: string } | null;
    const assignedIdStr = assignedObj?._id?.toString() || duty.assignedUserId?.toString() || '';
    const assignedName = assignedObj?.name || 'Member';
    const isProxyPayer = payerId.toString() !== assignedIdStr;
    const groupName = group?.name || 'Chai Group';

    await AuditLog.create({
      groupId: duty.groupId,
      actorUserId: currentUser ? currentUser._id : payerId,
      action: 'Chai Completed',
      entityType: 'ChaiEntry',
      entityId: entry._id.toString(),
      reason: isProxyPayer
        ? `${assignedName} ki jagah ${payerName} ne ₹${billAmount} pay kiya (${paymentStatus})`
        : `₹${billAmount} paid by ${payerName} (${paymentStatus})`,
    });

    // 4. Send Fun In-App + Chrome Push Notifications to all group members
    let notifTitle = `💸 Bill Paid — Wah Taj! (${groupName})`;
    let notifBody = `${payerName} ne ₹${billAmount} ki kadak chai ka bill bhar diya (${note || 'Chai & Snacks'}). Shukriya boss!`;

    if (isProxyPayer) {
      notifTitle = `🦸‍♂️ Chai Hero Alert! (${groupName})`;
      notifBody = `Waah! ${assignedName} aaj busy/chutti par the, to ${payerName} ne unki jagah ₹${billAmount} ki chai pila di! Kya baat hai!`;
    } else if (paymentStatus === 'pending') {
      notifTitle = `📝 Tapri Khata Update (${groupName})`;
      notifBody = `${payerName} ki ₹${billAmount} ki chai ho gayi hai — payment abhi pending/khata me hai.`;
    }

    const memberIds = activeMembers.map((m) => m.userId.toString());
    if (memberIds.length > 0) {
      await Promise.all([
        Notification.insertMany(
          memberIds.map((uid) => ({
            userId: uid,
            groupId: duty.groupId,
            type: 'payment_recorded',
            title: notifTitle,
            message: notifBody,
            read: false,
            timeAgoText: 'just now',
          }))
        ),
        sendPushToUsers(memberIds, {
          title: notifTitle,
          body: notifBody,
          url: '/',
          tag: `chai-paid-${duty._id}`,
        }),
      ]);
    }

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
