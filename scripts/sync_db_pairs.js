const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e){}

const uri = 'mongodb://muraliarimbra1962_db_user:RbYhKq30zvR9h5XC@ac-vhmrayk-shard-00-00.han22u7.mongodb.net:27017,ac-vhmrayk-shard-00-01.han22u7.mongodb.net:27017,ac-vhmrayk-shard-00-02.han22u7.mongodb.net:27017/apextrade?ssl=true&replicaSet=atlas-6g8to7-shard-0&authSource=admin&retryWrites=true&w=majority';

const TradingPairSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name: String,
  category: String,
  current_price: Number,
  change: Number,
  payout_rate: Number,
  is_active: { type: Boolean, default: true },
  image_url: String,
  updated_at: { type: Date, default: Date.now }
});

const TradingPair = mongoose.models.TradingPair || mongoose.model('TradingPair', TradingPairSchema);

async function sync() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB');

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

  for (const p of defaultPairs) {
    await TradingPair.updateOne(
      { symbol: p.symbol },
      { $set: { image_url: p.image_url, category: p.category, name: p.name, is_active: true } },
      { upsert: true }
    );
  }

  const all = await TradingPair.find();
  console.log('Successfully updated', all.length, 'pairs in MongoDB');
  await mongoose.disconnect();
}

sync().catch(console.error);
