import express from "express";
import axios from "axios";
import { nseDataService } from "../services/nseDataService.js";
import { yahooFinanceService } from "../services/yahooFinanceService.js";
import { fredApiService } from "../services/fredApiService.js";
import { coinGeckoService } from "../services/coinGeckoService.js";
import { frankfurterApiService } from "../services/frankfurterApiService.js";
import { rbiApiService } from "../services/rbiApiService.js";
import { moneycontrolService } from "../services/moneycontrolService.js";
import { screenerService } from "../services/screenerService.js";
import { getUpstoxLiveToken } from "../utils/upstoxAuthHelper.js";

const router = express.Router();

async function checkProviderHealth(provider) {
    const start = performance.now();
    let status = "UP";
    let sampleData = "Connected";
    let configured = true;

    try {
        if (provider === "upstox") {
            let token;
            try {
                token = await getUpstoxLiveToken();
            } catch (tokenErr) {
                configured = false;
                throw tokenErr;
            }
            if (!token) {
                configured = false;
                throw new Error("No live token found");
            }
            try {
                const res = await axios.get("https://api.upstox.com/v2/user/profile", {
                    headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
                    timeout: 6000
                });
                sampleData = `Active User: ${res.data?.data?.user_name || "Verified"}`;
            } catch (profileErr) {
                configured = false;
                throw profileErr;
            }
        } else if (provider === "nse") {
            const pingRes = await nseDataService.ping();
            if (pingRes.status === "OFFLINE") throw new Error(pingRes.error || "NSE feed returned null");
            sampleData = pingRes.sampleData;
        } else if (provider === "moneycontrol") {
            const pingRes = await moneycontrolService.ping();
            if (pingRes.status === "OFFLINE") throw new Error(pingRes.error || "Moneycontrol ping failed");
            sampleData = pingRes.sampleData;
        } else if (provider === "screener") {
            const pingRes = await screenerService.ping();
            if (pingRes.status === "OFFLINE") throw new Error(pingRes.error || "Screener ping failed");
            sampleData = pingRes.sampleData;
        } else if (provider === "fred") {
            const gdp = await fredApiService.getGDPGrowth();
            if (gdp === null) throw new Error("FRED GDP returned null");
            sampleData = `India GDP Growth: ${gdp}%`;
        } else if (provider === "yahoo") {
            const vix = await yahooFinanceService.getVix();
            if (vix === null) throw new Error("Yahoo VIX returned null");
            sampleData = `India VIX: ${vix.toFixed(2)}`;
        } else if (provider === "coinGecko") {
            const btc = await coinGeckoService.getBitcoinPrice();
            if (btc === null) throw new Error("CoinGecko returned null");
            sampleData = `BTC: $${btc.toLocaleString()}`;
        } else if (provider === "frankfurter") {
            const rate = await frankfurterApiService.getEurUsd();
            if (rate === null) throw new Error("Frankfurter returned null");
            sampleData = `EUR/USD: ${rate}`;
        } else if (provider === "rbi") {
            const repo = await rbiApiService.getRepoRate();
            sampleData = `Policy Repo Rate: ${repo}%`;
        } else if (provider === "amfi") {
            const res = await axios.get("https://www.amfiindia.com/spages/NAVAll.txt", {
                headers: {
                    "Range": "bytes=0-500",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                timeout: 7000
            });
            if (res.status !== 200 && res.status !== 206) throw new Error("AMFI server returned status " + res.status);
            sampleData = "AMFI NAV Feed Verified";
        } else {
            return { provider, status: "OFFLINE", latency: 0, sampleData: "Unknown Provider", configured: false };
        }

        const latency = Math.round(performance.now() - start);
        return { provider, status, latency, sampleData, configured };
    } catch (err) {
        const latency = Math.round(performance.now() - start);
        return { provider, status: "OFFLINE", latency, error: err.message || "Connection Failed", configured };
    }
}

/**
 * @route   GET /api/v1/health/all
 * @desc    Get real live health status of all data providers in parallel
 */
router.get("/all", async (req, res) => {
    const allProviders = [
        "upstox", "fred", "yahoo", "rbi", "coinGecko", "frankfurter", "amfi",
        "nse", "moneycontrol", "screener"
    ];

    const results = await Promise.all(allProviders.map(p => checkProviderHealth(p)));
    res.json({ status: "success", providers: results, timestamp: new Date().toISOString() });
});

/**
 * @route   GET /api/v1/health/ping/:provider
 * @desc    Ping an individual data provider
 */
router.get("/ping/:provider", async (req, res) => {
    const { provider } = req.params;
    const result = await checkProviderHealth(provider);
    res.json(result);
});

export default router;
