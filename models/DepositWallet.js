import mongoose from 'mongoose';

const DepositWalletSchema = new mongoose.Schema({
  network: { type: String, required: true, trim: true },
  network_name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  account_title: { type: String, default: '' },
  account_number: { type: String, default: '' },
  instructions: { type: String, default: '' },
  qr_code: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.DepositWallet || mongoose.model('DepositWallet', DepositWalletSchema);
