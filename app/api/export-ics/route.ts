import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DutyAssignment } from '@/models/DutyAssignment';
import { ChaiGroup } from '@/models/ChaiGroup';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return new NextResponse('groupId parameter required', { status: 400 });
    }

    const group = await ChaiGroup.findById(groupId);
    if (!group) {
      return new NextResponse('Group not found', { status: 404 });
    }

    const duties = await DutyAssignment.find({ groupId })
      .populate('assignedUserId', 'name')
      .sort({ dutyDate: 1 })
      .lean();

    // Build standard ICS calendar file
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chai Pe Charcha//Chai Duty Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${group.name} - Chai Pe Charcha Duties`,
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    duties.forEach((duty) => {
      const dateNoDash = duty.dutyDate.replace(/-/g, '');
      const assignedName = (duty.assignedUserId as unknown as { name: string })?.name || 'Chai Duty';
      
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:chai-${duty._id}@bhabhikichai.app`);
      icsContent.push(`DTSTAMP:${dateNoDash}T000000Z`);
      icsContent.push(`DTSTART;VALUE=DATE:${dateNoDash}`);
      icsContent.push(`SUMMARY:☕ Chai Duty: ${assignedName}`);
      icsContent.push(`DESCRIPTION:Chai duty for ${group.name} on ${duty.dutyDate}. Status: ${duty.status}`);
      icsContent.push(`STATUS:${duty.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    return new NextResponse(icsContent.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${group.name.replace(/\s+/g, '_')}_Chai_Schedule.ics"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return new NextResponse(err.message, { status: 500 });
  }
}
