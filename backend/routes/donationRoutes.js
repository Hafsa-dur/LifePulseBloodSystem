import express from 'express';
import { 
  getAllDonations, 
  getDashboardDonations, 
  addDonation, 
  getDonorHistory, 
  dispatchBlood,
  findMatchingDonors
} from '../controllers/donationController.js';


const router = express.Router();

// Pure Donation & Stock Routes
router.get('/', getAllDonations);                           // Stock Inventory (All entries + dispatches)
router.get('/dashboard', getDashboardDonations);             // Dashboard / Registered Donors (Real donors only)
router.post('/', addDonation);                               // Add new donation with duplicate email check
router.get('/history/:donorName', getDonorHistory);          // Get specific donor history
router.get('/match', async (req, res) => {
  try {
    const rankedDonors = await findMatchingDonors(req.query);
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
router.post('/dispatch', dispatchBlood);                     // Dispatch blood units
export default router;