import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { generateScheduleForGroup } from '@/lib/rotationEngine';

const MEMBER_COLORS = ['#3B82F6', '#10B981', '#EC4899', '#F97316', '#8B5CF6', '#EAB308'];

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { inviteCode, userEmail } = body;

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json(
        { success: false, error: 'Kripya invite code enter karein!' },
        { status: 400 }
      );
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    // 1. Find group by invite code
    const group = await ChaiGroup.findOne({ inviteCode: cleanCode, status: 'active' });
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Galat invite code! Aisa koi active group nahi mila.' },
        { status: 404 }
      );
    }

    // 2. Find user
    const emailToFind = (userEmail || '').trim().toLowerCase();
    let currentUser = null;
    if (emailToFind) {
      currentUser = await User.findOne({ email: emailToFind });
    }
    if (!currentUser) {
      currentUser = await User.findOne({ email: 'rahul@example.com' });
    }
    if (!currentUser) {
      currentUser = await User.findOne();
    }
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User nahi mila. Kripya pehle login karein.' },
        { status: 401 }
      );
    }

    // 3. Check if already a member
    const existingMembership = await GroupMember.findOne({
      groupId: group._id,
      userId: currentUser._id,
    });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        return NextResponse.json({
          success: true,
          alreadyMember: true,
          message: `Aap pehle se '${group.name}' ke member hain!`,
          group,
        });
      } else {
        // Reactivate membership
        existingMembership.status = 'active';
        await existingMembership.save();
        await generateScheduleForGroup(group._id, 30);
        return NextResponse.json({
          success: true,
          message: `Aapki '${group.name}' me membership punah active ho gayi!`,
          group,
        });
      }
    }

    // 4. Determine next rotation position
    const activeMembersCount = await GroupMember.countDocuments({
      groupId: group._id,
      status: 'active',
    });

    const newPosition = activeMembersCount;
    const color = MEMBER_COLORS[newPosition % MEMBER_COLORS.length];

    // 5. Add user to GroupMember
    await GroupMember.create({
      groupId: group._id,
      userId: currentUser._id,
      role: 'member',
      rotationPosition: newPosition,
      color,
      status: 'active',
    });

    // 6. Update future schedule to incorporate the new member in rotation
    await generateScheduleForGroup(group._id, 30);

    // 7. Audit log & Notification
    await AuditLog.create({
      groupId: group._id,
      actorUserId: currentUser._id,
      action: 'member_joined',
      entityType: 'GroupMember',
      entityId: group._id.toString(),
      reason: `${currentUser.name} ne invite code (${cleanCode}) se group join kiya.`,
    });

    await Notification.create({
      userId: currentUser._id,
      groupId: group._id,
      title: 'Group Join Kiya! ☕',
      message: `Aap safalta se '${group.name}' me shamil ho gaye hain!`,
      type: 'member_joined',
      read: false,
    });

    return NextResponse.json({
      success: true,
      message: `Badhai ho! Aap '${group.name}' group me shamil ho gaye.`,
      group,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error joining group:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
