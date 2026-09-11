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
    const { name, tag, min_amount, max_amount, duration_days, total_return_roi, daily_roi, description, is_active } = body;

    await connectToDatabase();
    const pkg = await InvestmentPackage.findById(id);
    if (!pkg) {
      return NextResponse.json({ success: false, message: 'Package not found' }, { status: 404 });
    }

    if (name !== undefined) pkg.name = name;
    if (tag !== undefined) pkg.tag = tag;
    if (min_amount !== undefined) pkg.min_amount = Number(min_amount);
    if (max_amount !== undefined) pkg.max_amount = Number(max_amount);
    if (duration_days !== undefined) pkg.duration_days = Number(duration_days);

    if (total_return_roi !== undefined) {
      pkg.total_return_roi = Number(total_return_roi);
      pkg.daily_roi = Number((pkg.total_return_roi / (pkg.duration_days || 7)).toFixed(2));
    } else if (daily_roi !== undefined) {
      pkg.daily_roi = Number(daily_roi);
      pkg.total_return_roi = Number((pkg.daily_roi * (pkg.duration_days || 7)).toFixed(2));
    }

    if (description !== undefined) pkg.description = description;
    if (is_active !== undefined) pkg.is_active = is_active;

    await pkg.save();
    return NextResponse.json({ success: true, message: 'Investment package updated successfully!', data: pkg });
  } catch (err) {
    console.error('Update package error:', err);
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
    console.error('Delete package error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
