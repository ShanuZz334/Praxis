import { query } from "../config/postgres.js";

/**
 * @desc    Get historical chart data for a specific metric
 * @route   GET /api/v1/charts/:metricKey
 * @access  Public (or Protected based on req)
 */
export const getChartData = async (req, res) => {
    const { metricKey } = req.params;
    const { days = 30 } = req.query;

    if (!metricKey) {
        return res.status(400).json({ message: "Metric key is required" });
    }

    try {
        // Fetch data for the last N days
        const sql = `
            SELECT date, value 
            FROM chart_data 
            WHERE metric_key = $1 
            ORDER BY date DESC 
            LIMIT $2
        `;

        const { rows } = await query(sql, [metricKey, days]);

        // Transform for frontend (Recharts expects date string)
        const formattedData = rows.map(row => ({
            date: new Date(row.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            value: parseFloat(row.value)
        })).reverse(); // specific order for charts

        res.status(200).json(formattedData);
    } catch (err) {
        console.error(`Error fetching chart data for ${metricKey}:`, err.message);
        res.status(500).json({ message: "Failed to fetch chart data" });
    }
};

/**
 * @desc    Insert or update chart data (Internal/Admin usage)
 * @route   POST /api/v1/charts
 */
export const upsertChartData = async (req, res) => {
    const { metricKey, date, value } = req.body;

    if (!metricKey || !date || value === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const sql = `
            INSERT INTO chart_data (metric_key, date, value)
            VALUES ($1, $2, $3)
            ON CONFLICT (metric_key, date) 
            DO UPDATE SET value = EXCLUDED.value;
        `;

        await query(sql, [metricKey, date, value]);
        res.status(200).json({ message: "Data saved successfully" });
    } catch (err) {
        console.error("Error saving chart data:", err.message);
        res.status(500).json({ message: "Failed to save data" });
    }
};
