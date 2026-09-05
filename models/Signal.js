import mongoose from 'mongoose';

const SignalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  instrument: { type: String, required: true, uppercase: true, trim: true },
  order_type: { type: String, enum: ['BUY', 'SELL'], required: true },
  min_capital: { type: Number, default: 700.00 },
  execution_time_pst: { type: String, default: '07:00 PM (PST)' },
  duration_seconds: { type: Number, default: 900 },
  profit_percentage: { type: Number, default: 5.00 },
  outcome: { type: String, enum: ['WIN', 'LOSS'], default: 'WIN' },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'ARCHIVED'], default: 'ACTIVE' },
  disclaimer: { type: String, default: 'Disclaimer: Forex and CFD trading involve high risk. Execute only during official signal window.' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Signal || mongoose.model('Signal', SignalSchema);
