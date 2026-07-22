import express from "express";
import localDb from "../config/localDb.js";

const router = express.Router();

const insertSnapshotStmt = localDb.prepare(`
    INSERT INTO card_snapshots (
        instrument_key, card_id, raw_value, score, bias, snapshot_date
    ) VALUES (?, ?, ?, ?, ?, date('now', 'localtime'))
    ON CONFLICT(instrument_key, card_id, snapshot_date) DO UPDATE SET
        raw_value=excluded.raw_value,
        score=excluded.score,
        bias=excluded.bias
`);

const cleanupSnapshotsStmt = localDb.prepare(`
    DELETE FROM card_snapshots 
    WHERE snapshot_date < date('now', 'localtime', '-45 days')
`);

// @route   POST /api/v1/snapshots
// @desc    Upsert today's snapshots for an instrument's cards and prune old data
router.post("/", (req, res) => {
    try {
        const { snapshots } = req.body;
        if (!snapshots || !Array.isArray(snapshots)) {
            return res.status(400).json({ error: "Invalid snapshots array" });
        }

        const insertMany = localDb.transaction((snaps) => {
            for (const snap of snaps) {
                insertSnapshotStmt.run(
                    snap.instrument_key,
                    snap.card_id,
                    snap.raw_value,
                    snap.score,
                    snap.bias
                );
            }
            // Cleanup data older than 45 days (30 days + 15 days buffer)
            cleanupSnapshotsStmt.run();
        });

        insertMany(snapshots);

        res.json({ status: "success", message: "Snapshots saved and pruned." });
    } catch (error) {
        console.error("Error saving snapshots:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/snapshots/:instrument_key
// @desc    Get historical snapshots for an instrument
router.get("/:instrument_key", (req, res) => {
    try {
        const { instrument_key } = req.params;
        const rows = localDb.prepare(`
            SELECT card_id, raw_value, score, bias, snapshot_date 
            FROM card_snapshots 
            WHERE instrument_key = ?
            ORDER BY snapshot_date ASC
        `).all(instrument_key);

        // Group by card_id for easier frontend consumption
        const grouped = rows.reduce((acc, row) => {
            if (!acc[row.card_id]) acc[row.card_id] = [];
            acc[row.card_id].push({
                date: row.snapshot_date,
                raw_value: row.raw_value,
                score: row.score,
                bias: row.bias
            });
            return acc;
        }, {});

        res.json({ status: "success", data: grouped });
    } catch (error) {
        console.error("Error fetching snapshots:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   POST /api/v1/snapshots/header
// @desc    Upsert frontend calculated AI header (composite, regime, tailwinds, risks)
router.post("/header", (req, res) => {
    try {
        const { instrument_key, category, composite_score, regime_json, tailwinds_json, risks_json, counts_json, tree_payload_json } = req.body;
        
        if (!instrument_key || !category) {
            return res.status(400).json({ error: "instrument_key and category are required" });
        }

        localDb.prepare(`
            INSERT INTO header_data (
                instrument_key, category, composite_score, regime_json, tailwinds_json, risks_json, counts_json, tree_payload_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(instrument_key, category) DO UPDATE SET
                composite_score = COALESCE(excluded.composite_score, header_data.composite_score),
                regime_json = COALESCE(excluded.regime_json, header_data.regime_json),
                tailwinds_json = COALESCE(excluded.tailwinds_json, header_data.tailwinds_json),
                risks_json = COALESCE(excluded.risks_json, header_data.risks_json),
                counts_json = COALESCE(excluded.counts_json, header_data.counts_json),
                tree_payload_json = COALESCE(excluded.tree_payload_json, header_data.tree_payload_json),
                updated_at = CURRENT_TIMESTAMP
        `).run(
            instrument_key,
            category,
            composite_score !== undefined ? composite_score : null,
            regime_json !== undefined ? JSON.stringify(regime_json) : null,
            tailwinds_json !== undefined ? JSON.stringify(tailwinds_json) : null,
            risks_json !== undefined ? JSON.stringify(risks_json) : null,
            counts_json !== undefined ? JSON.stringify(counts_json) : null,
            tree_payload_json !== undefined ? JSON.stringify(tree_payload_json) : null
        );

        res.json({ status: "success", message: "Header state saved." });
    } catch (error) {
        console.error("Error saving header state:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route   GET /api/v1/snapshots/header/:instrument_key
// @desc    Get last known AI header state (fallback)
router.get("/header/:instrument_key", (req, res) => {
    try {
        const { instrument_key } = req.params;
        const { category } = req.query;

        if (category) {
            const row = localDb.prepare(`
                SELECT composite_score, regime_json, tailwinds_json, risks_json, tree_payload_json, updated_at 
                FROM header_data 
                WHERE instrument_key = ? AND category = ?
            `).get(instrument_key, category);

            if (row) {
                return res.json({
                    status: "success",
                    data: {
                        composite_score: row.composite_score,
                        regime: row.regime_json ? JSON.parse(row.regime_json) : null,
                        tailwinds: row.tailwinds_json ? JSON.parse(row.tailwinds_json) : [],
                        risks: row.risks_json ? JSON.parse(row.risks_json) : [],
                        tree_payload: row.tree_payload_json ? JSON.parse(row.tree_payload_json) : null,
                        updated_at: row.updated_at
                    }
                });
            } else {
                return res.json({ status: "success", data: null });
            }
        } else {
            // Fetch all categories for this instrument (plus global which is universal)
            const rows = localDb.prepare(`
                SELECT category, composite_score, regime_json, tailwinds_json, risks_json, counts_json, tree_payload_json, updated_at 
                FROM header_data 
                WHERE instrument_key = ? OR category = 'global' OR category = 'events'
            `).all(instrument_key);

            const result = {};
            for (const row of rows) {
                result[row.category] = {
                    composite_score: row.composite_score,
                    regime: row.regime_json ? JSON.parse(row.regime_json) : null,
                    tailwinds: row.tailwinds_json ? JSON.parse(row.tailwinds_json) : [],
                    risks: row.risks_json ? JSON.parse(row.risks_json) : [],
                    counts: row.counts_json ? JSON.parse(row.counts_json) : null,
                    tree_payload: row.tree_payload_json ? JSON.parse(row.tree_payload_json) : null,
                    updated_at: row.updated_at
                };
            }
            return res.json({ status: "success", data: result });
        }
    } catch (error) {
        console.error("Error fetching header state:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
