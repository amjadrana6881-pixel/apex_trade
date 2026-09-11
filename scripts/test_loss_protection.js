import dotenv from 'dotenv';
dotenv.config();
import { connectToDatabase } from '../lib/db.js';
import User from '../models/User.js';
import Trade from '../models/Trade.js';
import Transaction from '../models/Transaction.js';
import { resolveTradeRecord, stopTradeEarly } from '../lib/marketEngine.js';

async function testLossProtection() {
  await connectToDatabase();
  const testUser = await User.findOne({ role: 'admin' });
  if (!testUser) {
    console.log('No user found');
    process.exit(0);
  }

  const initialBal = testUser.wallet_balance;
  console.log('Test User Initial Balance:', initialBal);

  // 1. Create a simulated off-signal trade
  const tradeAmount = 100;
  testUser.wallet_balance -= tradeAmount;
  testUser.tradeable_amount = testUser.wallet_balance;
  await testUser.save();

  const trade = await Trade.create({
    user_id: testUser._id,
    pair: 'BTCUSDT',
    type: 'BUY',
    amount: tradeAmount,
    entry_price: 90000,
    duration: 60,
    payout_rate: 88,
    is_signal_trade: false,
    status: 'PENDING',
    result: 'PENDING',
    resolves_at: new Date()
  });

  console.log('Created pending trade:', trade._id, 'Balance after deduct:', testUser.wallet_balance);

  // 2. Resolve trade (should be LOSS with 3-5% cap)
  const resolved = await resolveTradeRecord(trade);
  const updatedUser = await User.findById(testUser._id);

  console.log('--- RESOLUTION METRICS ---');
  console.log('Result:', resolved.result);
  console.log('Loss Profit:', resolved.profit);
  console.log('Refunded Amount:', resolved.refunded_amount);
  console.log('Penalty %:', resolved.penalty_percentage + '%');
  console.log('Updated User Balance:', updatedUser.wallet_balance);
  console.log('Capital Preserved %:', ((resolved.refunded_amount / tradeAmount) * 100).toFixed(2) + '%');

  // Clean up test trade and restore initial balance
  await Trade.findByIdAndDelete(trade._id);
  await Transaction.deleteMany({ reference_id: trade._id.toString() });
  updatedUser.wallet_balance = initialBal;
  updatedUser.tradeable_amount = initialBal;
  await updatedUser.save();
  console.log('✅ Cleaned up test data & restored balance.');

  process.exit(0);
}

testLossProtection().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
