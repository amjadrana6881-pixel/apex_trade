import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import InvestmentPackage from '@/models/InvestmentPackage';

export async function GET(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const list = await InvestmentPackage.find().sort({ min_amount: 1 });
    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, tag, min_amount, max_amount, daily_roi, duration_days, description } = body;
    const totalRoi = Number(daily_roi) * Number(duration_days);

    await connectToDatabase();
    await InvestmentPackage.create({
      name,
      tag: tag || 'Custom',
      min_amount: Number(min_amount),
      max_amount: Number(max_amount),
      daily_roi: Number(daily_roi),
      duration_days: Number(duration_days),
      total_return_roi: totalRoi,
      description: description || '',
      is_active: true
    });

    return NextResponse.json({ success: true, message: 'Investment package created!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to create package.' }, { status: 500 });
  }
}
