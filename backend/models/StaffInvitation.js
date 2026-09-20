import mongoose from 'mongoose';

const staffInvitationSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true, index: true },
  hospitalId: { type: String, required: true, index: true },
  hospitalName: { type: String, required: true },
  hospitalLocation: { type: String, default: '' },
  staffRole: { type: String, enum: ['Hospital Staff'], default: 'Hospital Staff' },
  inviteeName: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, lowercase: true, trim: true, default: '' },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'used', 'expired'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('StaffInvitation', staffInvitationSchema);
