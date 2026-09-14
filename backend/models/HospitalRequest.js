import mongoose from 'mongoose';

const hospitalRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: String,
      default: ''
    },
    hospitalName: {
      type: String,
      required: true
    },
    hospitalLocation: {
      type: String,
      required: true,
      trim: true
    },
    bloodGroup: {
      type: String,
      required: true
    },
    unitsRequired: {
      type: Number,
      required: true
    },
    urgencyLevel: {
      type: String,
      default: 'Critical'
    },
    contactPerson: {
      type: String,
      default: 'Emergency Department'
    },
    phone: {
      type: String,
      required: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null
    },
    donorName: { type: String, default: '' },
    donorEmail: { type: String, lowercase: true, trim: true, default: '' },
    donorLocation: { type: String, default: '' },
    sourceType: { type: String, enum: ['donor', 'inventory'], default: 'inventory' },
    status: {
      type: String,
      default: 'Pending'
    }
  },
  { timestamps: true }
);

export default mongoose.model('HospitalRequest', hospitalRequestSchema);