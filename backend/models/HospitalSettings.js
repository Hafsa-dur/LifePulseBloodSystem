import mongoose from 'mongoose';

const hospitalSettingsSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  hospitalName: { type: String, default: '' },
  hospitalLocation: { type: String, default: '' },
  emergencyAlerts: { type: Boolean, default: true },
  autoDispatch: { type: Boolean, default: true },
  donorNotifications: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default mongoose.model('HospitalSettings', hospitalSettingsSchema);
