import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const allInvestments = await UserInvestment.find({ user_id: freshUser._id }).sort({ created_at: -1 });

    let userUpdated = false;

    // Check and auto-settle any matured investments
    for (const inv of allInvestments) {
      if (inv.status === 'ACTIVE') {
        const matureDate = inv.matures_at || new Date(new Date(inv.created_at).getTime() + (inv.duration_days || 7) * 86400 * 1000);
        if (now >= matureDate) {
          const profit = inv.expected_profit || Number(((inv.amount * (inv.total_roi || 15)) / 100).toFixed(2));
          inv.status = 'COMPLETED';
          inv.completed_at = now;
          inv.total_profit_earned = profit;
          await inv.save();

          freshUser.wallet_balance += profit;
          freshUser.tradeable_amount = freshUser.wallet_balance;
          freshUser.investment_balance = Math.max(0, (freshUser.investment_balance || 0) - inv.amount);
          userUpdated = true;

          await Transaction.create({
            user_id: freshUser._id,
            type: 'INVESTMENT_PROFIT',
            amount: profit,
            description: `🎉 Yield Package Matured: ${inv.package_name} (+${inv.total_roi}% ROI profit credited to wallet)`,
            reference_id: inv._id.toString(),
            status: 'COMPLETED'
          });

          // Send Push Notification for payout
          import('@/lib/fcm').then(({ sendPushToUser }) => {
            sendPushToUser(freshUser._id, {
              title: `💰 Investment Package Matured (+ $${profit.toFixed(2)})!`,
              body: `Your ${inv.package_name} has completed. $${profit.toFixed(2)} net profit has been added to your wallet!`,
              data: {
                type: 'INVESTMENT_MATURED',
                investment_id: inv._id.toString(),
                target_url: '/wallet'
              }
            });
          }).catch(() => {});
        }
      }
    }

    if (userUpdated) {
      await freshUser.save();
    }

    // Refresh investments list
    const updatedInvestments = await UserInvestment.find({ user_id: freshUser._id }).sort({ created_at: -1 });

    const activeInvestments = updatedInvestments.filter(i => i.status === 'ACTIVE');
    const totalInvested = activeInvestments.reduce((acc, curr) => acc + curr.amount, 0);
    const totalProfitEarned = updatedInvestments.reduce((acc, curr) => acc + (curr.total_profit_earned || 0), 0);

    // Calculate nearest lock expiry
    let isWithdrawalLocked = false;
    let lockExpiresAt = null;
    let daysRemaining = 0;
    let activePackageName = '';

    if (activeInvestments.length > 0) {
      isWithdrawalLocked = true;
      // Sort by furthest mature date
      const sortedByExpiry = [...activeInvestments].sort((a, b) => new Date(b.matures_at) - new Date(a.matures_at));
      lockExpiresAt = sortedByExpiry[0].matures_at;
      activePackageName = sortedByExpiry[0].package_name;
      const msLeft = new Date(lockExpiresAt).getTime() - now.getTime();
      daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      success: true,
      data: {
        investments: updatedInvestments,
        summary: {
          totalInvested,
          totalProfitEarned,
          activeCount: activeInvestments.length,
          hasVipBoost: activeInvestments.length > 0,
          isWithdrawalLocked,
          lockExpiresAt,
          daysRemaining,
          activePackageName
        }
      }
    });
  } catch (err) {
    console.error('Error fetching my investments:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
