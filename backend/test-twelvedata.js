import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { decrypt } from './utils/encryption.js';
import TwelveDataProvider from './services/providers/twelveData.provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Client } = pg;

async function testTwelveData() {
    console.log("🔍 Testing TwelveData Provider Integration...\n");

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URI,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();

        // 1. Get Credential
        const res = await client.query("SELECT * FROM api_credentials WHERE provider = 'TWELVEDATA'");
        if (res.rows.length === 0) {
            console.error("❌ TwelveData Credential not found in DB.");
            process.exit(1);
        }

        const cred = res.rows[0];
        const decryptedKey = decrypt(cred.key_encrypted);

        console.log("✅ Credential retrieved and decrypted.");

        // 2. Initialize Provider
        const provider = new TwelveDataProvider();
        await provider.init({
            key: decryptedKey,
            secret: null,
            extra: null
        });

        // 3. Health Check
        console.log("📡 Running Health Check...");
        const health = await provider.healthCheck();
        console.log("   Status:", health);

        if (health.status !== 'UP') {
            console.warn(`⚠️ Health check failed: ${health.error}`);
        } else {
            console.log("✅ Health Check Passed!");
        }

        // 4. Fetch Realtime Quote
        console.log("\n📊 Fetching Realtime Quote for AAPL...");
        const quotes = await provider.fetchRealtimeQuotes(["AAPL"]);

        if (quotes && quotes.length > 0) {
            const q = quotes[0];
            console.log("✅ Quote fetched successfully:");
            console.log(`   Symbol: ${q.symbol}`);
            console.log(`   LTP: $${q.ltp}`);
            console.log(`   Change: ${q.changePct}%`);
        } else {
            console.error("❌ Failed to fetch quote.");
        }

        // 5. Fetch OHLC
        console.log("\n🕯️ Fetching Daily OHLC for AAPL...");
        const candles = await provider.fetchOHLC("AAPL", "1day", 5);
        if (candles && candles.length > 0) {
            console.log(`✅ OHLC fetched successfully (${candles.length} candles).`);
            console.log(`   Latest Close: $${candles[0].close}`);
        } else {
            console.log("❌ Failed to fetch OHLC.");
        }

    } catch (err) {
        console.error("❌ Test Failed:", err);
    } finally {
        await client.end();
    }
}

testTwelveData();
