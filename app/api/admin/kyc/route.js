import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const users = await User.find({ kyc_status: { $ne: 'UNVERIFIED' } })
      .select('name email kyc_status kyc_doc created_at')
      .sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
