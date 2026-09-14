import express from 'express';
import { requireAuth, requireHospitalRole, requireAdmin } from '../middleware/auth.js';
import { createStaff, getStaff, updateStaff, deleteStaff, getHospitalSettings, updateHospitalSettings, getHospitalAnalytics, updateAccount, listHospitals, onboardHospitalAdmin } from '../controllers/hospitalController.js';

const router = express.Router();
router.get('/directory', listHospitals);
router.post('/onboard', onboardHospitalAdmin);
router.use(requireAuth, requireHospitalRole);
router.get('/staff', requireAdmin, getStaff);
router.post('/staff', requireAdmin, createStaff);
router.patch('/staff/:id', requireAdmin, updateStaff);
router.delete('/staff/:id', requireAdmin, deleteStaff);
router.get('/settings', requireAdmin, getHospitalSettings);
router.put('/settings', requireAdmin, updateHospitalSettings);
router.get('/analytics', getHospitalAnalytics);
router.patch('/account', updateAccount);

export default router;
