import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Deposit from '@/models/Deposit';
import Withdrawal from '@/models/Withdrawal';
import Trade from '@/models/Trade';
import UserInvestment from '@/models/UserInvestment';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    const totalUsers = await User.countDocuments({ role: 'user' });

    const allUsers = await User.find({ role: 'user' });
    const totalBalance = allUsers.reduce((sum, u) => sum + Number(u.wallet_balance || 0), 0);

    const activeInvs = await UserInvestment.find({ status: 'ACTIVE' });
    const totalInvestments = activeInvs.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const approvedDeposits = await Deposit.find({ status: 'APPROVED' });
    const totalDeposited = approvedDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const pendingDeposits = await Deposit.countDocuments({ status: 'PENDING' });

    const approvedWithdrawals = await Withdrawal.find({ status: 'APPROVED' });
    const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'PENDING' });

    const totalTrades = await Trade.countDocuments();
    const liveTrades = await Trade.countDocuments({ status: 'PENDING' });
    const pendingKyc = await User.countDocuments({ kyc_status: 'PENDING' });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalBalance,
        totalInvestments,
        totalDeposited,
        pendingDeposits,
        totalWithdrawn,
        pendingWithdrawals,
        totalTrades,
        liveTrades,
        pendingKyc
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
