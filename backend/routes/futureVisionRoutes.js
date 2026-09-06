/**
 * @file futureVisionRoutes.js
 * @purpose Express routes for the Future Vision predictive candle engine.
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { runFutureVisionPrediction } from '../services/futureVisionService.js';
import AiChatThread from '../models/AiChatThread.js';

const router = express.Router();

/**
 * POST /api/v1/future-vision/predict
 * Body: { contextPayload: string, instrumentKey: string, horizonBars: number }
 * Returns: { candles, overall_bias, key_risk, predicted_at, modelUsed }
 */
router.post('/predict', protect, async (req, res) => {
    try {
        const { contextPayload, instrumentKey, horizonBars = 7 } = req.body;

        if (!contextPayload || !instrumentKey) {
            return res.status(400).json({ error: 'contextPayload and instrumentKey are required' });
        }
        if (typeof contextPayload !== 'string' || contextPayload.length > 20000) {
            return res.status(400).json({ error: 'contextPayload must be a string under 20KB' });
        }
        if (horizonBars < 1 || horizonBars > 20) {
            return res.status(400).json({ error: 'horizonBars must be between 1 and 20' });
        }

        const result = await runFutureVisionPrediction(contextPayload, instrumentKey, horizonBars);

        // Fire-and-forget: log to the new PAI Sidebar readonly trace chat
        const userId = req.user._id;
        const userMsg = `**Future Vision Request for ${instrumentKey.split('|')[1] || instrumentKey}**\n\n**Raw Context Payload:**\n\`\`\`json\n${contextPayload.substring(0, 1200)}\n...\n[Payload truncated for UI. Full length: ${contextPayload.length} chars]\n\`\`\``;
        const aiMsg = `**Prediction Complete**\n\n**Raw JSON Response:**\n\`\`\`json\n${JSON.stringify({ bias: result.overall_bias, risk: result.key_risk, candles: result.candles }, null, 2)}\n\`\`\``;
        
        AiChatThread.findOneAndUpdate(
            { targetId: 'fv_logs', scope: 'page', userId },
            {
                $push: {
                    entries: {
                        $each: [
                            { role: 'user', content: userMsg, timestamp: new Date() },
                            { role: 'assistant', content: aiMsg, model: result.modelUsed || 'Unknown Model', timestamp: new Date() }
                        ],
                        $slice: -100
                    }
                },
                $inc: { entryCount: 2 }
            },
            { upsert: true, new: true }
        ).catch(err => console.error('[FutureVision] Failed to save trace log:', err));

        return res.json({
            status: 'success',
            instrumentKey,
            horizonBars,
            ...result,
        });

    } catch (err) {
        console.error('[FutureVision] Prediction error:', err.message);
        return res.status(500).json({ error: err.message || 'Future Vision prediction failed' });
    }
});

/**
 * POST /api/v1/future-vision/feedback
 * Optional: logs PAE report server-side for analytics/model improvement tracking.
 * Body: { instrumentKey, timeframe, paeReport }
 */
router.post('/feedback', protect, async (req, res) => {
    try {
        const { instrumentKey, timeframe, paeReport } = req.body;
        // For now: log to console. Future: store in DB for aggregated model analytics.
        console.log(`[FutureVision PAE Feedback] ${instrumentKey} | ${timeframe}:`, paeReport);
        return res.json({ status: 'ok' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;