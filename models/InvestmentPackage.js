import mongoose from 'mongoose';

const InvestmentPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tag: { type: String, default: 'Yield Staking', trim: true },
  min_amount: { type: Number, required: true },
  max_amount: { type: Number, required: true },
  duration_days: { type: Number, required: true }, // e.g. 7, 14, 21, 30
  total_return_roi: { type: Number, required: true }, // e.g. 15, 22, 28, 35 (%)
  daily_roi: { type: Number, default: 0 },
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.InvestmentPackage || mongoose.model('InvestmentPackage', InvestmentPackageSchema);

