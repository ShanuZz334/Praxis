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
        const { contextPayload, instrumentKey, timeframe, horizonBars = 7, candles = [] } = req.body;

        if (!contextPayload || !instrumentKey || !timeframe) {
            return res.status(400).json({ error: 'contextPayload, instrumentKey, and timeframe are required' });
        }
        if (typeof contextPayload !== 'string' || contextPayload.length > 80000) {
            return res.status(400).json({ error: 'contextPayload must be a string under 80KB' });
        }
        if (horizonBars < 1 || horizonBars > 20) {
            return res.status(400).json({ error: 'horizonBars must be between 1 and 20' });
        }

        const result = await runFutureVisionPrediction(contextPayload, instrumentKey, timeframe, horizonBars, candles);

        // Fire-and-forget: log to the PAI Sidebar readonly trace chat
        const userId = req.user._id;
        const symbol = instrumentKey.split('|')[1] || instrumentKey;
        const userMsg = `**Future Vision Request for ${symbol}**\n\n**Raw Context Payload:**\n\`\`\`text\n${contextPayload.substring(0, 1200)}\n...\n[Payload truncated for UI. Full length: ${contextPayload.length} chars]\n\`\`\``;

        const weightsText = (result.modelWeights || [])
            .map(w => {
                const label = w.model_id === 'chronos_bolt' ? 'Chronos-Bolt (Amazon Distilled T5)'
                    : w.model_id === 'kronos' ? 'Kronos-Small (AAAI 2026 Foundation Model)'
                    : w.model_id === 'naive_baseline' ? 'Naive Drift Baseline'
                    : w.model_id === 'lag_llama' ? 'Lag-Llama'
                    : w.model_id;
                return `- **${label}**: ${Math.round((w.weight || 0) * 100)}%`;
            }).join('\n');

        let tableRows = '';
        if (Array.isArray(result.candles)) {
            tableRows = result.candles.map(c => {
                const kVal = c.kronosQ50 ? `₹${c.kronosQ50.toFixed(1)}` : '—';
                const cVal = c.chronosQ50 ? `₹${c.chronosQ50.toFixed(1)}` : '—';
                const cone = (c.q10 && c.q90) ? `[₹${c.q10.toFixed(1)} - ₹${c.q90.toFixed(1)}]` : '—';
                return `| Bar ${c.bar} | ₹${c.open.toFixed(2)} | ₹${c.close.toFixed(2)} | ${kVal} | ${cVal} | ${cone} | ${c.direction.toUpperCase()} (${c.confidence}%) |`;
            }).join('\n');
        }

        const aiMsg = `### Praxis Multi-Model Foundation Ensemble [${horizonBars}-Candle Forecast]
**Instrument**: \`${symbol}\` | **Timeframe**: \`${timeframe}\` | **Regime**: \`${result.regime || 'CHOPPY'}\`
**Statistical Conformal Multiplier**: \`${result.conformalMultiplier ? Number(result.conformalMultiplier).toFixed(3) : '1.000'}x\`

#### Active Foundation Models & Allocation:
${weightsText || '- Local Foundation Models & AI Gateway'}
- **Context & Reasoning Synthesizer**: \`${result.cloudModelUsed || 'Cloud AI'}\`

#### 7-Candle Quantitative Consensus:
| Bar | Open | Blended Close | Kronos q50 | Chronos q50 | 80% Cone [q10-q90] | Signal |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${tableRows}

#### Strategic Outlook:
- **Overall Bias**: \`${result.overall_bias?.toUpperCase() || 'NEUTRAL'}\`
- **Key Support**: \`${result.key_support ? '₹' + result.key_support : 'N/A'}\` | **Key Resistance**: \`${result.key_resistance ? '₹' + result.key_resistance : 'N/A'}\`
- **Key Risk**: ${result.key_risk || 'N/A'}
- **Reasoning**: ${result.reasoning_summary || 'Multi-model consensus evaluated.'}

<details>
<summary><b>View Raw JSON Response</b></summary>

\`\`\`json
${JSON.stringify({ bias: result.overall_bias, risk: result.key_risk, regime: result.regime, weights: result.modelWeights, candles: result.candles }, null, 2)}
\`\`\`
</details>`;

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