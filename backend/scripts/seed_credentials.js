import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { encrypt } from '../utils/encryption.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

// CREDENTIALS TO SEED (From provided Excel screenshot)
const SEED_CREDENTIALS = [
    {
        provider: "FMP",
        label: "Financial Modeling Prep",
        key: "hir0KvHzfiiY4a6qgf22gQ4StnwVyon9",
        secret: null
    },
    {
        provider: "TWELVEDATA",
        label: "Twelve Data",
        key: "f98143ed7873474e9cf436b095df8545",
        secret: null
    },
    {
        provider: "FRED",
        label: "Federal Reserve Economic Data",
        key: "42344b66df6d2f92c16f5892426dc904",
        secret: null
    },
    {
        provider: "NEWSAPI",
        label: "NewsAPI.org",
        key: "ee8f9ebd-5e73-452f-9298-1aff2506e1e6", // Fixing typo in key if any, assuming standard format
        secret: null
    },
    {
        provider: "UPSTOX",
        label: "Upstox (Official)",
        key: "fff3e2b7-f0de-4d6b-88f3-381004173166",
        secret: "fr3l2e79bb"
    },
    {
        provider: "ALPHAVANTAGE",
        label: "Alpha Vantage",
        key: "AZF1GUZ8NQ32MBOA",
        secret: null
    },
    {
        provider: "POLYGON",
        label: "Polygon.io",
        key: "f903a874-9f47-4edb-bce0-9f479f18dde2",
        secret: "zdSL4jc9mQYl1lv3_msMpP6QwmBpG7Qg"
    }
];

async function seedCredentials() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URI,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log("🌱 Connected to DB. Seeding Credentials...");

        for (const cred of SEED_CREDENTIALS) {
            const encKey = encrypt(cred.key);
            const encSecret = cred.secret ? encrypt(cred.secret) : null;

            await client.query(`
                INSERT INTO api_credentials (provider, label, key_encrypted, secret_encrypted, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (provider) 
                DO UPDATE SET 
                    label = EXCLUDED.label,
                    key_encrypted = EXCLUDED.key_encrypted,
                    secret_encrypted = EXCLUDED.secret_encrypted,
                    updated_at = NOW()
            `, [cred.provider, cred.label, encKey, encSecret]);

            console.log(`✅ Seeded: ${cred.provider}`);
        }

        console.log("\n✨ All credentials seeded successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seeding Failed:", err);
        process.exit(1);
    }
}

seedCredentials();
