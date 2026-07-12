import express from "express";
import IntelligenceSnapshot from "../models/IntelligenceSnapshot.js";
import InstrumentOverride from "../models/InstrumentOverride.js";
import { protect } from "../middleware/authMiddleware.js";

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

        const history = await IntelligenceSnapshot.find({ 
            instrumentKey: instrument_key,
            type: type
        })
        .sort({ timestamp: -1 }) // Newest first
        .limit(parseInt(limit));

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

        const snapshot = await IntelligenceSnapshot.findOne({ 
            instrumentKey: instrument_key,
            type: type
        }).sort({ timestamp: -1 });

        res.json({ status: "success", data: snapshot });
    } catch (error) {
        console.error("❌ Error fetching latest intelligence:", error.message);
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

export default router;
