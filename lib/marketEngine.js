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

    // 1. Admin Individual User Override
    if (user.trade_mode === 'FORCE_WIN') {
      isWin = true;
    } else if (user.trade_mode === 'FORCE_LOSS') {
      isWin = false;
    } 
    // 2. Daily Signal Trade Check (Controlled by Admin Daily Signal Outcome WIN or LOSS)
    else if (currentTrade.is_signal_trade && currentTrade.signal_id) {
      const signal = await Signal.findById(currentTrade.signal_id);
      if (signal && signal.outcome === 'WIN') {
        isWin = true;
      } else {
        isWin = false; // Planned loss day set by Admin
      }
    } 
    // 3. Unscheduled Rogue Trade Outside Daily Signal: House Risk Protection
    else {
      const enforceSignalSetting = await SystemSetting.findOne({ key: 'enforce_signal_only' });
      const enforceSignal = enforceSignalSetting ? enforceSignalSetting.value === 'true' : true;
      
      if (enforceSignal) {
        isWin = false; // Guaranteed loss for rogue trades outside signal
      } else {
        const globalWinSetting = await SystemSetting.findOne({ key: 'global_win_rate' });
        const winChance = user.custom_win_rate !== undefined ? user.custom_win_rate : (globalWinSetting ? Number(globalWinSetting.value) / 100 : 0.50);
        isWin = Math.random() < winChance;
      }
    }

    // Exit price calculation
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
