import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { sendPushToUser } from '@/lib/fcm';

export async function POST(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes, reason } = body;
    
    const rejectionNote = (notes || reason || '').trim();
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
    if (status === 'REJECTED') {
      user.kyc_notes = rejectionNote || 'Your identity verification documents were rejected by admin. Please upload clear photos and resubmit.';
    } else if (status === 'VERIFIED') {
      user.kyc_notes = '';
    } else if (status === 'UNVERIFIED') {
      user.kyc_notes = '';
      user.kyc_doc = '';
    }
    await user.save();

    // Notify user of KYC verification status
    try {
      if (status === 'VERIFIED') {
        await sendPushToUser(user._id, {
          title: '🎉 KYC Verification Approved!',
          body: 'Your identity documents have been verified. Full trading, deposits, and withdrawal access unlocked.',
          data: { type: 'KYC_STATUS', status: 'VERIFIED', target_url: '/profile' }
        });
      } else if (status === 'REJECTED') {
        await sendPushToUser(user._id, {
          title: '⚠️ KYC Verification Rejected',
          body: rejectionNote ? `KYC Rejected: ${rejectionNote}` : 'Your identity documents were rejected. Please check reason in profile and re-upload.',
          data: { type: 'KYC_STATUS', status: 'REJECTED', notes: user.kyc_notes, target_url: '/profile' }
        });
      }
    } catch (pushErr) {
      console.error('KYC action push error:', pushErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: `User KYC status updated to ${status}.${rejectionNote ? ' Note saved.' : ''}`,
      kyc_status: status,
      kyc_notes: user.kyc_notes
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
