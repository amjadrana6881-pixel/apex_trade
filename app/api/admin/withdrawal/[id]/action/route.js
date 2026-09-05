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
