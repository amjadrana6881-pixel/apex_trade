import mongoose from 'mongoose';

const InvestmentPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tag: { type: String, default: 'Custom', trim: true },
  min_amount: { type: Number, required: true },
  max_amount: { type: Number, required: true },
  daily_roi: { type: Number, required: true },
  duration_days: { type: Number, required: true },
  total_return_roi: { type: Number, required: true },
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.InvestmentPackage || mongoose.model('InvestmentPackage', InvestmentPackageSchema);
