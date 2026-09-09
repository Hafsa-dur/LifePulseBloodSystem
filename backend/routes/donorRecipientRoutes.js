import express from 'express';
import { 
  getCombinedDispatchLogs, 
  getDonorRecipientHistory 
} from '../controllers/donorRecipientController.js';

const router = express.Router();

router.get('/combined', getCombinedDispatchLogs);
router.get('/history/:donorName', getDonorRecipientHistory);

export default router;