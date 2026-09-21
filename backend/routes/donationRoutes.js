import express from 'express';
import { 
  getAllDonations, 
  getDashboardDonations, 
  addDonation, 
  updateDonation,
  getDonorHistory, 
  dispatchBlood,
  findMatchingDonors,
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
    const rankedDonors = await findMatchingDonors({
      ...req.query,
      hospitalId: req.user.hospitalId,
      hospitalName: req.user.hospitalName
    });
    return res.status(200).json({
      success: true,
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