import express from 'express';
import { 
  getAllDonations, 
  getDashboardDonations, 
  addDonation, 
  getDonorHistory, 
  dispatchBlood
} from '../controllers/donationController.js';


const router = express.Router();

// Pure Donation & Stock Routes
router.get('/', getAllDonations);                           // Stock Inventory (All entries + dispatches)
router.get('/dashboard', getDashboardDonations);             // Dashboard / Registered Donors (Real donors only)
router.post('/', addDonation);                               // Add new donation with duplicate email check
router.get('/history/:donorName', getDonorHistory);          // Get specific donor history
router.post('/dispatch', dispatchBlood);                     // Dispatch blood units
export default router;