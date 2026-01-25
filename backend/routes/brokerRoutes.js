import express from 'express';
import authenticateToken from '../middleware/auth.js';
import {
    saveBrokerCredentials,
    getBrokerCredentials,
    testBrokerConnection
} from '../controllers/brokerController.js';

const router = express.Router();

// Routes
router.post('/credentials', authenticateToken, saveBrokerCredentials);
router.get('/credentials', authenticateToken, getBrokerCredentials);
router.post('/test', authenticateToken, testBrokerConnection);

export default router;
