// services/pnlService.js
import Upstox from "upstox"; // Replace with actual SDK or HTTP wrapper

const upstox = new Upstox({
  apiKey: process.env.UPSTOX_API_KEY,
  accessToken: process.env.UPSTOX_ACCESS_TOKEN,
});

// Fetch live positions & trades
export const fetchLivePnL = async () => {
  try {
    // 1️⃣ Get open positions
    const positions = await upstox.getPositions(); // returns array of positions

    // 2️⃣ Calculate PnL for each position
    const pnlData = positions.map(pos => {
      const unrealizedPnL = (pos.last_price - pos.average_price) * pos.quantity;
      const tradeType = pos.buy_quantity > 0 ? "BUY" : "SELL";
      return {
        symbol: pos.symbol,
        quantity: pos.quantity,
        entry_price: pos.average_price,
        last_price: pos.last_price,
        trade_type: tradeType,
        unrealizedPnL,
        fees: pos.fees || 0,
        pnl: unrealizedPnL - (pos.fees || 0),
      };
    });

    // 3️⃣ Total PnL
    const totalPnL = pnlData.reduce((sum, t) => sum + t.pnl, 0);

    return { pnlData, totalPnL };
  } catch (err) {
    console.error("Error fetching PnL from Upstox:", err);
    return { pnlData: [], totalPnL: 0 };
  }
};
