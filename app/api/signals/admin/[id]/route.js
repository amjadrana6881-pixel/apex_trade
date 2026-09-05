import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';

export async function PUT(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      instrument,
      order_type,
      min_capital,
      execution_time_pst,
      duration_seconds,
      profit_percentage,
      outcome,
      status,
      disclaimer
    } = body;

    await connectToDatabase();

    if (status === 'ACTIVE') {
      await Signal.updateMany({ _id: { $ne: id }, status: 'ACTIVE' }, { status: 'EXPIRED' });
    }

    const signal = await Signal.findById(id);
    if (!signal) {
      return NextResponse.json({ success: false, message: 'Signal not found' }, { status: 404 });
    }

    if (title) signal.title = title;
    if (instrument) signal.instrument = instrument.toUpperCase();
    if (order_type) signal.order_type = order_type.toUpperCase();
    if (min_capital !== undefined) signal.min_capital = Number(min_capital);
    if (execution_time_pst) signal.execution_time_pst = execution_time_pst;
    if (duration_seconds !== undefined) signal.duration_seconds = Number(duration_seconds);
    if (profit_percentage !== undefined) signal.profit_percentage = Number(profit_percentage);
    if (outcome) signal.outcome = outcome;
    if (status) signal.status = status;
    if (disclaimer) signal.disclaimer = disclaimer;

    await signal.save();

    return NextResponse.json({ success: true, message: 'Signal updated successfully!' });
  } catch (err) {
    console.error('Update signal error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update signal.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();
    await Signal.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Signal deleted.' });
  } catch (err) {
    console.error('Delete signal error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete signal.' }, { status: 500 });
  }
}
