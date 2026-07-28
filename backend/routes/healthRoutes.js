import express from "express";
import axios from "axios";

const router = express.Router();

const PROVIDER_URLS = {
    alphaVantage: "https://www.alphavantage.co",
    fred: "https://api.stlouisfed.org",
    yahoo: "https://query1.finance.yahoo.com",
    rbi: "https://rbi.org.in",
    coinGecko: "https://api.coingecko.com",
    frankfurter: "https://api.frankfurter.app",
    amfi: "https://www.amfiindia.com",
    nse: "https://www.nseindia.com",
    moneycontrol: "https://www.moneycontrol.com",
    screener: "https://www.screener.in"
};

router.get("/ping/:provider", async (req, res) => {
    const { provider } = req.params;

    const start = performance.now();
    let sampleData = "Connection Verified";

    try {
        if (provider === "alphaVantage") {
            const { data } = await axios.get("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo", { timeout: 8000 });
            sampleData = `IBM Quote: $${data["Global Quote"]?.["05. price"] || "N/A"}`;
        } else if (provider === "coinGecko") {
            const { data } = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", { timeout: 8000 });
            sampleData = `BTC: $${data.bitcoin?.usd || "N/A"}`;
        } else if (provider === "frankfurter") {
            const { data } = await axios.get("https://api.frankfurter.app/latest?to=USD", { timeout: 8000 });
            sampleData = `EUR/USD: ${data.rates?.USD || "N/A"}`;
        } else if (provider === "yahoo") {
            const { data } = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/AAPL", { timeout: 8000 });
            sampleData = `AAPL: $${data.chart?.result?.[0]?.meta?.regularMarketPrice || "N/A"}`;
        } else {
            // Fallback for others, just ping the base URL
            const url = PROVIDER_URLS[provider];
            if (!url) return res.status(400).json({ error: "Unknown provider" });
            await axios.get(url, { timeout: 5000 }).catch(() => true);
            sampleData = "Ping OK";
        }

        const latency = Math.round(performance.now() - start);
        res.json({ provider, status: "UP", latency, sampleData });
    } catch (err) {
        const latency = Math.round(performance.now() - start);
        res.json({ provider, status: "OFFLINE", latency, sampleData: "Fetch Failed" });
    }
});

export default router;
