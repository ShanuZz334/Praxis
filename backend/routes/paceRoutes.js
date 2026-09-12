/**
 * @file paceRoutes.js
 * @purpose Express routes for the Praxis Adaptive Calibration Engine (PACE).
 *
 * GET  /api/v1/pace/profile  - fetch calibration profile for an instrument/timeframe
 * POST /api/v1/pace/score    - submit a bar score to update the profile
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    updateCalibrationProfile,
    getCalibrationProfile,
    formatProfileForPrompt,
} from '../engine/paceEngine.js';
import { runOvernightAnalyst, getLatestAnalystBrief, runJournalAnalyst } from '../engine/overnightAnalyst.js';

const router = express.Router();

/**
 * GET /api/v1/pace/profile?instrumentKey=...&timeframe=...
 * Returns the full calibration profile + formatted prompt string.
 */
router.get('/profile', protect, (req, res) => {
    try {
        const { instrumentKey, timeframe } = req.query;
        if (!instrumentKey || !timeframe) {
            return res.status(400).json({ error: 'instrumentKey and timeframe are required' });
        }

        const profile = getCalibrationProfile(instrumentKey, timeframe);
        const promptBlock = formatProfileForPrompt(profile);

        return res.json({
            status: 'ok',
            hasData: !!profile,
            profile: profile ?? null,
            promptBlock,
        });
    } catch (err) {
        console.error('[PACE] getProfile error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v1/pace/score
 * Body: { instrumentKey, timeframe, barScore, regime }
 * Updates the permanent calibration profile with a newly closed bar.
 */
router.post('/score', protect, (req, res) => {
    try {
        const { instrumentKey, timeframe, barScore, regime = 'normal' } = req.body;

        if (!instrumentKey || !timeframe || !barScore) {
            return res.status(400).json({ error: 'instrumentKey, timeframe, and barScore are required' });
        }

        updateCalibrationProfile(instrumentKey, timeframe, barScore, regime);

        return res.json({ status: 'ok', message: 'Calibration profile updated.' });
    } catch (err) {
        console.error('[PACE] score error:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/pace/analyst?instrumentKey=...&timeframe=...
 */
router.get('/analyst', protect, (req, res) => {
    try {
        const { instrumentKey, timeframe } = req.query;
        if (!instrumentKey || !timeframe) return res.status(400).json({ error: 'Missing params' });
        
        const result = getLatestAnalystBrief(instrumentKey, timeframe);
        if (result && typeof result === 'object') {
            res.json({ brief: result.brief, createdAt: result.createdAt });
        } else {
            res.json({ brief: result, createdAt: null });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch brief' });
    }
});

/**
 * POST /api/v1/pace/analyst/run
 */
router.post('/analyst/run', protect, async (req, res) => {
    try {
        const { instrumentKey, timeframe, candles, confluence, stats, symbol } = req.body;
        if (!instrumentKey || !timeframe) return res.status(400).json({ error: 'Missing params' });
        
        const brief = await runOvernightAnalyst(instrumentKey, timeframe, { candles, confluence, stats, symbol });
        res.json({ success: true, brief, createdAt: Date.now() });
    } catch (error) {
        console.error('[PACE] /analyst/run error:', error.message);
        res.status(500).json({ error: 'Failed to run Analyst', details: error.message });
    }
});

/**
 * POST /api/v1/pace/analyst/journal
 */
router.post('/analyst/journal', protect, async (req, res) => {
    try {
        const brief = await runJournalAnalyst();
        res.json({ success: true, brief });
    } catch (error) {
        res.status(500).json({ error: 'Failed to run Journal Analyst', details: error.message });
    }
});

export default router;
