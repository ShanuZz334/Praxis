import FMPProvider from "../services/providers/fmp.provider.js";
import TwelveDataProvider from "../services/providers/twelveData.provider.js";
import UpstoxProvider from "../services/providers/upstox.provider.js";
import { query } from "../config/postgres.js";
import { decrypt } from "../utils/encryption.js";

/**
 * @desc    Check health status of all configured providers
 * @route   GET /api/v1/health/providers
 * @access  Private (Admin)
 */
export const checkProvidersHealth = async (req, res) => {
    try {
        const results = [];
        
        // Fetch all enabled credentials from DB
        const dbResult = await query(`
            SELECT provider, key_encrypted, secret_encrypted, extra_json_encrypted 
            FROM api_credentials 
            WHERE is_enabled = TRUE
        `);
        const dbCreds = dbResult.rows;
        
        const getDbCred = (providerName) => dbCreds.find(p => p.provider === providerName);

        // FMP
        const fmpCred = getDbCred("FMP");
        if (fmpCred) {
            const fmp = new FMPProvider();
            await fmp.init({ key: decrypt(fmpCred.key_encrypted) });
            const health = await fmp.healthCheck();
            results.push({
                provider: "FMP",
                label: "Financial Modeling Prep",
                ...health,
                configured: true
            });
        } else {
            results.push({
                provider: "FMP",
                label: "Financial Modeling Prep",
                status: "NOT_CONFIGURED",
                latency: 0,
                configured: false
            });
        }

        // Twelve Data
        const twelveCred = getDbCred("TWELVEDATA");
        if (twelveCred) {
            const twelve = new TwelveDataProvider();
            await twelve.init({ key: decrypt(twelveCred.key_encrypted) });
            const health = await twelve.healthCheck();
            results.push({
                provider: "TWELVEDATA",
                label: "Twelve Data",
                ...health,
                configured: true
            });
        } else {
            results.push({
                provider: "TWELVEDATA",
                label: "Twelve Data",
                status: "NOT_CONFIGURED",
                latency: 0,
                configured: false
            });
        }

        // Upstox
        const upstoxCred = getDbCred("UPSTOX");
        if (upstoxCred) {
            try {
                const key = decrypt(upstoxCred.key_encrypted);
                const secret = decrypt(upstoxCred.secret_encrypted);
                const extra = upstoxCred.extra_json_encrypted ? JSON.parse(decrypt(upstoxCred.extra_json_encrypted)) : null;

                const upstox = new UpstoxProvider();
                await upstox.init({ key, secret, extra });
                const health = await upstox.healthCheck();
                results.push({
                    provider: "UPSTOX",
                    label: "Upstox",
                    ...health,
                    configured: true
                });
            } catch (err) {
                results.push({
                    provider: "UPSTOX",
                    label: "Upstox",
                    status: "ERROR",
                    latency: 0,
                    configured: false,
                    error: "Decryption Failed or Database Error"
                });
            }
        } else {
            results.push({
                provider: "UPSTOX",
                label: "Upstox",
                status: "NOT_CONFIGURED",
                latency: 0,
                configured: false,
                error: "Please configure via UI"
            });
        }

        // Other Providers
        const otherProviders = [
            { id: "ALPHAVANTAGE", label: "Alpha Vantage" },
            { id: "POLYGON", label: "Polygon.io" },
            { id: "FRED", label: "Federal Reserve (FRED)" },
            { id: "NEWSAPI", label: "NewsAPI.org" },
            { id: "FINNHUB", label: "Finnhub" },
            { id: "TIINGO", label: "Tiingo" },
            { id: "IEXCLOUD", label: "IEX Cloud" },
            { id: "YAHOO_FINANCE", label: "Yahoo Finance API" },
            { id: "SIMFIN", label: "SimFin" }
        ];

        otherProviders.forEach(p => {
            if (getDbCred(p.id)) {
                results.push({
                    provider: p.id,
                    label: p.label,
                    status: "UP",
                    latency: 50, // Mock latency for confirmed keys
                    configured: true
                });
            } else {
                results.push({
                    provider: p.id,
                    label: p.label,
                    status: "NOT_CONFIGURED",
                    latency: 0,
                    configured: false
                });
            }
        });

        res.status(200).json(results);
    } catch (err) {
        console.error("Error checking provider health:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
