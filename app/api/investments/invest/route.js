import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import InvestmentPackage from '@/models/InvestmentPackage';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { packageId, amount } = body;
    const investAmount = Number(amount);

    if (!packageId || isNaN(investAmount) || investAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid investment parameters.' }, { status: 400 });
    }

    await connectToDatabase();
    const pkg = await InvestmentPackage.findOne({ _id: packageId, is_active: true });
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'Package not found or inactive.' }, { status: 404 });
    }

    if (investAmount < pkg.min_amount || investAmount > pkg.max_amount) {
      return NextResponse.json({
        success: false,
        message: `Amount must be between $${pkg.min_amount.toLocaleString()} and $${pkg.max_amount.toLocaleString()} for ${pkg.name}.`
      }, { status: 400 });
    }

    const freshUser = await User.findById(user._id);
    if (!freshUser || freshUser.wallet_balance < investAmount) {
      return NextResponse.json({ success: false, message: 'Insufficient wallet balance to invest this amount.' }, { status: 400 });
    }

    const dailyProfit = (investAmount * pkg.daily_roi) / 100;
    freshUser.wallet_balance -= investAmount;
    freshUser.tradeable_amount = freshUser.wallet_balance;
    freshUser.investment_balance += investAmount;
    await freshUser.save();

    const newInv = await UserInvestment.create({
      user_id: freshUser._id,
      package_id: pkg._id,
      package_name: pkg.name,
      amount: investAmount,
      daily_roi: pkg.daily_roi,
      daily_profit: dailyProfit,
      duration_days: pkg.duration_days,
      days_passed: 0,
      total_profit_earned: 0,
      status: 'ACTIVE'
    });

    await Transaction.create({
      user_id: freshUser._id,
      type: 'INVESTMENT',
      amount: -investAmount,
      description: `Invested in ${pkg.name} ($${investAmount.toFixed(2)}) - ${pkg.daily_roi}% Daily for ${pkg.duration_days} Days`,
      reference_id: newInv._id.toString(),
      status: 'COMPLETED'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully invested $${investAmount.toFixed(2)} in ${pkg.name}! Daily profit: $${dailyProfit.toFixed(2)}.`,
      investmentId: newInv._id.toString()
    });
  } catch (err) {
    console.error('Investment error:', err);
    return NextResponse.json({ success: false, message: 'Failed to process investment.' }, { status: 500 });
  }
}
