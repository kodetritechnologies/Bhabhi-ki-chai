import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ChaiEntry } from '@/models/ChaiEntry';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId') || '';
    const statusFilter = searchParams.get('status') || 'all';
    const exportType = searchParams.get('export') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '5', 10) || 5));

    if (!groupId) {
      return NextResponse.json({
        success: true,
        payments: [],
        memberSummary: [],
        page: 1,
        limit,
        totalCount: 0,
        totalPages: 1,
      });
    }

    const filter: Record<string, unknown> = { groupId };
    if (statusFilter === 'paid' || statusFilter === 'pending') {
      filter.paymentStatus = statusFilter;
    }

    // CSV Export
    if (exportType === 'csv') {
      const allEntries = await ChaiEntry.find(filter)
        .populate('paidByUserId', 'name email')
        .sort({ dutyDate: -1, createdAt: -1 })
        .lean();

      const header = 'Date,Paid By,Email,Amount (INR),Status,Note';
      const rows = allEntries.map((e) => {
        const payer = e.paidByUserId as unknown as { name?: string; email?: string } | null;
        const rawName = e.guestPayerName
          ? `${e.guestPayerName} (Guest)`
          : payer?.name || 'Member';
        const safeName = rawName.replace(/"/g, '""');
        const safeEmail = (payer?.email || '').replace(/"/g, '""');
        const safeNote = (e.note || '').replace(/"/g, '""');
        return `"${e.dutyDate}","${safeName}","${safeEmail}",${e.amount},"${e.paymentStatus}","${safeNote}"`;
      });

      const csv = [header, ...rows].join('\r\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="chai_payment_history.csv"`,
        },
      });
    }

    const [payments, totalCount, allGroupEntries] = await Promise.all([
      ChaiEntry.find(filter)
        .populate('paidByUserId', 'name email')
        .sort({ dutyDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChaiEntry.countDocuments(filter),
      ChaiEntry.find({ groupId })
        .populate('paidByUserId', 'name')
        .lean(),
    ]);

    // Member-wise total summary across the group
    const summaryMap = new Map<
      string,
      { userId: string; name: string; totalPaid: number; totalPending: number; count: number }
    >();
    for (const entry of allGroupEntries) {
      if (entry.guestPayerName) continue; // Keep guest treats separate from member totals
      const payer = entry.paidByUserId as unknown as { _id?: { toString(): string }; name?: string } | null;
      const uid = payer?._id?.toString() || 'unknown';
      const name = payer?.name || 'Member';
      const current = summaryMap.get(uid) || { userId: uid, name, totalPaid: 0, totalPending: 0, count: 0 };
      if (entry.paymentStatus === 'pending') {
        current.totalPending += entry.amount || 0;
      } else {
        current.totalPaid += entry.amount || 0;
      }
      current.count += 1;
      summaryMap.set(uid, current);
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      success: true,
      payments,
      memberSummary: Array.from(summaryMap.values()),
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

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { entryId, paymentStatus } = body;

    if (!entryId || (paymentStatus !== 'paid' && paymentStatus !== 'pending')) {
      return NextResponse.json(
        { success: false, error: 'Valid entryId aur paymentStatus zaroori hai' },
        { status: 400 }
      );
    }

    const updated = await ChaiEntry.findByIdAndUpdate(
      entryId,
      { paymentStatus },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Payment entry nahi mili' }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
