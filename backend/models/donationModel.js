import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  bloodGroup: { type: String, required: true },
  patientName: { type: String, default: '' },
  units: { type: Number, required: true, default: 1 },
  totalUnits: { type: Number, default: 0 },
  availableUnits: { type: Number, default: 0 },
  dispatchedUnits: { type: Number, default: 0 },
  phone: { type: String, default: '03000000000' },
  address: { type: String, default: '' },
  location: { type: String, default: '' },
  city: { type: String, default: '' },
  hospitalId: { type: String, default: '' },
  hospitalName: { type: String, default: '' },
  notes: { type: String, default: '' },
  donationDate: { type: Date, default: Date.now },
  lastDonationDate: { type: Date },
  status: { type: String, default: 'Recorded' }
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);