import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

// Fix for Node.js MongoDB Atlas SRV ETIMEOUT on macOS / local ISP networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const DEFAULT_URI = 'mongodb://muraliarimbra1962_db_user:RbYhKq30zvR9h5XC@ac-vhmrayk-shard-00-00.han22u7.mongodb.net:27017,ac-vhmrayk-shard-00-01.han22u7.mongodb.net:27017,ac-vhmrayk-shard-00-02.han22u7.mongodb.net:27017/apextrade?ssl=true&replicaSet=atlas-6g8to7-shard-0&authSource=admin&retryWrites=true&w=majority';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(uri, opts).then((conn) => {
      console.log('🍃 MongoDB connected successfully to', uri.replace(/:[^:@]+@/, ':***@'));
      // Run initial seeding in background without blocking response
      ensureSeedData().catch((seedErr) => {
        console.warn('⚠️ Seeding warning:', seedErr.message);
      });
      return conn;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

let isSeeded = false;

export async function ensureSeedData() {
  if (isSeeded) return;
  try {
    const User = (await import('../models/User.js')).default;
    const TradingPair = (await import('../models/TradingPair.js')).default;
    const DepositWallet = (await import('../models/DepositWallet.js')).default;
    const Signal = (await import('../models/Signal.js')).default;
    const InvestmentPackage = (await import('../models/InvestmentPackage.js')).default;
    const SystemSetting = (await import('../models/SystemSetting.js')).default;

    // 1. Seed Master Admin
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@apextrade.net').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync(adminPassword, salt);

    let admin = await User.findOne({ $or: [{ role: 'admin' }, { email: adminEmail }] });
    if (!admin) {
      await User.create({
        name: 'ApexTrader Master Admin',
        email: adminEmail,
        password: adminHash,
        role: 'admin',
        wallet_balance: 50000.00,
        tradeable_amount: 50000.00,
        investment_balance: 0,
        referral_code: 'APEXADMIN',
        referred_by: '',
        phone: '',
        kyc_status: 'VERIFIED',
        status: 'ACTIVE',
        trade_mode: 'AUTO',
        custom_win_rate: 0.50,
      });
      console.log('✅ Master Admin account seeded:', adminEmail);
    } else {
      admin.email = adminEmail;
      admin.password = adminHash;
      admin.role = 'admin';
      await admin.save();
    }

    // 2. Seed Trading Pairs
    const defaultPairs = [
      { symbol: 'XAUUSD', name: 'Gold/USD', category: 'Commodities', current_price: 2894.50, change: 0.04, payout_rate: 88, is_active: true, image_url: '/images/Gold.jpg' },
      { symbol: 'XAGUSD', name: 'Silver/USD', category: 'Commodities', current_price: 32.40, change: 1.75, payout_rate: 85, is_active: true, image_url: '/images/Silver.jpg' },
      { symbol: 'USOIL', name: 'Crude Oil', category: 'Commodities', current_price: 74.80, change: -0.93, payout_rate: 85, is_active: true, image_url: '/images/Oil.jpg' },
      { symbol: 'GAS', name: 'Natural Gas', category: 'Commodities', current_price: 2.85, change: -25.47, payout_rate: 82, is_active: true, image_url: '/images/gas.jpg' },
      { symbol: 'EURUSD', name: 'Euro/USD', category: 'Forex', current_price: 1.0842, change: -43.49, payout_rate: 87, is_active: true, image_url: '/images/eurusd.jpg' },
      { symbol: 'USDJPY', name: 'USD/JPY', category: 'Forex', current_price: 154.60, change: 0.22, payout_rate: 86, is_active: true, image_url: '/images/usdjpy.jpg' },
      { symbol: 'GBPJPY', name: 'GBP/JPY', category: 'Forex', current_price: 196.20, change: 0.09, payout_rate: 85, is_active: true, image_url: '/images/gbpjpy.jpg' },
      { symbol: 'AUDNZD', name: 'AUD/NZD', category: 'Forex', current_price: 1.1025, change: -7.93, payout_rate: 84, is_active: true, image_url: '/images/AUDNZD.jpg' },
      { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', category: 'Crypto', current_price: 91450.00, change: 3.42, payout_rate: 90, is_active: true, image_url: '/images/Bitcoin.jpg' },
      { symbol: 'ETHUSDT', name: 'Ethereum/USDT', category: 'Crypto', current_price: 3420.00, change: 2.85, payout_rate: 88, is_active: true, image_url: '/images/ethereum.jpg' },
      { symbol: 'SOLUSDT', name: 'Solana/USDT', category: 'Crypto', current_price: 198.50, change: 5.60, payout_rate: 86, is_active: true, image_url: '/images/SOLANA.jpg' },
      { symbol: 'XRPUSDT', name: 'Ripple/USDT', category: 'Crypto', current_price: 2.45, change: 4.10, payout_rate: 85, is_active: true, image_url: '/images/xrp.jpg' },
      { symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks', current_price: 232.80, change: 1.15, payout_rate: 85, is_active: true, image_url: '/images/apple.jpg' },
      { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Stocks', current_price: 288.40, change: -1.80, payout_rate: 87, is_active: true, image_url: '/images/TESLA.jpg' },
      { symbol: 'GOOG', name: 'Alphabet Google', category: 'Stocks', current_price: 184.20, change: 0.92, payout_rate: 85, is_active: true, image_url: '/images/google.jpg' },
      { symbol: 'META', name: 'Meta Platforms', category: 'Stocks', current_price: 620.50, change: 2.40, payout_rate: 86, is_active: true, image_url: '/images/facebook.jpg' }
    ];

    const pairsCount = await TradingPair.countDocuments();
    if (pairsCount === 0) {
      await TradingPair.insertMany(defaultPairs);
      console.log('✅ Default Trading Pairs seeded');
    } else {
      // Ensure image_url is populated for all existing pairs
      for (const dp of defaultPairs) {
        await TradingPair.updateOne(
          { symbol: dp.symbol, $or: [{ image_url: '' }, { image_url: { $exists: false } }] },
          { $set: { image_url: dp.image_url, category: dp.category } }
        );
      }
    }

    // 3. Seed Crypto Deposit Wallets
    const walletsCount = await DepositWallet.countDocuments();
    if (walletsCount === 0) {
      const defaultWallets = [
        {
          network: 'TRC-20',
          network_name: 'USDT (TRC-20 Network)',
          address: 'TYDzsYbm2n9vVqF8cWwQeP7Z8xK9LmN4aB',
          instructions: 'Send only USDT TRC-20 to this address. Minimum deposit $10. Upload TXID & receipt screenshot.',
          is_active: true
        },
        {
          network: 'BEP-20',
          network_name: 'USDT (BNB Smart Chain BEP-20)',
          address: '0x32A4B892F74Ce91B991F268153A47C1a84f3299E',
          instructions: 'Send only BSC BEP-20 USDT. Lowest network gas fee.',
          is_active: true
        },
        {
          network: 'ERC-20',
          network_name: 'USDT (Ethereum ERC-20)',
          address: '0x71C5A8c9F4F96E69888941785A8297bcf5f74B81',
          instructions: 'Send only ERC-20 tokens to this address. Ensure network gas fee is included.',
          is_active: true
        }
      ];
      await DepositWallet.insertMany(defaultWallets);
      console.log('✅ Default Crypto Deposit Wallets seeded');
    }

    // 4. Seed Daily Signal
    const signalCount = await Signal.countDocuments();
    if (signalCount === 0) {
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
        status: 'ACTIVE',
        disclaimer: 'Disclaimer: Forex and CFD trading involve high risk. Execute only during official signal window.'
      });
      console.log('✅ Default Daily Signal seeded');
    }

    // 5. Seed Investment Packages
    const pkgsCount = await InvestmentPackage.countDocuments();
    if (pkgsCount === 0) {
      const defaultPkgs = [
        { name: '7-Day Starter Yield', tag: 'Starter', min_amount: 50, max_amount: 10000, duration_days: 7, total_return_roi: 15.0, daily_roi: 2.14, description: 'Earn 15% guaranteed return after 7 days. Full balance remains 100% available for trading with VIP Signal boost!', is_active: true },
        { name: '14-Day Pro Yield', tag: 'Popular', min_amount: 100, max_amount: 25000, duration_days: 14, total_return_roi: 22.0, daily_roi: 1.57, description: 'Earn 22% guaranteed return after 14 days. Full balance remains 100% available for trading with VIP Signal boost!', is_active: true },
        { name: '21-Day Elite Yield', tag: 'VIP Elite', min_amount: 250, max_amount: 50000, duration_days: 21, total_return_roi: 28.0, daily_roi: 1.33, description: 'Earn 28% guaranteed return after 21 days. Full balance remains 100% available for trading with VIP Signal boost!', is_active: true },
        { name: '30-Day Master Yield', tag: 'Max Return', min_amount: 500, max_amount: 100000, duration_days: 30, total_return_roi: 35.0, daily_roi: 1.17, description: 'Earn 35% guaranteed return after 30 days. Full balance remains 100% available for trading with VIP Signal boost!', is_active: true }
      ];
      await InvestmentPackage.insertMany(defaultPkgs);
      console.log('✅ Default Investment Packages seeded');
    }

    // 6. Seed System Settings
    const defaultSettings = [
      { key: 'min_deposit', value: '10' },
      { key: 'min_withdrawal', value: '10' },
      { key: 'withdrawal_fee_percent', value: '10' },
      { key: 'enforce_signal_only', value: 'true' },
      { key: 'referral_lvl1_pct', value: '10' },
      { key: 'referral_lvl2_pct', value: '5' },
      { key: 'referral_lvl3_pct', value: '2' },
      { key: 'global_win_rate', value: '50' }
    ];

    for (const s of defaultSettings) {
      await SystemSetting.findOneAndUpdate(
        { key: s.key },
        { $setOnInsert: s },
        { upsert: true }
      );
    }

    isSeeded = true;
  } catch (err) {
    console.error('Error during database seed:', err);
  }
}
