import { connectToDatabase } from './db';
import User from '@/models/User';
import Trade from '@/models/Trade';
import Signal from '@/models/Signal';
import Transaction from '@/models/Transaction';
import SystemSetting from '@/models/SystemSetting';
import TradingPair from '@/models/TradingPair';

/**
 * Resolves a single pending trade record using institutional business rules.
 */
export async function resolveTradeRecord(trade) {
  try {
    await connectToDatabase();

    const currentTrade = await Trade.findById(trade._id || trade.id);
    if (!currentTrade || currentTrade.status === 'RESOLVED') {
      return currentTrade;
    }

    const user = await User.findById(currentTrade.user_id);
    if (!user) return null;

    let isWin = false;

    // 1. Admin Individual User Override takes highest priority
    if (user.trade_mode === 'FORCE_WIN') {
      isWin = true;
    } else if (user.trade_mode === 'FORCE_LOSS') {
      isWin = false;
    } 
    // 2. Official Daily Signal Trade: Guaranteed Win (or Planned Signal Outcome)
    else if (currentTrade.is_signal_trade && currentTrade.signal_id) {
      const signal = await Signal.findById(currentTrade.signal_id);
      if (signal && signal.outcome === 'LOSS') {
        isWin = false; // Planned loss day set by Admin
      } else {
        isWin = true;  // Official Signal trade always WINS
      }
    } 
    // 3. Unscheduled Off-Signal Trade: Guaranteed Loss for all trades outside signal
    else {
      isWin = false; // Strict House Rule: Any trade placed without/outside official signal is guaranteed LOSS
    }

    // Exit price calculation: Adjust price dynamically based on win or loss
    const priceDelta = currentTrade.entry_price * 0.0018;
    let exitPrice = currentTrade.entry_price;

    if (currentTrade.type === 'BUY') {
      exitPrice = isWin ? (currentTrade.entry_price + priceDelta) : (currentTrade.entry_price - priceDelta);
    } else { // SELL
      exitPrice = isWin ? (currentTrade.entry_price - priceDelta) : (currentTrade.entry_price + priceDelta);
    }

    const profitAmount = isWin ? (currentTrade.amount * (currentTrade.payout_rate / 100)) : -currentTrade.amount;
    const result = isWin ? 'WIN' : 'LOSS';

    // If win, refund trade principal + profit into balance
    if (isWin) {
      const returnTotal = currentTrade.amount + profitAmount;
      user.wallet_balance += returnTotal;
      user.tradeable_amount += returnTotal;
      await user.save();

      await Transaction.create({
        user_id: user._id,
        type: 'TRADE_WIN',
        amount: returnTotal,
        description: `Trade WON on ${currentTrade.pair} (+ $${profitAmount.toFixed(2)} profit)`,
        reference_id: currentTrade._id.toString(),
        status: 'COMPLETED'
      });

      // Send lock-screen push notification
      import('@/lib/fcm').then(({ sendPushToUser }) => {
        sendPushToUser(user._id, {
          title: `💰 Option Trade Won (+ $${profitAmount.toFixed(2)})!`,
          body: `Congratulations! Your ${currentTrade.type} contract on ${currentTrade.pair} hit the target. Profit credited to your wallet.`,
          data: { type: 'TRADE_RESULT', result: 'WIN', profit: profitAmount, target_url: '/trading' }
        });
      }).catch(() => {});
    } else {
      // Log Trade Loss Transaction for transparency
      await Transaction.create({
        user_id: user._id,
        type: 'TRADE_LOSS',
        amount: -currentTrade.amount,
        description: `Trade EXPIRED on ${currentTrade.pair} (- $${currentTrade.amount.toFixed(2)})`,
        reference_id: currentTrade._id.toString(),
        status: 'COMPLETED'
      });

      // Send push notification on trade loss
      import('@/lib/fcm').then(({ sendPushToUser }) => {
        sendPushToUser(user._id, {
          title: `📉 Trade Option Expired`,
          body: `Your ${currentTrade.type} contract on ${currentTrade.pair} resolved. Tap to inspect market charts.`,
          data: { type: 'TRADE_RESULT', result: 'LOSS', target_url: '/trading' }
        });
      }).catch(() => {});
    }

    // Update trade record to RESOLVED
    currentTrade.status = 'RESOLVED';
    currentTrade.result = result;
    currentTrade.profit = isWin ? profitAmount : -currentTrade.amount;
    currentTrade.exit_price = exitPrice;
    await currentTrade.save();

    return currentTrade;
  } catch (err) {
    console.error('Error resolving trade record:', err);
    return null;
  }
}

