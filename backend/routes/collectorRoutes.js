import express from "express";
import { queues } from "../services/queue/queues.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @desc    Manually trigger a collection job
 * @route   POST /api/v1/collect/run
 */
router.post("/run", protect, async (req, res) => {
    try {
        const { type, payload } = req.body;

        if (type === 'quotes') {
            if (!queues.realtimeQuotes) {
                return res.status(503).json({ message: "Queue system unavailable (Redis missing)" });
            }

            const job = await queues.realtimeQuotes.add('manual-fetch', payload || { symbols: ['AAPL', 'TSLA'] });
            return res.status(200).json({ message: "Job added", jobId: job.id });
        }

        res.status(400).json({ message: "Unknown job type" });

    } catch (err) {
        console.error("Collector Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
