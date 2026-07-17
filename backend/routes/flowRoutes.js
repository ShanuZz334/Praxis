import express from 'express';
import { getAiCardStoreHistory } from '../config/localDb.js';

const router = express.Router();

// GET /api/flow/history
// Returns the historical institutional flow data sorted by timestamp descending
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30; // Default to 30 days
        const skip = parseInt(req.query.skip) || 0;
        
        const history = getAiCardStoreHistory("GLOBAL", "Dashboard", "InstitutionalFlow", "FiiDiiSegmented", skip, limit);
            
        res.json({ success: true, data: history });
    } catch (error) {
        console.error("Error fetching flow history:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
