import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { decrypt } from './utils/encryption.js';
import FMPProvider from './services/providers/fmp.provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Client } = pg;

async function testFMP() {
    console.log("🔍 Testing FMP Provider Integration...\n");

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URI,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();

        // 1. Get Credential
        const res = await client.query("SELECT * FROM api_credentials WHERE provider = 'FMP'");
        if (res.rows.length === 0) {
            console.error("❌ FMP Credential not found in DB.");
            process.exit(1);
        }

        const cred = res.rows[0];
        const decryptedKey = decrypt(cred.key_encrypted);

        console.log("✅ Credential retrieved and decrypted.");

        // 2. Initialize Provider
        const fmp = new FMPProvider();
        await fmp.init({
            key: decryptedKey,
            secret: null,
            extra: null
        });

        // 3. Health Check
        console.log("📡 Running Health Check...");
        const health = await fmp.healthCheck();
        console.log("   Status:", health);

        if (health.status !== 'UP') {
            console.warn("⚠️ Health check failed or degraded.");
        }

        // 4. Fetch Fundamentals
        console.log("\n📊 Fetching Fundamentals for AAPL...");
        const fundamentals = await fmp.fetchFundamentals("AAPL");

        if (fundamentals) {
            console.log("✅ Fundamentals fetched successfully:");
            console.log(`   Name: ${fundamentals.name}`);
            console.log(`   Price: $${fundamentals.price}`);
            console.log(`   Market Cap: $${(fundamentals.mcap / 1e9).toFixed(2)}B`);
            console.log(`   PE Ratio: ${fundamentals.pe}`);
        } else {
            console.error("❌ Failed to fetch fundamentals (null response).");
        }

    } catch (err) {
        console.error("❌ Test Failed:", err.message);
        if (err.response) {
            console.error("   Status:", err.response.status);
            console.error("   Data:", JSON.stringify(err.response.data, null, 2));
        }
    } finally {
        await client.end();
    }
}

testFMP();
