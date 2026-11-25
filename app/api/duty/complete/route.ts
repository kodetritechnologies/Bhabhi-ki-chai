import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

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
    const payer = await User.findById(payerId);
    const payerName = payer ? payer.name : 'Member';

    await AuditLog.create({
      groupId: duty.groupId,
      actorUserId: currentUser ? currentUser._id : payerId,
      action: 'Chai Completed',
      entityType: 'ChaiEntry',
      entityId: entry._id.toString(),
      reason: `₹${billAmount} paid by ${payerName}`,
    });

    // 4. Send In-App Notification
    await Notification.create({
      userId: currentUser ? currentUser._id : payerId,
      groupId: duty.groupId,
      type: 'payment_recorded',
      title: 'Payment Recorded',
      message: `₹${billAmount} added for ${duty.dutyDate}.`,
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
