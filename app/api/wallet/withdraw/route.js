import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Withdrawal from '@/models/Withdrawal';
import Transaction from '@/models/Transaction';
import SystemSetting from '@/models/SystemSetting';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { amount, network, destinationAddress, withdrawalPassword, saveAsDefault } = body;
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Please enter a valid withdrawal amount.' }, { status: 400 });
    }

    if (!destinationAddress || !destinationAddress.trim()) {
      return NextResponse.json({ success: false, message: 'Please enter your USDT receiving address.' }, { status: 400 });
    }

    await connectToDatabase();
    const freshUser = await User.findById(user._id);

    // Verify Withdrawal Security Password
    if (!freshUser.withdrawal_password || freshUser.withdrawal_password.trim().length === 0) {
      return NextResponse.json({
        success: false,
        requiresWithdrawalPasswordSetup: true,
        message: 'You have not set a Withdrawal Security Password yet. Please set your Withdrawal Password first.'
      }, { status: 400 });
    }

    if (!withdrawalPassword) {
      return NextResponse.json({ success: false, message: 'Withdrawal Security Password is required to execute withdrawals.' }, { status: 400 });
    }

    const isMatch = bcrypt.compareSync(withdrawalPassword, freshUser.withdrawal_password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Incorrect Withdrawal Security Password. Please try again.' }, { status: 400 });
    }

    const minWithdrawSetting = await SystemSetting.findOne({ key: 'min_withdrawal' });
    const minWithdraw = minWithdrawSetting ? Number(minWithdrawSetting.value) : 10;

    if (withdrawAmount < minWithdraw) {
      return NextResponse.json({ success: false, message: `Minimum withdrawal amount is $${minWithdraw.toFixed(2)}.` }, { status: 400 });
    }

    if (freshUser.wallet_balance < withdrawAmount) {
      return NextResponse.json({ success: false, message: 'Insufficient wallet balance for this withdrawal.' }, { status: 400 });
    }

    const feeSetting = await SystemSetting.findOne({ key: 'withdrawal_fee_percent' });
    const feePct = feeSetting ? Number(feeSetting.value) : 10.0;
    const fee = (withdrawAmount * feePct) / 100;
    const netAmount = withdrawAmount - fee;

    const validNetworks = ['TRC-20', 'BEP-20', 'ERC-20'];
    const chosenNetwork = validNetworks.includes(network) ? network : 'TRC-20';

    // Deduct balance immediately
    freshUser.wallet_balance -= withdrawAmount;
    freshUser.tradeable_amount = freshUser.wallet_balance;

    if (saveAsDefault) {
      freshUser.saved_usdt_address = destinationAddress.trim();
      freshUser.saved_usdt_network = chosenNetwork;
    }

    await freshUser.save();

    const newWithdrawal = await Withdrawal.create({
      user_id: freshUser._id,
      amount: withdrawAmount,
      fee,
      net_amount: netAmount,
      network: chosenNetwork,
      destination_address: destinationAddress.trim(),
      status: 'PENDING'
    });

    // Record transaction
    await Transaction.create({
      user_id: freshUser._id,
      type: 'WITHDRAWAL',
      amount: -withdrawAmount,
      description: `Crypto withdrawal to ${destinationAddress.trim()} (Net: $${netAmount.toFixed(2)})`,
      reference_id: newWithdrawal._id.toString(),
      status: 'PENDING'
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request for $${withdrawAmount.toFixed(2)} submitted successfully! Processed within standard blockchain clearance.`,
      withdrawalId: newWithdrawal._id.toString()
    });
  } catch (err) {
    console.error('Withdrawal error:', err);
    return NextResponse.json({ success: false, message: 'Failed to process withdrawal request.' }, { status: 500 });
  }
}
