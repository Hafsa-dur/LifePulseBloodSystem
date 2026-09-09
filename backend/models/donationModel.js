import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  bloodGroup: { type: String, required: true },
  patientName: { type: String, default: '' },
  units: { type: Number, required: true, default: 1 },
  phone: { type: String, default: '03000000000' },
  hospitalName: { type: String, default: '' },
  notes: { type: String, default: '' },
  donationDate: { type: Date, default: Date.now },
  lastDonationDate: { type: Date },
  status: { type: String, default: 'Recorded' }
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);