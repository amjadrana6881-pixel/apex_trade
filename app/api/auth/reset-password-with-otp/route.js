import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import OtpCode from '@/models/OtpCode';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'Email, 6-digit OTP code, and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP
    const validOtp = await OtpCode.findOne({
      email: cleanEmail,
      code: otp.toString().trim(),
      type: 'FORGOT_PASSWORD',
      expires_at: { $gte: new Date() }
    });

    if (!validOtp) {
      return NextResponse.json({ success: false, message: 'Invalid or expired reset code. Please request a new code.' }, { status: 400 });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(newPassword, salt);
    await user.save();

    await OtpCode.deleteMany({ email: cleanEmail, type: 'FORGOT_PASSWORD' });

    return NextResponse.json({
      success: true,
      message: 'Your account password has been reset successfully! You can now log in.'
    });
  } catch (err) {
    console.error('Reset password with OTP error:', err);
    return NextResponse.json({ success: false, message: 'Failed to reset password.' }, { status: 500 });
  }
}
