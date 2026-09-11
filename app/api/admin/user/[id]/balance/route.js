import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { sendPushToUser } from '@/lib/fcm';

async function handleBalanceAdjustment(request, params) {
  const { errorResponse, user: adminUser } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, action, reason } = body;

    let numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json({ success: false, message: 'Please enter a valid non-zero amount.' }, { status: 400 });
    }

    let isAddition = true;
    if (action) {
      const act = action.toUpperCase();
      if (act === 'SUBTRACT' || act === 'DEDUCT' || act === 'SUB') {
        isAddition = false;
      } else {
        isAddition = true;
      }
      numAmount = Math.abs(numAmount);
    } else {
      isAddition = numAmount > 0;
      numAmount = Math.abs(numAmount);
    }

    await connectToDatabase();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found in system.' }, { status: 404 });
    }

    let newBalance = targetUser.wallet_balance || 0;
    if (isAddition) {
      newBalance += numAmount;
    } else {
      newBalance = Math.max(0, newBalance - numAmount);
    }

    newBalance = Number(newBalance.toFixed(2));
    targetUser.wallet_balance = newBalance;
    targetUser.tradeable_amount = newBalance;
    await targetUser.save();

    const signedAmount = isAddition ? numAmount : -numAmount;

    await Transaction.create({
      user_id: targetUser._id,
      type: 'ADMIN_ADJUSTMENT',
      amount: signedAmount,
      description: `Admin manual adjustment (${isAddition ? 'CREDIT' : 'DEBIT'}): ${reason || 'Account Balance Correction'}`,
      reference_id: adminUser?._id ? adminUser._id.toString() : 'admin',
      status: 'COMPLETED'
    });

    // Notify user via FCM Push
    try {
      await sendPushToUser(targetUser._id, {
        title: isAddition ? `💳 Balance Credited (+ $${numAmount.toFixed(2)})` : `💳 Balance Adjusted (- $${numAmount.toFixed(2)})`,
        body: `Your wallet balance was updated by administration. New balance: $${newBalance.toFixed(2)} USDT.`,
        data: { type: 'BALANCE_ADJUSTMENT', target_url: '/wallet' }
      });
    } catch (pushErr) {
      console.error('Balance adjustment push error:', pushErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${isAddition ? 'added' : 'deducted'} $${numAmount.toFixed(2)} USDT. New user balance: $${newBalance.toFixed(2)}.`,
      newBalance,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        wallet_balance: newBalance
      }
    });
  } catch (err) {
    console.error('Admin balance adjust error:', err);
    return NextResponse.json({ success: false, message: 'Failed to adjust user balance.', error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  return handleBalanceAdjustment(request, params);
}

export async function PUT(request, { params }) {
  return handleBalanceAdjustment(request, params);
}
