import express from "express";
import db from "../config/localDb.js";
import { aiGateway } from "../ai-gateway/index.js";
import {
    resolvePromptByInstrumentType,
    buildEventExtractionPrompt,
    detectInstrumentType,
    validateAndSanitizeEvent,
    computeEventScore
} from "../../frontend/stock-look/src/shared/global/logic/eventsEngine.js";

const router = express.Router();

/**
 * GET /api/v1/events
 * Fetch all market events, ordered by newest first.
 */
router.get("/", (req, res) => {
    try {
        const stmt = db.prepare(`SELECT * FROM market_events ORDER BY created_at DESC LIMIT 500`);
        const rows = stmt.all();
        
        const formatted = rows.map(r => {
            let assets = [];
            let keyPoints = [];
            if (r.affected_assets) { try { assets = JSON.parse(r.affected_assets); } catch (e) { assets = []; } }
            if (r.key_data_points)  { try { keyPoints = JSON.parse(r.key_data_points); } catch (e) { keyPoints = []; } }
            return {
                ...r,
                created_at:     r.created_at ? (r.created_at.includes('Z') ? r.created_at : r.created_at.replace(' ', 'T') + 'Z') : new Date().toISOString(),
                affected_assets: assets,
                key_data_points: keyPoints
            };
        });
        
        res.json({ success: true, data: formatted });
    } catch (e) {
        console.error("GET /events error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * POST /api/v1/events/preview
 * 1. Auto-detects instrument type from headline/content/source.
 * 2. Routes to the correct domain-specific system prompt.
 * 3. Sends to AI Gateway for extraction.
 * 4. Validates AI output and computes PES-7 score deterministically.
 * 5. Returns the sanitized event object for user confirmation.
 */
router.post("/preview", async (req, res) => {
    const { headline, summary, source, instrument_type: clientInstrumentType } = req.body;
    if (!headline) return res.status(400).json({ success: false, message: "Headline is required" });

    // Step 1: Determine instrument type (client may send auto-detected value, or we detect server-side)
    const instrumentType = clientInstrumentType || detectInstrumentType(headline, summary || "", source || "");
    
    // Step 2: Check if few-shot is enabled (from request header or default true)
    const useFewShot = req.headers["x-few-shot"] !== "false";

    // Step 3: Resolve the correct domain system prompt
    const systemPrompt = resolvePromptByInstrumentType(instrumentType, useFewShot);

    try {
        const aiRequest = {
            taskType:          "MARKET_EVENT_EXTRACTION",
            prompt:            buildEventExtractionPrompt(headline, summary || "", source || "Unknown", instrumentType),
            systemInstruction: systemPrompt,
            jsonMode:          true,
            temperature:       0.1,
            maxTokens:         900
        };

        const result = await aiGateway.process(aiRequest);

        if (result.error) {
            return res.status(500).json({ success: false, message: result.message });
        }

        // Step 4: Parse AI JSON response
        let rawAiData;
        try {
            rawAiData = JSON.parse(result.text);
        } catch (e) {
            try {
                const firstBrace = result.text.indexOf('{');
                const lastBrace  = result.text.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    rawAiData = JSON.parse(result.text.substring(firstBrace, lastBrace + 1));
                } else {
                    throw new Error("No JSON object found");
                }
            } catch (err2) {
                console.error("Failed to parse AI JSON. Raw text:", result.text);
                return res.status(500).json({ success: false, message: "AI output could not be parsed as JSON" });
            }
        }

        // Step 5: Inject auto-detected instrument type if AI didn't return it
        if (!rawAiData.instrument_type) rawAiData.instrument_type = instrumentType;

        // Step 6: Validate, sanitize, and compute PES-7 score deterministically
        const { valid, errors, sanitized } = validateAndSanitizeEvent(rawAiData);
        
        if (!valid) {
            console.warn("[Events Preview] AI output had validation issues:", errors);
        }

        // Always return sanitized data with computed score
        res.json({
            success: true,
            data:    sanitized,
            meta: {
                instrumentType,
                promptUsed: instrumentType,
                validationErrors: errors,
                scoreComputed: true
            }
        });

    } catch (e) {
        console.error("POST /events/preview error:", e);
        res.status(500).json({ success: false, message: "AI Extraction failed" });
    }
});

/**
 * POST /api/v1/events/confirm
 * Saves the confirmed (pre-validated, pre-scored) event to SQLite.
 */
router.post("/confirm", (req, res) => {
    const data = req.body;
    if (!data.headline) return res.status(400).json({ success: false, message: "Headline required" });

    try {
        // Re-validate and re-compute score on backend before saving (never trust client-sent score)
        const { sanitized } = validateAndSanitizeEvent(data);

        const stmt = db.prepare(`
            INSERT INTO market_events (
                headline, summary, category, sub_category, source, 
                sentiment, importance, severity, override_mode, 
                confidence, affected_assets, event_score, horizon, reasoning,
                instrument_type, key_data_points, ttl_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const info = stmt.run(
            sanitized.headline,
            sanitized.summary       || null,
            sanitized.category      || null,
            sanitized.sub_category  || null,
            sanitized.source        || null,
            sanitized.sentiment     || null,
            sanitized.importance    || null,
            sanitized.severity      || null,
            sanitized.override_mode || "None",
            sanitized.confidence    || 60,
            sanitized.affected_assets ? JSON.stringify(sanitized.affected_assets) : "[]",
            sanitized.event_score   || 0,
            sanitized.horizon       || null,
            sanitized.reasoning     || null,
            sanitized.instrument_type || "INDICES",
            sanitized.key_data_points ? JSON.stringify(sanitized.key_data_points) : "[]",
            sanitized.ttl_hours     || 72
        );

        res.json({ success: true, id: info.lastInsertRowid });
    } catch (e) {
        console.error("POST /events/confirm error:", e);
        res.status(500).json({ success: false, message: "Database insert failed: " + e.message });
    }
});

/**
 * DELETE /api/v1/events/:id
 * Deletes a market event by ID.
 */
router.delete("/:id", (req, res) => {
    try {
        const stmt = db.prepare(`DELETE FROM market_events WHERE id = ?`);
        const info = stmt.run(req.params.id);
        res.json({ success: true, deleted: info.changes });
    } catch (e) {
        console.error("DELETE /events/:id error:", e);
        res.status(500).json({ success: false, message: "Database delete failed: " + e.message });
    }
});

/**
 * POST /api/v1/events/migrate-scores
 * One-time migration: re-computes all existing event scores using the new
 * PES-7 v2 formula (±100 internal scale, with horizon weighting & sigmoid confidence).
 * Safe to run multiple times — idempotent.
 */
router.post("/migrate-scores", (req, res) => {
    try {
        const rows = db.prepare(`SELECT id, sentiment, importance, severity, confidence, horizon FROM market_events`).all();

        const updateStmt = db.prepare(`UPDATE market_events SET event_score = ? WHERE id = ?`);

        let updated = 0;
        let skipped = 0;

        const migrate = db.transaction(() => {
            for (const row of rows) {
                if (!row.sentiment || !row.importance || !row.severity) {
                    skipped++;
                    continue;
                }
                // Re-compute with new formula including horizon
                const newScore = computeEventScore(
                    row.sentiment,
                    row.importance,
                    row.severity,
                    row.confidence || 60,
                    row.horizon || "Positional"
                );
                updateStmt.run(newScore, row.id);
                updated++;
            }
        });

        migrate();

        console.log(`[Migration] Re-scored ${updated} events, skipped ${skipped}`);
        res.json({
            success: true,
            message: `Migration complete: ${updated} events re-scored with PES-7 v2 formula.`,
            updated,
            skipped
        });
    } catch (e) {
        console.error("POST /events/migrate-scores error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
