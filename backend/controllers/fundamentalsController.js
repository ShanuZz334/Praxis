import axios from "axios";
import UpstoxAuth from "../models/UpstoxAuth.js";
import localDb from "../config/localDb.js";
import { getCache, setCache } from "../services/cacheService.js";

const UPSTOX_FUNDAMENTALS_URL = "https://api.upstox.com/v2/fundamentals";

export const getFundamentals = async (req, res) => {
    try {
        const auth = await UpstoxAuth.findOne().sort({ createdAt: -1 });
        if (!auth || !auth.accessToken) {
            return res.status(401).json({ error: "Upstox is not authenticated" });
        }

        const instrumentKey = req.query.instrument_key;
        if (!instrumentKey) return res.status(400).json({ error: "instrument_key is required" });

        const cacheKey = `fundamentals_${instrumentKey}`;
        let payload = getCache(cacheKey);

        if (!payload) {
            // Lookup ISIN from local DB
            const row = localDb.prepare("SELECT isin FROM instruments WHERE instrument_key = ?").get(instrumentKey);
            
            let isin = row ? row.isin : null;

            if (!isin) {
                // Indices don't have an ISIN or fundamental data via this Upstox API
                payload = { ratios: [], income: [], balanceSheet: [], cashFlow: [], holdings: [], calculated_at: Date.now() };
            } else {
                const headers = {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${auth.accessToken}`
                };

                // Fetch all 5 endpoints concurrently
                const endpoints = [
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/key-ratios`, { headers }).catch(e => { console.log('Ratios Error:', e.response?.data || e.message); return { data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/income-statement?type=consolidated&time_period=yearly&fs=true`, { headers }).catch(e => { console.log('Income Error:', e.response?.data || e.message); return { data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/balance-sheet?type=consolidated&fs=true`, { headers }).catch(e => { console.log('Balance Error:', e.response?.data || e.message); return { data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/cash-flow?type=consolidated&fs=true`, { headers }).catch(e => { console.log('CashFlow Error:', e.response?.data || e.message); return { data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/share-holdings`, { headers }).catch(e => { console.log('Holdings Error:', e.response?.data || e.message); return { data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/corporate-actions`, { headers }).catch(e => { console.log('CorpActions Error:', e.response?.data || e.message); return { data: { data: [] }}; }),
                    axios.get(`${UPSTOX_FUNDAMENTALS_URL}/${isin}/profile`, { headers }).catch(e => { console.log('Profile Error:', e.response?.data || e.message); return { data: { data: {} }}; })
                ];

                const [ratiosRes, incomeRes, balanceRes, cashRes, holdingsRes, corpActionsRes, profileRes] = await Promise.all(endpoints);

                payload = {
                    ratios: ratiosRes.data?.data || [],
                    income: incomeRes.data?.data || {},
                    balanceSheet: balanceRes.data?.data || {},
                    cashFlow: cashRes.data?.data || {},
                    holdings: holdingsRes.data?.data || [],
                    corporate_actions: corpActionsRes.data?.data || [],
                    company_profile: profileRes.data?.data || {},   // full object: sector, sector_market_cap_inr, etc.
                    calculated_at: Date.now()
                };
            }

            setCache(cacheKey, payload, 86400); // 24 hours TTL
        }

        // Live Global India VIX Injection (Fetched from local high-frequency DB)
        const vixQuote = localDb.prepare("SELECT ltp, updated_at FROM quotes WHERE instrument_key = 'NSE_INDEX|India VIX'").get();
        if (vixQuote && vixQuote.ltp) {
            payload.india_vix = vixQuote.ltp;
            if (vixQuote.updated_at) payload.vix_updated_at = vixQuote.updated_at;
        }

        return res.json({ status: "success", data: payload, cached: !!getCache(cacheKey) });



    } catch (error) {
        console.error("Error fetching fundamentals:", error?.response?.data || error.message);
        res.status(500).json({ error: "Internal server error while fetching fundamentals" });
    }
};
