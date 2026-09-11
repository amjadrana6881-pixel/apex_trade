import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Withdrawal from '@/models/Withdrawal';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body; // 'APPROVE' or 'REJECT'

    await connectToDatabase();
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json({ success: false, message: 'Withdrawal not found.' }, { status: 404 });
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: `Withdrawal is already ${withdrawal.status}.` }, { status: 400 });
    }

    if (action === 'APPROVE') {
      withdrawal.status = 'APPROVED';
      withdrawal.admin_notes = notes || 'Approved & Transferred';
      await withdrawal.save();

      await Transaction.updateMany(
        { reference_id: withdrawal._id.toString() },
        { status: 'COMPLETED' }
      );

      // Notify User of approval
      import('@/lib/fcm').then(({ sendPushToUser }) => {
        sendPushToUser(withdrawal.user_id, {
          title: `💸 Payout Sent ($${withdrawal.net_amount.toFixed(2)})`,
          body: `Your withdrawal of $${withdrawal.net_amount.toFixed(2)} USDT has been successfully transferred to your destination wallet!`,
          data: {
            type: 'WITHDRAWAL_APPROVED',
            withdrawal_id: withdrawal._id.toString(),
            target_url: '/wallet'
          }
        });
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Withdrawal of $${withdrawal.net_amount.toFixed(2)} marked as approved and transferred.`
      });
    } else if (action === 'REJECT') {
      // Refund balance to user
      const user = await User.findById(withdrawal.user_id);
      if (user) {
        user.wallet_balance += withdrawal.amount;
        user.tradeable_amount = user.wallet_balance;
        await user.save();
      }

      withdrawal.status = 'REJECTED';
      withdrawal.admin_notes = notes || 'Rejected by Admin';
      await withdrawal.save();

      await Transaction.updateMany(
        { reference_id: withdrawal._id.toString() },
        { status: 'REJECTED' }
      );

      // Notify User of rejection & refund
      import('@/lib/fcm').then(({ sendPushToUser }) => {
        sendPushToUser(withdrawal.user_id, {
          title: `❌ Withdrawal Rejected ($${withdrawal.amount.toFixed(2)} Refunded)`,
          body: `Your withdrawal request was rejected. $${withdrawal.amount.toFixed(2)} has been restored to your wallet. Reason: ${notes || 'Admin rejected'}`,
          data: {
            type: 'WITHDRAWAL_REJECTED',
            withdrawal_id: withdrawal._id.toString(),
            target_url: '/wallet'
          }
        });
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Withdrawal rejected and $${withdrawal.amount.toFixed(2)} refunded to user balance.`
      });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }
  } catch (err) {
    console.error('Withdrawal action error:', err);
    return NextResponse.json({ success: false, message: 'Failed to process withdrawal action.' }, { status: 500 });
  }
}
