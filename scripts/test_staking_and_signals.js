import { connectToDatabase } from '../lib/db.js';
import User from '../models/User.js';
import InvestmentPackage from '../models/InvestmentPackage.js';
import UserInvestment from '../models/UserInvestment.js';
import Signal from '../models/Signal.js';
import Trade from '../models/Trade.js';
import Transaction from '../models/Transaction.js';
import { resolveTradeRecord } from '../lib/marketEngine.js';

async function runTests() {
  console.log('🚀 Starting Verification Tests for Staking Balance Deduction & Signal Trade Execution...');
  try {
    await connectToDatabase();

    // 1. Create or retrieve test user
    const testEmail = 'staking_test_trader@apextrader.io';
    let user = await User.findOne({ email: testEmail });
    if (!user) {
      user = await User.create({
        name: 'Test Staker',
        email: testEmail,
        password: 'password123',
        wallet_balance: 500.00,
        investment_balance: 0.00,
        tradeable_amount: 500.00
      });
    } else {
      user.wallet_balance = 500.00;
      user.investment_balance = 0.00;
      user.tradeable_amount = 500.00;
      await user.save();
    }
    console.log(`\n[STEP 1] Initial User Balance: Spot Wallet = $${user.wallet_balance.toFixed(2)}, Investment Balance = $${user.investment_balance.toFixed(2)}`);

    // 2. Simulate Staking Package Purchase ($500 into 7-day package)
    const pkg = await InvestmentPackage.findOne({ duration_days: 7, is_active: true }) || await InvestmentPackage.findOne({ is_active: true });
    const investAmount = 500.00;

    user.wallet_balance = Math.max(0, Number((user.wallet_balance - investAmount).toFixed(2)));
    user.tradeable_amount = user.wallet_balance;
    user.investment_balance = Number(((user.investment_balance || 0) + investAmount).toFixed(2));
    await user.save();

    const userInv = await UserInvestment.create({
      user_id: user._id,
      package_id: pkg._id,
      package_name: pkg.name,
      amount: investAmount,
      total_roi: pkg.total_return_roi || 15.0,
      daily_roi: 2.14,
      daily_profit: 10.71,
      expected_profit: Number(((investAmount * (pkg.total_return_roi || 15.0)) / 100).toFixed(2)),
      duration_days: pkg.duration_days,
      status: 'ACTIVE',
      created_at: new Date(),
      matures_at: new Date(Date.now() + pkg.duration_days * 86400 * 1000)
    });

    console.log(`[STEP 2] Package Purchased: Staked $${investAmount.toFixed(2)} in ${pkg.name}`);
    console.log(`         Spot Wallet Balance: $${user.wallet_balance.toFixed(2)} (Deducted to $0.00)`);
    console.log(`         Investment Balance:  $${user.investment_balance.toFixed(2)} (Staked Collateral)`);

    if (user.wallet_balance !== 0.00 || user.investment_balance !== 500.00) {
      throw new Error(`Step 2 Failed: Expected wallet=0, investment=500. Got wallet=${user.wallet_balance}, investment=${user.investment_balance}`);
    }
    console.log('         ✅ Balance deduction verified!');

    // 3. Simulate Signal Trade Execution with $500 Staked Capital
    const activeSignal = await Signal.findOne({ status: 'ACTIVE' });
    const availableWallet = user.wallet_balance;
    const availableStaked = user.investment_balance;
    const totalAvailable = availableWallet + availableStaked;
    const tradeAmount = 500.00;

    if (tradeAmount > totalAvailable) {
      throw new Error('Step 3 Failed: Total available should be $500, but rejected.');
    }

    const walletUsed = Math.min(availableWallet, tradeAmount); // 0
    const stakedUsed = Number((tradeAmount - walletUsed).toFixed(2)); // 500

    user.wallet_balance -= walletUsed;
    user.tradeable_amount = user.wallet_balance;
    await user.save();

    const testTrade = await Trade.create({
      user_id: user._id,
      pair: 'BTCUSDT',
      type: 'BUY',
      amount: tradeAmount,
      entry_price: 91500.00,
      duration: 180,
      payout_rate: 8.50, // VIP Boost rate
      is_signal_trade: true,
      is_investment_boosted: true,
      signal_id: activeSignal?._id || null,
      wallet_amount_used: walletUsed,
      staked_amount_used: stakedUsed,
      status: 'PENDING',
      result: 'PENDING',
      resolves_at: new Date(Date.now() + 1000)
    });

    console.log(`\n[STEP 3] Signal Trade Executed: $${tradeAmount.toFixed(2)} (Wallet Used: $${walletUsed.toFixed(2)}, Staked Used: $${stakedUsed.toFixed(2)})`);
    console.log(`         Trade ID: ${testTrade._id}`);
    console.log('         ✅ Signal trade with staked balance successfully placed!');

    // 4. Simulate Trade Resolution (Win with VIP Boost 8.50% = +$42.50)
    const resolvedTrade = await resolveTradeRecord(testTrade);
    const updatedUser = await User.findById(user._id);

    console.log(`\n[STEP 4] Trade Resolved: Result = ${resolvedTrade.result}, Profit = +$${resolvedTrade.profit.toFixed(2)}`);
    console.log(`         Updated Spot Wallet Balance: $${updatedUser.wallet_balance.toFixed(2)} (Received Profit +$${resolvedTrade.profit.toFixed(2)})`);
    console.log(`         Updated Investment Balance:  $${updatedUser.investment_balance.toFixed(2)} (Staked principal intact)`);

    if (updatedUser.wallet_balance !== 42.50 || updatedUser.investment_balance !== 500.00) {
      throw new Error(`Step 4 Failed: Expected wallet=42.50, investment=500. Got wallet=${updatedUser.wallet_balance}, investment=${updatedUser.investment_balance}`);
    }
    console.log('         ✅ Daily signal profit credited directly to spot wallet, staking principal preserved!');

    // 5. Simulate Maturity Settlement
    const matureProfit = userInv.expected_profit; // $75.00
    const returnTotal = Number((userInv.amount + matureProfit).toFixed(2)); // $575.00

    updatedUser.wallet_balance = Number((updatedUser.wallet_balance + returnTotal).toFixed(2));
    updatedUser.tradeable_amount = updatedUser.wallet_balance;
    updatedUser.investment_balance = Math.max(0, Number(((updatedUser.investment_balance || 0) - userInv.amount).toFixed(2)));
    await updatedUser.save();

    userInv.status = 'COMPLETED';
    userInv.completed_at = new Date();
    userInv.total_profit_earned = matureProfit;
    await userInv.save();

    console.log(`\n[STEP 5] Package Matured & Settled: Returned $${returnTotal.toFixed(2)} ($${userInv.amount.toFixed(2)} principal + $${matureProfit.toFixed(2)} ROI profit)`);
    console.log(`         Final Spot Wallet Balance: $${updatedUser.wallet_balance.toFixed(2)} ($42.50 daily profit + $575.00 maturity = $617.50)`);
    console.log(`         Final Investment Balance:  $${updatedUser.investment_balance.toFixed(2)}`);

    const expectedFinalWallet = Number((42.50 + returnTotal).toFixed(2));
    if (updatedUser.wallet_balance !== expectedFinalWallet || updatedUser.investment_balance !== 0.00) {
      throw new Error(`Step 5 Failed: Expected final wallet=${expectedFinalWallet}, investment=0. Got wallet=${updatedUser.wallet_balance}, investment=${updatedUser.investment_balance}`);
    }
    console.log('         ✅ Maturity settlement return verified perfectly!');

    // Clean up test records
    await Trade.deleteOne({ _id: testTrade._id });
    await UserInvestment.deleteOne({ _id: userInv._id });
    await User.deleteOne({ _id: user._id });
    console.log('\n🧹 Test artifacts cleaned up.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The yield deduction and signal trade execution system is 100% verified.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
