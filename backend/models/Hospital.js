import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  contactPhone: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Hospital', hospitalSchema);
