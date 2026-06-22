import { Worker } from 'bullmq';
import redisConnection from '../../config/redis.js';
import { query } from '../../config/postgres.js';
import UpstoxProvider from '../providers/upstox.provider.js';
import TwelveDataProvider from '../providers/twelveData.provider.js';
import FMPProvider from '../providers/fmp.provider.js';
import { decrypt } from '../../utils/encryption.js';

// Provider Instances Cache
const providers = {
    UPSTOX: new UpstoxProvider(),
    TWELVEDATA: new TwelveDataProvider(),
    FMP: new FMPProvider()
};

/**
 * Initialize a provider with credentials from DB
 */
async function getInitializedProvider(name) {
    const provider = providers[name];
    if (provider.isInitialized && (name !== 'UPSTOX' || provider.accessToken)) {
        return provider;
    }

    try {
        const res = await query("SELECT * FROM api_credentials WHERE provider = $1", [name]);
        if (res.rows.length === 0) return null;

        const cred = res.rows[0];
        const key = decrypt(cred.key_encrypted);
        const secret = cred.secret_encrypted ? decrypt(cred.secret_encrypted) : null;
        const extra = cred.extra_json_encrypted ? JSON.parse(decrypt(cred.extra_json_encrypted)) : {};

        await provider.init({ key, secret, extra });
        return provider;
    } catch (err) {
        console.error(`[Worker] Failed to init ${name}:`, err.message);
        return null;
    }
}

// Worker Processing Function
const processQuoteJob = async (job) => {
    const { symbols, preferredProvider } = job.data;

    if (!symbols || symbols.length === 0) {
        throw new Error("No symbols provided");
    }

    // fallback strategy
    const providerOrder = preferredProvider ? [preferredProvider, 'TWELVEDATA', 'FMP'] : ['TWELVEDATA', 'FMP'];

    let quotes = null;
    let usedProvider = null;

    for (const pName of providerOrder) {
        try {
            const provider = await getInitializedProvider(pName);
            if (!provider) continue;

            console.log(`[Worker] Fetching quotes from ${pName}...`);
            quotes = await provider.fetchRealtimeQuotes(symbols);

            if (quotes && quotes.length > 0) {
                usedProvider = pName;
                break; // Success
            }
        } catch (err) {
            console.warn(`[Worker] ${pName} failed:`, err.message);
        }
    }

    if (!quotes) {
        throw new Error("All providers failed to fetch quotes.");
    }

    // Persist to DB (Batch Insert)
    // For simplicity, we loop. In production, use pg-format or UNNEST
    for (const q of quotes) {
        // We'll store this in a 'rt_quotes' table (need to create it if not exists)
        // For now, just logging to simulate ingestion
        console.log(`[Ingest] ${q.symbol}: ${q.ltp} (${usedProvider})`);

        // Example: Upsert into DB
        // await query(...)
    }

    return { count: quotes.length, provider: usedProvider };
};

// Initialize Worker
let worker = null;

if (redisConnection) {
    worker = new Worker('realtime-quotes', processQuoteJob, {
        connection: redisConnection,
        concurrency: 5
    });

    worker.on('completed', (job, returnvalue) => {
        console.log(`[Worker] Job ${job.id} completed. Fetched ${returnvalue.count} quotes via ${returnvalue.provider}.`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
    });

    console.log("[Worker] Quote Collector started.");
} else {
    console.warn("⚠️  Redis missing. Worker not started.");
}

export default worker;
