import mongoose from 'mongoose';

const hospitalRequestSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: true
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
    status: {
      type: String,
      default: 'Pending'
    }
  },
  { timestamps: true }
);

export default mongoose.model('HospitalRequest', hospitalRequestSchema);