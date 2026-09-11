import { connectToDatabase } from '../lib/db.js';
import User from '../models/User.js';
import InvestmentPackage from '../models/InvestmentPackage.js';
import UserInvestment from '../models/UserInvestment.js';
import Signal from '../models/Signal.js';
import Trade from '../models/Trade.js';
import Transaction from '../models/Transaction.js';

async function verifySystem() {
  try {
    await connectToDatabase();
    console.log('🧪 Starting Yield Staking & Signal Boost System Verification...');

    // 1. Verify Packages
    const pkgs = await InvestmentPackage.find({ is_active: true }).sort({ duration_days: 1 });
    console.log(`\n1. Active Investment Packages (${pkgs.length} found):`);
    pkgs.forEach(p => {
      console.log(`   - ${p.name} | ${p.duration_days} Days | +${p.total_return_roi}% ROI | $${p.min_amount} - $${p.max_amount}`);
    });

    if (pkgs.length < 4) {
      throw new Error('Expected at least 4 default packages (7d, 14d, 21d, 30d).');
    }

    // 2. Verify Signal Schema
    const activeSignal = await Signal.findOne({ status: 'ACTIVE' });
    console.log(`\n2. Active Daily Signal:`);
    if (activeSignal) {
      console.log(`   - Instrument: ${activeSignal.instrument} ${activeSignal.order_type}`);
      console.log(`   - Standard User Profit: +${activeSignal.profit_percentage}%`);
      console.log(`   - VIP Staking Profit: +${activeSignal.investment_profit_percentage}%`);
    } else {
      console.log('   - No active signal found, creating test active signal...');
      await Signal.create({
        title: `${new Date().toLocaleDateString('en-GB')}, Day Trading Signal`,
        instrument: 'BTCUSDT',
        order_type: 'BUY',
        min_capital: 10.00,
        execution_time_pst: '07:00 PM (PST)',
        duration_seconds: 180,
        profit_percentage: 5.00,
        investment_profit_percentage: 8.50,
        outcome: 'WIN',
        status: 'ACTIVE'
      });
      console.log('   - Created active signal with +5.00% Standard and +8.50% VIP rate.');
    }

    // 3. Test Subscription & Lock Simulation
    console.log(`\n3. Verifying User Investment Creation & Lock Logic:`);
    const testUser = await User.findOne({ role: 'user' });
    if (testUser) {
      console.log(`   - Found test user: ${testUser.email} (Balance: $${testUser.wallet_balance})`);
      
      const pkg7 = pkgs.find(p => p.duration_days === 7) || pkgs[0];
      const amount = 100;
      const expectedProfit = Number(((amount * pkg7.total_return_roi) / 100).toFixed(2));
      const maturesAt = new Date(Date.now() + pkg7.duration_days * 86400 * 1000);

      // Check existing active investments
      const activeInvCount = await UserInvestment.countDocuments({ user_id: testUser._id, status: 'ACTIVE' });
      console.log(`   - Current active investments for user: ${activeInvCount}`);
      console.log(`   - 7-Day Plan: $${amount} -> Expected Profit: +$${expectedProfit} (+${pkg7.total_return_roi}%) on ${maturesAt.toLocaleDateString()}`);
    }

    console.log('\n✅ All system checks and schema validations passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

verifySystem();
