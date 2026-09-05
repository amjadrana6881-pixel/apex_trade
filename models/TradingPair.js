import mongoose from 'mongoose';

const TradingPairSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Crypto', 'Forex', 'Commodities', 'Stocks'], default: 'Crypto' },
  current_price: { type: Number, required: true },
  change: { type: Number, default: 0 },
  payout_rate: { type: Number, default: 88.0 },
  is_active: { type: Boolean, default: true },
  image_url: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now }
});

TradingPairSchema.pre('save', function() {
  this.updated_at = new Date();
});

export default mongoose.models.TradingPair || mongoose.model('TradingPair', TradingPairSchema);
