import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import AiCardPrompt from '../models/AiCardPrompt.js';
import AiChatThread from '../models/AiChatThread.js';
import aiGateway from '../ai-gateway/index.js';

const router = express.Router();
router.use(protect);

// ─── DEFAULT SYSTEM INSTRUCTIONS ─────────────────────────────────────────────
// Fallback when no custom prompt has been saved yet for a targetId.
const DEFAULT_SYSTEM_INSTRUCTION = (displayName) =>
    `You are Praxis, an elite Indian financial market analyst AI. Generate a single, concise, actionable insight about the ${displayName} indicator for the given stock/index. Focus on what the current value means for near-term price action. Be direct. Max 2 sentences.`;

// ─── PROMPT ENDPOINTS ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/ai-prompts/:targetId
 * Fetch the saved system instruction for a card or page header.
 * Creates a default entry if none exists.
 */
router.get('/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        let prompt = await AiCardPrompt.findOne({ targetId }).lean();

        if (!prompt) {
            // Return default — do NOT auto-create in DB until user explicitly saves
            return res.json({
                targetId,
                systemInstruction: '',
                isDefault: true,
                displayName: targetId.replace(/_/g, ' '),
                page: 'Unknown'
            });
        }

        res.json({ ...prompt, isDefault: false });
    } catch (err) {
        console.error('GET /ai-prompts/:targetId error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/v1/ai-prompts/:targetId
 * Save (upsert) a system instruction for a card or page header.
 * This is what the Prompts Studio "Save Prompt" button calls.
 */
router.put('/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const { systemInstruction, displayName, page, isHeaderPrompt, applicability } = req.body;

        if (systemInstruction === undefined) {
            return res.status(400).json({ error: 'systemInstruction is required' });
        }

        const prompt = await AiCardPrompt.findOneAndUpdate(
            { targetId },
            {
                targetId,
                systemInstruction,
                displayName: displayName || targetId.replace(/_/g, ' '),
                page: page || 'Unknown',
                isHeaderPrompt: isHeaderPrompt || false,
                applicability: applicability || 'both'
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ success: true, prompt });
    } catch (err) {
        console.error('PUT /ai-prompts/:targetId error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/v1/ai-prompts
 * List all saved prompts (for Prompts Studio to populate the sidebar).
 */
router.get('/', async (req, res) => {
    try {
        const { page, isHeaderPrompt } = req.query;
        const filter = {};
        if (page) filter.page = page;
        if (isHeaderPrompt !== undefined) filter.isHeaderPrompt = isHeaderPrompt === 'true';

        const prompts = await AiCardPrompt.find(filter).sort({ page: 1, displayName: 1 }).lean();
        res.json(prompts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── THREAD ENDPOINTS ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/ai-prompts/thread/:targetId?scope=card
 * Fetch the insight/chat thread for a specific targetId and scope.
 */
router.get('/thread/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const scope = req.query.scope || 'card';
        const userId = req.user._id;

        const thread = await AiChatThread.findOne({ targetId, scope, userId }).lean();
        res.json({
            targetId,
            scope,
            entries: thread?.entries || [],
            entryCount: thread?.entryCount || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/v1/ai-prompts/thread/:targetId
 * Append one or more entries to a thread (called after AI generates an insight).
 */
router.post('/thread/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const { scope = 'card', entries } = req.body;
        const userId = req.user._id;

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'entries array is required' });
        }

        const thread = await AiChatThread.findOneAndUpdate(
            { targetId, scope, userId },
            {
                $push: { entries: { $each: entries, $slice: -100 } }, // keep last 100
                $inc: { entryCount: entries.length }
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, entryCount: thread.entryCount });
    } catch (err) {
        console.error('POST /ai-prompts/thread/:targetId error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/v1/ai-prompts/thread/:targetId
 * Clear a thread (user-triggered "clear history").
 */
router.delete('/thread/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const scope = req.query.scope || 'card';
        const userId = req.user._id;

        await AiChatThread.findOneAndUpdate(
            { targetId, scope, userId },
            { $set: { entries: [], entryCount: 0 } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── INSIGHT GENERATION ENDPOINT ─────────────────────────────────────────────

/**
 * POST /api/v1/ai-prompts/generate/:targetId
 * The main endpoint called by useCardInsight.
 * 1. Fetches the saved custom prompt for targetId (falls back to default).
 * 2. Calls the AI Gateway with real card data + that prompt.
 * 3. Persists the exchange to the targetId's thread.
 * 4. Returns the insight.
 */
router.post('/generate/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const { value, displayName, stockSymbol, scope = 'card', additionalContext } = req.body;
        const userId = req.user._id;

        if (value === null || value === undefined) {
            return res.json({ insight: null, reason: 'insufficient_data' });
        }

        // 1. Fetch saved prompt (or use default)
        const savedPrompt = await AiCardPrompt.findOne({ targetId }).lean();
        const systemInstruction = savedPrompt?.systemInstruction ||
            DEFAULT_SYSTEM_INSTRUCTION(displayName || targetId.replace(/_/g, ' '));

        // 2. Build the user message with real card data
        const userMessage = [
            `Stock/Index: ${stockSymbol || 'Unknown'}`,
            `Indicator: ${displayName || targetId}`,
            `Current Value: ${value}`,
            additionalContext ? `Context: ${additionalContext}` : null
        ].filter(Boolean).join('\n');

        // 3. Call AI Gateway
        const response = await aiGateway.process({
            taskType: 'per_card_insight',
            prompt: userMessage,
            systemInstruction,
            data: { targetId, value, stockSymbol, scope },
            jsonMode: false,
            maxTokens: 100
        });

        if (response.error) {
            return res.status(500).json({ error: response.message || 'AI Gateway error' });
        }

        const insight = response.text?.trim() || null;

        // 4. Persist to thread (fire-and-forget style — don't block response)
        if (insight) {
            AiChatThread.findOneAndUpdate(
                { targetId, scope, userId },
                {
                    $push: {
                        entries: {
                            $each: [
                                { role: 'user', content: userMessage, cardValue: value },
                                {
                                    role: 'assistant',
                                    content: insight,
                                    model: response.model,
                                    provider: response.provider,
                                    latencyMs: response.latencyMs,
                                    cardValue: value
                                }
                            ],
                            $slice: -100
                        }
                    },
                    $inc: { entryCount: 2 }
                },
                { upsert: true }
            ).catch(e => console.warn('Thread persist warning:', e.message));
        }

        // 5. Return insight to client
        res.json({
            insight,
            targetId,
            provider: response.provider,
            model: response.model,
            latencyMs: response.latencyMs,
            cached: !!response.cached,
            usedCustomPrompt: !!savedPrompt?.systemInstruction
        });
    } catch (err) {
        console.error('POST /ai-prompts/generate/:targetId error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
