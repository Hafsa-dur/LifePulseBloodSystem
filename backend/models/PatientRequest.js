import mongoose from 'mongoose';

const patientRequestSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  hospitalId: { type: String, default: '' },
  hospitalName: { type: String, required: true },
  hospitalLocation: { type: String, required: true, trim: true },
  contactPhone: { type: String, required: true },
  donorName: { type: String, trim: true },
  donorEmail: { type: String, lowercase: true, trim: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', default: null },
  sourceType: { type: String, enum: ['donor', 'inventory'] },
  matchStatus: { type: String, enum: ['Matched', 'Fulfilled', 'Cancelled'] },
  allocationLogIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DonorRecipientLog' }],
  isAllocated: { type: Boolean, default: false },
  urgencyLevel: { type: String, default: 'Normal' },
  department: { type: String, default: '' },
  city: { type: String, default: '' },
  areaOrLocation: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Dispatched', 'Delivered'], 
    default: 'Pending' 
  },
  currentLocationNote: { type: String, default: 'Blood bag packed and ready for dispatch.' },
  createdBy: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('PatientRequest', patientRequestSchema);