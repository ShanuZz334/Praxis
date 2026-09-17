/**
 * @file predictionRoutes.js
 * @purpose REST API endpoints for monitoring model weights, conformal calibration state,
 *          prediction history, and triggering resolution cycles.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getModelWeights,
    getCalibrationState,
    getPredictionHistory,
    resolvePendingPredictions,
    getEdgeEvaluation
} from '../services/predictionResolutionService.js';

import { getEnsembleReadiness, getEnsembleMembers } from '../services/ensembleService.js';
import { calculateNseFriction, evaluateNetEdge } from '../engine/frictionEngine.js';

const router = express.Router();

/**
 * Optional authentication: attaches user if token is present, but allows read access.
 */
const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        return protect(req, res, next);
    }
    next();
};

/**
 * GET /api/v1/predictions/weights
 * Query params: instrument (required), timeframe (optional, default 'day'), regime (optional, default 'CHOPPY')
 */
router.get('/weights', optionalProtect, async (req, res) => {
    try {
        const { instrument, timeframe = 'day', regime = 'CHOPPY' } = req.query;
        if (!instrument) {
            return res.status(400).json({ error: 'instrument query parameter is required' });
        }

        const weights = getModelWeights(instrument, timeframe, regime);
        const edgeEval = getEdgeEvaluation(instrument, timeframe, regime);

        return res.json({
            status: 'success',
            instrument,
            timeframe,
            regime,
            weights,
            edge: edgeEval
        });
    } catch (err) {
        console.error('[PredictionRoutes] Error fetching weights:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/predictions/friction
 * Query params: instrument (required), timeframe (optional, default 'day')
 */
router.get('/friction', optionalProtect, async (req, res) => {
    try {
        const { instrument, timeframe = 'day' } = req.query;
        if (!instrument) {
            return res.status(400).json({ error: 'instrument query parameter is required' });
        }
        const friction = calculateNseFriction(instrument, timeframe);
        return res.json({
            status: 'success',
            instrument,
            timeframe,
            friction
        });
    } catch (err) {
        console.error('[PredictionRoutes] Error calculating friction:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/predictions/calibration
 * Query params: instrument (required), timeframe (optional, default 'day')
 */
router.get('/calibration', optionalProtect, async (req, res) => {
    try {
        const { instrument, timeframe = 'day' } = req.query;
        if (!instrument) {
            return res.status(400).json({ error: 'instrument query parameter is required' });
        }

        const state = getCalibrationState(instrument, timeframe);
        return res.json({
            status: 'success',
            ...state
        });
    } catch (err) {
        console.error('[PredictionRoutes] Error fetching calibration state:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/predictions/history
 * Query params: instrument (required), timeframe (optional, default 'day'), limit (optional, default 50)
 */
router.get('/history', optionalProtect, async (req, res) => {
    try {
        const { instrument, timeframe = 'day', limit = 50 } = req.query;
        if (!instrument) {
            return res.status(400).json({ error: 'instrument query parameter is required' });
        }

        const history = getPredictionHistory(instrument, timeframe, parseInt(limit, 10) || 50);
        return res.json({
            status: 'success',
            instrument,
            timeframe,
            count: history.length,
            history
        });
    } catch (err) {
        console.error('[PredictionRoutes] Error fetching prediction history:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v1/predictions/resolve
 * Manually trigger resolution cycle for all pending predictions whose target candle has arrived.
 */
router.post('/resolve', protect, async (req, res) => {
    try {
        const result = await resolvePendingPredictions();
        return res.json({
            status: 'success',
            ...result
        });
    } catch (err) {
        console.error('[PredictionRoutes] Error triggering prediction resolution:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/predictions/readiness
 * Proxy to Python ensemble service health check.
 * Returns 200 even if ensemble service is offline (graceful degraded mode).
 */
router.get('/readiness', async (req, res) => {
    try {
        const readiness = await getEnsembleReadiness();
        return res.json({
            ensemble_service: readiness.status,    // 'ok' | 'degraded' | 'offline'
            online: readiness.online,
            members: readiness.members,
        });
    } catch (err) {
        return res.json({ ensemble_service: 'offline', online: false, members: [] });
    }
});

/**
 * GET /api/v1/predictions/ensemble-members
 * List all Python ensemble members and their readiness status.
 */
router.get('/ensemble-members', async (req, res) => {
    try {
        const members = await getEnsembleMembers();
        return res.json({ members });
    } catch (err) {
        return res.json({ members: [] });
    }
});

export default router;
