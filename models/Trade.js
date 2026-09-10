import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pair: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  amount: { type: Number, required: true },
  entry_price: { type: Number, required: true },
  exit_price: { type: Number, default: 0 },
  duration: { type: Number, default: 60 },
  payout_rate: { type: Number, default: 88.0 },
  is_signal_trade: { type: Boolean, default: false },
  signal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Signal', default: null },
  status: { type: String, enum: ['PENDING', 'RESOLVED', 'STOPPED', 'CANCELLED'], default: 'PENDING' },
  result: { type: String, enum: ['PENDING', 'WIN', 'LOSS', 'STOPPED'], default: 'PENDING' },
  profit: { type: Number, default: 0 },
  early_stop_fee: { type: Number, default: 0 },
  refunded_amount: { type: Number, default: 0 },
  penalty_percentage: { type: Number, default: 0 },
  stopped_early: { type: Boolean, default: false },
  resolves_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema);
