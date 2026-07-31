import express from "express";
import { NseIndia } from "stock-nse-india";

const router = express.Router();
const nse = new NseIndia();

let breadthCache = null;
let lastBreadthFetchTime = 0;
const BREADTH_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

router.get("/breadth", async (req, res) => {
    if (breadthCache && (Date.now() - lastBreadthFetchTime < BREADTH_CACHE_TTL)) {
        return res.json({ status: "success", cached: true, data: breadthCache });
    }

    try {
        const [indices, highs, lows] = await Promise.all([
            nse.getAllIndices().catch(() => null),
            nse.getDataByEndpoint('/api/live-analysis-52Week?index=high').catch(() => null),
            nse.getDataByEndpoint('/api/live-analysis-52Week?index=low').catch(() => null)
        ]);

        let advances = 0;
        let declines = 0;

        if (indices && indices.data) {
            const n500 = indices.data.find(d => d.indexSymbol === 'NIFTY 500');
            if (n500) {
                advances = parseInt(n500.advances) || 0;
                declines = parseInt(n500.declines) || 0;
            } else {
                const n50 = indices.data.find(d => d.indexSymbol === 'NIFTY 50');
                if (n50) {
                    advances = parseInt(n50.advances) || 0;
                    declines = parseInt(n50.declines) || 0;
                }
            }
        }

        let newHighs = 0;
        let newLows = 0;

        if (highs) {
            newHighs = (highs.dataLtpGreater20?.length || 0) + (highs.dataLtpLess20?.length || 0);
        }
        if (lows) {
            newLows = (lows.dataLtpGreater20?.length || 0) + (lows.dataLtpLess20?.length || 0);
        }

        breadthCache = {
            advances,
            declines,
            netAdvances: advances - declines,
            breadthRatio: declines > 0 ? (advances / declines) : null,
            newHighs,
            newLows,
            nhnlRatio: newLows > 0 ? (newHighs / newLows) : null
        };
        lastBreadthFetchTime = Date.now();

        res.json({ status: "success", data: breadthCache });
    } catch (e) {
        console.error("Failed to fetch market breadth", e.message);
        res.status(500).json({ status: "error", message: e.message });
    }
});

export default router;
