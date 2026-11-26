import { DutyAssignment, IDutyAssignment } from '@/models/DutyAssignment';
import { GroupMember, IGroupMember } from '@/models/GroupMember';
import { ChaiGroup } from '@/models/ChaiGroup';
import mongoose from 'mongoose';

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD string into local midnight Date
 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday avoids DST shift
}

/**
 * Generates round-robin schedule for a group up to `daysAhead` days into the future.
 * Ensures:
 * 1. Working days are respected (e.g. Mon-Sat, Sunday off).
 * 2. Holidays are skipped without advancing rotation position.
 * 3. Rotations seamlessly cross week & month boundaries without resetting.
 * 4. Idempotent: Existing dates are never overwritten or duplicated.
 */
export async function generateScheduleForGroup(
  groupId: string | mongoose.Types.ObjectId,
  daysAhead: number = 30
): Promise<IDutyAssignment[]> {
  const group = await ChaiGroup.findById(groupId);
  if (!group || group.status === 'archived') return [];

  // Get active members sorted by rotationPosition
  const members: IGroupMember[] = await GroupMember.find({
    groupId: group._id,
    status: 'active',
  }).sort({ rotationPosition: 1 });

  if (members.length === 0) return [];

  const workingDays = new Set(group.workingDays || [1, 2, 3, 4, 5, 6]);
  const holidays = new Set(group.holidays || []);

  // Fetch the latest existing assignment to find the last assigned rotation sequence
  const latestAssignment = await DutyAssignment.findOne({ groupId: group._id })
    .sort({ dutyDate: -1 })
    .lean();

  let nextSequence = 0;
  let nextMemberIndex = 0;
  let startDate = new Date();

  if (latestAssignment) {
    nextSequence = latestAssignment.rotationSequence + 1;
    // Find member index after latest
    const lastMemberIndex = members.findIndex(
      (m) => m.userId.toString() === latestAssignment.assignedUserId.toString()
    );
    nextMemberIndex = lastMemberIndex >= 0 ? (lastMemberIndex + 1) % members.length : 0;

    // Start generating after latest assignment date
    const latestDate = parseDateKey(latestAssignment.dutyDate);
    latestDate.setDate(latestDate.getDate() + 1);
    if (latestDate > startDate) {
      startDate = latestDate;
    }
  }

  const todayStr = formatDateKey(new Date());
  const startKey = formatDateKey(startDate);
  const existingDocs = await DutyAssignment.find({
    groupId: group._id,
    dutyDate: { $gte: startKey },
  })
    .select('dutyDate')
    .lean();
  const existingDates = new Set(existingDocs.map((d) => d.dutyDate));

  const newAssignments: Partial<IDutyAssignment>[] = [];
  const currentDate = new Date(startDate);

  // Generate up to daysAhead
  for (let i = 0; i < daysAhead; i++) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 1 = Mon ...
    const dateKey = formatDateKey(currentDate);

    // Skip if already assigned in DB
    if (!existingDates.has(dateKey)) {
      // Check if it's a working day and not a holiday
      if (workingDays.has(dayOfWeek) && !holidays.has(dateKey)) {
        const assignedMember = members[nextMemberIndex % members.length];

        let initialStatus: 'upcoming' | 'pending' = 'upcoming';
        if (dateKey === todayStr) {
          initialStatus = 'pending';
        }

        newAssignments.push({
          groupId: group._id as mongoose.Types.ObjectId,
          dutyDate: dateKey,
          assignedUserId: assignedMember.userId,
          status: initialStatus,
          rotationSequence: nextSequence,
          source: 'automatic',
        });

        nextSequence++;
        nextMemberIndex = (nextMemberIndex + 1) % members.length;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (newAssignments.length > 0) {
    try {
      await DutyAssignment.insertMany(newAssignments, { ordered: false });
    } catch {
      // Duplicate key or concurrent insert handled cleanly
    }
    return DutyAssignment.find({ groupId: group._id })
      .populate('assignedUserId', 'name avatar email')
      .sort({ dutyDate: 1 });
  }

  return [];
}

/**
 * Rebalances future automatic 'upcoming' duties (after today) when group membership changes,
 * preserving today's duty as well as any completed, skipped, manual, or swapped duties.
 */
export async function rebalanceUpcomingSchedule(
  groupId: string | mongoose.Types.ObjectId,
  daysAhead: number = 30
): Promise<IDutyAssignment[]> {
  const todayStr = formatDateKey(new Date());
  await DutyAssignment.deleteMany({
    groupId,
    dutyDate: { $gt: todayStr },
    status: 'upcoming',
    source: 'automatic',
  });
  return generateScheduleForGroup(groupId, daysAhead);
}
