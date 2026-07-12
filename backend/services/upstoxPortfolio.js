import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import db from "../config/localDb.js";
import { broadcast } from "./socketBroadcast.js";

const UPSTOX_BASE_URL = "https://api.upstox.com/v2";

const getAuthToken = async () => {
    const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
    if (!auth || !auth.accessToken) throw new Error("Upstox is not authenticated");
    return auth.accessToken;
};

const insertHoldingStmt = db.prepare(`
    INSERT INTO holdings (
        instrument_key, trading_symbol, quantity, average_price, current_value, pnl, day_change
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(instrument_key) DO UPDATE SET
        trading_symbol=excluded.trading_symbol,
        quantity=excluded.quantity,
        average_price=excluded.average_price,
        current_value=excluded.current_value,
        pnl=excluded.pnl,
        day_change=excluded.day_change,
        updated_at=CURRENT_TIMESTAMP
`);

export const syncHoldings = async () => {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${UPSTOX_BASE_URL}/portfolio/long-term-holdings`, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });

        const holdings = response.data?.data || [];
        
        const insertAll = db.transaction((items) => {
            for (const h of items) {
                insertHoldingStmt.run(
                    h.instrument_token, h.tradingsymbol, h.quantity, h.average_price, 
                    h.last_trade_price * h.quantity, h.pnl, h.day_change
                );
            }
        });

        if (holdings.length > 0) insertAll(holdings);
        
        broadcast("holding:update", holdings);
        return holdings;
    } catch (error) {
        console.error("❌ Failed to sync holdings:", error?.response?.data || error.message);
    }
};

const insertPositionStmt = db.prepare(`
    INSERT INTO positions (
        instrument_key, trading_symbol, net_quantity, buy_quantity, sell_quantity, 
        average_price, unrealized_pnl, realized_pnl
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(instrument_key) DO UPDATE SET
        trading_symbol=excluded.trading_symbol,
        net_quantity=excluded.net_quantity,
        buy_quantity=excluded.buy_quantity,
        sell_quantity=excluded.sell_quantity,
        average_price=excluded.average_price,
        unrealized_pnl=excluded.unrealized_pnl,
        realized_pnl=excluded.realized_pnl,
        updated_at=CURRENT_TIMESTAMP
`);

export const syncPositions = async () => {
    try {
        const token = await getAuthToken();
        const response = await axios.get(`${UPSTOX_BASE_URL}/portfolio/short-term-positions`, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` }
        });

        const positions = response.data?.data || [];
        
        const insertAll = db.transaction((items) => {
            for (const p of items) {
                insertPositionStmt.run(
                    p.instrument_token, p.tradingsymbol, p.quantity, p.buy_quantity, p.sell_quantity,
                    p.average_price, p.unrealised, p.realised
                );
            }
        });

        if (positions.length > 0) insertAll(positions);
        
        broadcast("position:update", positions);
        return positions;
    } catch (error) {
        console.error("❌ Failed to sync positions:", error?.response?.data || error.message);
    }
};
