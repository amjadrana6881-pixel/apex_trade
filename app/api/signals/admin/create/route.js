import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';
import { sendPushToAllUsers } from '@/lib/fcm';

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
      investment_profit_percentage,
      loss_percentage,
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
    const stdPct = Number(profit_percentage) || 5.00;
    const vipPct = Number(investment_profit_percentage) || Number((stdPct * 1.6).toFixed(2)) || 8.50;
    const lossPct = Number(loss_percentage) || 4.00;

    const newSignal = await Signal.create({
      title: title || `${today}, Day Trading Signal`,
      instrument: instrument.toUpperCase(),
      order_type: order_type.toUpperCase(),
      min_capital: Number(min_capital) || 10.00,
      execution_time_pst: execution_time_pst || '07:00 PM (PST)',
      duration_seconds: Number(duration_seconds) || 180,
      profit_percentage: stdPct,
      investment_profit_percentage: vipPct,
      loss_percentage: lossPct,
      outcome: outcome || 'WIN',
      status: status || 'ACTIVE',
      disclaimer: disclaimer || 'Disclaimer: Forex and CFD trading involve substantial risk. Follow official signal parameters.'
    });

    // Dispatch Push Notification to all users (Professional format without revealing planned outcomes)
    if (newSignal.status === 'ACTIVE') {
      try {
        await sendPushToAllUsers({
          title: `📊 Official Trading Signal Published!`,
          body: `${newSignal.instrument} ${newSignal.order_type} execution scheduled at ${newSignal.execution_time_pst}. Standard: +${newSignal.profit_percentage}% | VIP Staking: +${newSignal.investment_profit_percentage}%.`,
          data: {
            type: 'SIGNAL_PUBLISHED',
            signal_id: newSignal._id.toString(),
            target_url: '/trading'
          }
        });
      } catch (pushErr) {
        console.error('Signal broadcast push error:', pushErr);
      }
    }

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