/**
 * Stops an active/pending trade prematurely (Early Exit / Stop Trade).
 * Calculates a dynamic 3% to 5% early settlement fee, refunds the remaining 95% to 97% to user's wallet.
 */
export async function stopTradeEarly(tradeId, userId) {
  try {
    await connectToDatabase();

    const trade = await Trade.findOne({ _id: tradeId, user_id: userId });
    if (!trade) {
      return { success: false, error: 'Active trade not found.' };
    }

    if (trade.status !== 'PENDING') {
      return { success: false, error: `Trade is already ${trade.status.toLowerCase()}.` };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    // Dynamic penalty percentage between 3.00% and 5.00%
    const penaltyPct = Number((3.0 + Math.random() * 2.0).toFixed(2)); // e.g. 3.45%, 4.20%, etc.
    const penaltyFee = Number(((trade.amount * penaltyPct) / 100).toFixed(2));
    const refundAmount = Number((trade.amount - penaltyFee).toFixed(2));

    // Refund remaining principal to user's wallet
    user.wallet_balance += refundAmount;
    user.tradeable_amount = user.wallet_balance;
    await user.save();

    // Log transaction
    await Transaction.create({
      user_id: user._id,
      type: 'TRADE_EARLY_EXIT',
      amount: refundAmount,
      description: `Early Close Option on ${trade.pair} (-$${penaltyFee.toFixed(2)} [${penaltyPct}% fee], +$${refundAmount.toFixed(2)} refunded to wallet)`,
      reference_id: trade._id.toString(),
      status: 'COMPLETED'
    });

    // Mark trade as STOPPED / RESOLVED
    trade.status = 'STOPPED';
    trade.result = 'STOPPED';
    trade.profit = -penaltyFee;
    trade.early_stop_fee = penaltyFee;
    trade.refunded_amount = refundAmount;
    trade.penalty_percentage = penaltyPct;
    trade.stopped_early = true;
    trade.exit_price = trade.entry_price;
    await trade.save();

    // Notify User of Early Stop & Refund
    import('@/lib/fcm').then(({ sendPushToUser }) => {
      sendPushToUser(user._id, {
        title: `🛑 Trade Stopped Early (+ $${refundAmount.toFixed(2)} Refunded)`,
        body: `Your trade on ${trade.pair} was closed early. $${refundAmount.toFixed(2)} refunded (${penaltyPct}% exit fee).`,
        data: { type: 'TRADE_EARLY_EXIT', trade_id: trade._id.toString(), target_url: '/trading' }
      });
    }).catch(() => {});

    return {
      success: true,
      trade,
      penaltyPct,
      penaltyFee,
      refundAmount,
      updatedBalance: user.wallet_balance
    };
  } catch (err) {
    console.error('Error stopping trade early:', err);
    return { success: false, error: 'Failed to stop trade early.' };
  }
}

/**
 * Resolves all pending trades whose resolution time has passed.
 */
export async function processExpiredTrades() {
  try {
    await connectToDatabase();
    const now = new Date();
    const expiredTrades = await Trade.find({
      status: 'PENDING',
      resolves_at: { $lte: now }
    });

    for (const trade of expiredTrades) {
      await resolveTradeRecord(trade);
    }
  } catch (err) {
    console.error('Error in processExpiredTrades worker:', err);
  }
}

/**
 * Updates prices with realistic real-time micro fluctuations
 */
export async function tickMarketPrices() {
  try {
    await connectToDatabase();
    const pairs = await TradingPair.find({ is_active: true });

    for (const pair of pairs) {
      let pct = (Math.random() * 0.004) - 0.0019; // -0.19% to +0.21%
      if (pair.category === 'Crypto') {
        pct = (Math.random() * 0.008) - 0.0038;
      }

      let newPrice = pair.current_price * (1 + pct);
      if (pair.category === 'Forex') {
        newPrice = Number(newPrice.toFixed(4));
      } else if (newPrice > 1000) {
        newPrice = Number(newPrice.toFixed(2));
      } else if (newPrice > 10) {
        newPrice = Number(newPrice.toFixed(2));
      } else {
        newPrice = Number(newPrice.toFixed(4));
      }

      let newChange = Number((pair.change + (pct * 10)).toFixed(2));
      if (Math.abs(newChange) > 15) {
        newChange = Number((pct * 10).toFixed(2));
      }

      pair.current_price = newPrice;
      pair.change = newChange;
      await pair.save();
    }
  } catch (err) {
    console.error('Error in tickMarketPrices:', err);
  }
}
