import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { decrypt } from './utils/encryption.js';
import UpstoxProvider from './services/providers/upstox.provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Client } = pg;

async function testUpstox() {
    console.log("🔍 Testing Upstox Provider Integration...\n");

    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URI,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();

        // 1. Get Credential
        const res = await client.query("SELECT * FROM api_credentials WHERE provider = 'UPSTOX'");
        if (res.rows.length === 0) {
            console.error("❌ Upstox Credential not found in DB.");
            process.exit(1);
        }

        const cred = res.rows[0];
        const decryptedKey = decrypt(cred.key_encrypted);
        const decryptedSecret = cred.secret_encrypted ? decrypt(cred.secret_encrypted) : null;
        const extra = cred.extra_json_encrypted ? JSON.parse(decrypt(cred.extra_json_encrypted)) : {};

        console.log("✅ Credential retrieved and decrypted.");

        // 2. Initialize Provider
        const provider = new UpstoxProvider();
        await provider.init({
            key: decryptedKey,
            secret: decryptedSecret,
            extra: extra
        });

        // 3. Health Check
        console.log("📡 Running Health Check...");
        const health = await provider.healthCheck();
        console.log("   Status:", health);

        if (health.status === 'DOWN' && health.error.includes("Token")) {
            console.log("⚠️ Expected Result: Token is missing or expired. Upstox requires daily login.");
            console.log("   To fix: You will need to generate an access_token and update the credential.");
        } else if (health.status === 'UP') {
            console.log("✅ Health Check Passed!");
        } else {
            console.warn(`⚠️ Health check failed: ${health.error}`);
        }

    } catch (err) {
        console.error("❌ Test Failed:", err);
    } finally {
        await client.end();
    }
}

testUpstox();
