import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import OtpCode from '@/models/OtpCode';
import { sendOtpEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, message: 'Please provide your registered email address.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json({ success: false, message: 'No registered trader account found with this email.' }, { status: 404 });
    }

    // Generate 6-digit Reset OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpCode.deleteMany({ email: cleanEmail, type: 'FORGOT_PASSWORD' });

    await OtpCode.create({
      email: cleanEmail,
      code: otpCode,
      type: 'FORGOT_PASSWORD',
      expires_at: expiresAt
    });

    console.log(`🔑 [PASSWORD RESET OTP] OTP for ${cleanEmail}: ${otpCode}`);

    // Dispatch real email via Nodemailer
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: otpCode,
      type: 'FORGOT_PASSWORD'
    });

    const isEmailSent = Boolean(emailResult?.emailSent);
    const msg = isEmailSent 
      ? `Password reset code sent to ${cleanEmail}. Please check your inbox and spam folder.`
      : `Password reset verification code generated for ${cleanEmail}.`;

    return NextResponse.json({
      success: true,
      message: msg,
      emailSent: isEmailSent,
      otp: otpCode
    });
  } catch (err) {
    console.error('Send forgot password OTP error:', err);
    return NextResponse.json({ success: false, message: 'Failed to generate password reset code.' }, { status: 500 });
  }
}
