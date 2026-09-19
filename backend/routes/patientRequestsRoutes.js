import express from 'express';
import { requireAuth, requireHospitalRole, requirePermission } from '../middleware/auth.js';
import { 
    createPatientRequest, 
    getPatientRequests, 
    approveRequest, 
    dispatchRequest, 
    rejectRequest 
} from '../controllers/patientController.js';

const router = express.Router();

router.use(requireAuth, requireHospitalRole);

router.post('/', requirePermission('requests'), createPatientRequest);
router.get('/', getPatientRequests);
router.put('/approve/:id', requirePermission('requests'), approveRequest);
router.put('/dispatch/:id', requirePermission('dispatch'), dispatchRequest);
router.put('/reject/:id', requirePermission('requests'), rejectRequest);

export default router;