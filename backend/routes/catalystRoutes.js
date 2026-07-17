import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';

const router = express.Router();
const dbPath = path.join(process.cwd(), 'local_data', 'praxis_market.db');

// GET all catalysts
router.get('/', (req, res) => {
    try {
        const db = new Database(dbPath);
        const events = db.prepare('SELECT * FROM catalysts ORDER BY event_date ASC').all();
        db.close();
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching catalysts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST a new catalyst
router.post('/', (req, res) => {
    try {
        const { title, event_date, impact, category, description } = req.body;
        if (!title || !event_date) return res.status(400).json({ success: false, message: 'Title and event_date are required' });

        const db = new Database(dbPath);
        const stmt = db.prepare('INSERT INTO catalysts (title, event_date, impact, category, description) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(title, event_date, impact || 'Low', category || 'Macro', description || '');
        db.close();
        
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        console.error('Error adding catalyst:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
