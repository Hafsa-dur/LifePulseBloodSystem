import express from 'express';
import { requireAuth, requireHospitalRole } from '../middleware/auth.js';
import { 
  getCombinedDispatchLogs, 
  getDonorRecipientHistory 
} from '../controllers/donorRecipientController.js';

const router = express.Router();

router.use(requireAuth, requireHospitalRole);

router.get('/combined', getCombinedDispatchLogs);
router.get('/history/:donorName', getDonorRecipientHistory);

export default router;