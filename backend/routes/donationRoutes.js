import express from 'express';
import { 
  getAllDonations, 
  getDashboardDonations, 
  addDonation, 
  updateDonation,
  getDonorHistory, 
  dispatchBlood,
  findMatchingDonors,
  normalizeCoordinatePair,
  getPublicDonationStats
} from '../controllers/donationController.js';
import { requireAuth, requireHospitalRole, requirePermission } from '../middleware/auth.js';


const router = express.Router();

// Pure Donation & Stock Routes
router.get('/public-stats', getPublicDonationStats);
router.get('/', requireAuth, getAllDonations);                           // Hospital/donor-scoped inventory
router.get('/dashboard', requireAuth, requireHospitalRole, getDashboardDonations);             // Hospital-scoped dashboard stock
router.post('/', addDonation);                               // Add new donation with duplicate email check
router.patch('/:id', requireAuth, requireHospitalRole, requirePermission('inventory'), updateDonation);
router.get('/history/:donorName', getDonorHistory);          // Get specific donor history
router.get('/match', requireAuth, requireHospitalRole, async (req, res) => {
  try {
    const requestedBloodGroup = String(req.query.bloodGroup || '').trim().toUpperCase();
    const requestedUnits = Number(req.query.units);
    if (!['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(requestedBloodGroup)
      || !String(req.query.location || '').trim()
      || !Number.isInteger(requestedUnits) || requestedUnits <= 0) {
      return res.status(400).json({ success: false, message: 'Blood group, hospital location, and a positive whole number of units are required.' });
    }
    let coordinates;
    try {
      coordinates = normalizeCoordinatePair(req.query.latitude, req.query.longitude);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const matchingDiagnostics = [];
    const rankedDonors = await findMatchingDonors({
      ...req.query,
      bloodGroup: requestedBloodGroup,
      units: requestedUnits,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      hospitalId: req.user.hospitalId,
      hospitalName: req.user.hospitalName,
      diagnostics: matchingDiagnostics
    });
    const matchingIncomplete = matchingDiagnostics.some((item) =>
      item.reason === 'hospital-location-unresolved' || item.rejectionReason === 'donor-location-unresolved'
    );
    if (rankedDonors.length === 0 && matchingIncomplete) {
      return res.status(503).json({
        success: false,
        message: 'Donor matching is incomplete because location data could not be resolved.',
        matchingDiagnostics
      });
    }
    return res.status(200).json({
      success: true,
      matchingComplete: !matchingIncomplete,
      matchingDiagnostics,
      donor: rankedDonors[0]?.donor || null,
      donors: rankedDonors.map(({ donor, distance }) => ({
        ...donor.toObject(),
        distanceInKilometers: Number.isFinite(distance) ? Number(distance.toFixed(2)) : null
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
router.post('/dispatch', requireAuth, requireHospitalRole, requirePermission('dispatch'), dispatchBlood);                     // Dispatch blood units
export default router;