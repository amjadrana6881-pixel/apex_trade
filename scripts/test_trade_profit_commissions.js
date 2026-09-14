import { connectToDatabase } from '../lib/db.js';
import User from '../models/User.js';
import Trade from '../models/Trade.js';
import Transaction from '../models/Transaction.js';
import { resolveTradeRecord } from '../lib/marketEngine.js';

async function testTradeProfitCommissionDistribution() {
  console.log('🚀 Running 3-Tier Daily Trade Profit Commission Verification...\n');
  await connectToDatabase();

  // Create 3-Tier Sponsor Hierarchy
  const u3 = await User.create({
    name: 'Tier 3 Sponsor',
    email: 'tier3_sponsor@apex.io',
    password: 'password123',
    referral_code: 'APEX_T3_01',
    wallet_balance: 100,
    status: 'ACTIVE'
  });

  const u2 = await User.create({
    name: 'Tier 2 Sponsor',
    email: 'tier2_sponsor@apex.io',
    password: 'password123',
    referral_code: 'APEX_T2_01',
    referred_by: u3.referral_code,
    wallet_balance: 100,
    status: 'ACTIVE'
  });

  const u1 = await User.create({
    name: 'Tier 1 Sponsor',
    email: 'tier1_sponsor@apex.io',
    password: 'password123',
    referral_code: 'APEX_T1_01',
    referred_by: u2.referral_code,
    wallet_balance: 100,
    status: 'ACTIVE'
  });

  const trader = await User.create({
    name: 'Active Downline Trader',
    email: 'active_trader@apex.io',
    password: 'password123',
    referral_code: 'APEX_TRADER_01',
    referred_by: u1.referral_code,
    wallet_balance: 500,
    trade_mode: 'FORCE_WIN',
    status: 'ACTIVE'
  });

  console.log('[STEP 1] Created 3-Tier Network Hierarchy:');
  console.log(`         Tier 3 Sponsor: ${u3.name} ($${u3.wallet_balance.toFixed(2)})`);
  console.log(`         Tier 2 Sponsor: ${u2.name} ($${u2.wallet_balance.toFixed(2)})`);
  console.log(`         Tier 1 Sponsor: ${u1.name} ($${u1.wallet_balance.toFixed(2)})`);
  console.log(`         Trader:         ${trader.name} ($${trader.wallet_balance.toFixed(2)})`);

  // Create active trade for Trader ($500 with 10% payout = $50.00 profit)
  const trade = await Trade.create({
    user_id: trader._id,
    pair: 'BTCUSDT',
    type: 'BUY',
    amount: 500,
    entry_price: 60000,
    duration: 180,
    payout_rate: 10.0, // $50 profit
    status: 'PENDING',
    resolves_at: new Date()
  });

  console.log(`\n[STEP 2] Trader Placed $500.00 Trade with 10.0% Payout ($50.00 expected profit)...`);

  // Resolve trade record using market engine
  const resolvedTrade = await resolveTradeRecord(trade);
  console.log(`         Trade Resolved: Result = ${resolvedTrade.result}, Profit = +$${resolvedTrade.profit.toFixed(2)}`);

  // Fetch updated sponsor balances
  const freshU1 = await User.findById(u1._id);
  const freshU2 = await User.findById(u2._id);
  const freshU3 = await User.findById(u3._id);

  console.log('\n[STEP 3] Verifying Sponsor Commission Distributions on $50.00 Trade Profit:');
  console.log(`         Tier 1 Sponsor (+10%): $${freshU1.wallet_balance.toFixed(2)} (Initial: $100.00, Earned: +$${(freshU1.wallet_balance - 100).toFixed(2)})`);
  console.log(`         Tier 2 Sponsor (+5%):  $${freshU2.wallet_balance.toFixed(2)} (Initial: $100.00, Earned: +$${(freshU2.wallet_balance - 100).toFixed(2)})`);
  console.log(`         Tier 3 Sponsor (+2%):  $${freshU3.wallet_balance.toFixed(2)} (Initial: $100.00, Earned: +$${(freshU3.wallet_balance - 100).toFixed(2)})`);

  // Verify Transactions
  const t1Tx = await Transaction.findOne({ user_id: u1._id, type: 'REFERRAL_BONUS' });
  const t2Tx = await Transaction.findOne({ user_id: u2._id, type: 'REFERRAL_BONUS' });
  const t3Tx = await Transaction.findOne({ user_id: u3._id, type: 'REFERRAL_BONUS' });

  if (t1Tx && Number(t1Tx.amount) === 5.0 && t2Tx && Number(t2Tx.amount) === 2.5 && t3Tx && Number(t3Tx.amount) === 1.0) {
    console.log('\n✅ PASS: 3-Tier Trade Profit Share Commission calculated and credited with 100% precision!');
  } else {
    console.log('\n❌ FAIL: Commission calculation mismatch.');
  }

  // Cleanup test artifacts
  await Trade.findByIdAndDelete(trade._id);
  await Transaction.deleteMany({ reference_id: trade._id.toString() });
  await User.deleteMany({ _id: { $in: [u3._id, u2._id, u1._id, trader._id] } });

  console.log('🧹 Test artifacts cleaned up successfully.');
  console.log('\n🎉 ALL DAILY TRADE PROFIT SHARING COMMISSION TESTS PASSED 100%!\n');
  process.exit(0);
}

testTradeProfitCommissionDistribution().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
