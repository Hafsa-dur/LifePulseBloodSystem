import express from 'express';
import { requireAuth, requireHospitalRole } from '../middleware/auth.js';
import { createStaff, getStaff, updateStaff, deleteStaff, getHospitalSettings, updateHospitalSettings, getHospitalAnalytics, updateAccount } from '../controllers/hospitalController.js';

const router = express.Router();
router.use(requireAuth, requireHospitalRole);
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.patch('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);
router.get('/settings', getHospitalSettings);
router.put('/settings', updateHospitalSettings);
router.get('/analytics', getHospitalAnalytics);
router.patch('/account', updateAccount);

export default router;
