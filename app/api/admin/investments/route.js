import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';
import { sendPushToUser } from '@/lib/fcm';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const investments = await UserInvestment.find()
      .populate('user_id', 'name email wallet_balance investment_balance phone')
      .populate('package_id', 'name duration_days total_return_roi tag')
      .sort({ created_at: -1 });

    const totalActiveStaked = investments
      .filter(i => i.status === 'ACTIVE')
      .reduce((sum, i) => sum + i.amount, 0);

    const totalProfitDisbursed = investments
      .reduce((sum, i) => sum + (i.total_profit_earned || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        investments,
        summary: {
          totalActiveStaked,
          totalProfitDisbursed,
          activeCount: investments.filter(i => i.status === 'ACTIVE').length,
          totalCount: investments.length
        }
      }
    });
  } catch (err) {
    console.error('Admin fetch investments error:', err);
    return NextResponse.json({ success: false, message: 'Server error fetching user investments.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { investmentId, action } = body; // action: 'MATURE' or 'CANCEL'

    if (!investmentId || !['MATURE', 'CANCEL'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid action parameter.' }, { status: 400 });
    }

    await connectToDatabase();
    const inv = await UserInvestment.findById(investmentId);
    if (!inv) {
      return NextResponse.json({ success: false, message: 'Investment position not found.' }, { status: 404 });
    }

    if (inv.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, message: `Investment is already ${inv.status}.` }, { status: 400 });
    }

    const user = await User.findById(inv.user_id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'MATURE') {
      const profit = inv.expected_profit || Number(((inv.amount * (inv.total_roi || 15)) / 100).toFixed(2));
      inv.status = 'COMPLETED';
      inv.completed_at = now;
      inv.total_profit_earned = profit;
      await inv.save();

      user.wallet_balance += profit;
      user.tradeable_amount = user.wallet_balance;
      user.investment_balance = Math.max(0, (user.investment_balance || 0) - inv.amount);
      await user.save();

      await Transaction.create({
        user_id: user._id,
        type: 'INVESTMENT_PROFIT',
        amount: profit,
        description: `🎉 Yield Package Matured (Admin Payout): ${inv.package_name} (+${inv.total_roi}% ROI profit credited to wallet)`,
        reference_id: inv._id.toString(),
        status: 'COMPLETED'
      });

      // Send Push Notification
      try {
        await sendPushToUser(user._id, {
          title: `💰 Yield Package Matured (+ $${profit.toFixed(2)})!`,
          body: `Your ${inv.package_name} has completed. $${profit.toFixed(2)} profit has been credited to your wallet!`,
          data: { type: 'INVESTMENT_MATURED', investment_id: inv._id.toString(), target_url: '/wallet' }
        });
      } catch (pushErr) {
        console.error('Investment mature push error:', pushErr);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully matured investment and credited $${profit.toFixed(2)} profit to ${user.name || user.email}.`
      });
    } else if (action === 'CANCEL') {
      inv.status = 'CANCELLED';
      inv.completed_at = now;
      await inv.save();

      user.investment_balance = Math.max(0, (user.investment_balance || 0) - inv.amount);
      await user.save();

      await Transaction.create({
        user_id: user._id,
        type: 'INVESTMENT_CANCELLED',
        amount: 0,
        description: `Yield Package Cancelled: ${inv.package_name} ($${inv.amount.toFixed(2)})`,
        reference_id: inv._id.toString(),
        status: 'COMPLETED'
      });

      return NextResponse.json({
        success: true,
        message: `Investment package cancelled and lock released for ${user.name || user.email}.`
      });
    }
  } catch (err) {
    console.error('Admin investment action error:', err);
    return NextResponse.json({ success: false, message: 'Failed to execute investment action.' }, { status: 500 });
  }
}
