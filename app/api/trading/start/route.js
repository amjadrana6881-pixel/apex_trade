import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Trade from '@/models/Trade';
import Signal from '@/models/Signal';
import TradingPair from '@/models/TradingPair';
import Transaction from '@/models/Transaction';
import { isCurrentlySignalTime, formatPKTTime } from '@/lib/timeUtils';

export async function POST(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { pair, type, amount, duration } = body;
    const tradeAmount = Number(amount);
    const rawDuration = Number(duration) || 60;
    const tradeDuration = Math.min(180, Math.max(30, rawDuration)); // 30s to 180s

    if (!pair || !type || isNaN(tradeAmount) || tradeAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Please enter a valid trade amount.' }, { status: 400 });
    }

    const cleanPair = pair.replace('/', '').toUpperCase();
    await connectToDatabase();

    const pairData = await TradingPair.findOne({ symbol: cleanPair, is_active: true });
    if (!pairData) {
      return NextResponse.json({ success: false, error: 'Selected asset pair is unavailable.' }, { status: 400 });
    }

    // Refresh user balance from database
    const freshUser = await User.findById(user._id);
    if (!freshUser || freshUser.wallet_balance < tradeAmount) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient wallet balance ($${Number(freshUser?.wallet_balance || 0).toFixed(2)} available).` 
      }, { status: 400 });
    }

    // Check against active daily trading signal in Pakistan Standard Time
    const activeSignal = await Signal.findOne({ status: 'ACTIVE' }).sort({ created_at: -1 });

    let isSignalTrade = false;
    let signalId = null;
    let appliedPayout = pairData.payout_rate || 88.0;
    let expectedOutcome = 'LOSS';

    if (freshUser.trade_mode === 'FORCE_WIN') {
      expectedOutcome = 'WIN';
    } else if (freshUser.trade_mode === 'FORCE_LOSS') {
      expectedOutcome = 'LOSS';
    } else if (activeSignal) {
      const sigPair = activeSignal.instrument.replace('/', '').toUpperCase();
      const sigType = activeSignal.order_type.toUpperCase();
      const isCorrectWindow = isCurrentlySignalTime(activeSignal);

      if (cleanPair === sigPair && type.toUpperCase() === sigType && isCorrectWindow) {
        isSignalTrade = true;
        signalId = activeSignal._id;
        expectedOutcome = activeSignal.outcome || 'WIN';
        if (activeSignal.profit_percentage > 0) {
          appliedPayout = activeSignal.profit_percentage;
        } else {
          // Dynamic 4.85% - 5.15% (~5.0% daily)
          appliedPayout = Number((4.85 + Math.random() * 0.30).toFixed(2));
        }
      }
    }

    // Deduct trade capital from balance immediately
    freshUser.wallet_balance -= tradeAmount;
    freshUser.tradeable_amount = freshUser.wallet_balance;
    await freshUser.save();

    const resolvesAt = new Date(Date.now() + tradeDuration * 1000);

    const newTrade = await Trade.create({
      user_id: freshUser._id,
      pair: cleanPair,
      type: type.toUpperCase(),
      amount: tradeAmount,
      entry_price: pairData.current_price,
      duration: tradeDuration,
      payout_rate: appliedPayout,
      is_signal_trade: isSignalTrade,
      signal_id: signalId,
      status: 'PENDING',
      result: 'PENDING',
      resolves_at: resolvesAt
    });

    // Record deduction transaction
    await Transaction.create({
      user_id: freshUser._id,
      type: 'TRADE_ORDER',
      amount: -tradeAmount,
      description: `Placed ${type.toUpperCase()} Option on ${cleanPair} ($${tradeAmount.toFixed(2)})${isSignalTrade ? ' [Official Signal]' : ''}`,
      reference_id: newTrade._id.toString(),
      status: 'COMPLETED'
    });

    return NextResponse.json({
      success: true,
      trade: {
        id: newTrade._id.toString(),
        _id: newTrade._id.toString(),
        pair: cleanPair,
        type: type.toUpperCase(),
        amount: tradeAmount,
        entryPrice: pairData.current_price,
        duration: tradeDuration,
        payoutRate: appliedPayout,
        isSignalTrade,
        expectedOutcome,
        resolves_at: resolvesAt.toISOString()
      },
      session: {
        durationSec: tradeDuration
      }
    });
  } catch (err) {
    console.error('Error starting trade:', err);
    return NextResponse.json({ success: false, error: 'Internal error executing trade.' }, { status: 500 });
  }
}
