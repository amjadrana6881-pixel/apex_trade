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
    const { action } = body;
    
    const normalizedAction = (action || '').toUpperCase();
    let status = 'VERIFIED';
    if (normalizedAction === 'REJECT' || normalizedAction === 'REJECTED') {
      status = 'REJECTED';
    } else if (normalizedAction === 'RESET' || normalizedAction === 'UNVERIFY' || normalizedAction === 'UNVERIFIED') {
      status = 'UNVERIFIED';
    } else if (normalizedAction === 'PENDING') {
      status = 'PENDING';
    } else {
      status = 'VERIFIED';
    }

    await connectToDatabase();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    user.kyc_status = status;
    await user.save();

    // Notify user of KYC verification status
    import('@/lib/fcm').then(({ sendPushToUser }) => {
      if (status === 'VERIFIED') {
        sendPushToUser(user._id, {
          title: '🎉 KYC Verification Approved!',
          body: 'Your identity documents have been verified. Full trading, deposits, and withdrawal access unlocked.',
          data: { type: 'KYC_STATUS', status: 'VERIFIED', target_url: '/profile' }
        });
      } else {
        sendPushToUser(user._id, {
          title: '⚠️ KYC Verification Update',
          body: 'Your identity documents could not be verified. Please re-upload clear photos from your Profile.',
          data: { type: 'KYC_STATUS', status: 'REJECTED', target_url: '/profile' }
        });
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, message: `User KYC status updated to ${status}.` });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
