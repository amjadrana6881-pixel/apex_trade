import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import InvestmentPackage from '@/models/InvestmentPackage';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, tag, min_amount, max_amount, daily_roi, duration_days, description, is_active } = body;
    const totalRoi = Number(daily_roi) * Number(duration_days);

    await connectToDatabase();
    const pkg = await InvestmentPackage.findById(id);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'Package not found' }, { status: 404 });
    }

    if (name !== undefined) pkg.name = name;
    if (tag !== undefined) pkg.tag = tag;
    if (min_amount !== undefined) pkg.min_amount = Number(min_amount);
    if (max_amount !== undefined) pkg.max_amount = Number(max_amount);
    if (daily_roi !== undefined) pkg.daily_roi = Number(daily_roi);
    if (duration_days !== undefined) pkg.duration_days = Number(duration_days);
    pkg.total_return_roi = totalRoi;
    if (description !== undefined) pkg.description = description;
    if (is_active !== undefined) pkg.is_active = is_active;

    await pkg.save();
    return NextResponse.json({ success: true, message: 'Investment package updated!' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to update package.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();
    await InvestmentPackage.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Investment package deleted.' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
