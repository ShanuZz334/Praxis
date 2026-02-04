/**
 * @file brokerRoutes.js
 * @purpose API route definitions for broker integration.
 * @responsibilities
 * - Defines broker credential management endpoints
 * - Handles broker connection testing
 * - Applies authentication middleware to all routes
 * - Routes requests to brokerController
 * @key_exports
 * - Express router (default export)
 * @dependencies
 * - express - Router
 * - brokerController - Request handlers
 * - authMiddleware - Authentication middleware
 * @lifecycle
 * - Registered in server.js as /api/v1/broker
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import express from 'express';
import { protect as authenticateToken } from '../middleware/authMiddleware.js';
import {
    saveBrokerCredentials,
    getBrokerCredentials,
    testBrokerConnection
} from '../controllers/brokerController.js';

// =============================
// Router Setup
// =============================
const router = express.Router();

// =============================
// Route Definitions
// =============================
router.post('/credentials', authenticateToken, saveBrokerCredentials);
router.get('/credentials', authenticateToken, getBrokerCredentials);
router.post('/test', authenticateToken, testBrokerConnection);

// =============================
// Export
// =============================
export default router;
