import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const rows = await SystemSetting.find();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const settings = await request.json();
    await connectToDatabase();

    for (const [key, value] of Object.entries(settings)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value: String(value) },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: 'System settings updated successfully!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
