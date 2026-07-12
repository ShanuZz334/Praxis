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

export default router;
