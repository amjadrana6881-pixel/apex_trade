import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { signJwtToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@apextrade.net').toLowerCase().trim();
    const envAdminPass = process.env.ADMIN_PASSWORD || 'admin123';

    // Direct Master Admin Authentication from .env
    if (cleanEmail === envAdminEmail && password === envAdminPass) {
      let adminUser = await User.findOne({ $or: [{ email: cleanEmail }, { role: 'admin' }] });
      if (!adminUser) {
        const salt = bcrypt.genSaltSync(10);
        adminUser = await User.create({
          name: 'ApexTrade Master Admin',
          email: envAdminEmail,
          password: bcrypt.hashSync(envAdminPass, salt),
          role: 'admin',
          wallet_balance: 50000.00,
          tradeable_amount: 50000.00,
          investment_balance: 0,
          referral_code: 'APEXADMIN',
          kyc_status: 'VERIFIED',
          status: 'ACTIVE'
        });
      }

      const token = signJwtToken({ id: adminUser._id.toString(), email: envAdminEmail, role: 'admin' });
      return NextResponse.json({
        success: true,
        message: 'Master Admin authenticated successfully!',
        token,
        user: {
          id: adminUser._id.toString(),
          _id: adminUser._id.toString(),
          name: adminUser.name || 'ApexTrade Master Admin',
          email: envAdminEmail,
          role: 'admin',
          wallet_balance: adminUser.wallet_balance || 50000.00,
          tradeable_amount: adminUser.tradeable_amount || 50000.00,
          investment_balance: adminUser.investment_balance || 0,
          referral_code: adminUser.referral_code || 'APEXADMIN',
          kyc_status: 'VERIFIED',
          status: 'ACTIVE',
          created_at: adminUser.created_at
        }
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 400 });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 400 });
    }

    if (user.status === 'BANNED') {
      return NextResponse.json({ success: false, message: 'Your account is suspended. Please contact customer support.' }, { status: 403 });
    }

    const token = signJwtToken({ id: user._id.toString(), email: user.email, role: user.role });

    const userProfile = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      tradeable_amount: user.tradeable_amount,
      investment_balance: user.investment_balance,
      referral_code: user.referral_code,
      phone: user.phone,
      kyc_status: user.kyc_status,
      status: user.status,
      created_at: user.created_at
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error during login.' }, { status: 500 });
  }
}
