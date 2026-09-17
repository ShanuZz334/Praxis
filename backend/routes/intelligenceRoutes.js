import express from "express";
import { getLatestAiPageSnapshot, getAiPageHistory, upsertAiCardStore, insertCardScoreHistory } from "../config/localDb.js";
import db from "../config/localDb.js";
import { protect } from "../middleware/authMiddleware.js";
import aiGateway from "../ai-gateway/index.js";
import AiRouting from "../models/AiRouting.js";
import { runFundamentalIntelligence, forceFullAppSynchronization } from "../services/intelligenceCron.js";
import { broadcast } from "../services/socketBroadcast.js";
import { sanitizeAiErrorMessage } from "../ai-gateway/utils/aiErrorSanitizer.js";

const router = express.Router();

router.get("/force-cron", async (req, res) => {
    try {
        const instrument_key = req.body?.instrument_key || req.query?.instrument_key || null;
        const result = await forceFullAppSynchronization({ targetInstrument: instrument_key });
        res.json({ status: "success", message: "Intelligence Cron forced successfully.", details: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * @route   POST /api/v1/intelligence/force-sync
 * @route   GET  /api/v1/intelligence/force-sync
 * @desc    Trigger instant, all-engine background sync + market data refresh for dashboard
 * @access  Public / Private
 */
const handleForceSyncRequest = async (req, res) => {
    try {
        const instrument_key = req.body?.instrument_key || req.query?.instrument_key || null;
        const result = await forceFullAppSynchronization({ targetInstrument: instrument_key });
        res.json({
            status: "success",
            message: "Full app synchronization completed successfully across all intelligence engines.",
            data: result
        });
    } catch (error) {
        console.error("[ForceSync] Error in force-sync handler:", error);
        res.status(500).json({ status: "error", error: error.message });
    }
};

router.post("/force-sync", handleForceSyncRequest);
router.get("/force-sync", handleForceSyncRequest);


/**
 * @route   GET /api/v1/intelligence/history
 * @desc    Get structured intelligence history for an instrument (AI Box format)
 * @access  Private
 */
router.get("/history", protect, async (req, res) => {
    try {
        const { instrument_key, type = "fundamental", limit = 100 } = req.query;

        if (!instrument_key) {
            return res.status(400).json({ error: "instrument_key is required" });
        }

        const page_name = (type === "fundamental" || type === "fundamentals") ? "Fundamentals" : 
                          type === "technical" ? "Technical" : 
                          type === "options" ? "Options" : "Fundamentals";

        const history = getAiPageHistory(instrument_key, page_name, parseInt(limit));

        res.json({
            status: "success",
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error("[Intelligence] Error fetching intelligence history:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   GET /api/v1/intelligence/latest
 * @desc    Get the most recent AI snapshot (for Single Source of Truth dashboard)
 * @access  Private
 */
router.get("/latest", protect, async (req, res) => {
    try {
        const { instrument_key, type = "fundamental" } = req.query;
        if (!instrument_key) return res.status(400).json({ error: "instrument_key is required" });

        const page_name = (type === "fundamental" || type === "fundamentals") ? "Fundamentals" : 
                          type === "technical" ? "Technical" : 
                          type === "options" ? "Options" : "Fundamentals";

        const snapshot = getLatestAiPageSnapshot(instrument_key, page_name);

        res.json({ status: "success", data: snapshot });
    } catch (error) {
        console.error("[Intelligence] Error fetching latest intelligence:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   POST /api/v1/intelligence/sync
 * @desc    Stream finished AI Snapshots from Frontend natively into SQLite
 * @access  Private
 */
router.post("/sync", async (req, res) => {
    try {
        const { instrument_key, page_name, payload } = req.body;
        
        if (!instrument_key || !page_name || !payload) {
            return res.status(400).json({ error: "instrument_key, page_name, and payload are required" });
        }

        const nowIso = new Date().toISOString();

        // 1. Header (Scores, Tailwinds, Risks, Regime)
        upsertAiCardStore(
            instrument_key, 
            page_name, 
            "Header", 
            "Summary", 
            nowIso, 
            {
                compositeScore: payload.compositeScore,
                regime: payload.regime,
                tailwinds: payload.tailwinds,
                risks: payload.risks,
                aiInsight: payload.aiInsight
            }
        );

        // 2. Sections
        if (payload.sections) {
            upsertAiCardStore(
                instrument_key,
                page_name,
                "Sections",
                "List",
                nowIso,
                { sections: payload.sections }
            );
        }

        // 3. Individual Cards
        if (payload.cards && Array.isArray(payload.cards)) {
            for (const card of payload.cards) {
                if (!card.id) {
                    console.error("[Intelligence] Card missing ID in payload from:", page_name, card);
                    continue;
                }
                upsertAiCardStore(
                    instrument_key,
                    page_name,
                    "Cards",
                    card.id,
                    nowIso,
                    card
                );

                // Insert into gauge score history (append-only)
                const signal = typeof card.normalized === 'number' ? card.normalized : null;
                const gauge_score = typeof card.score === 'number' ? card.score : null;
                
                if (gauge_score !== null) {
                    insertCardScoreHistory(
                        instrument_key,
                        page_name,
                        "Cards",
                        card.id,
                        nowIso,
                        signal,
                        gauge_score
                    );
                }
            }
        }

        // 4. Also write to header_data so Master Dashboard's GET /snapshots/header picks up
        //    the correct page-computed scores (e.g. FUND=52, OPT=51) not the cron's simplified scores.
        if (typeof payload.compositeScore === 'number' && payload.compositeScore > 0) {
            const PAGE_TO_CATEGORY = {
                'Fundamentals': 'fundamental',
                'Technical':    'technical',
                'Options':      'options',
                'Foreign':      'global',
                'Global':       'global',   // ForeignPage passes pageName='Global'
                'Events':       'events',
            };
            const category = PAGE_TO_CATEGORY[page_name];
            if (category) {
                // Normalize instrument_key: global/events always stored under 'GLOBAL' key
                // (ForeignPage uses 'GLOBAL_MACRO', master reads 'GLOBAL' via snapshotRoutes)
                const hdKey = (category === 'global' || category === 'events') ? 'GLOBAL' : instrument_key;
                const cardCounts = {};
                if (payload.cards && Array.isArray(payload.cards)) {
                    for (const c of payload.cards) {
                        if (c.id && c.score != null) cardCounts[c.id] = c.score;
                    }
                } else if (payload.rawScores && typeof payload.rawScores === 'object') {
                    for (const [k, v] of Object.entries(payload.rawScores)) {
                        if (v != null && !isNaN(v)) cardCounts[k] = Number(v);
                    }
                } else if (payload.counts && typeof payload.counts === 'object') {
                    for (const [k, v] of Object.entries(payload.counts)) {
                        if (v != null && !isNaN(v)) cardCounts[k] = Number(v);
                    }
                }
                const treePayload = payload.nestedTreePayload || payload.tree_payload || payload.tree_payload_json || null;
                try {
                    db.prepare(`
                        INSERT INTO header_data (
                            instrument_key, category, composite_score, regime_json, 
                            tailwinds_json, risks_json, counts_json, tree_payload_json, updated_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(instrument_key, category) DO UPDATE SET
                            composite_score = excluded.composite_score,
                            regime_json     = COALESCE(excluded.regime_json, header_data.regime_json),
                            tailwinds_json  = COALESCE(excluded.tailwinds_json, header_data.tailwinds_json),
                            risks_json      = COALESCE(excluded.risks_json, header_data.risks_json),
                            counts_json     = COALESCE(excluded.counts_json, header_data.counts_json),
                            tree_payload_json = COALESCE(excluded.tree_payload_json, header_data.tree_payload_json),
                            updated_at      = excluded.updated_at
                    `).run(
                        hdKey,
                        category,
                        payload.compositeScore,
                        payload.regime ? JSON.stringify(payload.regime) : null,
                        payload.tailwinds ? JSON.stringify(payload.tailwinds) : null,
                        payload.risks ? JSON.stringify(payload.risks) : null,
                        Object.keys(cardCounts).length > 0 ? JSON.stringify(cardCounts) : null,
                        treePayload ? (typeof treePayload === 'string' ? treePayload : JSON.stringify(treePayload)) : null,
                        nowIso
                    );

                    // Broadcast snapshot over socket so Master Dashboard and other pages update instantly
                    broadcast('intelligence:snapshot', {
                        instrument_key: hdKey,
                        [category]: {
                            composite_score: payload.compositeScore,
                            regime: typeof payload.regime === 'object' ? payload.regime?.label : payload.regime,
                            counts: cardCounts,
                            tailwinds: payload.tailwinds || [],
                            risks: payload.risks || payload.headwinds || [],
                            tree_payload: treePayload
                        }
                    });
                } catch (hdErr) {
                    console.error(`[header_data] write failed for ${page_name}:`, hdErr.message);
                }
            }
        }

        res.json({ status: "success", message: "Snapshot synced to SQLite successfully" });
    } catch (error) {
        console.error("[Intelligence] Error syncing intelligence:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


/**
 * @route   GET /api/v1/intelligence/overrides
 * @desc    Get manual overrides for an instrument (now reads from SQLite user_overrides)
 * @access  Private
 */
router.get("/overrides", protect, async (req, res) => {
    try {
        const { instrument_key, module_key = 'fundamentals' } = req.query;
        if (!instrument_key) return res.status(400).json({ error: "instrument_key is required" });

        const rows = db.prepare(`
            SELECT field_key, value FROM user_overrides
            WHERE module_key = ? AND instrument_key = ?
        `).all(module_key, instrument_key);

        const overrides = {};
        for (const row of rows) overrides[row.field_key] = row.value;

        res.json({ status: "success", data: overrides });
    } catch (error) {
        console.error("[Intelligence] Error fetching overrides:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


/**
 * @route   POST /api/v1/intelligence/overrides
 * @desc    Save manual overrides for an instrument (now stored in SQLite user_overrides)
 * @access  Private
 */
router.post("/overrides", protect, async (req, res) => {
    try {
        const { instrument_key, overrides, module_key = 'fundamentals' } = req.body;
        if (!instrument_key || !overrides) return res.status(400).json({ error: "instrument_key and overrides are required" });

        // Batch-write each override field to SQLite user_overrides table
        const upsert = db.prepare(`
            INSERT INTO user_overrides (module_key, instrument_key, field_key, value, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(module_key, instrument_key, field_key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
        `);
        const batchWrite = db.transaction((entries) => {
            for (const [fieldKey, value] of entries) {
                upsert.run(module_key, instrument_key, fieldKey, String(value ?? ''));
            }
        });
        batchWrite(Object.entries(overrides));

        res.json({ status: "success", data: overrides });
    } catch (error) {
        console.error("[Intelligence] Error saving overrides:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   POST /api/v1/intelligence/card-insight
 * @desc    Generate a 1-2 sentence contextual AI insight for a specific indicator card
 * @access  Private
 */
router.post("/card-insight", protect, async (req, res) => {
    try {
        const { metric, metricId, value, sectorAvg, historicalContext, stockSymbol, module } = req.body;

        if (!metric || !stockSymbol) {
            return res.status(400).json({ error: "metric and stockSymbol are required" });
        }

        if (value === null || value === undefined) {
            return res.json({ insight: null, reason: "insufficient_data", cached: false });
        }

        const routing = await AiRouting.findOne({ isSingleton: true }).lean();
        
        let verbosityInstruction = "";
        let finalMaxTokens = 1536;
        
        if (routing && routing.cardInsight) {
            const verbLevel = routing.cardInsight.verbosity;
            let numVerbosity = 150;
            if (typeof verbLevel === 'number') {
                numVerbosity = verbLevel;
            } else if (verbLevel === 'short') {
                numVerbosity = 50;
            } else if (verbLevel === 'detailed') {
                numVerbosity = 350;
            }

            if (numVerbosity <= 100) {
                verbosityInstruction = ` Generate exactly 1 to 2 short sentences total (maximum ${numVerbosity} words). NO MORE. Conclude completely.`;
            } else if (numVerbosity >= 350) {
                verbosityInstruction = ` Provide a detailed, comprehensive analysis (target ${numVerbosity} words). Conclude naturally.`;
            } else {
                verbosityInstruction = ` Generate EXACTLY ONE SINGLE PARAGRAPH (target ${numVerbosity} words). Keep it concise and actionable.`;
            }
            finalMaxTokens = Math.max(1024, Math.floor(numVerbosity * 3.5));
        }

        const prompt = `Generate an insight about ${metric} for ${stockSymbol}. Current value: ${value}. ${sectorAvg ? `Sector Average: ${sectorAvg}. ` : ""}${historicalContext ? `Historical Trend: ${historicalContext.trend}. ` : ""}${verbosityInstruction}`;

        const response = await aiGateway.process({
            taskType: 'per_card_insight',
            prompt,
            data: { metric, metricId, value, sectorAvg, historicalContext, stockSymbol, module },
            jsonMode: false,
            maxTokens: finalMaxTokens,
            temperature: routing?.temperature !== undefined ? routing.temperature : 0.7
        });

        if (response.error) {
            return res.status(500).json({ error: response.message || "AI processing failed", details: response.details });
        }

        res.json({
            insight: response.text?.trim() || null,
            provider: response.provider,
            model: response.model,
            latencyMs: response.latencyMs,
            cached: !!response.cached
        });
    } catch (error) {
        console.error("[Intelligence] Error generating card insight:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   POST /api/v1/intelligence/backtest-walkthrough
 * @desc    Generate an institutional strategic diagnosis & walkthrough from scorecard metrics & test configs.
 *          Prefers local 7B / Ollama if available, backed by AI Gateway fallback chain and quantitative guardrails.
 * @access  Public / Private
 */
router.post("/backtest-walkthrough", async (req, res) => {
    try {
        const { summary = {}, config = {}, instrument = "N/A", timeframe = "1d", activeUnit = "PREDICTOR" } = req.body;

        if (!summary || typeof summary !== "object") {
            return res.status(400).json({ status: "error", error: "Invalid summary payload provided" });
        }

        // 1. Sanitize string inputs against injection
        const cleanInstrument = String(instrument).replace(/[<>{}[\]]/g, "").slice(0, 80);
        const cleanTimeframe = String(timeframe).replace(/[<>{}[\]]/g, "").slice(0, 20);
        const cleanUnit = String(activeUnit).replace(/[<>{}[\]]/g, "").slice(0, 30);
        const cleanMode = String(config.mode || "SWING").replace(/[<>{}[\]]/g, "").slice(0, 30);
        const cleanExitMode = String(config.targetStopMode || "TARGET_STOP").replace(/[<>{}[\]]/g, "").slice(0, 40);

        // 2. Extract verified metrics
        const winRate = summary.winRate ?? 0;
        const wins = summary.wins ?? 0;
        const losses = summary.losses ?? 0;
        const totalTrades = summary.totalTrades ?? (wins + losses);
        const profitFactor = summary.profitFactor ?? 0;
        const realizedRR = summary.realizedRR ?? 1;
        const expectancy = summary.expectancy ?? 0;
        const netReturnPct = summary.netReturnPct ?? 0;
        const maxDrawdownPct = Math.abs(summary.maxDrawdownPct ?? 0);
        const sharpeRatio = summary.sharpeRatio ?? 0;
        const sortinoRatio = summary.sortinoRatio ?? 0;
        const calmarRatio = summary.calmarRatio ?? 0;
        const endingCapital = summary.endingCapital ? `₹${summary.endingCapital.toLocaleString('en-IN')}` : "N/A";
        const maxConsecWins = summary.maxConsecutiveWins ?? 0;
        const maxConsecLosses = summary.maxConsecutiveLosses ?? 0;
        const durationCandles = summary.avgTradeDurationCandles ?? 0;

        // Mathematical break-even calculation: WR_be = 1 / (1 + RR)
        const breakEvenWR = Math.round((1 / (1 + Math.max(0.01, realizedRR))) * 1000) / 10;
        const recoveryGainRequired = maxDrawdownPct > 0 && maxDrawdownPct < 100
            ? Math.round(((1 / (1 - maxDrawdownPct / 100)) - 1) * 1000) / 10
            : 0;

        // Multi-year breakdown
        const matrix = Array.isArray(summary.annualMatrix) ? summary.annualMatrix : [];
        const annualSummary = matrix.length > 0
            ? matrix.map(m => `${m.year}: ${m.returnPct >= 0 ? '+' : ''}${m.returnPct}% (${m.trades} trades, ${m.winRate}% WR)`).slice(0, 10).join("; ")
            : "No annual breakdown available";

        // 3. Construct institutional prompt
        const systemInstruction = `You are an elite Institutional Quantitative Risk Auditor and Chief Trading Systems Architect for the Praxis platform.
Your client is Shanif (nickname Shanu).
You must NEVER hallucinate or alter any numbers. Stick strictly to the exact figures supplied.

Deliver a rigorous, unhedged, direct, and actionable "Scorecard Strategic Diagnosis & Walkthrough".
Your response MUST be formatted in clean, professional markdown with these exact numbered sections:

### 1. Executive Verdict & Edge Health
- Blunt, unambiguous assessment of whether this system has an edge or is fatally bleeding capital.
- State whether this configuration is viable or completely unviable for live execution.

### 2. Trading Style Suitability (Swing vs Intraday vs Scalp)
- Evaluate whether this strategy actually works for Swing Trading, Day Trading, or Scalping based on holding duration (${durationCandles} candles on ${cleanTimeframe}) and drawdown behavior.
- Clearly declare if it's "good for swing", "marginal", or "fully toxic".

### 3. Core Mathematical Leaks & Exit Mechanics
- Analyze the break-even math: Win Rate (${winRate}%) vs Required Break-Even (${breakEvenWR}%) at Realized R:R (${realizedRR}x).
- Explain how the Expectancy (${expectancy}% per trade) drives cumulative decay.
- Address the Exit Model (${cleanExitMode}, Horizon: ${config.maxHorizonCandles || 'N/A'} candles, Target: ${config.targetPct || 'N/A'}%, Stop: ${config.stopLossPct || 'N/A'}%).

### 4. Capital Ruin & Drawdown Math
- Dissect the peak drawdown of -${maxDrawdownPct}%. Emphasize the asymmetrical recovery burden (+${recoveryGainRequired}% gain needed to break even).
- Address the impact of the ${maxConsecLosses}-loss losing streak and risk-of-ruin.

### 5. Multi-Year Regime Resilience
- Review cyclical performance (${annualSummary}). Explain whether the system survives bear markets or regime shifts.

### 6. Prescriptive Optimization Roadmap
- Give 3 to 4 concrete, prioritized parameter changes (e.g. SL/TP adjustment, ATR trailing stop, minimum confidence threshold filter) to fix the strategy.

### Output Completeness Mandate:
- Deliver rigorous, institutional-grade quantitative reasoning.
- Every section and every priority bullet point MUST be completely finished with full analysis.
- Conclude naturally and cleanly. NEVER stop mid-sentence or leave recommendations unfinished.`;

        const userPrompt = `Audit and synthesize this quantitative backtest scorecard:
- Asset / Instrument: ${cleanInstrument} (${cleanTimeframe}) | Mode: ${cleanMode} | Unit: ${cleanUnit}
- Total Executions: ${totalTrades} (${wins} Wins / ${losses} Losses)
- Win Rate: ${winRate}% (Mathematical Break-Even Needed: ${breakEvenWR}%)
- Realized Risk-Reward: ${realizedRR}x | Profit Factor: ${profitFactor}
- Mathematical Expectancy: ${expectancy}% per trade
- Net Cumulative Return: ${netReturnPct}% | Ending Capital: ${endingCapital}
- Max Peak-to-Trough Drawdown: -${maxDrawdownPct}% (Requires +${recoveryGainRequired}% to break even)
- Max Consecutive Streaks: ${maxConsecWins} Wins / ${maxConsecLosses} Losses
- Average Position Duration: ${durationCandles} candles
- Exit Model Config: Mode = ${cleanExitMode}, Target = ${config.targetPct || 'N/A'}%, Stop = ${config.stopLossPct || 'N/A'}%, Horizon = ${config.maxHorizonCandles || 'N/A'} candles
- Annual Breakdown: ${annualSummary}`;

        const { forceRefresh = false } = req.body;

        // 4. Dispatch through AI Gateway (classified as 'report_generation', prioritizing local 7B / Ollama with fallback)
        const response = await aiGateway.process({
            taskType: "report_generation",
            prompt: userPrompt,
            systemInstruction,
            maxTokens: 4096,
            temperature: 0.25,
            forceRefresh: Boolean(forceRefresh),
            data: { instrument: cleanInstrument, timeframe: cleanTimeframe, winRate, profitFactor, maxDrawdownPct }
        });

        if (response.error) {
            const sanitized = sanitizeAiErrorMessage(response.message || "AI Gateway processing failed", response.provider || "AI Gateway");
            return res.status(502).json({
                status: "error",
                error: sanitized.cleanMessage,
                details: sanitized
            });
        }

        const walkthroughText = response.text?.trim() || "";

        return res.json({
            status: "success",
            data: {
                walkthrough: walkthroughText,
                provider: response.provider,
                model: response.model,
                latencyMs: response.latencyMs,
                cached: !!response.cached
            }
        });

    } catch (error) {
        console.error("[Intelligence] Error generating backtest walkthrough:", error.message);
        const sanitized = sanitizeAiErrorMessage(error.message, "AI Gateway");
        return res.status(500).json({
            status: "error",
            error: sanitized.cleanMessage
        });
    }
});

export default router;
