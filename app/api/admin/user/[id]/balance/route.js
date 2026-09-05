import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function PUT(request, { params }) {
  const { errorResponse, user: adminUser } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, action, reason } = body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid balance amount.' }, { status: 400 });
    }

    await connectToDatabase();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    let newBalance = targetUser.wallet_balance;
    if (action === 'ADD') {
      newBalance += numAmount;
    } else if (action === 'DEDUCT') {
      newBalance = Math.max(0, newBalance - numAmount);
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }

    targetUser.wallet_balance = newBalance;
    targetUser.tradeable_amount = newBalance;
    await targetUser.save();

    await Transaction.create({
      user_id: targetUser._id,
      type: 'ADMIN_ADJUSTMENT',
      amount: action === 'ADD' ? numAmount : -numAmount,
      description: `Admin adjustment (${action}): ${reason || 'Manual balance adjustment'}`,
      reference_id: adminUser._id.toString(),
      status: 'COMPLETED'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'ADD' ? 'added' : 'deducted'} $${numAmount.toFixed(2)}. New balance: $${newBalance.toFixed(2)}.`,
      newBalance
    });
  } catch (err) {
    console.error('Admin balance adjust error:', err);
    return NextResponse.json({ success: false, message: 'Failed to adjust balance.' }, { status: 500 });
  }
}
