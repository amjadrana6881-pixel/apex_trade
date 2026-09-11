import mongoose from 'mongoose';

const UserInvestmentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  package_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPackage', required: true },
  package_name: { type: String, required: true },
  amount: { type: Number, required: true },
  daily_roi: { type: Number, default: 0 },
  daily_profit: { type: Number, default: 0 },
  total_roi: { type: Number, required: true }, // e.g. 15 for 15%
  expected_profit: { type: Number, required: true }, // (amount * total_roi) / 100
  duration_days: { type: Number, required: true },
  days_passed: { type: Number, default: 0 },
  total_profit_earned: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now },
  matures_at: { type: Date, required: true },
  completed_at: { type: Date, default: null },
  last_payout_at: { type: Date, default: Date.now }
});

export default mongoose.models.UserInvestment || mongoose.model('UserInvestment', UserInvestmentSchema);

