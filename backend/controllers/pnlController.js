import axios from "axios";

// This assumes you have stored Upstox access token somewhere (e.g., in DB or environment)
const UPSTOX_API_BASE = "https://api.upstox.com"; // replace with actual API base
const UPSTOX_ACCESS_TOKEN = process.env.UPSTOX_ACCESS_TOKEN;

// GET /api/pnl
export const getPnL = async (req, res) => {
  try {
    // Fetch all positions
    const positionsRes = await axios.get(`${UPSTOX_API_BASE}/positions`, {
      headers: { Authorization: `Bearer ${UPSTOX_ACCESS_TOKEN}` },
    });

    // Fetch all trades (optional)
    const tradesRes = await axios.get(`${UPSTOX_API_BASE}/trades`, {
      headers: { Authorization: `Bearer ${UPSTOX_ACCESS_TOKEN}` },
    });

    const positions = positionsRes.data;
    const trades = tradesRes.data;

    // Calculate total PnL if needed
    let totalPnL = 0;
    positions.forEach(pos => {
      totalPnL += pos.unrealized_pnl || 0;
    });

    res.status(200).json({
      totalPnL,
      positions,
      trades,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching PnL from Upstox",
      error: err.response?.data || err.message,
    });
  }
};
