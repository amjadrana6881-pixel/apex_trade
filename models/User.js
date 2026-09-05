import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  wallet_balance: { type: Number, default: 0.00 },
  tradeable_amount: { type: Number, default: 0.00 },
  investment_balance: { type: Number, default: 0.00 },
  referral_code: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
  referred_by: { type: String, default: '', uppercase: true, trim: true },
  phone: { type: String, default: '', trim: true },
  kyc_status: { type: String, enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'], default: 'UNVERIFIED' },
  kyc_doc: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'BANNED'], default: 'ACTIVE' },
  trade_mode: { type: String, enum: ['AUTO', 'FORCE_WIN', 'FORCE_LOSS'], default: 'AUTO' },
  custom_win_rate: { type: Number, default: 0.50 },
  withdrawal_password: { type: String, default: '' },
  saved_usdt_address: { type: String, default: '', trim: true },
  saved_usdt_network: { type: String, enum: ['TRC-20', 'BEP-20', 'ERC-20'], default: 'TRC-20' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

UserSchema.pre('save', function() {
  this.updated_at = new Date();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
