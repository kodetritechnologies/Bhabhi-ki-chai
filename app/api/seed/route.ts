import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { seedInitialData } from '@/lib/seedData';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { formatDateKey } from '@/lib/rotationEngine';

async function seedDummyForGroup(groupId: string) {
  await connectToDatabase();
  const group = await ChaiGroup.findById(groupId);
  if (!group) {
    throw new Error('Group nahi mila');
  }

  const members = await GroupMember.find({ groupId: group._id, status: 'active' })
    .populate('userId', 'name')
    .sort({ rotationPosition: 1 });

  if (members.length === 0) {
    throw new Error('Group me koi active member nahi hai');
  }

  const notes = [
    '4 Special Adrak Chai + Toast',
    '5 Cutting Chai + Samosa',
    '3 Masala Chai + Bun Maska',
    '6 Regular Chai + Biscuit',
    '4 Elaichi Chai',
    '5 Kulhad Chai + Kachori',
  ];

  const today = new Date();
  let createdPayments = 0;
  let createdLogs = 0;
  let createdNotifications = 0;

  for (let i = 1; i <= 12; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = formatDateKey(d);
    const member = members[i % members.length];
    const userObj = member.userId as unknown as { _id?: mongoose.Types.ObjectId; name?: string };
    const payerId = userObj?._id || (member.userId as mongoose.Types.ObjectId);
    const payerName = userObj?.name || 'Member';
    const amount = 50 + (i % 5) * 20;
    const paymentStatus = i % 3 === 0 ? 'pending' : 'paid';
    const note = notes[i % notes.length];

    const duty = await DutyAssignment.findOneAndUpdate(
      { groupId: group._id, dutyDate: dateKey },
      {
        groupId: group._id,
        dutyDate: dateKey,
        assignedUserId: payerId,
        status: 'completed',
        source: 'automatic',
        notes: note,
      },
      { upsert: true, new: true }
    );

    await ChaiEntry.findOneAndUpdate(
      { dutyAssignmentId: duty._id },
      {
        groupId: group._id,
        dutyAssignmentId: duty._id,
        dutyDate: dateKey,
        amount,
        currency: 'INR',
        paidByUserId: payerId,
        paymentStatus,
        dutyCompletionStatus: 'completed',
        note,
        createdBy: payerId,
      },
      { upsert: true, new: true }
    );
    createdPayments++;

    await AuditLog.create({
      groupId: group._id,
      actorUserId: payerId,
      action: i % 4 === 0 ? 'Duty Swapped' : 'Chai Completed',
      entityType: 'ChaiEntry',
      entityId: `${duty._id}`,
      reason: `${payerName} ne ${dateKey} ko ${note} (₹${amount} - ${paymentStatus}) record kiya.`,
      createdAt: d,
    });
    createdLogs++;
  }

  for (let j = 0; j < 6; j++) {
    const targetMember = members[j % members.length];
    const targetUser = targetMember.userId as unknown as { _id?: mongoose.Types.ObjectId };
    const uid = targetUser?._id || (targetMember.userId as mongoose.Types.ObjectId);
    await Notification.create({
      userId: uid,
      groupId: group._id,
      title: j % 2 === 0 ? 'Chai Time Reminder ☕' : 'Payment Update 💳',
      message:
        j % 2 === 0
          ? `'${group.name}' me aapki chai duty ka reminder #${j + 1}.`
          : `'${group.name}' me naya chai bill record hua hai (#${j + 1}).`,
      type: j % 2 === 0 ? 'turn_today' : 'payment_recorded',
      read: j >= 4,
    });
    createdNotifications++;
  }

  return {
    message: `Dummy test data seeded for '${group.name}'!`,
    createdPayments,
    createdLogs,
    createdNotifications,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const dummy = searchParams.get('dummy') === 'true';
    const groupId = searchParams.get('groupId') || '';

    if (dummy && groupId) {
      const dummyResult = await seedDummyForGroup(groupId);
      return NextResponse.json({ success: true, ...dummyResult });
    }

    const result = await seedInitialData(force);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const dummy = searchParams.get('dummy') === 'true';
    const groupId = searchParams.get('groupId') || '';

    if (dummy && groupId) {
      const dummyResult = await seedDummyForGroup(groupId);
      return NextResponse.json({ success: true, ...dummyResult });
    }

    const result = await seedInitialData(force);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
