import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { signJwtToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, email, password, referralCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Please provide all required fields.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'An account with this email already exists.' }, { status: 400 });
    }

    let referredBy = '';
    if (referralCode && referralCode.trim()) {
      const referrer = await User.findOne({ referral_code: referralCode.trim().toUpperCase() });
      if (referrer) {
        referredBy = referrer.referral_code;
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userRefCode = 'APEX' + Math.floor(100000 + Math.random() * 900000);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'user',
      wallet_balance: 0.00,
      tradeable_amount: 0.00,
      investment_balance: 0.00,
      referral_code: userRefCode,
      referred_by: referredBy,
      kyc_status: 'UNVERIFIED',
      status: 'ACTIVE'
    });

    const token = signJwtToken({ id: newUser._id.toString(), email: cleanEmail, role: 'user' });

    const userProfile = {
      id: newUser._id.toString(),
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      wallet_balance: newUser.wallet_balance,
      tradeable_amount: newUser.tradeable_amount,
      investment_balance: newUser.investment_balance,
      referral_code: newUser.referral_code,
      referred_by: newUser.referred_by,
      kyc_status: newUser.kyc_status,
      status: newUser.status,
      created_at: newUser.created_at
    };

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error during registration.' }, { status: 500 });
  }
}
