import express from 'express';
import db from '../config/localDb.js';

const router = express.Router();

// Prepared statements for fii_dii_history reads
const getHistoryRange = db.prepare(`
    SELECT date, fii_json, dii_json, updated_at
    FROM fii_dii_history
    ORDER BY date DESC
    LIMIT ? OFFSET ?
`);

// GET /api/flow/history
// Returns historical institutional flow data (newest first), one row per trading day
router.get('/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30;  // default 30 days
        const skip  = parseInt(req.query.skip)  || 0;

        const rows = getHistoryRange.all(limit, skip);

        const data = rows.map(row => ({
            timestamp: new Date(row.date).getTime(), // milliseconds for FiiDiiFlow.jsx
            date: row.date,
            fii: row.fii_json ? JSON.parse(row.fii_json) : {},
            dii: row.dii_json ? JSON.parse(row.dii_json) : {}
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching flow history:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
