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
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. You have $${Number(freshUser?.wallet_balance || 0).toFixed(2)} available.` 
      }, { status: 400 });
    }

    const durationDays = Number(pkg.duration_days) || 7;
    const totalRoi = Number(pkg.total_return_roi) || 15.0;
    const expectedProfit = Number(((investAmount * totalRoi) / 100).toFixed(2));
    const maturesAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const dailyRoi = Number((totalRoi / durationDays).toFixed(2));
    const dailyProfit = Number(((investAmount * dailyRoi) / 100).toFixed(2));

    // Update user investment balance (wallet balance remains available for trading, but withdrawals are locked)
    freshUser.investment_balance = (freshUser.investment_balance || 0) + investAmount;
    await freshUser.save();

    const newInv = await UserInvestment.create({
      user_id: freshUser._id,
      package_id: pkg._id,
      package_name: pkg.name,
      amount: investAmount,
      total_roi: totalRoi,
      daily_roi: dailyRoi,
      daily_profit: dailyProfit,
      expected_profit: expectedProfit,
      duration_days: durationDays,
      days_passed: 0,
      total_profit_earned: 0,
      status: 'ACTIVE',
      created_at: new Date(),
      matures_at: maturesAt
    });

    await Transaction.create({
      user_id: freshUser._id,
      type: 'INVESTMENT',
      amount: 0, // Ledger entry documenting active package activation
      description: `Activated ${pkg.name} ($${investAmount.toFixed(2)} for ${durationDays} Days). Expected Return: +${totalRoi}% (+$${expectedProfit.toFixed(2)}) maturing on ${maturesAt.toLocaleDateString()}. VIP Signal boost unlocked!`,
      reference_id: newInv._id.toString(),
      status: 'COMPLETED'
    });

    // Send Push Notification to user
    import('@/lib/fcm').then(({ sendPushToUser }) => {
      sendPushToUser(freshUser._id, {
        title: `🎉 ${pkg.name} Activated (+${totalRoi}% ROI)!`,
        body: `Your $${investAmount.toFixed(2)} package will mature with +$${expectedProfit.toFixed(2)} on ${maturesAt.toLocaleDateString()}. You can continue trading freely with VIP Signal boost!`,
        data: {
          type: 'INVESTMENT_ACTIVATED',
          investment_id: newInv._id.toString(),
          target_url: '/investments'
        }
      });
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${pkg.name}! Expected profit: +$${expectedProfit.toFixed(2)} (+${totalRoi}%) on ${maturesAt.toLocaleDateString()}. You can trade freely with VIP Signal boost.`,
      investment: newInv
    });
  } catch (err) {
    console.error('Investment error:', err);
    return NextResponse.json({ success: false, message: 'Failed to process investment subscription.' }, { status: 500 });
  }
}
