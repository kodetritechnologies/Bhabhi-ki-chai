import { connectToDatabase } from './db';
import { User } from '@/models/User';
import { ChaiGroup } from '@/models/ChaiGroup';
import { GroupMember } from '@/models/GroupMember';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiEntry } from '@/models/ChaiEntry';
import { Notification } from '@/models/Notification';
import { AuditLog } from '@/models/AuditLog';
import { Admin } from '@/models/Admin';
import { hashAdminPassword } from './adminAuth';
import { formatDateKey } from './rotationEngine';

export async function seedInitialData(force = false) {
  await connectToDatabase();

  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    return { message: 'Database already seeded' };
  }

  // Clear if forced
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Admin.deleteMany({}),
      ChaiGroup.deleteMany({}),
      GroupMember.deleteMany({}),
      DutyAssignment.deleteMany({}),
      ChaiEntry.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
  }

  // 1. Create Users
  const users = await User.create([
    {
      name: 'Rahul',
      email: 'rahul@example.com',
      avatar: '/images/default-avatar.png',
      timezone: 'Asia/Kolkata',
    },
    {
      name: 'Amit',
      email: 'amit@example.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      timezone: 'Asia/Kolkata',
    },
    {
      name: 'Sandeep',
      email: 'sandeep@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      timezone: 'Asia/Kolkata',
    },
    {
      name: 'Vikas',
      email: 'vikas@example.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      timezone: 'Asia/Kolkata',
    },
    {
      name: 'Pooja',
      email: 'pooja@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      timezone: 'Asia/Kolkata',
    },
  ]);

  const [rahul, amit, sandeep, vikas, pooja] = users;

  // Create Admin record in `admins` collection & User record for Default Groups
  const adminEmail = 'admin@bhabhikichai.com';
  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const defaultAdminPasswordHash = await hashAdminPassword('admin123');
    await Admin.create({
      name: 'Tapri Admin',
      email: adminEmail,
      passwordHash: defaultAdminPasswordHash,
      role: 'super_admin',
      isActive: true,
    });
  }

  const adminUser = await User.create({
    name: 'Tapri Admin',
    email: adminEmail,
    avatar: '/images/default-avatar.png',
    timezone: 'Asia/Kolkata',
  });

  // 2. Create Default Groups (owned by Admin)
  const officeGroup = await ChaiGroup.create({
    name: 'Office Chai Group',
    description: 'Daily cutting chai & tech charcha with the core team',
    createdBy: adminUser._id,
    isDefault: true,
    timezone: 'Asia/Kolkata',
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    chaiTime: '10:30 AM',
    holidays: [],
    rotationPolicy: 'move_to_end',
    status: 'active',
    currency: 'INR',
    inviteCode: 'CHAI-OFFICE-99',
    bannerImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=500&q=80',
  });

  const friendsGroup = await ChaiGroup.create({
    name: 'Friends Chai Group',
    description: 'Sham ki tapri baazi with old college buddies',
    createdBy: adminUser._id,
    isDefault: true,
    timezone: 'Asia/Kolkata',
    workingDays: [0, 1, 2, 3, 4, 5, 6], // 7 Days/Week
    chaiTime: '05:30 PM',
    holidays: [],
    rotationPolicy: 'move_to_end',
    status: 'active',
    currency: 'INR',
    inviteCode: 'CHAI-DOST-77',
    bannerImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
  });

  const weekendGroup = await ChaiGroup.create({
    name: 'Weekend Chai',
    description: 'Special Irani chai and bun maska on Saturday & Sunday',
    createdBy: adminUser._id,
    isDefault: true,
    timezone: 'Asia/Kolkata',
    workingDays: [0, 6], // 2 Days/Week: Sat, Sun
    chaiTime: '09:00 AM',
    holidays: [],
    rotationPolicy: 'move_to_end',
    status: 'active',
    currency: 'INR',
    inviteCode: 'CHAI-WKND-22',
    bannerImage: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=500&q=80',
  });

  // 3. Add Group Members for Office Group
  await GroupMember.create([
    {
      groupId: officeGroup._id,
      userId: rahul._id,
      role: 'admin',
      rotationPosition: 0,
      color: '#4B7BEC', // Blue for Rahul
    },
    {
      groupId: officeGroup._id,
      userId: amit._id,
      role: 'member',
      rotationPosition: 1,
      color: '#73984E', // Green for Amit
    },
    {
      groupId: officeGroup._id,
      userId: sandeep._id,
      role: 'member',
      rotationPosition: 2,
      color: '#E84393', // Pink for Sandeep
    },
    {
      groupId: officeGroup._id,
      userId: vikas._id,
      role: 'member',
      rotationPosition: 3,
      color: '#FA8231', // Orange for Vikas
    },
  ]);

  // Members for Friends Group
  await GroupMember.create([
    { groupId: friendsGroup._id, userId: rahul._id, role: 'member', rotationPosition: 0, color: '#3B82F6' },
    { groupId: friendsGroup._id, userId: amit._id, role: 'member', rotationPosition: 1, color: '#10B981' },
    { groupId: friendsGroup._id, userId: sandeep._id, role: 'admin', rotationPosition: 2, color: '#EC4899' },
    { groupId: friendsGroup._id, userId: vikas._id, role: 'member', rotationPosition: 3, color: '#F59E0B' },
    { groupId: friendsGroup._id, userId: pooja._id, role: 'member', rotationPosition: 4, color: '#8B5CF6' },
  ]);

  // Members for Weekend Group
  await GroupMember.create([
    { groupId: weekendGroup._id, userId: rahul._id, role: 'member', rotationPosition: 0, color: '#3B82F6' },
    { groupId: weekendGroup._id, userId: amit._id, role: 'admin', rotationPosition: 1, color: '#10B981' },
    { groupId: weekendGroup._id, userId: sandeep._id, role: 'member', rotationPosition: 2, color: '#EC4899' },
  ]);

  // 4. Generate Duties & History for Office Group
  // Let today be November 24, 2026 (or current date dynamically)
  const now = new Date();
  const membersOrder = [rahul, amit, sandeep, vikas];

  // Let's create past completed duties for the last 12 days to match "12 Chai Days This Month" and "₹800 Total Expenses"
  const dutyAssignments = [];
  const chaiEntries = [];
  let seq = 0;

  // 12 days past
  for (let i = 12; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // Sunday off

    const dateKey = formatDateKey(d);
    const member = membersOrder[seq % membersOrder.length];
    
    const duty = new DutyAssignment({
      groupId: officeGroup._id,
      dutyDate: dateKey,
      assignedUserId: member._id,
      status: 'completed',
      rotationSequence: seq,
      source: 'automatic',
    });
    dutyAssignments.push(duty);

    // Bill entry (averaging around ₹65-₹100 to total ₹800)
    const amount = i === 1 ? 100 : Math.floor(60 + (i % 4) * 12);
    chaiEntries.push({
      groupId: officeGroup._id,
      dutyAssignmentId: duty._id,
      dutyDate: dateKey,
      amount: amount,
      currency: 'INR',
      paidByUserId: member._id,
      paymentStatus: 'paid',
      dutyCompletionStatus: 'completed',
      note: '4 Special Adrak Chai + Toast',
      createdBy: member._id,
    });

    seq++;
  }

  // Today's Duty: Rahul, Status: 'pending' (just like in the mockup!)
  const todayKey = formatDateKey(now);
  const todayDuty = new DutyAssignment({
    groupId: officeGroup._id,
    dutyDate: todayKey,
    assignedUserId: rahul._id,
    status: 'pending',
    rotationSequence: seq,
    source: 'automatic',
    notes: 'Bhai, aaj aapki baari hai! Chai ki tayari ready rakho 😊',
  });
  dutyAssignments.push(todayDuty);
  seq++;

  // Upcoming 14 days
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0) continue; // Skip Sunday

    const dateKey = formatDateKey(d);
    const member = membersOrder[seq % membersOrder.length];

    dutyAssignments.push(
      new DutyAssignment({
        groupId: officeGroup._id,
        dutyDate: dateKey,
        assignedUserId: member._id,
        status: 'upcoming',
        rotationSequence: seq,
        source: 'automatic',
      })
    );
    seq++;
  }

  await DutyAssignment.insertMany(dutyAssignments);
  await ChaiEntry.insertMany(chaiEntries);

  // 5. Seed In-App Notifications (matching the mockup exactly)
  await Notification.create([
    {
      userId: rahul._id,
      groupId: officeGroup._id,
      type: 'turn_today',
      title: 'Aaj aapki chai ki baari hai!',
      message: 'Rahul, please arrange chai today.',
      read: false,
      timeAgoText: '2m ago',
    },
    {
      userId: rahul._id,
      groupId: officeGroup._id,
      type: 'reminder_time',
      title: 'Reminder: Chai at 9 AM',
      message: "Don't forget to mark the entry.",
      read: false,
      timeAgoText: '1h ago',
    },
    {
      userId: rahul._id,
      groupId: officeGroup._id,
      type: 'payment_recorded',
      title: 'Payment Recorded',
      message: '₹100 added for this month.',
      read: true,
      timeAgoText: '1d ago',
    },
  ]);

  // 6. Seed Recent Activities (matching the mockup exactly)
  await AuditLog.create([
    {
      groupId: officeGroup._id,
      actorUserId: rahul._id,
      action: 'Chai Completed',
      entityType: 'ChaiEntry',
      entityId: todayDuty._id.toString(),
      reason: '₹100 paid by Rahul',
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
    },
    {
      groupId: officeGroup._id,
      actorUserId: rahul._id,
      action: 'Reminder Sent',
      entityType: 'Notification',
      entityId: 'rem_1',
      reason: "Amit's turn tomorrow!",
      createdAt: new Date(now.getTime() - 24 * 3600 * 1000),
    },
    {
      groupId: officeGroup._id,
      actorUserId: rahul._id,
      action: 'New Member Joined',
      entityType: 'GroupMember',
      entityId: sandeep._id.toString(),
      reason: 'Welcome Sandeep!',
      createdAt: new Date(now.getTime() - 48 * 3600 * 1000),
    },
  ]);

  return { message: 'Database seeded successfully with authentic Tapri data!' };
}
