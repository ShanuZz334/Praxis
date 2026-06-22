import { query } from "../config/postgres.js";

/**
 * @desc    Get all events
 * @route   GET /api/v1/events
 * @access  Public
 */
export const getEvents = async (req, res) => {
    try {
        const sql = `
            SELECT * FROM events 
            ORDER BY date DESC 
            LIMIT 100
        `;

        const { rows } = await query(sql);

        // Transform keys to camelCase for frontend consistency
        const events = rows.map(row => ({
            id: row.id,
            title: row.title,
            date: row.date,
            category: row.category,
            impactScore: parseFloat(row.impact_score),
            consensus: row.consensus,
            previous: row.previous,
            marketSensitivity: row.market_sensitivity,
            type: row.type,
            reliability: parseFloat(row.reliability),
            description: row.description
        }));

        res.status(200).json(events);
    } catch (err) {
        console.error("Error fetching events:", err.message);
        res.status(500).json({ message: "Failed to fetch events" });
    }
};

/**
 * @desc    Add a new event
 * @route   POST /api/v1/events
 * @access  Private
 */
export const addEvent = async (req, res) => {
    const {
        title,
        date,
        category,
        impactScore,
        consensus,
        previous,
        marketSensitivity,
        type = 'event',
        reliability = 0.5,
        description
    } = req.body;

    if (!title || !date) {
        return res.status(400).json({ message: "Title and date are required" });
    }

    try {
        const sql = `
            INSERT INTO events (
                title, date, category, impact_score, consensus, previous, 
                market_sensitivity, type, reliability, description
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            title, date, category, impactScore, consensus, previous,
            marketSensitivity, type, reliability, description
        ];

        const { rows } = await query(sql, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error("Error adding event:", err.message);
        res.status(500).json({ message: "Failed to add event" });
    }
};
