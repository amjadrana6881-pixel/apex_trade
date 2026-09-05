import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Trade from '@/models/Trade';
import Deposit from '@/models/Deposit';
import Withdrawal from '@/models/Withdrawal';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const freshUser = await User.findById(user._id);

    // 1. Deposits sum
    const approvedDeposits = await Deposit.find({ user_id: user._id, status: 'APPROVED' });
    const totalDeposited = approvedDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    // 2. Withdrawals sum
    const approvedWithdrawals = await Withdrawal.find({ user_id: user._id, status: 'APPROVED' });
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    // 3. Trades stats
    const trades = await Trade.find({ user_id: user._id }).sort({ created_at: -1 });
    const totalTrades = trades.length;

    let winsCount = 0;
    let lossCount = 0;
    let totalProfitWon = 0;
    let totalLossAmount = 0;

    for (const t of trades) {
      if (t.result === 'WIN') {
        winsCount++;
        totalProfitWon += Number(t.profit || 0);
      } else if (t.result === 'LOSS') {
        lossCount++;
        totalLossAmount += Number(t.amount || 0);
      }
    }

    const netTradingPnL = totalProfitWon - totalLossAmount;
    const winRate = totalTrades > 0 ? Math.round((winsCount / totalTrades) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        walletBalance: freshUser?.wallet_balance || 0,
        totalDeposited,
        totalWithdrawn,
        totalTrades,
        winsCount,
        lossCount,
        totalProfitWon,
        totalLossAmount,
        netTradingPnL,
        winRate,
        recentTrades: trades.slice(0, 5)
      }
    });
  } catch (err) {
    console.error('Error fetching portfolio analytics:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
