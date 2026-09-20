import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'hospital_admin', 'hospital_staff', 'admin', 'staff'], default: 'donor' },
  staffRole: { type: String, enum: ['Hospital Staff', ''], default: '' },
  hospitalId: { type: String, default: '' },
  hospitalName: { type: String, default: '' },
  hospitalLocation: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  dutyStatus: { type: String, enum: ['on_duty', 'off_duty'], default: 'off_duty' },
  dutyStatusUpdatedAt: { type: Date, default: null },
  permissions: { type: [String], default: ['dashboard', 'requests', 'dispatch'] },
  phone: { type: String, default: '' },
  profile: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;