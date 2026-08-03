import express from "express";
import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import { getUpstoxAuthForMode } from "../utils/upstoxAuthHelper.js";

const router = express.Router();

/** Helper — determines active mode */
const getActiveUpstoxAuth = async () => {
    const liveAuth = await UpstoxAuth.findOne({ mode: 'live' }).sort({ createdAt: -1 });
    const sandboxAuth = await UpstoxAuth.findOne({ mode: 'sandbox' }).sort({ createdAt: -1 });
    
    let activeAuth = liveAuth;
    if (liveAuth && sandboxAuth) {
        activeAuth = liveAuth.updatedAt > sandboxAuth.updatedAt ? liveAuth : sandboxAuth;
    } else if (sandboxAuth && !liveAuth) {
        activeAuth = sandboxAuth;
    }
    
    return activeAuth;
};

const getUpstoxBaseUrl = (mode) => {
    return mode === 'sandbox' ? "https://api-sandbox.upstox.com/v2" : "https://api.upstox.com/v2";
};

// @route   POST /api/v1/orders/place
// @desc    Place a new order (Buy/Sell)
router.post("/place", async (req, res) => {
    try {
        const auth = await getActiveUpstoxAuth();
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox not connected" });
        }

        const baseUrl = auth.mode === 'sandbox' ? "https://api-sandbox.upstox.com/v2" : "https://api.upstox.com/v2";
        const { quantity, product, validity, price, instrument_token, instrument_key, order_type, transaction_type, disclosed_quantity, trigger_price, is_amo } = req.body;
        const instrumentKey = instrument_key || instrument_token; // Accept either field name for compatibility

        const payload = {
            quantity: parseInt(quantity),
            product: product || "D", // Delivery or Intraday (I)
            validity: validity || "DAY",
            price: parseFloat(price) || 0,
            instrument_token: instrumentKey, // Upstox V2 expects this
            instrument_key: instrumentKey, // Upstox V3/Some V2 endpoints expect this
            order_type: order_type || "MARKET", // MARKET, LIMIT, SL, SL-M
            transaction_type: transaction_type, // BUY or SELL
            disclosed_quantity: parseInt(disclosed_quantity) || 0,
            trigger_price: parseFloat(trigger_price) || 0,
            is_amo: is_amo || false,
            tag: req.body.tag || "praxis"
        };

        const response = await axios.post(`${baseUrl}/order/place`, payload, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.accessToken}`
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error("Order Place Error:", err.response?.data || err.message);
        res.status(500).json(err.response?.data || { error: "Failed to place order" });
    }
});

const getUpstoxV3BaseUrl = (mode) => {
    return mode === 'sandbox' ? "https://api-sandbox.upstox.com/v3" : "https://api.upstox.com/v3";
};

// @route   POST /api/v1/orders/gtt/place
// @desc    Place a new GTT order (Single or Multi-leg)
router.post("/gtt/place", async (req, res) => {
    try {
        const auth = await getActiveUpstoxAuth();
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox not connected" });
        }

        const baseUrl = auth.mode === 'sandbox' ? "https://api-sandbox.upstox.com/v3" : "https://api.upstox.com/v3";
        const { type, quantity, product, transaction_type, instrument_token, instrument_key, order_type, price, rules } = req.body;
        const instrumentKey = instrument_key || instrument_token;

        const payload = {
            type: type || "SINGLE", // SINGLE or MULTIPLE
            quantity: parseInt(quantity),
            product: product || "D", // D, I, or MTF
            transaction_type: transaction_type,
            instrument_token: instrumentKey, // Inject both to satisfy inconsistent Upstox APIs
            instrument_key: instrumentKey,
            order_type: order_type || "LIMIT",
            price: parseFloat(price) || 0,
            rules: rules || []
        };

        const response = await axios.post(`${baseUrl}/order/gtt/place`, payload, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth.accessToken}`
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error("GTT Order Place Error:", err.response?.data || err.message);
        res.status(500).json(err.response?.data || { error: "Failed to place GTT order" });
    }
});

// @route   GET /api/v1/orders/positions
// @desc    Get live positions
router.get("/positions", async (req, res) => {
    try {
        const auth = await getActiveUpstoxAuth();
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox not connected" });
        }

        const baseUrl = auth.mode === 'sandbox' ? "https://api-sandbox.upstox.com/v2" : "https://api.upstox.com/v2";
        
        const response = await axios.get(`${baseUrl}/portfolio/short-term-positions`, {
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${auth.accessToken}`
            }
        });

        res.json(response.data);
    } catch (err) {
        console.error("Fetch Positions Error:", err.response?.data || err.message);
        res.status(500).json(err.response?.data || { error: "Failed to fetch positions" });
    }
});

export default router;
