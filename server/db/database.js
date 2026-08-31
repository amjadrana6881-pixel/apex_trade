const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'apextrade.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      wallet_balance REAL DEFAULT 0.00,
      tradeable_amount REAL DEFAULT 0.00,
      investment_balance REAL DEFAULT 0.00,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      kyc_status TEXT DEFAULT 'UNVERIFIED',
      kyc_doc TEXT DEFAULT '',
      status TEXT DEFAULT 'ACTIVE',
      trade_mode TEXT DEFAULT 'AUTO',
      custom_win_rate REAL DEFAULT 0.50,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Trading Pairs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_pairs (
      symbol TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      current_price REAL NOT NULL,
      change REAL DEFAULT 0.0,
      payout_rate REAL DEFAULT 88.0,
      is_active INTEGER DEFAULT 1,
      image_url TEXT DEFAULT ''
    );
  `);

  // 3. Signals table (Admin Daily Trading Signals)
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      instrument TEXT NOT NULL,
      order_type TEXT NOT NULL,
      min_capital REAL NOT NULL DEFAULT 10.00,
      execution_time_pst TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 180,
      profit_percentage REAL NOT NULL DEFAULT 4.25,
      outcome TEXT DEFAULT 'WIN',
      status TEXT DEFAULT 'ACTIVE',
      disclaimer TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Trades table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pair TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL DEFAULT 0.0,
      duration INTEGER NOT NULL,
      is_signal_trade INTEGER DEFAULT 0,
      signal_id TEXT DEFAULT '',
      status TEXT DEFAULT 'PENDING',
      result TEXT DEFAULT 'PENDING',
      profit REAL DEFAULT 0.00,
      payout_rate REAL DEFAULT 88.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolves_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 5. Deposits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      network TEXT NOT NULL,
      txid TEXT DEFAULT '',
      receipt_url TEXT DEFAULT '',
      status TEXT DEFAULT 'PENDING',
      admin_notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 6. Withdrawals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      fee REAL DEFAULT 0.00,
      net_amount REAL NOT NULL,
      network TEXT NOT NULL,
      destination_address TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      admin_notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 7. Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT DEFAULT '',
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 8. Investment Packages
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tag TEXT DEFAULT '',
      min_amount REAL NOT NULL,
      max_amount REAL NOT NULL,
      daily_roi REAL NOT NULL,
      duration_days INTEGER NOT NULL,
      total_return_roi REAL NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1
    );
  `);

  // 9. User Investments
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_investments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      package_name TEXT NOT NULL,
      amount REAL NOT NULL,
      daily_roi REAL NOT NULL,
      daily_profit REAL NOT NULL,
      total_profit_earned REAL DEFAULT 0.00,
      duration_days INTEGER NOT NULL,
      days_passed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      last_payout_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 10. Wheel Prizes
  db.exec(`
    CREATE TABLE IF NOT EXISTS wheel_prizes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      type TEXT DEFAULT 'BALANCE',
      amount REAL NOT NULL,
      probability_weight INTEGER DEFAULT 10,
      position INTEGER NOT NULL,
      color TEXT DEFAULT '#2563eb',
      is_active INTEGER DEFAULT 1
    );
  `);

  // 11. User Spins
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_spins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      prize_id TEXT NOT NULL,
      prize_label TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 12. Deposit Wallets (CRYPTO ONLY)
  db.exec(`
    CREATE TABLE IF NOT EXISTS deposit_wallets (
      id TEXT PRIMARY KEY,
      network TEXT NOT NULL,
      address TEXT NOT NULL,
      network_name TEXT NOT NULL,
      instructions TEXT DEFAULT '',
      qr_code TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1
    );
  `);

  // 13. Announcements
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 14. System Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 15. Support Messages (Realtime Human Chat with Images, Seen Receipts, Edit and Delete)
  db.exec(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      is_seen INTEGER DEFAULT 0,
      is_edited INTEGER DEFAULT 0,
      deleted_for_everyone INTEGER DEFAULT 0,
      deleted_by TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 16. OTP Verification Codes (For Registration & Password Reset)
  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Column Migrations for support_messages
  try {
    db.exec("ALTER TABLE support_messages ADD COLUMN image_url TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE support_messages ADD COLUMN is_seen INTEGER DEFAULT 0");
  } catch (e) {}

  // Column Migrations on users table for withdrawal security & saved USDT addresses
  try {
    db.exec("ALTER TABLE users ADD COLUMN withdrawal_password TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN saved_usdt_address TEXT DEFAULT ''");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN saved_usdt_network TEXT DEFAULT 'TRC-20'");
  } catch (e) {}

  seedDefaultData();
}

