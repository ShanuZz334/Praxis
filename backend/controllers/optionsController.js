import { query } from "../config/postgres.js";

/**
 * @desc    Get options chain for a symbol and expiry
 * @route   GET /api/v1/options/:symbol
 * @access  Public
 */
export const getOptionsChain = async (req, res) => {
    const { symbol } = req.params;
    const { expiry } = req.query; // Optional: filter by expiry

    if (!symbol) {
        return res.status(400).json({ message: "Symbol is required" });
    }

    try {
        let sql = `
            SELECT * FROM options_chain 
            WHERE symbol = $1
        `;
        const params = [symbol];

        if (expiry) {
            sql += ` AND expiry = $2`;
            params.push(expiry);
        }

        sql += ` ORDER BY strike ASC`;

        const { rows } = await query(sql, params);

        // Transform to frontend structure
        const formattedChain = rows.map(row => ({
            strike: parseFloat(row.strike),
            call: {
                ltp: parseFloat(row.call_ltp),
                oi: parseInt(row.call_oi),
                oiChg: parseFloat(row.call_oi_chg),
                vol: parseInt(row.call_vol),
                iv: parseFloat(row.call_iv),
                delta: parseFloat(row.call_delta),
                gamma: parseFloat(row.call_gamma),
                theta: parseFloat(row.call_theta),
                vega: parseFloat(row.call_vega)
            },
            put: {
                ltp: parseFloat(row.put_ltp),
                oi: parseInt(row.put_oi),
                oiChg: parseFloat(row.put_oi_chg),
                vol: parseInt(row.put_vol),
                iv: parseFloat(row.put_iv),
                delta: parseFloat(row.put_delta),
                gamma: parseFloat(row.put_gamma),
                theta: parseFloat(row.put_theta),
                vega: parseFloat(row.put_vega)
            }
        }));

        res.status(200).json(formattedChain);
    } catch (err) {
        console.error(`Error fetching options chain for ${symbol}:`, err.message);
        res.status(500).json({ message: "Failed to fetch options chain" });
    }
};

/**
 * @desc    Add or Update options chain data (Bulk Upsert)
 * @route   POST /api/v1/options
 * @access  Private
 */
export const upsertOptionsChain = async (req, res) => {
    const { symbol, expiry, data } = req.body; // data is array of strikes

    if (!symbol || !expiry || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid payload" });
    }

    try {
        const client = await query('BEGIN'); // Start transaction via helper logic if possible, or just individual queries
        // Note: simple 'query' helper doesn't expose client for transactions, so we'll do row-by-row for simplicity 
        // or assumes the helper handles it. For safety/speed, we'll just loop sequentially here as this is likely low volume admin task.

        for (const row of data) {
            const sql = `
                INSERT INTO options_chain (
                    symbol, expiry, strike,
                    call_ltp, call_oi, call_oi_chg, call_vol, call_iv, call_delta, call_gamma, call_theta, call_vega,
                    put_ltp, put_oi, put_oi_chg, put_vol, put_iv, put_delta, put_gamma, put_theta, put_vega
                ) VALUES (
                    $1, $2, $3,
                    $4, $5, $6, $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18, $19, $20, $21
                )
                ON CONFLICT (symbol, expiry, strike) DO UPDATE SET
                    call_ltp = EXCLUDED.call_ltp, call_oi = EXCLUDED.call_oi, call_oi_chg = EXCLUDED.call_oi_chg, call_vol = EXCLUDED.call_vol, call_iv = EXCLUDED.call_iv,
                    put_ltp = EXCLUDED.put_ltp, put_oi = EXCLUDED.put_oi, put_oi_chg = EXCLUDED.put_oi_chg, put_vol = EXCLUDED.put_vol, put_iv = EXCLUDED.put_iv;
            `;

            const values = [
                symbol, expiry, row.strike,
                row.call.ltp, row.call.oi, row.call.oiChg, row.call.vol, row.call.iv, row.call.delta, row.call.gamma, row.call.theta, row.call.vega,
                row.put.ltp, row.put.oi, row.put.oiChg, row.put.vol, row.put.iv, row.put.delta, row.put.gamma, row.put.theta, row.put.vega
            ];

            await query(sql, values);
        }

        res.status(200).json({ message: "Options chain updated successfully" });
    } catch (err) {
        console.error("Error upserting options chain:", err.message);
        res.status(500).json({ message: "Failed to update options chain" });
    }
};
