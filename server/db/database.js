const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

let db = null;
let usePureJsFallback = false;

// 1. Try loading native better-sqlite3
try {
  const Database = require('better-sqlite3');
  let dbPath = path.join(__dirname, 'apextrade.db');

  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    const tmpPath = path.join('/tmp', 'apextrade.db');
    if (!fs.existsSync(tmpPath) && fs.existsSync(dbPath)) {
      try { fs.copyFileSync(dbPath, tmpPath); } catch (e) {}
    }
    dbPath = tmpPath;
  }

  db = new Database(dbPath);
  try { db.pragma('journal_mode = WAL'); } catch (e) {}
  console.log('✅ Native SQLite engine initialized successfully.');
} catch (nativeErr) {
  console.warn('⚠️ Native SQLite driver not supported in this serverless environment. Initializing Pure-JS Resilient Database Engine...');
  usePureJsFallback = true;
}

// 2. Pure-JS Resilient Database Engine (Zero Binary Dependencies - 100% Netlify Compatible)
if (usePureJsFallback || !db) {
  const storePath = path.join(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME ? '/tmp' : __dirname, 'apextrade_store.json');

  let store = {
    users: [],
    trading_pairs: [],
    signals: [],
    trades: [],
    deposits: [],
    withdrawals: [],
    deposit_wallets: [],
    investment_packages: [],
    user_investments: [],
    wheel_prizes: [],
    user_spins: [],
    announcements: [],
    system_settings: {},
    support_messages: [],
    otp_codes: []
  };

  // Load existing data if file exists
  if (fs.existsSync(storePath)) {
    try {
      store = { ...store, ...JSON.parse(fs.readFileSync(storePath, 'utf8')) };
    } catch (e) {}
  }

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
          // Binding object if single object passed
          const paramObj = (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) ? params[0] : null;

          // 1. Users queries
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
          if (/SELECT \* FROM otp_codes WHERE email = \? AND code = \?/i.test(normalizedSql)) {
            const [email, code] = params;
            return store.otp_codes.find(o => (o.email || '').toLowerCase() === (email || '').toLowerCase().trim() && String(o.code).trim() === String(code).trim()) || null;
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
          const paramObj = (params.length === 1 && typeof params[0] === 'object' && params[0] !== null) ? params[0] : null;

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
            const [id, email, code, type] = params;
            store.otp_codes.push({
              id,
              email: (email || '').toLowerCase().trim(),
              code: String(code).trim(),
              type,
              created_at: new Date().toISOString()
            });
            saveStore();
            return { changes: 1 };
          }

          // 3. Delete OTP
          if (/DELETE FROM otp_codes WHERE email = \? AND type = \?/i.test(normalizedSql)) {
            const [email, type] = params;
            store.otp_codes = store.otp_codes.filter(o => !((o.email || '').toLowerCase() === (email || '').toLowerCase().trim() && o.type === type));
            saveStore();
            return { changes: 1 };
          }

          // 4. Update User Password
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

          // 10. Insert Trading Pair (paramObj support)
          if (/INSERT OR IGNORE INTO trading_pairs/i.test(normalizedSql) && paramObj) {
            if (!store.trading_pairs.some(p => p.symbol === paramObj.symbol)) {
              store.trading_pairs.push({
                symbol: paramObj.symbol,
                name: paramObj.name,
                category: paramObj.category,
                current_price: paramObj.price,
                change: paramObj.change,
                payout_rate: paramObj.payout,
                is_active: 1,
                image_url: paramObj.img || ''
              });
              saveStore();
            }
            return { changes: 1 };
          }

          // 11. Insert Setting
          if (/INSERT OR IGNORE INTO system_settings/i.test(normalizedSql)) {
            const [key, value] = params;
            if (store.system_settings[key] === undefined) {
              store.system_settings[key] = value;
              saveStore();
            }
            return { changes: 1 };
          }

          saveStore();
          return { changes: 1 };
        }
      };
    }
  };
}

// Initialize and seed default system data
function initDatabase() {
  // 1. Users table
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
    `);
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
  }

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
    180,
    5.00,
    `Disclaimer: Forex and CFD trading involve high risk. Execute only during official signal window. Outside trades are subject to 100% loss.`
  );

  // 4. Seed Deposit Wallets
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

  // 5. Seed System Settings
  const defaultSettings = [
    { key: 'min_deposit', value: '10' },
    { key: 'min_withdrawal', value: '10' },
    { key: 'withdrawal_fee_percent', value: '10' },
    { key: 'enforce_signal_only', value: 'true' },
    { key: 'referral_level1', value: '10' },
    { key: 'referral_level2', value: '5' },
    { key: 'referral_level3', value: '2' },
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)');
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }
}

initDatabase();

module.exports = db;
