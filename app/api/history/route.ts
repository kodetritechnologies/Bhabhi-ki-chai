import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(20, parseInt(searchParams.get('limit') || '5', 10) || 5));

    if (!groupId) {
      return NextResponse.json({
        success: true,
        activities: [],
        page: 1,
        limit,
        totalCount: 0,
        totalPages: 1,
      });
    }

    const [activities, totalCount] = await Promise.all([
      AuditLog.find({ groupId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({ groupId }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      success: true,
      activities,
      page,
      limit,
      totalCount,
      totalPages,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
