import express from 'express';
import { 
    createPatientRequest, 
    getPatientRequests, 
    approveRequest, 
    dispatchRequest, 
    rejectRequest 
} from '../controllers/patientController.js';

const router = express.Router();

router.post('/', createPatientRequest);
router.get('/', getPatientRequests);
router.put('/approve/:id', approveRequest);
router.put('/dispatch/:id', dispatchRequest);
router.put('/reject/:id', rejectRequest);

export default router;