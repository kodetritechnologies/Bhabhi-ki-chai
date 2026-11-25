import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { GroupMember } from '@/models/GroupMember';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';

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

    // Find next active member in rotation queue
    const members = await GroupMember.find({ groupId: duty.groupId, status: 'active' }).sort({
      rotationPosition: 1,
    });

    if (members.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 members to reassign' }, { status: 400 });
    }

    const currentIndex = members.findIndex(
      (m) => m.userId.toString() === duty.assignedUserId._id.toString()
    );
    const nextMember = members[(currentIndex + 1) % members.length];

    const prevUser = duty.assignedUserId;
    duty.assignedUserId = nextMember.userId;
    duty.status = 'reassigned';
    duty.source = 'manual';
    duty.notes = `Skipped by ${(prevUser as unknown as { name: string }).name}: ${reason}`;
    await duty.save();

    const currentUser = await User.findOne({ email: 'rahul@example.com' });
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
