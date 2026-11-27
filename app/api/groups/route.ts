import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { User } from '@/models/User';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { generateScheduleForGroup, formatDateKey } from '@/lib/rotationEngine';

const BANNER_PRESETS = [
  '/images/golden-hour-tapri.jpg',
  '/images/doston-ki-chai-banner.jpg',
  '/images/cozy-tea-stall.jpg',
  '/images/chai-lovers-banner.jpg',
];

const MEMBER_COLORS = ['#3B82F6', '#10B981', '#EC4899', '#F97316', '#8B5CF6', '#EAB308'];

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    let currentUser = null;
    if (userEmail) {
      currentUser = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
    }
    if (!currentUser) {
      currentUser = await User.findOne({ email: 'rahul@example.com' }).lean();
    }
    if (!currentUser) {
      currentUser = await User.findOne().lean();
    }

    if (!currentUser) {
      return NextResponse.json({ success: true, groups: [] });
    }

    const memberships = await GroupMember.find({ userId: currentUser._id, status: 'active' }).lean();
    const groupIds = memberships.map((m) => m.groupId);

    const groups = await ChaiGroup.find({ _id: { $in: groupIds }, status: 'active' }).lean();

    const todayStr = formatDateKey(new Date());

    // Enrich groups with memberCount, user's role, and nextDuty
    const enrichedGroups = await Promise.all(
      groups.map(async (grp) => {
        const memCount = await GroupMember.countDocuments({ groupId: grp._id, status: 'active' });
        const userMem = memberships.find((m) => m.groupId.toString() === grp._id.toString());
        const role = userMem ? userMem.role : 'member';

        const nextDuty = await DutyAssignment.findOne({
          groupId: grp._id,
          dutyDate: { $gte: todayStr },
        })
          .sort({ dutyDate: 1 })
          .populate('assignedUserId', 'name avatar')
          .lean();

        type UserType = { _id: unknown; name: string };
        const assignedUser = nextDuty?.assignedUserId as unknown as UserType | undefined;
        const isUser = assignedUser?._id?.toString() === currentUser._id.toString();

        return {
          _id: grp._id,
          name: grp.name,
          description: grp.description,
          role,
          memberCount: memCount,
          workingDaysCount: grp.workingDays ? grp.workingDays.length : 6,
          bannerImage: grp.bannerImage || BANNER_PRESETS[0],
          inviteCode: grp.inviteCode,
          chaiTime: grp.chaiTime,
          workingDays: grp.workingDays,
          nextDuty: nextDuty
            ? {
                date: nextDuty.dutyDate,
                assignedTo: assignedUser?.name || 'TBD',
                isUser,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, groups: enrichedGroups });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching groups:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      name,
      description = '',
      workingDays = [1, 2, 3, 4, 5, 6],
      chaiTime = '10:30 AM',
      creatorEmail,
      userEmail,
      memberEmails = [],
      rotationOrder = [],
      bannerImage,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Group ka naam zaroori hai!' }, { status: 400 });
    }

    const emailToFind = (creatorEmail || userEmail || '').trim().toLowerCase();
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
      return NextResponse.json({ success: false, error: 'Logged-in user nahi mila!' }, { status: 404 });
    }

    // Clean invite code generation: CHAI-<NAME_5_CHARS>-<RANDOM_NUMBER>
    const cleanPrefix = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'TAPRI';
    const randomCode = Math.floor(100 + Math.random() * 900);
    const inviteCode = `CHAI-${cleanPrefix}-${randomCode}`;

    const chosenBanner =
      bannerImage || BANNER_PRESETS[Math.floor(Math.random() * BANNER_PRESETS.length)];

    // Create the ChaiGroup
    const newGroup = await ChaiGroup.create({
      name: name.trim(),
      description: description.trim(),
      createdBy: currentUser._id,
      timezone: 'Asia/Kolkata',
      workingDays: Array.isArray(workingDays) && workingDays.length > 0 ? workingDays : [1, 2, 3, 4, 5, 6],
      chaiTime: chaiTime.trim() || '10:30 AM',
      status: 'active',
      inviteCode,
      bannerImage: chosenBanner,
      rotationPolicy: 'move_to_end',
    });

    // Build ordered list of emails for rotationPosition (0, 1, 2, ...)
    const orderedEmails: string[] = [];
    const seen = new Set<string>();
    const selfEmail = currentUser.email.trim().toLowerCase();

    if (Array.isArray(rotationOrder) && rotationOrder.length > 0) {
      for (const raw of rotationOrder) {
        const clean =
          raw === '__self__' ? selfEmail : (raw || '').trim().toLowerCase();
        if (clean && !seen.has(clean)) {
          seen.add(clean);
          orderedEmails.push(clean);
        }
      }
    }

    if (!seen.has(selfEmail)) {
      seen.add(selfEmail);
      orderedEmails.unshift(selfEmail);
    }

    if (Array.isArray(memberEmails)) {
      for (const rawEmail of memberEmails) {
        const cleanEmail = (rawEmail || '').trim().toLowerCase();
        if (cleanEmail && !seen.has(cleanEmail)) {
          seen.add(cleanEmail);
          orderedEmails.push(cleanEmail);
        }
      }
    }

    // Create GroupMember entries in exact rotationPosition order
    for (let pos = 0; pos < orderedEmails.length; pos++) {
      const emailItem = orderedEmails[pos];
      if (emailItem === selfEmail) {
        await GroupMember.create({
          groupId: newGroup._id,
          userId: currentUser._id,
          role: 'admin',
          rotationPosition: pos,
          color: MEMBER_COLORS[pos % MEMBER_COLORS.length],
          status: 'active',
        });
        continue;
      }

      let memberUser = await User.findOne({ email: emailItem });
      if (!memberUser) {
        const namePart = emailItem.split('@')[0];
        const autoName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        memberUser = await User.create({
          name: autoName,
          email: emailItem,
          avatar: '/images/default-avatar.png',
        });
      }

      await GroupMember.create({
        groupId: newGroup._id,
        userId: memberUser._id,
        role: 'member',
        rotationPosition: pos,
        color: MEMBER_COLORS[pos % MEMBER_COLORS.length],
        status: 'active',
      });
    }

    // 3. Auto-generate schedule for this new group (30 days ahead)
    await generateScheduleForGroup(newGroup._id, 30);

    // 4. Audit Log
    await AuditLog.create({
      groupId: newGroup._id,
      actorUserId: currentUser._id,
      action: 'group_created',
      entityType: 'ChaiGroup',
      entityId: newGroup._id.toString(),
      reason: `Naya group '${newGroup.name}' banaya gaya. Invite code: ${inviteCode}`,
    });

    // 5. Notification
    await Notification.create({
      userId: currentUser._id,
      groupId: newGroup._id,
      title: 'Chai Group Ban Gaya! ☕',
      message: `'${newGroup.name}' group safalta se create ho gaya hai. Invite code: ${inviteCode}`,
      type: 'member_joined',
      read: false,
    });

    return NextResponse.json({
      success: true,
      message: `'${newGroup.name}' safaltapoorvak create ho gaya!`,
      group: newGroup,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating group:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    let groupId = searchParams.get('groupId') || '';
    let userEmail = searchParams.get('userEmail') || '';

    if (!groupId) {
      try {
        const body = await request.json();
        groupId = body.groupId || '';
        userEmail = userEmail || body.userEmail || '';
      } catch {
        // ignore empty body
      }
    }

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Login required to delete a group' }, { status: 401 });
    }

    const currentUser = await User.findOne({ email: userEmail.trim().toLowerCase() });
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const group = await ChaiGroup.findById(groupId);
    if (!group) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
    }

    const DEFAULT_INVITE_CODES = ['CHAI-OFFICE-99', 'CHAI-DOST-77', 'CHAI-WKND-22'];
    if (group.isDefault || DEFAULT_INVITE_CODES.includes(group.inviteCode || '')) {
      return NextResponse.json(
        { success: false, error: 'Default group delete nahi kiya ja sakta' },
        { status: 403 }
      );
    }

    const isCreator = group.createdBy?.toString() === currentUser._id.toString();
    if (!isCreator) {
      return NextResponse.json(
        { success: false, error: 'Sirf aapke banaye hue groups hi delete ho sakte hain' },
        { status: 403 }
      );
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
      message: `'${group.name}' group delete ho gaya!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error deleting group:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
