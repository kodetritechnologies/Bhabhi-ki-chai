import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAdminSession } from '@/lib/adminAuth';
import { User } from '@/models/User';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { generateScheduleForGroup } from '@/lib/rotationEngine';

const BANNER_PRESETS = [
  '/images/golden-hour-tapri.jpg',
  '/images/doston-ki-chai-banner.jpg',
  '/images/cozy-tea-stall.jpg',
  '/images/chai-lovers-banner.jpg',
];

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const {
      name,
      description = '',
      chaiTime = '10:30 AM',
      workingDays = [1, 2, 3, 4, 5, 6],
      bannerImage = '',
      isDefault = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Group name zaroori hai' }, { status: 400 });
    }

    // Find or create an admin user record to own the default group
    let adminUser = await User.findOne({ email: session.email });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Tapri Admin',
        email: session.email,
        avatar: '/images/default-avatar.png',
      });
    }

    const prefix = name
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'CHAI';
    const randNum = Math.floor(10 + Math.random() * 89);
    const inviteCode = `CHAI-${prefix}-${randNum}`;

    const chosenBanner =
      bannerImage || BANNER_PRESETS[Math.floor(Math.random() * BANNER_PRESETS.length)];

    const newGroup = await ChaiGroup.create({
      name: name.trim(),
      description: description.trim(),
      createdBy: adminUser._id,
      timezone: 'Asia/Kolkata',
      workingDays: Array.isArray(workingDays) && workingDays.length > 0 ? workingDays : [1, 2, 3, 4, 5, 6],
      chaiTime: chaiTime.trim() || '10:30 AM',
      status: 'active',
      isDefault: Boolean(isDefault),
      inviteCode,
      bannerImage: chosenBanner,
      rotationPolicy: 'move_to_end',
    });

    await GroupMember.create({
      groupId: newGroup._id,
      userId: adminUser._id,
      role: 'admin',
      rotationPosition: 0,
      color: '#3B82F6',
      status: 'active',
    });

    await generateScheduleForGroup(newGroup._id, 30);

    await AuditLog.create({
      groupId: newGroup._id,
      actorUserId: adminUser._id,
      action: isDefault ? 'default_group_created' : 'group_created',
      entityType: 'ChaiGroup',
      entityId: newGroup._id.toString(),
      reason: `Admin ne ${isDefault ? 'default ' : ''}group '${newGroup.name}' create kiya. Code: ${inviteCode}`,
    });

    return NextResponse.json({
      success: true,
      message: `${isDefault ? 'Default' : ''} Group '${newGroup.name}' create ho gaya!`,
      group: newGroup,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Admin create group error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
    }

    const group = await ChaiGroup.findById(groupId);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    await Promise.all([
      GroupMember.deleteMany({ groupId: group._id }),
      DutyAssignment.deleteMany({ groupId: group._id }),
      ChaiEntry.deleteMany({ groupId: group._id }),
      AuditLog.deleteMany({ groupId: group._id }),
      Notification.deleteMany({ groupId: group._id }),
      ChaiGroup.findByIdAndDelete(group._id),
    ]);

    return NextResponse.json({
      success: true,
      message: `'${group.name}' admin dwara delete kar diya gaya.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Admin delete group error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
