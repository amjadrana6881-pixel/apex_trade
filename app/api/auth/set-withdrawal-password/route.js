import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { withdrawalPassword, currentLoginPassword } = body;

    if (!withdrawalPassword || withdrawalPassword.length < 4) {
      return NextResponse.json({ success: false, message: 'Withdrawal password must be at least 4 characters/digits.' }, { status: 400 });
    }

    if (currentLoginPassword) {
      const isMatch = bcrypt.compareSync(currentLoginPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, message: 'Current login password is incorrect.' }, { status: 400 });
      }
    }

    const salt = bcrypt.genSaltSync(10);
    user.withdrawal_password = bcrypt.hashSync(withdrawalPassword.trim(), salt);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Withdrawal Security Password has been set successfully!'
    });
  } catch (err) {
    console.error('Set withdrawal password error:', err);
    return NextResponse.json({ success: false, message: 'Failed to set withdrawal password.' }, { status: 500 });
  }
}
