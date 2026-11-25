import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { dutyId1, dutyId2, reason = 'Mutual agreement' } = body;

    if (!dutyId1 || !dutyId2) {
      return NextResponse.json({ error: 'Both dutyId1 and dutyId2 are required' }, { status: 400 });
    }

    const [duty1, duty2] = await Promise.all([
      DutyAssignment.findById(dutyId1).populate('assignedUserId', 'name'),
      DutyAssignment.findById(dutyId2).populate('assignedUserId', 'name'),
    ]);

    if (!duty1 || !duty2) {
      return NextResponse.json({ error: 'One or both duties not found' }, { status: 404 });
    }

    if (duty1.status === 'completed' || duty2.status === 'completed') {
      return NextResponse.json({ error: 'Cannot swap already completed duties' }, { status: 400 });
    }

    // Swap assigned users
    const tempUser = duty1.assignedUserId;
    duty1.assignedUserId = duty2.assignedUserId;
    duty2.assignedUserId = tempUser;

    duty1.source = 'swap';
    duty2.source = 'swap';

    await Promise.all([duty1.save(), duty2.save()]);

    const currentUser = await User.findOne({ email: 'rahul@example.com' });

    // Log the audit record
    await AuditLog.create({
      groupId: duty1.groupId,
      actorUserId: currentUser ? currentUser._id : duty1.assignedUserId,
      action: 'Duty Swapped',
      entityType: 'DutyAssignment',
      entityId: `${duty1._id}_${duty2._id}`,
      reason: `Swapped duties between ${duty1.dutyDate} and ${duty2.dutyDate} (${reason})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Duties swapped successfully!',
      duty1,
      duty2,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
