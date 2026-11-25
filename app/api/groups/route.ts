import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { User } from '@/models/User';
import { generateScheduleForGroup } from '@/lib/rotationEngine';

export async function GET() {
  try {
    await connectToDatabase();
    const currentUser = await User.findOne({ email: 'rahul@example.com' });
    if (!currentUser) return NextResponse.json({ groups: [] });

    const memberships = await GroupMember.find({ userId: currentUser._id, status: 'active' });
    const groupIds = memberships.map((m) => m.groupId);

    const groups = await ChaiGroup.find({ _id: { $in: groupIds }, status: 'active' }).lean();
    return NextResponse.json({ success: true, groups });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, description = '', workingDays = [1, 2, 3, 4, 5, 6], chaiTime = '10:00 AM' } = body;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const currentUser = await User.findOne({ email: 'rahul@example.com' });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const inviteCode = `CHAI-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

    const group = await ChaiGroup.create({
      name,
      description,
      createdBy: currentUser._id,
      timezone: 'Asia/Kolkata',
      workingDays,
      chaiTime,
      status: 'active',
      inviteCode,
      bannerImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80',
    });

    // Add creator as Admin
    await GroupMember.create({
      groupId: group._id,
      userId: currentUser._id,
      role: 'admin',
      rotationPosition: 0,
      color: '#3B82F6',
    });

    // Auto-generate initial schedule
    await generateScheduleForGroup(group._id, 14);

    return NextResponse.json({ success: true, group });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
