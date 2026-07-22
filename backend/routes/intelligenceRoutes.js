import express from "express";
import { getLatestAiPageSnapshot, getAiPageHistory, upsertAiCardStore } from "../config/localDb.js";
import InstrumentOverride from "../models/InstrumentOverride.js";
import { protect } from "../middleware/authMiddleware.js";
import aiGateway from "../ai-gateway/index.js";

const router = express.Router();

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

        const page_name = type === "fundamental" ? "Fundamental" : 
                          type === "technical" ? "Technical" : 
                          type === "options" ? "Options" : "Fundamental";

        const history = getAiPageHistory(instrument_key, page_name, parseInt(limit));

        res.json({
            status: "success",
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error("❌ Error fetching intelligence history:", error.message);
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

        const page_name = type === "fundamental" ? "Fundamental" : 
                          type === "technical" ? "Technical" : 
                          type === "options" ? "Options" : "Fundamental";

        const snapshot = getLatestAiPageSnapshot(instrument_key, page_name);

        res.json({ status: "success", data: snapshot });
    } catch (error) {
        console.error("❌ Error fetching latest intelligence:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   POST /api/v1/intelligence/sync
 * @desc    Stream finished AI Snapshots from Frontend natively into SQLite
 * @access  Private
 */
router.post("/sync", protect, async (req, res) => {
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
                    console.error("❌ Card missing ID in payload from:", page_name, card);
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
            }
        }

        res.json({ status: "success", message: "Snapshot synced to SQLite successfully" });
    } catch (error) {
        console.error("❌ Error syncing intelligence:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   GET /api/v1/intelligence/overrides
 * @desc    Get manual overrides for an instrument
 * @access  Private
 */
router.get("/overrides", protect, async (req, res) => {
    try {
        const { instrument_key } = req.query;
        if (!instrument_key) return res.status(400).json({ error: "instrument_key is required" });

        const overrideDoc = await InstrumentOverride.findOne({ instrumentKey: instrument_key });
        res.json({ status: "success", data: overrideDoc ? overrideDoc.overrides : {} });
    } catch (error) {
        console.error("❌ Error fetching overrides:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * @route   POST /api/v1/intelligence/overrides
 * @desc    Save manual overrides for an instrument
 * @access  Private
 */
router.post("/overrides", protect, async (req, res) => {
    try {
        const { instrument_key, overrides } = req.body;
        if (!instrument_key) return res.status(400).json({ error: "instrument_key is required" });

        const overrideDoc = await InstrumentOverride.findOneAndUpdate(
            { instrumentKey: instrument_key },
            { $set: { overrides } },
            { new: true, upsert: true }
        );

        res.json({ status: "success", data: overrideDoc.overrides });
    } catch (error) {
        console.error("❌ Error saving overrides:", error.message);
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

        // @TODO (Phase 0): Use metricId to lookup custom prompt from aiCardPrompts registry
        // For now, fallback to generic template using the human-readable metric name
        const prompt = `Generate a 1-sentence insight about ${metric} for ${stockSymbol}. Current value: ${value}. ${sectorAvg ? `Sector Average: ${sectorAvg}. ` : ""}${historicalContext ? `Historical Trend: ${historicalContext.trend}. ` : ""} Keep it extremely concise and actionable.`;

        const response = await aiGateway.process({
            taskType: 'per_card_insight',
            prompt,
            data: { metric, metricId, value, sectorAvg, historicalContext, stockSymbol, module },
            jsonMode: false,
            maxTokens: 80
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
        console.error("❌ Error generating card insight:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
