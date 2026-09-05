import mongoose from 'mongoose';

const SystemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  value: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);
