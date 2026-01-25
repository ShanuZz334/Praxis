import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import { getOverview, getFinancials } from '../controllers/fundamentalsController.js';

const router = express.Router();

router.get('/overview', authenticateToken, getOverview);
router.get('/financials', authenticateToken, getFinancials);

export default router;
