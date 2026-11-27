import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { Notification } from '@/models/Notification';
import { sendPushToUsers } from '@/lib/webPush';

function parseChaiTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function getISTNow() {
  const now = new Date();
  const istStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istStr);
  const y = istDate.getFullYear();
  const m = String(istDate.getMonth() + 1).padStart(2, '0');
  const d = String(istDate.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  const dayOfWeek = istDate.getDay();
  const nowMinutes = istDate.getHours() * 60 + istDate.getMinutes();
  const startOfTodayIST = new Date(`${todayStr}T00:00:00+05:30`);
  return { todayStr, dayOfWeek, nowMinutes, startOfTodayIST };
}

async function runReminders(request: Request) {
  await connectToDatabase();
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === 'true';
  const targetGroupId = searchParams.get('groupId') || '';

  const { todayStr, dayOfWeek, nowMinutes, startOfTodayIST } = getISTNow();

  const query: Record<string, unknown> = { status: 'active' };
  if (targetGroupId) {
    query._id = targetGroupId;
  }

  const groups = await ChaiGroup.find(query).lean();
  let groupsNotified = 0;
  let totalPushSent = 0;

  for (const group of groups) {
    const workingDays: number[] = group.workingDays || [1, 2, 3, 4, 5, 6];
    const holidays: string[] = group.holidays || [];
    const isHoliday = holidays.includes(todayStr) || !workingDays.includes(dayOfWeek);

    if (!force) {
      const groupMinutes = parseChaiTimeToMinutes(group.chaiTime || '10:30 AM');
      if (groupMinutes === null) continue;

      // Trigger window: 15 minutes before chaiTime up to 5 minutes after chaiTime
      const diff = groupMinutes - nowMinutes;
      if (diff > 15 || diff < -5) continue;

      // Avoid sending duplicate reminder for the same group on the same day
      const alreadySent = await Notification.findOne({
        groupId: group._id,
        type: 'reminder_time',
        createdAt: { $gte: startOfTodayIST },
      }).lean();
      if (alreadySent) continue;
    }

    const [members, todayDuty] = await Promise.all([
      GroupMember.find({ groupId: group._id, status: 'active' }).lean(),
      DutyAssignment.findOne({ groupId: group._id, dutyDate: todayStr })
        .populate('assignedUserId', 'name')
        .lean(),
    ]);

    if (members.length === 0) continue;

    const assignedName =
      (todayDuty?.assignedUserId as unknown as { name?: string } | null)?.name || 'Team Member';
    const memberUserIds = members.map((m) => m.userId.toString());

    const title = isHoliday
      ? `🎉 Aaj Chai Break Ki Chutti Hai! (${group.name})`
      : `☕ Chai Time Ho Gaya Boss! (${group.name})`;
    const body = isHoliday
      ? `Aaj holiday / off-day hai! Aaram se ghar par chai piyen, aaj kisi ki duty nahi hai.`
      : `Chai ke bina kaam nahi chalega! Aaj ${assignedName} ki baari hai — ${group.chaiTime} par kadak adrak chai laane ka time ho gaya!`;

    const pushResult = await sendPushToUsers(memberUserIds, {
      title,
      body,
      url: '/',
      tag: `chai-reminder-${group._id}-${todayStr}`,
    });

    await Notification.insertMany(
      memberUserIds.map((uid) => ({
        userId: uid,
        groupId: group._id,
        title,
        message: body,
        type: 'reminder_time',
        read: false,
      }))
    );

    groupsNotified++;
    totalPushSent += pushResult.sent;
  }

  return NextResponse.json({
    success: true,
    checkedGroups: groups.length,
    groupsNotified,
    totalPushSent,
    istDate: todayStr,
  });
}

export async function GET(request: Request) {
  try {
    return await runReminders(request);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await runReminders(request);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
