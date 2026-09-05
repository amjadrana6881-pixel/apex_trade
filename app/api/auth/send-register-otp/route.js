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
      return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists. Please log in.' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous active OTP for this email
    await OtpCode.deleteMany({ email: cleanEmail, type: 'REGISTER' });

    // Save new OTP
    await OtpCode.create({
      email: cleanEmail,
      code: otpCode,
      type: 'REGISTER',
      expires_at: expiresAt
    });

    console.log(`📩 [OTP DISPATCH] Registration OTP for ${cleanEmail}: ${otpCode}`);

    // Dispatch real email via Nodemailer
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: otpCode,
      type: 'REGISTER'
    });

    const isEmailSent = Boolean(emailResult?.emailSent);
    const msg = isEmailSent 
      ? `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
      : `A 6-digit verification code has been generated for ${cleanEmail}.`;

    return NextResponse.json({
      success: true,
      message: msg,
      emailSent: isEmailSent,
      otp: otpCode // Provided for instant seamless UI verification & testing
    });
  } catch (err) {
    console.error('Send register OTP error:', err);
    return NextResponse.json({ success: false, message: 'Failed to generate verification OTP.' }, { status: 500 });
  }
}
