import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    if (targetUser.role === 'admin') {
      return NextResponse.json({ success: false, message: 'Cannot delete Super Admin account.' }, { status: 400 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `User account '${targetUser.name}' (${targetUser.email}) deleted permanently.`
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete user.' }, { status: 500 });
  }
}
