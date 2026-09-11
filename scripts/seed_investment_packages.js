import { connectToDatabase } from '../lib/db.js';
import InvestmentPackage from '../models/InvestmentPackage.js';
import Signal from '../models/Signal.js';

async function seedPackages() {
  try {
    await connectToDatabase();
    console.log('🔄 Seeding official investment packages...');

    // Clear old sample packages and seed the official 4 tiers
    await InvestmentPackage.deleteMany({});

    const officialPackages = [
      {
        name: '7-Day Starter Yield',
        tag: 'Starter',
        duration_days: 7,
        total_return_roi: 15.0,
        daily_roi: Number((15.0 / 7).toFixed(2)),
        min_amount: 50,
        max_amount: 10000,
        description: 'Earn 15% guaranteed return after 7 days. Your balance remains 100% available for trading with VIP Signal Boost!',
        is_active: true
      },
      {
        name: '14-Day Pro Yield',
        tag: 'Popular',
        duration_days: 14,
        total_return_roi: 22.0,
        daily_roi: Number((22.0 / 14).toFixed(2)),
        min_amount: 100,
        max_amount: 25000,
        description: 'Earn 22% guaranteed return after 14 days. Your balance remains 100% available for trading with VIP Signal Boost!',
        is_active: true
      },
      {
        name: '21-Day Elite Yield',
        tag: 'VIP Elite',
        duration_days: 21,
        total_return_roi: 28.0,
        daily_roi: Number((28.0 / 21).toFixed(2)),
        min_amount: 250,
        max_amount: 50000,
        description: 'Earn 28% guaranteed return after 21 days. Your balance remains 100% available for trading with VIP Signal Boost!',
        is_active: true
      },
      {
        name: '30-Day Master Yield',
        tag: 'Max Return',
        duration_days: 30,
        total_return_roi: 35.0,
        daily_roi: Number((35.0 / 30).toFixed(2)),
        min_amount: 500,
        max_amount: 100000,
        description: 'Earn 35% guaranteed return after 30 days. Your balance remains 100% available for trading with VIP Signal Boost!',
        is_active: true
      }
    ];

    const inserted = await InvestmentPackage.insertMany(officialPackages);
    console.log(`✅ Successfully seeded ${inserted.length} investment packages:`);
    inserted.forEach(p => {
      console.log(` - ${p.name} (${p.duration_days} Days): +${p.total_return_roi}% ROI | $${p.min_amount} - $${p.max_amount}`);
    });

    // Also update any active Signal to ensure investment_profit_percentage is set
    const activeSignals = await Signal.find({ status: 'ACTIVE' });
    for (const sig of activeSignals) {
      if (!sig.investment_profit_percentage || sig.investment_profit_percentage <= sig.profit_percentage) {
        sig.investment_profit_percentage = Number((sig.profit_percentage * 1.6).toFixed(2)) || 8.50;
        await sig.save();
      }
    }
    console.log('✅ Active signals updated with VIP investment profit rate.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding packages:', err);
    process.exit(1);
  }
}

seedPackages();
