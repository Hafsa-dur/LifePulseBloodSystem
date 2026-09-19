import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'donor', 'hospital_admin', 'hospital_staff'], default: 'donor' },
  staffRole: { type: String, enum: ['Blood Bank Staff', 'Emergency Staff', 'Hospital Staff', 'Hospital Admin', ''], default: '' },
  hospitalId: { type: String, default: '' },
  hospitalName: { type: String, default: '' },
  hospitalLocation: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  permissions: { type: [String], default: ['dashboard', 'requests', 'dispatch'] },
  phone: { type: String, default: '' },
  profile: { type: String, default: '' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;