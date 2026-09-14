import express from 'express';
import { requireAuth, requireHospitalRole } from '../middleware/auth.js';
import { 
    createPatientRequest, 
    getPatientRequests, 
    approveRequest, 
    dispatchRequest, 
    rejectRequest 
} from '../controllers/patientController.js';

const router = express.Router();

router.use(requireAuth, requireHospitalRole);

router.post('/', createPatientRequest);
router.get('/', getPatientRequests);
router.put('/approve/:id', approveRequest);
router.put('/dispatch/:id', dispatchRequest);
router.put('/reject/:id', rejectRequest);

export default router;