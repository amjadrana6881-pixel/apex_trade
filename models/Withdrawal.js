import mongoose from 'mongoose';

const WithdrawalSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  fee: { type: Number, required: true },
  net_amount: { type: Number, required: true },
  network: { type: String, enum: ['TRC-20', 'BEP-20', 'ERC-20'], default: 'TRC-20' },
  destination_address: { type: String, required: true, trim: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  admin_notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema);
