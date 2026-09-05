import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  network: { type: String, default: 'TRC-20' },
  txid: { type: String, default: '', trim: true },
  receipt_url: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  admin_notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);
