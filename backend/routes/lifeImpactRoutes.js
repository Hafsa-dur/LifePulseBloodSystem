import express from 'express';
import { getLifeImpactBoard } from '../controllers/lifeImpactController.js'; // Naye controller se import
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Route responds to GET /api/life-impact
router.get('/', requireAuth, getLifeImpactBoard);

export default router;