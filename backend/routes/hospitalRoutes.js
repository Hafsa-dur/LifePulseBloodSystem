import express from 'express';
import { requireAuth, requireHospitalRole, requireAdmin, requirePermission } from '../middleware/auth.js';
import { createStaff, getStaff, updateStaff, deleteStaff, getHospitalSettings, updateHospitalSettings, getHospitalAnalytics, updateAccount, listHospitals, onboardHospitalAdmin, createStaffInvitation } from '../controllers/hospitalController.js';
import { sendDonorEmergencyEmail } from '../services/emailService.js';
import Donation from '../models/donationModel.js';

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
    const { donorId, hospitalName, hospitalLocation, unitsRequired, customMessage, urgency = 'Urgent' } = req.body || {};
    if (!donorId) {
      return res.status(400).json({ success: false, message: 'Selected donor record is required.' });
    }

    const donorFilter = { _id: donorId, email: { $exists: true, $nin: ['', null] } };
    if (req.user?.hospitalId) donorFilter.hospitalId = req.user.hospitalId;
    else if (req.user?.hospitalName) donorFilter.hospitalName = req.user.hospitalName;

    const donor = await Donation.findOne(donorFilter).lean();
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Selected donor email was not found for this hospital.' });
    }

    const result = await sendDonorEmergencyEmail({
      donorEmail: donor.email,
      donorName: donor.donorName || 'Donor',
      bloodGroup: donor.bloodGroup || 'A+',
      urgency,
      hospitalName: hospitalName || req.user?.hospitalName || 'LifePulse Hospital',
      hospitalLocation: hospitalLocation || req.user?.hospitalLocation || 'Hospital location not provided',
      unitsRequired: unitsRequired || 1,
      message: customMessage || 'A blood requirement has been raised for an urgent patient need.'
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
