import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const rawUsers = await User.find({
      $or: [
        { kyc_status: { $in: ['PENDING', 'VERIFIED', 'REJECTED'] } },
        { kyc_doc: { $exists: true, $ne: '' } }
      ]
    })
      .select('name email kyc_status kyc_doc kyc_notes created_at updated_at')
      .sort({ updated_at: -1, created_at: -1 })
      .lean();

    const users = rawUsers.map(u => ({
      ...u,
      id: u._id.toString(),
      _id: u._id.toString(),
      kyc_document_url: u.kyc_doc || '',
      kyc_doc: u.kyc_doc || '',
      kyc_notes: u.kyc_notes || ''
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
