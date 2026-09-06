import express from 'express';
import db from '../config/localDb.js';

const router = express.Router();

// Prepared statements — prepared once at module load, reused for every request
const getAllCatalysts = db.prepare('SELECT * FROM catalysts ORDER BY event_date ASC');
const insertCatalyst = db.prepare(
    'INSERT INTO catalysts (title, event_date, impact, category, description) VALUES (?, ?, ?, ?, ?)'
);

// GET /api/v1/catalysts — all catalysts
router.get('/', (req, res) => {
    try {
        const events = getAllCatalysts.all();
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching catalysts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/catalysts — add new catalyst
router.post('/', (req, res) => {
    try {
        const { title, event_date, impact, category, description } = req.body;
        if (!title || !event_date) {
            return res.status(400).json({ success: false, message: 'Title and event_date are required' });
        }
        const result = insertCatalyst.run(title, event_date, impact || 'Low', category || 'Macro', description || '');
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('Error adding catalyst:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;

