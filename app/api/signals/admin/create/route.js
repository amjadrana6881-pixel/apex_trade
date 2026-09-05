import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';

export async function POST(request) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
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

    if (!instrument || !order_type) {
      return NextResponse.json({ success: false, message: 'Instrument and Order Type are required.' }, { status: 400 });
    }

    await connectToDatabase();

    // If active, expire previous active signals
    if (status === 'ACTIVE') {
      await Signal.updateMany({ status: 'ACTIVE' }, { status: 'EXPIRED' });
    }

    const today = new Date().toLocaleDateString('en-GB');

    const newSignal = await Signal.create({
      title: title || `${today}, Day Trading Signal`,
      instrument: instrument.toUpperCase(),
      order_type: order_type.toUpperCase(),
      min_capital: Number(min_capital) || 700.00,
      execution_time_pst: execution_time_pst || '07:00 PM (PST)',
      duration_seconds: Number(duration_seconds) || 900,
      profit_percentage: Number(profit_percentage) || 4.25,
      outcome: outcome || 'WIN',
      status: status || 'ACTIVE',
      disclaimer: disclaimer || 'Disclaimer: Forex and CFD trading involve substantial risk. Trade only with funds you can afford to lose.'
    });

    return NextResponse.json({
      success: true,
      message: 'Daily Trading Signal published successfully!',
      signalId: newSignal._id.toString()
    });
  } catch (err) {
    console.error('Create signal error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create signal.' }, { status: 500 });
  }
}
