import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
