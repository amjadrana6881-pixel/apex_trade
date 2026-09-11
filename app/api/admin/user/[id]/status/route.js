import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

async function handleUserStatus(request, params) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const rawStatus = (body.status || '').toUpperCase();

    let status = 'ACTIVE';
    if (rawStatus === 'BANNED' || rawStatus === 'SUSPENDED') {
      status = 'BANNED';
    } else {
      status = 'ACTIVE';
    }

    await connectToDatabase();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    targetUser.status = status;
    await targetUser.save();

    return NextResponse.json({ success: true, message: `User status updated to ${status}.` });
  } catch (err) {
    console.error('Admin user status error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update user status.', error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  return handleUserStatus(request, params);
}

export async function PUT(request, { params }) {
  return handleUserStatus(request, params);
}
