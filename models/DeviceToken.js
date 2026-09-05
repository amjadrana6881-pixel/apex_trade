import mongoose from 'mongoose';

const DeviceTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
  token: { type: String, required: true, unique: true },
  app_type: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  device_os: { type: String, default: 'android' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

DeviceTokenSchema.pre('save', function() {
  this.updated_at = new Date();
});

export default mongoose.models.DeviceToken || mongoose.model('DeviceToken', DeviceTokenSchema);
