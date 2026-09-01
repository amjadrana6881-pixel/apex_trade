const path = require('path');
const fs = require('fs');
const os = require('os');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let db = null;
let usePureJsFallback = false;

const isServerless = Boolean(
  process.env.NETLIFY || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT ||
  process.env.AWS_EXECUTION_ENV ||
  process.env.NETLIFY_DEV ||
  (process.env.NODE_ENV === 'production' && !process.env.RUN_LOCAL_SQLITE)
);

// 1. Try loading native better-sqlite3 ONLY in local/non-serverless environment
if (!isServerless) {
  try {
    const moduleName = 'better-sqlite3';
    const Database = module.require(moduleName);
    const dbPath = path.join(__dirname, 'apextrade.db');
    db = new Database(dbPath);
    try { db.pragma('journal_mode = WAL'); } catch (e) {}
    console.log('✅ Native SQLite engine initialized successfully.');
  } catch (nativeErr) {
    console.warn('⚠️ Native SQLite driver not available. Falling back to Pure-JS engine...');
    usePureJsFallback = true;
  }
} else {
  console.log('⚡ Serverless runtime detected (Netlify/AWS Lambda). Using Pure-JS Resilient Engine.');
  usePureJsFallback = true;
}

// 2. Pure-JS Resilient In-Memory & Persisted Database Engine (100% Netlify Serverless Compatible)
if (usePureJsFallback || !db) {
  const storePath = path.join(os.tmpdir(), 'apextrade_store.json');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@apextrade.net').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync(adminPassword, salt);

  const defaultPairs = [
    { symbol: 'XAUUSD', name: 'Gold/USD', category: 'Commodities', current_price: 2894.50, change: 1.24, payout_rate: 88, is_active: 1, image_url: '/images/Gold.jpg' },
    { symbol: 'XAGUSD', name: 'Silver/USD', category: 'Commodities', current_price: 32.40, change: -0.45, payout_rate: 85, is_active: 1, image_url: '/images/Silver.jpg' },
    { symbol: 'USOIL', name: 'Crude Oil', category: 'Commodities', current_price: 74.80, change: 2.15, payout_rate: 85, is_active: 1, image_url: '/images/Oil.jpg' },
    { symbol: 'GAS', name: 'Natural Gas', category: 'Commodities', current_price: 2.85, change: -1.10, payout_rate: 82, is_active: 1, image_url: '/images/gas.jpg' },
    { symbol: 'EURUSD', name: 'Euro/USD', category: 'Forex', current_price: 1.0842, change: 0.35, payout_rate: 87, is_active: 1, image_url: '/images/eurusd.jpg' },
    { symbol: 'USDJPY', name: 'USD/JPY', category: 'Forex', current_price: 154.60, change: -0.22, payout_rate: 86, is_active: 1, image_url: '/images/usdjpy.jpg' },
    { symbol: 'GBPJPY', name: 'GBP/JPY', category: 'Forex', current_price: 196.20, change: 0.58, payout_rate: 85, is_active: 1, image_url: '/images/gbpjpy.jpg' },
    { symbol: 'AUDNZD', name: 'AUD/NZD', category: 'Forex', current_price: 1.1025, change: -0.15, payout_rate: 84, is_active: 1, image_url: '/images/AUDNZD.jpg' },
    { symbol: 'BTCUSDT', name: 'Bitcoin/USDT', category: 'Crypto', current_price: 91450.00, change: 3.42, payout_rate: 90, is_active: 1, image_url: '/images/Bitcoin.jpg' },
    { symbol: 'ETHUSDT', name: 'Ethereum/USDT', category: 'Crypto', current_price: 3420.00, change: 2.85, payout_rate: 88, is_active: 1, image_url: '/images/ethereum.jpg' },
    { symbol: 'SOLUSDT', name: 'Solana/USDT', category: 'Crypto', current_price: 198.50, change: 5.60, payout_rate: 86, is_active: 1, image_url: '/images/SOLANA.jpg' },
    { symbol: 'XRPUSDT', name: 'Ripple/USDT', category: 'Crypto', current_price: 2.45, change: 4.10, payout_rate: 85, is_active: 1, image_url: '/images/xrp.jpg' },
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'Stocks', current_price: 232.80, change: 1.15, payout_rate: 85, is_active: 1, image_url: '/images/apple.jpg' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Stocks', current_price: 288.40, change: -1.80, payout_rate: 87, is_active: 1, image_url: '/images/TESLA.jpg' },
    { symbol: 'GOOG', name: 'Alphabet Google', category: 'Stocks', current_price: 184.20, change: 0.92, payout_rate: 85, is_active: 1, image_url: '/images/google.jpg' },
    { symbol: 'META', name: 'Meta Platforms', category: 'Stocks', current_price: 620.50, change: 2.40, payout_rate: 86, is_active: 1, image_url: '/images/facebook.jpg' }
  ];

  const defaultCryptoWallets = [
    {
      id: 'wallet-trc20',
      network: 'TRC-20',
      network_name: 'USDT (TRC-20 Network)',
      address: 'TYDzsYbm2n9vVqF8cWwQeP7Z8xK9LmN4aB',
      instructions: 'Send only USDT TRC-20 to this address. Minimum deposit $10. Upload TXID & receipt screenshot.',
      qr_code: '',
      is_active: 1
    },
    {
      id: 'wallet-bep20',
      network: 'BEP-20',
      network_name: 'USDT (BNB Smart Chain BEP-20)',
      address: '0x32A4B892F74Ce91B991F268153A47C1a84f3299E',
      instructions: 'Send only BSC BEP-20 USDT. Lowest network gas fee.',
      qr_code: '',
      is_active: 1
    },
    {
      id: 'wallet-erc20',
      network: 'ERC-20',
      network_name: 'USDT (Ethereum ERC-20)',
      address: '0x71C5A8c9F4F96E69888941785A8297bcf5f74B81',
      instructions: 'Send only ERC-20 tokens to this address. Ensure network gas fee is included.',
      qr_code: '',
      is_active: 1
    }
  ];

  let store = {
    users: [
      {
        id: 'admin-root-001',
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
        kyc_doc: '',
        status: 'ACTIVE',
        trade_mode: 'AUTO',
        custom_win_rate: 0.50,
        withdrawal_password: '',
        saved_usdt_address: '',
        saved_usdt_network: 'TRC-20',
        created_at: new Date().toISOString()
      }
    ],
    trading_pairs: defaultPairs,
    signals: [
      {
        id: 'sig-today-001',
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
      }
    ],
    trades: [],
    deposits: [],
    withdrawals: [],
    deposit_wallets: defaultCryptoWallets,
    investment_packages: [],
    user_investments: [],
    wheel_prizes: [],
    user_spins: [],
    announcements: [],
    system_settings: {
      min_deposit: '10',
      min_withdrawal: '10',
      withdrawal_fee_percent: '10',
      enforce_signal_only: 'true',
      referral_level1: '10',
      referral_level2: '5',
      referral_level3: '2'
    },
    support_messages: [],
    otp_codes: []
  };

  // Load existing data if file exists in /tmp
  try {
    if (fs.existsSync(storePath)) {
      const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        store = { ...store, ...parsed };
      }
    }
  } catch (e) {}

  const saveStore = () => {
    try {
      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {}
  };

  db = {
    pragma: () => {},
    exec: (sql) => {},
    prepare: (sql) => {
      const normalizedSql = sql.trim().replace(/\s+/g, ' ');

      return {
        get: (...params) => {
          // 1. Users queries
          if (/SELECT id FROM users WHERE role = \? OR email = \?/i.test(normalizedSql)) {
            const [role, email] = params;
            return store.users.find(u => u.role === role || (u.email || '').toLowerCase() === (email || '').toLowerCase().trim()) || null;
          }
          if (/SELECT \* FROM users WHERE email = \?/i.test(normalizedSql) || /SELECT id, name FROM users WHERE email = \?/i.test(normalizedSql) || /SELECT id FROM users WHERE email = \?/i.test(normalizedSql)) {
            const email = String(params[0] || '').toLowerCase().trim();
            return store.users.find(u => (u.email || '').toLowerCase() === email) || null;
          }
          if (/SELECT \* FROM users WHERE id = \?/i.test(normalizedSql) || /SELECT .* FROM users WHERE id = \?/i.test(normalizedSql)) {
            const id = params[0];
            return store.users.find(u => u.id === id) || null;
          }
          if (/SELECT referral_code FROM users WHERE referral_code = \?/i.test(normalizedSql)) {
            const code = params[0];
            return store.users.find(u => u.referral_code === code) || null;
          }

          // 2. OTP Codes queries
          if (/SELECT \* FROM otp_codes/i.test(normalizedSql)) {
            const email = (params[0] || '').toLowerCase().trim();
            const code = String(params[1] || '').trim();
            const isForgotPassword = /FORGOT_PASSWORD/i.test(normalizedSql);
            const requiredType = isForgotPassword ? 'FORGOT_PASSWORD' : 'REGISTER';
            const now = new Date();
            
            return (store.otp_codes || []).find(o => {
              const matchesEmail = (o.email || '').toLowerCase() === email;
              const matchesCode = String(o.code).trim() === code;
              const matchesType = (o.type || 'REGISTER') === requiredType;
              const notExpired = o.expires_at ? new Date(o.expires_at) >= now : true;
              return matchesEmail && matchesCode && matchesType && notExpired;
            }) || null;
          }

          // 3. Signals queries
          if (/SELECT \* FROM signals WHERE status = 'ACTIVE'/i.test(normalizedSql)) {
            return store.signals.find(s => s.status === 'ACTIVE') || store.signals[0] || null;
          }
          if (/SELECT \* FROM signals WHERE id = \?/i.test(normalizedSql)) {
            return store.signals.find(s => s.id === params[0]) || null;
          }

          // 4. System Settings queries
          if (/SELECT value FROM system_settings WHERE key = \?/i.test(normalizedSql)) {
            const key = params[0];
            const val = store.system_settings[key];
            return val !== undefined ? { value: val } : null;
          }

          // 5. Support Messages
          if (/SELECT \* FROM support_messages WHERE id = \?/i.test(normalizedSql)) {
            return store.support_messages.find(m => m.id === params[0]) || null;
          }

          // 6. Deposits / Wallets
          if (/SELECT id FROM deposit_wallets/i.test(normalizedSql)) {
            return store.deposit_wallets[0] || null;
          }
          if (/SELECT \* FROM trading_pairs WHERE symbol = \?/i.test(normalizedSql)) {
            const symbol = String(params[0] || '').toUpperCase();
            return store.trading_pairs.find(p => p.symbol === symbol) || null;
          }

          return null;
        },

        all: (...params) => {
          // 1. Trading Pairs
          if (/SELECT \* FROM trading_pairs/i.test(normalizedSql)) {
            return store.trading_pairs.filter(p => p.is_active !== 0);
          }

          // 2. Signals
          if (/SELECT \* FROM signals/i.test(normalizedSql)) {
            return [...store.signals].reverse();
          }

          // 3. Deposit Wallets
          if (/SELECT \* FROM deposit_wallets/i.test(normalizedSql)) {
            return store.deposit_wallets.filter(w => w.is_active !== 0);
          }

          // 4. Support Messages for user
          if (/SELECT \* FROM support_messages WHERE user_id = \?/i.test(normalizedSql)) {
            const userId = params[0];
            return store.support_messages.filter(m => m.user_id === userId);
          }

          // 5. Admin Support Conversations
          if (/SELECT .* FROM users u WHERE EXISTS \(SELECT 1 FROM support_messages/i.test(normalizedSql)) {
            const userIdsWithMsgs = [...new Set(store.support_messages.map(m => m.user_id))];
            return userIdsWithMsgs.map(uid => {
              const u = store.users.find(x => x.id === uid) || { name: 'Trader', email: 'user@trade.com' };
              const userMsgs = store.support_messages.filter(m => m.user_id === uid);
              const lastMsg = userMsgs[userMsgs.length - 1];
              const unread = userMsgs.filter(m => m.sender_role === 'user' && m.is_seen === 0).length;
              return {
                user_id: uid,
                name: u.name,
                email: u.email,
                wallet_balance: u.wallet_balance || 0,
                last_message: lastMsg?.message || '',
                last_image: lastMsg?.image_url || '',
                last_activity: lastMsg?.created_at || new Date().toISOString(),
                unread_count: unread
              };
            });
          }

          // 6. Users for Admin
          if (/SELECT \* FROM users ORDER BY/i.test(normalizedSql) || /SELECT .* FROM users/i.test(normalizedSql)) {
            return [...store.users].reverse();
          }

          // 7. Trades
          if (/SELECT \* FROM trades WHERE user_id = \?/i.test(normalizedSql)) {
            return store.trades.filter(t => t.user_id === params[0]).reverse();
          }
          if (/SELECT \* FROM trades/i.test(normalizedSql)) {
            return [...store.trades].reverse();
          }

          // 8. Deposits
          if (/SELECT \* FROM deposits WHERE user_id = \?/i.test(normalizedSql)) {
            return store.deposits.filter(d => d.user_id === params[0]).reverse();
          }
          if (/SELECT \* FROM deposits/i.test(normalizedSql)) {
            return [...store.deposits].reverse();
          }

          // 9. Withdrawals
          if (/SELECT \* FROM withdrawals WHERE user_id = \?/i.test(normalizedSql)) {
            return store.withdrawals.filter(w => w.user_id === params[0]).reverse();
          }
          if (/SELECT \* FROM withdrawals/i.test(normalizedSql)) {
            return [...store.withdrawals].reverse();
          }

          return [];
        },

        run: (...params) => {
          // 1. Insert User
          if (/INSERT INTO users/i.test(normalizedSql)) {
            const [id, name, email, password, role, wallet_balance, tradeable_amount, referral_code, referred_by] = params;
            store.users.push({
              id,
              name,
              email: (email || '').toLowerCase().trim(),
              password,
              role: role || 'user',
              wallet_balance: Number(wallet_balance || 0),
              tradeable_amount: Number(tradeable_amount || 0),
              investment_balance: 0,
              referral_code,
              referred_by: referred_by || '',
              phone: '',
              kyc_status: 'UNVERIFIED',
              kyc_doc: '',
              status: 'ACTIVE',
              trade_mode: 'AUTO',
              custom_win_rate: 0.50,
              withdrawal_password: '',
              saved_usdt_address: '',
              saved_usdt_network: 'TRC-20',
              created_at: new Date().toISOString()
            });
            saveStore();
            return { changes: 1 };
          }

          // 2. Insert OTP
          if (/INSERT INTO otp_codes/i.test(normalizedSql)) {
            const [id, email, code] = params;
            let otpType = 'REGISTER';
            if (/FORGOT_PASSWORD/i.test(normalizedSql) || params[3] === 'FORGOT_PASSWORD') {
              otpType = 'FORGOT_PASSWORD';
            } else if (params[3]) {
              otpType = params[3];
            }
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            if (!store.otp_codes) store.otp_codes = [];
            store.otp_codes.push({
              id,
              email: (email || '').toLowerCase().trim(),
              code: String(code).trim(),
              type: otpType,
              expires_at: expiresAt,
              created_at: new Date().toISOString()
            });
            saveStore();
            return { changes: 1 };
          }

          // 3. Delete OTP
          if (/DELETE FROM otp_codes/i.test(normalizedSql)) {
            const email = (params[0] || '').toLowerCase().trim();
            const type = params[1] || (/FORGOT_PASSWORD/i.test(normalizedSql) ? 'FORGOT_PASSWORD' : 'REGISTER');
            if (store.otp_codes) {
              store.otp_codes = store.otp_codes.filter(o => !((o.email || '').toLowerCase() === email && (o.type || 'REGISTER') === type));
            }
            saveStore();
            return { changes: 1 };
          }

          // 4. Update User Password or Admin Credentials
          if (/UPDATE users SET email = \?, password = \? WHERE id = \?/i.test(normalizedSql)) {
            const [newEmail, newPassword, id] = params;
            const u = store.users.find(x => x.id === id || x.role === 'admin');
            if (u) {
              u.email = (newEmail || '').toLowerCase().trim();
              u.password = newPassword;
            }
            saveStore();
            return { changes: 1 };
          }
          if (/UPDATE users SET password = \? WHERE email = \?/i.test(normalizedSql)) {
            const [password, email] = params;
            const u = store.users.find(x => (x.email || '').toLowerCase() === (email || '').toLowerCase().trim());
            if (u) u.password = password;
            saveStore();
            return { changes: 1 };
          }

          // 5. Update User Balances / Settings
          if (/UPDATE users SET/i.test(normalizedSql)) {
            const id = params[params.length - 1];
            const u = store.users.find(x => x.id === id);
            if (u) {
              if (params.length === 3 && typeof params[0] === 'number') {
                u.wallet_balance = params[0];
                u.tradeable_amount = params[1];
              }
            }
            saveStore();
            return { changes: 1 };
          }

          // 6. Insert Support Message
          if (/INSERT INTO support_messages/i.test(normalizedSql)) {
            const [id, user_id, sender_name, message, image_url] = params;
            store.support_messages.push({
              id,
              user_id,
              sender_role: normalizedSql.includes("'admin'") ? 'admin' : 'user',
              sender_name,
              message,
              image_url: image_url || '',
              is_seen: 0,
              is_edited: 0,
              deleted_for_everyone: 0,
              deleted_by: '[]',
              created_at: new Date().toISOString()
            });
            saveStore();
            return { changes: 1 };
          }

          // 7. Update Support Message Seen
          if (/UPDATE support_messages SET is_seen = 1/i.test(normalizedSql)) {
            const userId = params[0];
            store.support_messages.forEach(m => {
              if (m.user_id === userId) m.is_seen = 1;
            });
            saveStore();
            return { changes: 1 };
          }

          // 8. Insert Trade
          if (/INSERT INTO trades/i.test(normalizedSql)) {
            const [id, user_id, pair, type, amount, payout, is_signal_trade] = params;
            store.trades.push({
              id,
              user_id,
              pair,
              type,
              amount: Number(amount),
              payout: Number(payout),
              is_signal_trade: is_signal_trade || 0,
              result: 'PENDING',
              profit: 0,
              created_at: new Date().toISOString()
            });
            saveStore();
            return { changes: 1 };
          }

          // 9. Insert Deposit / Withdrawal
          if (/INSERT INTO deposits/i.test(normalizedSql)) {
            const [id, user_id, amount, network, txid, receipt_url] = params;
            store.deposits.push({ id, user_id, amount: Number(amount), network, txid, receipt_url, status: 'PENDING', created_at: new Date().toISOString() });
            saveStore();
            return { changes: 1 };
          }

          if (/INSERT INTO withdrawals/i.test(normalizedSql)) {
            const [id, user_id, amount, fee, net_amount, network, destination_address] = params;
            store.withdrawals.push({ id, user_id, amount: Number(amount), fee: Number(fee), net_amount: Number(net_amount), network, destination_address, status: 'PENDING', created_at: new Date().toISOString() });
            saveStore();
            return { changes: 1 };
          }

          saveStore();
          return { changes: 1 };
        }
      };
    }
  };
}

// 3. Initialize and seed default database schema for native SQLite (local mode)
function initDatabase() {
  if (usePureJsFallback || !db || isServerless) {
    return;
  }

  try {
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

      CREATE TABLE IF NOT EXISTS otp_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        type TEXT DEFAULT 'REGISTER',
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    seedDefaultData();
  } catch (e) {}
}

function seedDefaultData() {
  if (!db || isServerless) return;

  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@apextrade.net').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);

    const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ? OR email = ?').get('admin', adminEmail);
    if (!existingAdmin) {
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, wallet_balance, tradeable_amount, referral_code)
        VALUES (?, ?, ?, ?, 'admin', 50000.00, 50000.00, ?)
      `).run(
        'admin-root-001',
        'ApexTrade Master Admin',
        adminEmail,
        hash,
        'APEXADMIN'
      );
    } else {
      db.prepare('UPDATE users SET email = ?, password = ? WHERE id = ?').run(adminEmail, hash, existingAdmin.id);
    }
  } catch (e) {}
}

initDatabase();

module.exports = db;
