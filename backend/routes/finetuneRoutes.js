/**
 * @file finetuneRoutes.js
 * @purpose REST API endpoints for model fine-tuning status, run history, and retraining triggers.
 */

import express from 'express';
import { getFinetuneStatus, getFinetuneHistory, triggerFinetuneJob } from '../services/finetuneService.js';
import { normalizeTimeframe } from '../services/predictionResolutionService.js';

const router = express.Router();

/**
 * GET /api/v1/finetune/status
 * Query params: instrument, timeframe
 */
router.get('/status', (req, res) => {
    try {
        const instrument = req.query.instrument || 'NSE_INDEX|Nifty 50';
        const timeframe = normalizeTimeframe(req.query.timeframe || 'day');
        const data = getFinetuneStatus(instrument, timeframe);
        res.json({ success: true, ...data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/v1/finetune/history
 * Query params: instrument, timeframe, limit
 */
router.get('/history', (req, res) => {
    try {
        const instrument = req.query.instrument || 'NSE_INDEX|Nifty 50';
        const timeframe = normalizeTimeframe(req.query.timeframe || 'day');
        const limit = parseInt(req.query.limit || '20', 10);
        const history = getFinetuneHistory(instrument, timeframe, limit);
        res.json({ success: true, instrument, timeframe, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const ALLOWED_MODELS = ['kronos', 'chronos_bolt', 'lag_llama'];
const lastTriggerTimes = new Map();

/**
 * POST /api/v1/finetune/trigger
 * Body: { model_id, instrument, timeframe }
 */
router.post('/trigger', async (req, res) => {
    try {
        const { model_id, instrument = 'NSE_INDEX|Nifty 50', timeframe: rawTimeframe = 'day' } = req.body;
        const timeframe = normalizeTimeframe(rawTimeframe);
        if (!model_id) {
            return res.status(400).json({ success: false, error: 'model_id is required' });
        }
        if (!ALLOWED_MODELS.includes(model_id)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid model_id "${model_id}". Allowed models: ${ALLOWED_MODELS.join(', ')}` 
            });
        }

        // Debounce: reject multiple trigger calls within 10 seconds
        const triggerKey = `${model_id}|${instrument}|${timeframe}`;
        const now = Date.now();
        const lastTime = lastTriggerTimes.get(triggerKey) || 0;
        if (now - lastTime < 10000) {
            return res.status(429).json({
                success: false,
                error: `Retrain request for ${model_id} throttled. Please wait a few seconds before retrying.`
            });
        }
        lastTriggerTimes.set(triggerKey, now);

        const result = await triggerFinetuneJob(model_id, instrument, timeframe);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
