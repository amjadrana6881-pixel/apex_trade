import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/apextrade';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let memServerInstance = null;

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 4000,
    };

    cached.promise = (async () => {
      try {
        const conn = await mongoose.connect(MONGODB_URI, opts);
        console.log(' MongoDB connected successfully to', MONGODB_URI);
        return conn;
      } catch (err) {
        console.warn('⚠️ Standard MongoDB connection failed:', err.message);
        console.log('🔄 Attempting fallback to In-Memory MongoDB Server...');
        try {
          const memPkg = 'mongodb-memory-server';
          const { MongoMemoryServer } = await import(/* webpackIgnore: true */ memPkg);
          if (!memServerInstance) {
            memServerInstance = await MongoMemoryServer.create();
          }
          const memUri = memServerInstance.getUri();
          const conn = await mongoose.connect(memUri, { bufferCommands: false });
          console.log(' MongoDB Memory Server connected successfully at', memUri);
          return conn;
        } catch (memErr) {
          console.error('❌ Failed to initialize MongoDB connection:', memErr.message);
          throw memErr;
        }
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    await ensureSeedData();
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
        name: 'ApexTrade Master Admin',
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
    const pairsCount = await TradingPair.countDocuments();
    if (pairsCount === 0) {
      const defaultPairs = [
        { symbol: 'XAUUSD', name: 'Gold/USD', category: 'Commodities', current_price: 2894.50, change: 1.24, payout_rate: 88, is_active: true, image_url: '/images/Gold.jpg' },
        { symbol: 'XAGUSD', name: 'Silver/USD', category: 'Commodities', current_price: 32.40, change: -0.45, payout_rate: 85, is_active: true, image_url: '/images/Silver.jpg' },
        { symbol: 'USOIL', name: 'Crude Oil', category: 'Commodities', current_price: 74.80, change: 2.15, payout_rate: 85, is_active: true, image_url: '/images/Oil.jpg' },
        { symbol: 'GAS', name: 'Natural Gas', category: 'Commodities', current_price: 2.85, change: -1.10, payout_rate: 82, is_active: true, image_url: '/images/gas.jpg' },
        { symbol: 'EURUSD', name: 'Euro/USD', category: 'Forex', current_price: 1.0842, change: 0.35, payout_rate: 87, is_active: true, image_url: '/images/eurusd.jpg' },
        { symbol: 'USDJPY', name: 'USD/JPY', category: 'Forex', current_price: 154.60, change: -0.22, payout_rate: 86, is_active: true, image_url: '/images/usdjpy.jpg' },
        { symbol: 'GBPJPY', name: 'GBP/JPY', category: 'Forex', current_price: 196.20, change: 0.58, payout_rate: 85, is_active: true, image_url: '/images/gbpjpy.jpg' },
        { symbol: 'AUDNZD', name: 'AUD/NZD', category: 'Forex', current_price: 1.1025, change: -0.15, payout_rate: 84, is_active: true, image_url: '/images/AUDNZD.jpg' },
        { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', category: 'Crypto', current_price: 91450.00, change: 3.42, payout_rate: 90, is_active: true, image_url: '/images/Bitcoin.jpg' },
        { symbol: 'ETHUSDT', name: 'Ethereum/USDT', category: 'Crypto', current_price: 3420.00, change: 2.85, payout_rate: 88, is_active: true, image_url: '/images/ethereum.jpg' },
        { symbol: 'SOLUSDT', name: 'Solana/USDT', category: 'Crypto', current_price: 198.50, change: 5.60, payout_rate: 86, is_active: true, image_url: '/images/SOLANA.jpg' },
        { symbol: 'XRPUSDT', name: 'Ripple/USDT', category: 'Crypto', current_price: 2.45, change: 4.10, payout_rate: 85, is_active: true, image_url: '/images/xrp.jpg' },
        { symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks', current_price: 232.80, change: 1.15, payout_rate: 85, is_active: true, image_url: '/images/apple.jpg' },
        { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Stocks', current_price: 288.40, change: -1.80, payout_rate: 87, is_active: true, image_url: '/images/TESLA.jpg' },
        { symbol: 'GOOG', name: 'Alphabet Google', category: 'Stocks', current_price: 184.20, change: 0.92, payout_rate: 85, is_active: true, image_url: '/images/google.jpg' },
        { symbol: 'META', name: 'Meta Platforms', category: 'Stocks', current_price: 620.50, change: 2.40, payout_rate: 86, is_active: true, image_url: '/images/facebook.jpg' }
      ];
      await TradingPair.insertMany(defaultPairs);
      console.log('✅ Default Trading Pairs seeded');
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
        { name: 'Starter Yield', tag: 'Starter', min_amount: 50, max_amount: 500, daily_roi: 2.5, duration_days: 7, total_return_roi: 17.5, description: 'Stable algorithmic crypto liquidity yield with daily returns.', is_active: true },
        { name: 'Pro Option Growth', tag: 'Popular', min_amount: 500, max_amount: 5000, daily_roi: 3.5, duration_days: 14, total_return_roi: 49.0, description: 'Multi-asset derivatives arbitrage with automated daily disbursements.', is_active: true },
        { name: 'Institutional Prime', tag: 'VIP Tier', min_amount: 5000, max_amount: 50000, daily_roi: 5.0, duration_days: 30, total_return_roi: 150.0, description: 'High-frequency institutional options trading desk strategy.', is_active: true }
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
