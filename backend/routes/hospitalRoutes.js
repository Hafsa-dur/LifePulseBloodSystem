import express from 'express';
import { requireAuth, requireHospitalRole, requireAdmin, requirePermission } from '../middleware/auth.js';
import { createStaff, getStaff, updateStaff, deleteStaff, getHospitalSettings, updateHospitalSettings, getHospitalAnalytics, updateAccount, listHospitals, onboardHospitalAdmin, createStaffInvitation } from '../controllers/hospitalController.js';
import { sendDonorEmergencyEmail } from '../services/emailService.js';
import Donation from '../models/donationModel.js';
import PatientRequest from '../models/PatientRequest.js';

const router = express.Router();
router.get('/directory', listHospitals);
router.post('/onboard', onboardHospitalAdmin);
router.use(requireAuth, requireHospitalRole);
router.get('/staff', requireAdmin, getStaff);
router.post('/staff', requireAdmin, createStaff);
router.post('/staff/invite', requireAdmin, createStaffInvitation);
router.patch('/staff/:id', requireAdmin, updateStaff);
router.delete('/staff/:id', requireAdmin, deleteStaff);
router.get('/settings', requireAdmin, getHospitalSettings);
router.put('/settings', requireAdmin, updateHospitalSettings);
router.get('/analytics', getHospitalAnalytics);
router.patch('/account', updateAccount);
router.post('/send-donor-email', requirePermission('dispatch'), async (req, res) => {
  try {
    const { donorId, patientRequestId, customMessage, urgency = 'Urgent' } = req.body || {};
    if (!donorId || !patientRequestId) {
      return res.status(400).json({ success: false, message: 'A selected donor and patient request are required.' });
    }

    const donorFilter = { _id: donorId, email: { $exists: true, $nin: ['', null] } };
    if (req.user?.hospitalId) donorFilter.hospitalId = req.user.hospitalId;
    else if (req.user?.hospitalName) donorFilter.hospitalName = req.user.hospitalName;

    const donor = await Donation.findOne(donorFilter).lean();
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Selected donor email was not found for this hospital.' });
    }

    const requestFilter = { _id: patientRequestId, donorId };
    if (req.user?.hospitalId) requestFilter.hospitalId = req.user.hospitalId;
    else requestFilter.hospitalName = req.user?.hospitalName;
    const patientRequest = await PatientRequest.findOne(requestFilter).lean();
    if (!patientRequest) {
      return res.status(404).json({ success: false, message: 'The selected donor is not linked to a patient request for this hospital.' });
    }

    const result = await sendDonorEmergencyEmail({
      donorEmail: String(donor.email).trim().toLowerCase(),
      donorName: donor.donorName || 'Donor',
      bloodGroup: patientRequest.bloodGroup || donor.bloodGroup || 'A+',
      urgency,
      hospitalName: patientRequest.hospitalName,
      hospitalLocation: patientRequest.hospitalLocation,
      patientName: patientRequest.patientName,
      unitsRequired: patientRequest.unitsRequired || 1,
      message: customMessage || `Urgent requirement for ${patientRequest.bloodGroup} blood for patient ${patientRequest.patientName} at ${patientRequest.hospitalName}.`
    });

    if (!result.sent) {
      return res.status(500).json({ success: false, message: 'Email could not be delivered to the selected donor.' });
    }

    return res.status(200).json({ success: true, message: 'Email sent to the selected donor.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
