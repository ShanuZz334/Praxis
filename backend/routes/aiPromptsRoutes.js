import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import AiCardPrompt from '../models/AiCardPrompt.js';
import AiChatThread from '../models/AiChatThread.js';
import AiRouting from '../models/AiRouting.js';
import aiGateway from '../ai-gateway/index.js';
import { transcribeAudio } from '../ai-gateway/providers/groqProvider.js';
import { CARD_REGISTRY } from '../../frontend/stock-look/src/shared/config/cardRegistry.js';
import multer from 'multer';

// Set up multer to store uploaded files in memory
const upload = multer({ storage: multer.memoryStorage() });
import { GOLDEN_RULES } from '../config/goldenRules.js';

const router = express.Router();
router.use(protect);

// ─── DEFAULT SYSTEM INSTRUCTIONS ─────────────────────────────────────────────
// Fallback when no custom prompt has been saved yet for a targetId.

const PAGE_HEADER_DEFAULTS = {
    [CARD_REGISTRY.fundamentals_index_header?.id || "fundamentals_index_header"]: `You are Praxis. Analyze the Fundamentals for {{symbol}}. Generate a short, actionable summary of the market regime and valuation. No markdown, no bold text, no introductions.`,
    [CARD_REGISTRY.fundamentals_company_header?.id || "fundamentals_company_header"]: `You are Praxis. Analyze the Fundamentals for {{symbol}}. Generate a short, actionable summary of valuation and earnings quality. No markdown, no bold text, no introductions.`,
    [CARD_REGISTRY.technical_index_header?.id || "technical_index_header"]: `You are Praxis. Analyze the Technicals for {{symbol}}. Generate a short, actionable summary of the primary trend and key levels. No markdown, no bold text, no introductions.`,
    [CARD_REGISTRY.technical_company_header?.id || "technical_company_header"]: `You are Praxis. Analyze the Technicals for {{symbol}}. Generate a short summary of the primary trend and one specific trade setup. No markdown, no bold text, no introductions.`,
    [CARD_REGISTRY.options_header?.id || "options_header"]: `You are Praxis. Analyze the Options data for {{symbol}}. Generate a short summary of directional bias, volatility regime, and a strategy recommendation. No markdown, no bold text, no introductions.`,
    [CARD_REGISTRY.praxis_composite_header?.id || "praxis_composite_header"]: `You are Praxis. Analyze the composite data for {{symbol}}. Generate a short summary of the overall market posture and a tactical recommendation. No markdown, no bold text, no introductions.`,
    foreign_header: `You are Praxis. Analyze the Global Macro data for {{symbol}}. Generate a short summary of the most important global headwinds/tailwind and sector impact. No markdown, no bold text, no introductions.`,
    events_header: `You are Praxis. Analyze the Events data for {{symbol}}. Generate a short summary of key near-term event risks and expected impact. No markdown, no bold text, no introductions.`,
};

const DEFAULT_SYSTEM_INSTRUCTION = (targetId, displayName) => {
    if (targetId && PAGE_HEADER_DEFAULTS[targetId]) {
        return PAGE_HEADER_DEFAULTS[targetId];
    }
    return `You are Praxis, an elite Indian financial market analyst AI. Generate a single, concise, actionable insight about the ${displayName} indicator for the given stock/index. Focus on what the current value means for near-term price action. Be direct. Max 2 sentences.`;
};

// ─── TEMPLATE VARIABLE RESOLUTION ────────────────────────────────────────────

/**
 * Parses a pipe-separated additionalContext string (produced by IndicatorCard.jsx)
 * into a structured object of named fields.
 *
 * Input:  "Bias: Bullish | Confidence: 65% | Score: 68/100 | Impact: 5 | Sector P/E: 21.5x"
 * Output: { bias: 'Bullish', confidence: '65%', score: '68', impactWeight: '5', sectorValue: '21.5x' }
 */
