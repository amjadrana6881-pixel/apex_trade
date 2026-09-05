import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      password,
      withdrawal_password,
      saved_usdt_address,
      saved_usdt_network,
      wallet_balance,
      investment_balance,
      kyc_status,
      status,
      referral_code,
      referred_by,
      phone,
      trade_mode,
      custom_win_rate
    } = body;

    await connectToDatabase();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    if (name) targetUser.name = name.trim();
    if (email) targetUser.email = email.toLowerCase().trim();

    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      targetUser.password = bcrypt.hashSync(password.trim(), salt);
    }

    if (withdrawal_password && withdrawal_password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      targetUser.withdrawal_password = bcrypt.hashSync(withdrawal_password.trim(), salt);
    }

    if (saved_usdt_address !== undefined) targetUser.saved_usdt_address = saved_usdt_address.trim();
    if (saved_usdt_network) targetUser.saved_usdt_network = saved_usdt_network;

    if (wallet_balance !== undefined && !isNaN(Number(wallet_balance))) {
      targetUser.wallet_balance = Number(wallet_balance);
      targetUser.tradeable_amount = Number(wallet_balance);
    }

    if (investment_balance !== undefined && !isNaN(Number(investment_balance))) {
      targetUser.investment_balance = Number(investment_balance);
    }

    if (kyc_status) targetUser.kyc_status = kyc_status;
    if (status) targetUser.status = status;
    if (referral_code) targetUser.referral_code = referral_code.trim().toUpperCase();
    if (referred_by !== undefined) targetUser.referred_by = referred_by.trim().toUpperCase();
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (trade_mode) targetUser.trade_mode = trade_mode;
    if (custom_win_rate !== undefined && !isNaN(Number(custom_win_rate))) {
      targetUser.custom_win_rate = Number(custom_win_rate);
    }

    await targetUser.save();

    return NextResponse.json({
      success: true,
      message: `User '${targetUser.name}' updated successfully with full master admin changes!`
    });
  } catch (err) {
    console.error('Admin edit-all user error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update user details.' }, { status: 500 });
  }
}
