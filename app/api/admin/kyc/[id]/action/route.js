import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'VERIFY' or 'REJECT'
    const status = action === 'VERIFY' ? 'VERIFIED' : 'REJECTED';

    await connectToDatabase();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    user.kyc_status = status;
    await user.save();

    return NextResponse.json({ success: true, message: `User KYC status updated to ${status}.` });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
