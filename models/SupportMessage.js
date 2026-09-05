import mongoose from 'mongoose';

const SupportMessageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender_role: { type: String, enum: ['user', 'admin'], required: true },
  sender_name: { type: String, required: true },
  message: { type: String, default: '', trim: true },
  image_url: { type: String, default: '' },
  is_seen: { type: Boolean, default: false },
  is_edited: { type: Boolean, default: false },
  deleted_for_everyone: { type: Boolean, default: false },
  deleted_by: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

SupportMessageSchema.pre('save', function() {
  this.updated_at = new Date();
});

export default mongoose.models.SupportMessage || mongoose.model('SupportMessage', SupportMessageSchema);
