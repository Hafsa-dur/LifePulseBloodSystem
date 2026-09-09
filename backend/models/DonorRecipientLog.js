import mongoose from 'mongoose';

const donorRecipientLogSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', default: null },
  donorName: { type: String, required: true },
  donorEmail: { type: String, lowercase: true, trim: true },
  lastDonationDate: { type: String },
    bloodType: { type: String, required: true, uppercase: true, trim: true },
    pints: { type: Number, required: true, min: 0 },
    sourceDonationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation' },
    patientRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientRequest' },
  patientName: { type: String, default: '' },       // Patient ka real naam
  hospitalName: { type: String, default: '' },      // Hospital ka real naam
  recipientName: { type: String, default: '' },
  sourceType: { type: String, enum: ['donor', 'inventory'], required: true },
  matchStatus: { type: String, enum: ['Matched', 'Fulfilled', 'Cancelled'], default: 'Matched' },
  dispatchStatus: { type: String, enum: ['Pending', 'Dispatched'], default: 'Pending' },
  matchedAt: { type: Date, default: Date.now },
  dispatchedAt: { type: Date },
  status: { type: String, default: 'Matched' }
}, { timestamps: true });

export default mongoose.model('DonorRecipientLog', donorRecipientLogSchema);