function parseAdditionalContext(contextStr) {
    if (!contextStr || typeof contextStr !== 'string') return {};
    const result = {};
    contextStr.split('|').forEach(part => {
        const idx = part.indexOf(':');
        if (idx < 0) return;
        const rawKey = part.substring(0, idx).trim().toLowerCase().replace(/[\s/]/g, '');
        const val    = part.substring(idx + 1).trim();
        if (!val) return;
        if (rawKey === 'bias')              result.bias = val;
        else if (rawKey === 'confidence')   result.confidence = val;
        else if (rawKey === 'score')        result.score = val.split('/')[0].trim();
        else if (rawKey === 'impact')       result.impactWeight = val;
        else if (rawKey === 'regime')       result.regime = val;
        else if (rawKey === 'bulls')        result.bulls = val;
        else if (rawKey === 'bears')        result.bears = val;
        else if (rawKey === 'neutrals')     result.neutrals = val;
        else if (rawKey === 'techscore')    result.techScore = val;
        else if (rawKey === 'fundscore')    result.fundScore = val;
        else if (rawKey === 'optsscore')    result.optsScore = val;
        else if (rawKey === 'globscore')    result.globScore = val;
        else if (rawKey === 'evtscore')     result.evtScore = val;
        // ── Extended technical/options variable resolution ─────────────────────
        else if (rawKey === 'ivlow')        result.ivLow = val;
        else if (rawKey === 'ivhigh')       result.ivHigh = val;
        else if (rawKey === 'keylevel')     result.keyLevel = val;
        else if (rawKey === 'signalline')   result.signalLine = val;
        else if (rawKey === 'histogram')    result.histogram = val;
        else if (rawKey === 'upperband')    result.upperBand = val;
        else if (rawKey === 'lowerband')    result.lowerBand = val;
        else if (rawKey === 'midband')      result.midBand = val;
        else if (rawKey === 'overbought')   result.overbought = val;
        else if (rawKey === 'oversold')     result.oversold = val;
        else if (rawKey.startsWith('sector') && !result.sectorValue) {
            result.sectorValue = val; // e.g. "Sector P/E: 21.5x"
        }
    });
    return result;
}

/**
 * Resolves {variable} tokens in a template string using the provided data map.
 * Unresolved tokens are left as-is (not replaced), so the AI can still see the
 * intent of the prompt even if a value is unavailable.
 *
 * @param {string} template  - The system instruction with {key} placeholders
 * @param {object} data      - Map of key → resolved value strings
 * @returns {string}
 */
function resolveTemplateVars(template, data) {
    if (!template || typeof template !== 'string') return template;
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        const val = data[key];
        return (val !== undefined && val !== null && val !== '') ? String(val) : match;
    });
}

// ─── GOLDEN RULES ENDPOINT ───────────────────────────────────────────────────

router.get('/golden-rules', (req, res) => {
    res.json(GOLDEN_RULES);
});