function seedDefaultData() {
  // 1. Seed Master Super Admin User
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@apextrade.net');
  if (!adminExists) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    db.prepare(`
      INSERT INTO users (id, name, email, password, role, wallet_balance, tradeable_amount, referral_code)
      VALUES (?, ?, ?, ?, 'admin', 50000.00, 50000.00, ?)
    `).run(
      'admin-root-001',
      'ApexTrade Master Admin',
      'admin@apextrade.net',
      hash,
      'APEXADMIN'
    );
    console.log('✅ Admin user created: admin@apextrade.net / admin123');
  }

  // Clean out any old dummy demo users
  try {
    db.prepare("DELETE FROM users WHERE email = 'demo@apextrade.net'").run();
  } catch (e) {}

  // 2. Seed Real Active Trading Pairs
  const defaultPairs = [
    // Commodities
    { symbol: 'XAUUSD', name: 'Gold/USD', category: 'Commodities', price: 2894.50, change: 1.24, payout: 88, img: '/images/Gold.jpg' },
    { symbol: 'XAGUSD', name: 'Silver/USD', category: 'Commodities', price: 32.40, change: -0.45, payout: 85, img: '/images/Silver.jpg' },
    { symbol: 'USOIL', name: 'Crude Oil', category: 'Commodities', price: 74.80, change: 2.15, payout: 85, img: '/images/Oil.jpg' },
    { symbol: 'GAS', name: 'Natural Gas', category: 'Commodities', price: 2.85, change: -1.10, payout: 82, img: '/images/gas.jpg' },
    // Forex
    { symbol: 'EURUSD', name: 'Euro/USD', category: 'Forex', price: 1.0842, change: 0.35, payout: 87, img: '/images/eurusd.jpg' },
    { symbol: 'USDJPY', name: 'USD/JPY', category: 'Forex', price: 154.60, change: -0.22, payout: 86, img: '/images/usdjpy.jpg' },
    { symbol: 'GBPJPY', name: 'GBP/JPY', category: 'Forex', price: 196.20, change: 0.58, payout: 85, img: '/images/gbpjpy.jpg' },
    { symbol: 'AUDNZD', name: 'AUD/NZD', category: 'Forex', price: 1.1025, change: -0.15, payout: 84, img: '/images/AUDNZD.jpg' },
    // Crypto
    { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', category: 'Crypto', price: 91450.00, change: 3.42, payout: 90, img: '/images/Bitcoin.jpg' },
    { symbol: 'ETHUSDT', name: 'Ethereum/USDT', category: 'Crypto', price: 3420.00, change: 2.85, payout: 88, img: '/images/ethereum.jpg' },
    { symbol: 'SOLUSDT', name: 'Solana/USDT', category: 'Crypto', price: 198.50, change: 5.60, payout: 86, img: '/images/SOLANA.jpg' },
    { symbol: 'XRPUSDT', name: 'Ripple/USDT', category: 'Crypto', price: 2.45, change: 4.10, payout: 85, img: '/images/xrp.jpg' },
    // Stocks
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks', price: 232.80, change: 1.15, payout: 85, img: '/images/apple.jpg' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Stocks', price: 288.40, change: -1.80, payout: 87, img: '/images/TESLA.jpg' },
    { symbol: 'GOOG', name: 'Alphabet Google', category: 'Stocks', price: 184.20, change: 0.92, payout: 85, img: '/images/google.jpg' },
    { symbol: 'META', name: 'Meta Platforms', category: 'Stocks', price: 620.50, change: 2.40, payout: 86, img: '/images/facebook.jpg' },
  ];

  const insertPair = db.prepare(`
    INSERT OR IGNORE INTO trading_pairs (symbol, name, category, current_price, change, payout_rate, is_active, image_url)
    VALUES (@symbol, @name, @category, @price, @change, @payout, 1, @img)
  `);

  for (const pair of defaultPairs) {
    insertPair.run(pair);
  }

  // 3. Seed Today's Active Daily Signal
  const today = new Date().toLocaleDateString('en-GB');
  db.prepare(`
    INSERT OR REPLACE INTO signals (id, title, instrument, order_type, min_capital, execution_time_pst, duration_seconds, profit_percentage, outcome, status, disclaimer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'WIN', 'ACTIVE', ?)
  `).run(
    'sig-today-001',
    `${today}, Day Trading Signal`,
    'BTCUSDT',
    'BUY',
    10.00,
    '07:00 PM (PST)',
    180, // Max 3 Minutes
    5.00,
    `Disclaimer: Forex and CFD trading involve high risk. Execute only during official signal window. Outside trades are subject to 100% loss.`
  );

  // 4. Seed Deposit Wallets (CRYPTO ONLY - USDT)
  const defaultCryptoWallets = [
    {
      id: 'wallet-trc20',
      network: 'TRC-20',
      network_name: 'USDT (TRC-20 Network)',
      address: 'TYDzsYbm2n9vVqF8cWwQeP7Z8xK9LmN4aB',
      instructions: 'Send only USDT TRC-20 to this address. Minimum deposit $10. Upload TXID & receipt screenshot.',
      qr_code: ''
    },
    {
      id: 'wallet-bep20',
      network: 'BEP-20',
      network_name: 'USDT (BNB Smart Chain BEP-20)',
      address: '0x32A4B892F74Ce91B991F268153A47C1a84f3299E',
      instructions: 'Send only BSC BEP-20 USDT. Lowest network gas fee.',
      qr_code: ''
    },
    {
      id: 'wallet-erc20',
      network: 'ERC-20',
      network_name: 'USDT (Ethereum ERC-20)',
      address: '0x71C5A8c9F4F96E69888941785A8297bcf5f74B81',
      instructions: 'Send only ERC-20 tokens to this address. Ensure network gas fee is included.',
      qr_code: ''
    }
  ];

  const insertWallet = db.prepare(`
    INSERT OR REPLACE INTO deposit_wallets (id, network, address, network_name, instructions, qr_code, is_active)
    VALUES (@id, @network, @address, @network_name, @instructions, @qr_code, 1)
  `);

  for (const w of defaultCryptoWallets) {
    insertWallet.run(w);
  }
}

// Call initialization
initDatabase();

module.exports = db;
