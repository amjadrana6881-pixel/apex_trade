import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: [
      'DEPOSIT', 
      'WITHDRAWAL', 
      'TRADE_ORDER', 
      'TRADE_WIN', 
      'TRADE_LOSS', 
      'INVESTMENT', 
      'INVESTMENT_PAYOUT', 
      'REFERRAL_BONUS', 
      'ADMIN_ADJUSTMENT'
    ], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  reference_id: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'REJECTED'], default: 'COMPLETED' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
