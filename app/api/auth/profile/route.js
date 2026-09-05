import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function PUT(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, phone } = body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        wallet_balance: user.wallet_balance,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update profile.' }, { status: 500 });
  }
}