// ─── DB & PRESET ROUTES ─────────────────────────────────────────────────────────

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
                page: 'Unknown',
                presets: []
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
        const { systemInstruction, displayName, page, isHeaderPrompt, applicability, presets, activePresetId } = req.body;

        const prompt = await AiCardPrompt.findOneAndUpdate(
            { targetId },
            {
                targetId,
                systemInstruction: systemInstruction || '',
                displayName: displayName || targetId.replace(/_/g, ' '),
                page: page || 'Unknown',
                isHeaderPrompt: isHeaderPrompt || false,
                applicability: applicability || 'both',
                presets: presets || [],
                activePresetId: activePresetId || 'default'
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
// ─── PAGE DATA SUMMARIZER ──────────────────────────────────────────────────────────────
/**
 * Converts pageData into a concise human-readable summary for the AI.
 * Handles two shapes:
 *   1. nestedTreePayload: { engines: [{ name, score, sections[], marketContext }] }
 *   2. DataRegistry snapshot: { [cardId]: { displayName, value, score, signal } }
 *
 * Replaces raw JSON.stringify() — avoids massive token-heavy blobs.
 */
function summarizePageData(pageData) {
    if (!pageData) return null;

    // Shape 1: nested engine tree (nestedTreePayload or masterPayload)
    if (Array.isArray(pageData.engines) && pageData.engines.length > 0) {
        const lines = [];
        pageData.engines.forEach(e => {
            let line = `${e.name}: ${e.score}/100`;
            // Append market-specific context (Options: PCR, IV Rank, MaxPain)
            if (e.marketContext) {
                const mc = e.marketContext;
                if (mc.pcr     != null) line += ` | PCR ${Number(mc.pcr).toFixed(2)}`;
                if (mc.maxPain != null) line += ` | MaxPain ${mc.maxPain}`;
                if (mc.ivRank  != null) line += ` | IVR ${Number(mc.ivRank).toFixed(0)}%`;
            }
            lines.push(line);

            if (Array.isArray(e.sections) && e.sections.length > 0) {
                e.sections.forEach(s => {
                    if (s.score == null) return;
                    let sectionLine = `  - ${s.name || s.label || s.id || 'Module'} (${s.score > 0 ? '+' : ''}${s.score})`;
                    
                    if (Array.isArray(s.cards) && s.cards.length > 0) {
                        const cardStrs = s.cards.map(c => {
                            const valStr = c.value != null ? c.value : 'N/A';
                            const bias = c.score > 0 ? 'Bullish' : c.score < 0 ? 'Bearish' : 'Neutral';
                            return `${c.name || c.label || c.title || c.id || 'Card'}: ${valStr} [${bias}]`;
                        });
                        sectionLine += ` -> Cards: ${cardStrs.join(', ')}`;
                    }
                    lines.push(sectionLine);
                });
            }
        });

        if (pageData.master_widgets) {
            const w = pageData.master_widgets;
            lines.push('\n--- MASTER DASHBOARD WIDGETS ---');
            if (w.market_heatmap && Array.isArray(w.market_heatmap)) {
                lines.push(`Market Heatmap (Top 15): ${w.market_heatmap.slice(0, 15).map(m => `${m.symbol}(${m.pctChange}%)`).join(', ')}`);
            }
            if (w.fii_dii_flow_master) {
                lines.push(`Institutional Flow (FII/DII): ${JSON.stringify(w.fii_dii_flow_master)}`);
            }
            if (w.sector_rotation && Array.isArray(w.sector_rotation)) {
                lines.push(`Sector Rotation: ${w.sector_rotation.slice(0, 10).map(s => `${s.symbol || s.name || s.trading_symbol}(${(s.change_pct ?? s.percentage_change ?? s.pctChange ?? 0).toFixed(2)}%)`).join(', ')}`);
            }
            if (w.options_pulse && Array.isArray(w.options_pulse)) {
                lines.push(`Options Pulse (Active): ${w.options_pulse.slice(0, 10).map(o => `${o.symbol || o.name || o.trading_symbol}(${(o.change_pct ?? o.percentage_change ?? o.pctChange ?? 0).toFixed(2)}%)`).join(', ')}`);
            }
        }

        return lines.join('\n');
    }

    // Shape 3: DataRegistry structured data { pageId, compositeScore, sections: [{ name, cards: [...] }] }
    if (typeof pageData === 'object' && !Array.isArray(pageData) && Array.isArray(pageData.sections)) {
        const lines = [`${(pageData.pageId || 'Page').toUpperCase()} Composite Score: ${pageData.compositeScore ?? '?'}/100`];
        pageData.sections.forEach(s => {
            let sectionLine = `  - ${s.name}`;
            if (s.score != null) sectionLine += ` (${s.score > 0 ? '+' : ''}${s.score})`;
            if (Array.isArray(s.cards) && s.cards.length > 0) {
                const cardStrs = s.cards.map(c => {
                    const valStr = c.value != null ? c.value : 'N/A';
                    const sig = c.signal || (c.score > 0 ? 'Bullish' : c.score < 0 ? 'Bearish' : 'Neutral');
                    let str = `${c.displayName || c.name || c.id}: ${valStr} [${sig}]`;
                    if (c.additionalContext) str += ` {${c.additionalContext}}`;
                    return str;
                });
                sectionLine += ` -> Cards: ${cardStrs.join(', ')}`;
            }
            lines.push(sectionLine);
        });
        return lines.join('\n');
    }

    // Shape 2: DataRegistry flat card map { [cardId]: { displayName, value, score, signal } }
    if (typeof pageData === 'object' && !Array.isArray(pageData)) {
        const entries = Object.entries(pageData)
            .filter(([, v]) => v && typeof v === 'object' && v.value != null)
            .map(([id, v]) => {
                const sig = v.signal || 'N/A';
                const sc  = v.score != null ? `${v.score}/100` : '?/100';
                let line = `${v.displayName || id}: ${v.value} (${sc}, ${sig})`;
                if (v.additionalContext) line += ` | ${v.additionalContext}`;
                return line;
            });
        return entries.length > 0 ? entries.join('\n') : null;
    }

    return null;
}

router.post('/generate/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        const { value, displayName, stockSymbol, scope = 'card', additionalContext, pageData, presetId } = req.body;
        const userId = req.user._id;

        if (value === null || value === undefined) {
            return res.json({ insight: null, reason: 'insufficient_data' });
        }

        // 1. Fetch saved prompt (or use default)
        const savedPrompt = await AiCardPrompt.findOne({ targetId }).lean();
        
        let rawInstruction = DEFAULT_SYSTEM_INSTRUCTION(targetId, displayName || targetId.replace(/_/g, ' '));
        
        if (savedPrompt) {
            const targetPresetId = presetId || savedPrompt.activePresetId;
            if (targetPresetId && targetPresetId !== 'default' && Array.isArray(savedPrompt.presets)) {
                const preset = savedPrompt.presets.find(p => p.id === targetPresetId);
                if (preset && preset.systemInstruction) {
                    rawInstruction = preset.systemInstruction;
                }
            } else if (savedPrompt.systemInstruction) {
                rawInstruction = savedPrompt.systemInstruction;
            }
        }


        // 1a. Resolve {template variables} in the system instruction with real data
        const parsedCtx = parseAdditionalContext(additionalContext);
        const systemInstruction = resolveTemplateVars(rawInstruction, {
            name:              displayName || targetId.replace(/_/g, ' '),
            value:             value != null ? String(value) : '',
            stockSymbol:       stockSymbol || 'Unknown',
            score:             parsedCtx.score        || null,
            bias:              parsedCtx.bias         || null,
            confidence:        parsedCtx.confidence   || null,
            impactWeight:      parsedCtx.impactWeight || null,
            sectorValue:       parsedCtx.sectorValue  || null,
            additionalContext: additionalContext       || null,
            // Page header vars
            regime:            parsedCtx.regime    || null,
            bulls:             parsedCtx.bulls     || null,
            bears:             parsedCtx.bears     || null,
            neutrals:          parsedCtx.neutrals  || null,
            techScore:         parsedCtx.techScore || null,
            fundScore:         parsedCtx.fundScore || null,
            optsScore:         parsedCtx.optsScore || null,
            globScore:         parsedCtx.globScore || null,
            evtScore:          parsedCtx.evtScore  || null,
            // Extended technical / options vars (now fully resolved)
            ivLow:             parsedCtx.ivLow      || null,
            ivHigh:            parsedCtx.ivHigh     || null,
            keyLevel:          parsedCtx.keyLevel   || null,
            signalLine:        parsedCtx.signalLine || null,
            histogram:         parsedCtx.histogram  || null,
            upperBand:         parsedCtx.upperBand  || null,
            lowerBand:         parsedCtx.lowerBand  || null,
            midBand:           parsedCtx.midBand    || null,
            overbought:        parsedCtx.overbought || null,
            oversold:          parsedCtx.oversold   || null,
        });

        // 2. Build the user message with real card data
        let pageDataSummary = summarizePageData(pageData);
        if (pageDataSummary && pageDataSummary.length > 15000) {
            console.warn(`Truncating pageDataSummary from ${pageDataSummary.length} to 15000 chars to avoid token overflow causing cutoff.`);
            pageDataSummary = pageDataSummary.substring(0, 15000) + '\n...[TRUNCATED TO PREVENT TOKEN OVERFLOW]';
        }
        
        const userMessage = [
            `Stock/Index: ${stockSymbol || 'Unknown'}`,
            `Indicator: ${displayName || targetId}`,
            `Current Value: ${value}`,
            additionalContext ? `Context: ${additionalContext}` : null,
            pageDataSummary   ? `Page Data:\n${pageDataSummary}` : null
        ].filter(Boolean).join('\n');

        // 3. Call AI Gateway — use page_header_insight for headers (Tier 2, more reasoning)
        const isHeaderTarget = targetId.endsWith('_header');
        
        // 3a. Enforce Golden Rules system-wide or per-header
        let goldenRulesStr = '';
        if (savedPrompt && savedPrompt.goldenRules) {
            goldenRulesStr = `System Guardrails:\n${savedPrompt.goldenRules}\n\n`;
        } else {
            goldenRulesStr = `System Guardrails:\n${GOLDEN_RULES.map((r, i) => `${i+1}. ${r}`).join('\n')}\n\n`;
        }
        
        // 3b. Enforce Verbosity Settings
        const routing = await AiRouting.findOne({ isSingleton: true }).lean();
        let verbosityInstruction = "";
        if (routing) {
            const verbosityLevel = isHeaderTarget ? routing.headerInsight?.verbosity : routing.cardInsight?.verbosity;
            if (verbosityLevel === 'short') {
                verbosityInstruction = "\n\n[CRITICAL REQUIREMENT: Generate exactly 1 to 2 short sentences total. NO MORE.]";
            } else if (verbosityLevel === 'detailed') {
                verbosityInstruction = "\n\n[CRITICAL REQUIREMENT: Provide a highly detailed, comprehensive analysis spanning multiple paragraphs. Break down the reasoning deeply.]";
            } else {
                // Default / medium
                verbosityInstruction = "\n\n[CRITICAL REQUIREMENT: You MUST generate EXACTLY ONE SINGLE PARAGRAPH. Do NOT use any line breaks, bullet points, or multiple paragraphs. The entire response must be a single block of text.]";
            }
        }
        
        const enforcedSystemInstruction = `${goldenRulesStr}Task Instruction:\n${systemInstruction}${verbosityInstruction}`;

        const response = await aiGateway.process({
            taskType: 'per_card_insight', // Route headers to Tier 1 as requested
            prompt: userMessage,
            systemInstruction: enforcedSystemInstruction,
            data: { targetId, value, stockSymbol, scope },
            maxTokens: savedPrompt?.maxTokens || 2000,
            temperature: routing?.temperature !== undefined ? routing.temperature : 0.7
        });

        if (response.error) {
            return res.status(500).json({ error: response.message || 'AI Gateway error' });
        }

        let insight = response.text?.trim() || null;


        // 4. Persist to thread (fire-and-forget style — don't block response)
        if (insight) {
            AiChatThread.findOneAndUpdate(
                { targetId, scope, userId },
                {
                    $push: {
                        entries: {
                            $each: [
                                { role: 'user', content: userMessage, cardValue: value, timestamp: new Date() },
                                {
                                    role: 'assistant',
                                    content: insight,
                                    model: response.model,
                                    provider: response.provider,
                                    latencyMs: response.latencyMs,
                                    cardValue: value,
                                    timestamp: new Date()
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
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});
/**
 * POST /api/v1/ai-prompts/chat/:targetId
 * An interactive chat endpoint that reads previous thread history,
 * appends the new user message, gets an AI response, and saves both to the thread.
 */
router.post('/chat/:targetId', async (req, res) => {
    try {
        const { targetId } = req.params;
        let { message, scope = 'card', contextData, cardSnapshots = [], explicitProvider, explicitModel } = req.body;
        
        // DEBUG LOGGING START
        import('fs').then(fs => {
            fs.appendFileSync('chat_debug.log', JSON.stringify({ time: new Date().toISOString(), targetId, body: req.body }) + '\\n');
        }).catch(e => {});
        // DEBUG LOGGING END
        
        contextData = contextData || {};
        const userId = req.user._id;

        if (!message) return res.status(400).json({ error: 'Message is required' });

        // Fix E (backend): log any @mention snapshots that arrived with null value
        if (cardSnapshots.length > 0) {
            const nullCards = cardSnapshots.filter(s => s.value === null || s.value === undefined);
            if (nullCards.length > 0) {
                console.warn(
                    `[chat/${targetId}] @mention cards received with no live value:`,
                    nullCards.map(s => `${s.cardId} (${s.displayName})`).join(', '),
                    '— AI will see "N/A" for these. Likely cause: source page not mounted or widget missing register() call.'
                );
            }
        }

        // Build card context prefix from @mention snapshots
        // Cards with null value are labelled "N/A (page not open)" so AI knows it's a data gap, not a real value
        const cardContextPrefix = cardSnapshots.length > 0
            ? '[Live Card Data from Dashboard]\n' + cardSnapshots.map(s => {
                const valStr = s.value !== null && s.value !== undefined ? s.value : 'N/A (page not open)';
                const scoreStr = s.score !== null && s.score !== undefined ? `${s.score}/100` : '?/100';
                return `${s.displayName || s.cardId}: ${valStr} (${scoreStr} — ${s.signal ?? 'N/A'})` +
                    (s.additionalContext ? ` | ${s.additionalContext}` : '');
            }).join('\n') + '\n\n'
            : '';

        // 1. Fetch saved system instruction for targetId
        const savedPrompt = await AiCardPrompt.findOne({ targetId }).lean();
        let systemInstruction = savedPrompt?.systemInstruction;
        
        if (!systemInstruction) {
            if (targetId === 'master_qchat') {
                systemInstruction = `You are PAI, the Praxis AI assistant. You are engaging in an interactive chat with the user on the Master Dashboard (Global Praxis). You have context of all technicals, fundamentals, and macro indicators. Be helpful, concise, and conversational.`;
            } else if (targetId === 'qchat_global') {
                systemInstruction = `You are PAI, the Praxis AI assistant. You are engaging in an interactive chat with the user on the Foreign Markets (Global Macro) dashboard. This page tracks global indices, commodities, and currency. Be helpful, concise, and conversational regarding global impact on India.`;
            } else if (targetId === 'qchat_fundamentals') {
                systemInstruction = `You are PAI, the Praxis AI assistant. You are engaging in an interactive chat with the user on the Fundamentals dashboard. Be helpful, concise, and conversational regarding valuation, earnings, and fundamentals.`;
            } else if (targetId === 'qchat_technical') {
                systemInstruction = `You are PAI, the Praxis AI assistant. You are engaging in an interactive chat with the user on the Technical Analysis dashboard. Be helpful, concise, and conversational regarding price action, trends, and momentum.`;
            } else if (targetId === 'qchat_options') {
                systemInstruction = `You are PAI, the Praxis AI assistant. You are engaging in an interactive chat with the user on the Options Flow dashboard. Be helpful, concise, and conversational regarding derivatives and open interest.`;
            } else if (targetId.startsWith('qchat_')) {
                systemInstruction = `You are PAI, the Praxis AI assistant. You are engaging in an interactive chat with the user regarding ${targetId.replace('qchat_', '')}. Be helpful, concise, and conversational. Do not hallucinate data; if you don't know, ask the user to provide it.`;
            } else {
                systemInstruction = `You are Praxis, an elite Indian financial market analyst AI. You are chatting with the user about the ${targetId.replace(/_/g, ' ')} indicator. Answer their specific message directly, be conversational, and do not auto-generate generic insights if the user is just saying hello.`;
            }
        } else {
            systemInstruction += `\n\n(NOTE: You are currently in an interactive chat session with the user. Respond directly to their latest message in a conversational manner, using the rules above as your persona. Do not blindly generate an insight if they are just saying hello.)`;
        }

        // Extremely strict guardrail to prevent the AI from appending "Verdict:" or robotic summaries 
        // to natural conversational responses
        systemInstruction += `\n\nCRITICAL RULE: DO NOT append "Verdict: Bullish/Bearish" or any structured JSON/formatting to your response unless the user EXPLICITLY asks for a verdict in their latest message. Act completely natural and conversational.`;

        // Golden Rule: Anti-Hallucination
        systemInstruction += `\n\nGOLDEN RULE (ANTI-HALLUCINATION): You must NEVER invent, guess, or hallucinate financial data (prices, scores, ratios, etc.). If you do not have the specific data points in your provided context to answer the user's question, you must explicitly state that you don't have that data. Do not make up numbers.`;

        // Golden Rule: Personalization
        systemInstruction += `\n\nGOLDEN RULE: The user you are talking to is named Shanif, and his nickname is Shanu. Acknowledge this identity and refer to him by his name or nickname when appropriate.`;

        // Engine Power Levels
        if (contextData?.maxAiLevel) {
            systemInstruction += `\n\nINTELLIGENCE LEVEL: You are part of a multi-model cognitive engine. The models are ranked by power from Level 1 up to Level ${contextData.maxAiLevel} (Max Level). If the user asks what the max level is, tell them it is Level ${contextData.maxAiLevel}. The user can change levels by saying 'choose level X for this conversation'.`;
        }

        // 2. Fetch thread history
        const thread = await AiChatThread.findOne({ targetId, scope, userId }).lean();
        // Take last 6 messages to strictly conserve context window size limits
        const history = thread?.entries?.slice(-6) || [];

        // 3. Call AI Gateway
        const isHeaderTarget = targetId.endsWith('_header') || targetId.startsWith('qchat_') || targetId.includes('manual');
        const response = await aiGateway.process({
            taskType: 'chat_conversation',
            prompt: cardContextPrefix + message,  // #mention card data prepended
            systemInstruction,
            history,
            data: Object.keys(contextData).length > 0 ? contextData : null,
            jsonMode: false,
            maxTokens: savedPrompt?.maxTokens || (isHeaderTarget ? 2000 : 800),
            explicitProvider,
            explicitModel
        });

        if (response.error) {
            return res.status(500).json({ error: response.message || 'AI Gateway error' });
        }

        const insight = response.text?.trim() || null;

        // 4. Persist to thread
        if (insight) {
            await AiChatThread.findOneAndUpdate(
                { targetId, scope, userId },
                {
                    $push: {
                        entries: {
                            $each: [
                                { role: 'user', content: message, cardValue: contextData?.score, timestamp: new Date() },
                                {
                                    role: 'assistant',
                                    content: insight,
                                    model: response.model,
                                    provider: response.provider,
                                    latencyMs: response.latencyMs,
                                    cardValue: contextData?.score,
                                    timestamp: new Date()
                                }
                            ],
                            $slice: -100
                        }
                    },
                    $inc: { entryCount: 2 }
                },
                { upsert: true }
            );
        }

        // 5. Return latest message
        res.json({
            message: insight,
            targetId,
            provider: response.provider,
            model: response.model,
            latencyMs: response.latencyMs,
        });

    } catch (err) {
        console.error('POST /ai-prompts/chat/:targetId error:', err.message);
        import('fs').then(fs => fs.appendFileSync('chat_debug.log', 'ERROR: ' + err.stack + '\\n')).catch(e=>{});
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/ai-prompts/transcribe
 * Endpoint to receive audio files and transcribe them using Groq Whisper.
 */
router.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: true, message: 'No audio file provided' });
        }

        const audioBuffer = req.file.buffer;
        const originalName = req.file.originalname;
        const mimeType = req.file.mimetype;

        console.log(`[STT] Received audio for transcription: ${originalName} (${mimeType}), ${audioBuffer.length} bytes`);

        const transcribedText = await transcribeAudio(audioBuffer, originalName, mimeType);
        console.log(`[STT] Transcription successful: "${transcribedText}"`);

        res.json({ success: true, text: transcribedText });
    } catch (error) {
        console.error('[STT] Transcription error:', error);
        res.status(500).json({ error: true, message: 'Transcription failed', details: error.message });
    }
});

export default router;
