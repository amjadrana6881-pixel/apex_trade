import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/db.js';
import User from '../models/User.js';
import Trade from '../models/Trade.js';
import Deposit from '../models/Deposit.js';
import Withdrawal from '../models/Withdrawal.js';
import Transaction from '../models/Transaction.js';

async function seedHistory() {
  await connectToDatabase();

  const user = await User.findOne({ email: 'hafizawais0102@gmail.com' });
  if (!user) {
    console.error('User hafizawais0102@gmail.com not found in database.');
    process.exit(1);
  }

  console.log(`\n================ GENERATING REALISTIC 6-MONTH HISTORY ================`);
  console.log(`User: ${user.name} (${user.email})`);

  // 1. Clean previous data
  await Trade.deleteMany({ user_id: user._id });
  await Deposit.deleteMany({ user_id: user._id });
  await Withdrawal.deleteMany({ user_id: user._id });
  await Transaction.deleteMany({ user_id: user._id });

  // 2. Set account creation date 6 months ago (March 15, 2026)
  const accountCreatedDate = new Date('2026-03-15T09:30:00.000Z');
  user.created_at = accountCreatedDate;
  user.kyc_status = 'VERIFIED';
  user.kyc_doc = '/uploads/kyc-verified-national-id.jpg';
  user.saved_usdt_address = 'TX9aRkZ8FqL62uM7eN8oP3wS1tV4yB5cD6';
  user.saved_usdt_network = 'TRC-20';
  user.phone = '+92 301 7845129';

  const depositsToInsert = [];
  const withdrawalsToInsert = [];
  const tradesToInsert = [];
  const transactionsToInsert = [];

  // 3. Initial Deposit: Exactly $500.00 USDT on March 15, 2026
  const dep1Date = new Date('2026-03-15T11:45:00.000Z');
  const dep1Id = new mongoose.Types.ObjectId();
  depositsToInsert.push({
    _id: dep1Id,
    user_id: user._id,
    amount: 500.00,
    network: 'TRC-20',
    txid: '3f8a1e2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f',
    status: 'APPROVED',
    admin_notes: 'Initial $500.00 TRC-20 deposit verified on TRONSCAN',
    created_at: dep1Date,
    updated_at: dep1Date
  });
  transactionsToInsert.push({
    user_id: user._id,
    type: 'DEPOSIT',
    amount: 500.00,
    description: 'Initial Deposit via TRC-20 ($500.00)',
    reference_id: dep1Id.toString(),
    status: 'COMPLETED',
    created_at: dep1Date
  });

  // 4. Approved Withdrawals every 15-25 days ($200, $290, $340, $150, etc.)
  const withdrawalEvents = [
    { date: new Date('2026-04-06T14:20:00.000Z'), amount: 150.00, fee: 15.00, net: 135.00 },
    { date: new Date('2026-04-29T16:10:00.000Z'), amount: 200.00, fee: 20.00, net: 180.00 },
    { date: new Date('2026-05-21T11:35:00.000Z'), amount: 290.00, fee: 29.00, net: 261.00 },
    { date: new Date('2026-06-16T15:50:00.000Z'), amount: 340.00, fee: 34.00, net: 306.00 },
    { date: new Date('2026-07-12T17:05:00.000Z'), amount: 200.00, fee: 20.00, net: 180.00 },
    { date: new Date('2026-08-07T13:40:00.000Z'), amount: 290.00, fee: 29.00, net: 261.00 },
    { date: new Date('2026-08-30T16:25:00.000Z'), amount: 150.00, fee: 15.00, net: 135.00 }
  ];

  let totalWithdrawn = 0;
  for (const w of withdrawalEvents) {
    totalWithdrawn += w.amount;
    const wdId = new mongoose.Types.ObjectId();
    withdrawalsToInsert.push({
      _id: wdId,
      user_id: user._id,
      amount: w.amount,
      fee: w.fee,
      net_amount: w.net,
      network: 'TRC-20',
      destination_address: 'TX9aRkZ8FqL62uM7eN8oP3wS1tV4yB5cD6',
      status: 'APPROVED',
      admin_notes: 'Approved & processed via TRC-20 blockchain payout',
      created_at: w.date,
      updated_at: new Date(w.date.getTime() + 12 * 60 * 1000)
    });

    transactionsToInsert.push({
      user_id: user._id,
      type: 'WITHDRAWAL',
      amount: -w.amount,
      description: `Crypto payout to TX9aRkZ8FqL62uM7eN8oP3wS1tV4yB5cD6 (Net: $${w.net.toFixed(2)})`,
      reference_id: wdId.toString(),
      status: 'COMPLETED',
      created_at: w.date
    });
  }

  // Target:
  // Initial Deposit: $500.00
  // Total Withdrawals: $1,620.00
  // Final Balance required: Exactly $763.00
  // Required Net Trading Profit = 763.00 + 1620.00 - 500.00 = Exactly $1,883.00
  const targetNetProfit = 763.00 + totalWithdrawn - 500.00; // 1883.00

  // 5. Daily Trades over 6 months (March 15 to Sep 11, 2026)
  // 85% WIN, 15% LOSS, with realistic skipped days
  const tradingPairs = [
    { pair: 'BTCUSDT', basePrice: 62500, spread: 350 },
    { pair: 'ETHUSDT', basePrice: 2750, spread: 22 },
    { pair: 'SOLUSDT', basePrice: 142.0, spread: 2.0 },
    { pair: 'EURUSD', basePrice: 1.0880, spread: 0.0030 },
    { pair: 'XAUUSD', basePrice: 2420.0, spread: 10.0 },
    { pair: 'BNBUSDT', basePrice: 540.0, spread: 5.0 }
  ];

  // Exactly 85% Win (17 Wins, 3 Losses per 20 trades)
  const pattern20 = [
    'WIN', 'WIN', 'WIN', 'WIN', 'LOSS',
    'WIN', 'WIN', 'WIN', 'WIN', 'WIN',
    'WIN', 'LOSS', 'WIN', 'WIN', 'WIN',
    'WIN', 'WIN', 'LOSS', 'WIN', 'WIN'
  ];

  const startMs = accountCreatedDate.getTime();
  const endMs = new Date('2026-09-11T18:00:00.000Z').getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  let tradeDates = [];
  let dayCounter = 0;

  for (let t = startMs; t <= endMs; t += dayMs) {
    const d = new Date(t);
    const dayOfWeek = d.getUTCDay(); // 0 = Sun, 6 = Sat
    // Skip weekends and ~15% random days to feel organic
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    if (dayCounter % 7 === 2) {
      // Occasional rest day
      dayCounter++;
      continue;
    }
    tradeDates.push(d);
    dayCounter++;
  }

  // We have ~100 trading days
  const totalTradesCount = 100;
  // Make sure we take 100 trade dates or cycle
  const selectedDates = tradeDates.slice(-totalTradesCount);
  while (selectedDates.length < totalTradesCount) {
    selectedDates.push(new Date());
  }

  let rawProfits = [];
  let winTrades = [];
  let lossTrades = [];

  // Generate base amounts for 85 wins and 15 losses
  for (let i = 0; i < totalTradesCount; i++) {
    const outcome = pattern20[i % pattern20.length];
    const amount = [40, 50, 60, 70, 80, 50, 60][i % 7];
    if (outcome === 'WIN') {
      winTrades.push({ idx: i, amount, payoutRate: 88.0 });
    } else {
      lossTrades.push({ idx: i, amount });
    }
  }

  // Calculate current sum of wins and losses
  let currentWinsGross = winTrades.reduce((sum, t) => sum + (t.amount * 0.88), 0);
  let currentLossGross = lossTrades.reduce((sum, t) => sum + t.amount, 0);
  let currentNet = currentWinsGross - currentLossGross;

  // Fine-tune amounts to hit EXACTLY $1,883.00 net profit
  const diff = targetNetProfit - currentNet;
  // Adjust win trades slightly to absorb the diff exactly
  const perWinAdjustment = diff / winTrades.length;
  winTrades.forEach(wt => {
    wt.profit = Number(((wt.amount * 0.88) + perWinAdjustment).toFixed(2));
  });

  // Re-verify exact sum
  let finalNetCheck = winTrades.reduce((s, w) => s + w.profit, 0) - currentLossGross;
  let leftoverCents = Number((targetNetProfit - finalNetCheck).toFixed(2));
  if (winTrades.length > 0) {
    winTrades[0].profit = Number((winTrades[0].profit + leftoverCents).toFixed(2));
  }

  let winPtr = 0;
  let lossPtr = 0;

  for (let i = 0; i < totalTradesCount; i++) {
    const outcome = pattern20[i % pattern20.length];
    const currentDay = selectedDates[i];
    const selectedPair = tradingPairs[i % tradingPairs.length];
    const tradeType = (i % 2 === 0) ? 'BUY' : 'SELL';
    const duration = [60, 180, 300, 900][i % 4];

    const tradeDate = new Date(currentDay);
    tradeDate.setUTCHours(14, (i * 13) % 45, (i * 7) % 60);
    const resolveDate = new Date(tradeDate.getTime() + duration * 1000);

    const priceVariation = (Math.random() * selectedPair.spread) - (selectedPair.spread / 2);
    const entryPrice = Number((selectedPair.basePrice + priceVariation).toFixed(selectedPair.pair === 'EURUSD' ? 4 : 2));

    let exitPrice;
    let amount;
    let profit;

    if (outcome === 'WIN') {
      const wt = winTrades[winPtr++];
      amount = wt.amount;
      profit = wt.profit;
      exitPrice = tradeType === 'BUY'
        ? Number((entryPrice + (selectedPair.spread * 0.12)).toFixed(selectedPair.pair === 'EURUSD' ? 4 : 2))
        : Number((entryPrice - (selectedPair.spread * 0.12)).toFixed(selectedPair.pair === 'EURUSD' ? 4 : 2));
    } else {
      const lt = lossTrades[lossPtr++];
      amount = lt.amount;
      profit = -amount;
      exitPrice = tradeType === 'BUY'
        ? Number((entryPrice - (selectedPair.spread * 0.12)).toFixed(selectedPair.pair === 'EURUSD' ? 4 : 2))
        : Number((entryPrice + (selectedPair.spread * 0.12)).toFixed(selectedPair.pair === 'EURUSD' ? 4 : 2));
    }

    const tradeId = new mongoose.Types.ObjectId();
    tradesToInsert.push({
      _id: tradeId,
      user_id: user._id,
      pair: selectedPair.pair,
      type: tradeType,
      amount,
      entry_price: entryPrice,
      exit_price: exitPrice,
      duration,
      payout_rate: 88.0,
      is_signal_trade: true,
      status: 'RESOLVED',
      result: outcome === 'WIN' ? 'WIN' : 'LOSS',
      profit,
      stopped_early: false,
      resolves_at: resolveDate,
      created_at: tradeDate
    });

    transactionsToInsert.push({
      user_id: user._id,
      type: outcome === 'WIN' ? 'TRADE_WIN' : 'TRADE_LOSS',
      amount: profit,
      description: outcome === 'WIN' 
        ? `Trade WIN on ${selectedPair.pair} (+ $${profit.toFixed(2)})`
        : `Trade EXPIRED on ${selectedPair.pair} (- $${amount.toFixed(2)})`,
      reference_id: tradeId.toString(),
      status: 'COMPLETED',
      created_at: resolveDate
    });
  }

  // Bulk inserts
  console.log(`Inserting ${depositsToInsert.length} deposits...`);
  await Deposit.insertMany(depositsToInsert);

  console.log(`Inserting ${withdrawalsToInsert.length} approved withdrawals...`);
  await Withdrawal.insertMany(withdrawalsToInsert);

  console.log(`Inserting ${tradesToInsert.length} trades (85% WIN / 15% LOSS)...`);
  await Trade.insertMany(tradesToInsert);

  console.log(`Inserting ${transactionsToInsert.length} transaction ledger records...`);
  await Transaction.insertMany(transactionsToInsert);

  // Set user wallet balance to EXACTLY 763.00
  user.wallet_balance = 763.00;
  user.tradeable_amount = 763.00;
  user.investment_balance = 0.00;
  await user.save();

  const totalWinsCount = tradesToInsert.filter(t => t.result === 'WIN').length;
  const totalLossCount = tradesToInsert.filter(t => t.result === 'LOSS').length;
  const sumWinsProfit = tradesToInsert.filter(t => t.result === 'WIN').reduce((s, t) => s + t.profit, 0);
  const sumLosses = tradesToInsert.filter(t => t.result === 'LOSS').reduce((s, t) => s + Math.abs(t.profit), 0);

  console.log('\n================ SEED COMPLETE & VERIFIED ================');
  console.log(`User: ${user.name} (${user.email})`);
  console.log(`Account Age: 6 Months (Created ${accountCreatedDate.toDateString()})`);
  console.log(`Initial Deposit: $500.00`);
  console.log(`Total Approved Withdrawals: 7 Payouts (Total: $${totalWithdrawn.toFixed(2)})`);
  console.log(`Total Trades: ${tradesToInsert.length}`);
  console.log(`Wins: ${totalWinsCount} (${((totalWinsCount / tradesToInsert.length) * 100).toFixed(1)}%)`);
  console.log(`Losses: ${totalLossCount} (${((totalLossCount / tradesToInsert.length) * 100).toFixed(1)}%)`);
  console.log(`Total Profit from Wins: +$${sumWinsProfit.toFixed(2)}`);
  console.log(`Total Loss from Failed Trades: -$${sumLosses.toFixed(2)}`);
  console.log(`Net Trading Profit: +$${(sumWinsProfit - sumLosses).toFixed(2)}`);
  console.log(`Mathematical Formula: $500.00 (Deposit) + $${(sumWinsProfit - sumLosses).toFixed(2)} (Trading) - $${totalWithdrawn.toFixed(2)} (Withdrawals)`);
  console.log(`Active Wallet Balance: $${user.wallet_balance.toFixed(2)} USDT`);
  console.log('===========================================================\n');

  process.exit(0);
}

seedHistory().catch(err => {
  console.error('Seed history error:', err);
  process.exit(1);
});
