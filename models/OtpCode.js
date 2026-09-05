import mongoose from 'mongoose';

const OtpCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true, trim: true },
  type: { type: String, enum: ['REGISTER', 'FORGOT_PASSWORD'], required: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

// Auto-expire documents after expiration time
OtpCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OtpCode || mongoose.model('OtpCode', OtpCodeSchema);
