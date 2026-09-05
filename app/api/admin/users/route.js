import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();

    await connectToDatabase();

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { referral_code: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password -withdrawal_password')
      .sort({ created_at: -1 });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
