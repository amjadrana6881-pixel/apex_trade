import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Signal from '@/models/Signal';
import Trade from '@/models/Trade';
import { autoExpirePastSignals, getSignalTimeWindow } from '@/lib/timeUtils';
import { verifyToken } from '@/lib/auth';
import { checkAndTriggerSignalCountdownAlerts } from '@/lib/signalCountdownNotifier';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // 1. Auto-expire any past signals whose window has closed
    await autoExpirePastSignals();
    checkAndTriggerSignalCountdownAlerts().catch(() => {});

    // 2. Fetch current active signal
    const activeSignal = await Signal.findOne({ status: 'ACTIVE' }).sort({ created_at: -1 });

    if (!activeSignal) {
      return NextResponse.json({
        success: true,
        data: null,
        timing: {
          isLiveWindow: false,
          isExpired: true,
          hasUserExecuted: false
        }
      });
    }

    // 3. Calculate timing window breakdown
    const timing = getSignalTimeWindow(activeSignal);

    // If signal timing is expired, expire it immediately in DB
    if (timing.isExpired) {
      activeSignal.status = 'EXPIRED';
      await activeSignal.save();
      return NextResponse.json({
        success: true,
        data: null,
        timing: {
          isLiveWindow: false,
          isExpired: true,
          hasUserExecuted: false
        }
      });
    }

    // 4. Check if authenticated user has already executed this signal
    let hasUserExecuted = false;
    let userTrade = null;

    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (payload && payload.userId) {
          userTrade = await Trade.findOne({
            user_id: payload.userId,
            signal_id: activeSignal._id,
            status: { $in: ['PENDING', 'RESOLVED', 'RESOLVING'] }
          }).sort({ created_at: -1 });
          hasUserExecuted = Boolean(userTrade);
        }
      }
    } catch (e) {
      // Ignore token decode errors for public access
    }

    return NextResponse.json({
      success: true,
      data: activeSignal,
      timing: {
        ...timing,
        hasUserExecuted,
        userTrade: userTrade ? {
          id: userTrade._id.toString(),
          result: userTrade.result,
          profit: userTrade.profit,
          amount: userTrade.amount,
          status: userTrade.status
        } : null
      }
    });
  } catch (err) {
    console.error('Error fetching active signal:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
