import express from 'express';
import { getLifeImpactBoard } from '../controllers/lifeImpactController.js'; // Naye controller se import

const router = express.Router();

// Route responds to GET /api/life-impact
router.get('/', getLifeImpactBoard);

export default router;