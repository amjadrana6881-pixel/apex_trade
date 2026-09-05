import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Both current and new password are required.' }, { status: 400 });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Current password does not match.' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(newPassword, salt);
    await user.save();

    return NextResponse.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json({ success: false, message: 'Failed to change password.' }, { status: 500 });
  }
}
