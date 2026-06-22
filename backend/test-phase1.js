import { encrypt, decrypt } from './utils/encryption.js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Client } = pg;

async function testPhase1() {
    console.log("🔍 Starting Phase 1 Verification...\n");

    // 1. Test Encryption
    console.log("1️⃣  Testing Encryption Service...");
    const originalText = "super_secret_api_key_123";
    try {
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        if (originalText === decrypted) {
            console.log("✅ Encryption/Decryption working correctly.");
            console.log(`   Original: ${originalText}`);
            console.log(`   Encrypted: ${encrypted.substring(0, 20)}...`);
        } else {
            console.error("❌ Encryption verification failed!");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Encryption Error:", error.message);
        process.exit(1);
    }

    // 2. Test DB Connection & Schema
    console.log("\n2️⃣  Testing Database & Schema...");
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URI,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log("✅ Connected to Neon DB.");

        // Check if table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'api_credentials'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log("✅ Table 'api_credentials' exists.");
        } else {
            // Attempt to create it if missing (simulating server startup)
            console.log("⚠️ Table 'api_credentials' NOT found. Attempting creation...");
            await client.query(`
                CREATE TABLE IF NOT EXISTS api_credentials (
                    id SERIAL PRIMARY KEY,
                    provider VARCHAR(50) NOT NULL UNIQUE,
                    label VARCHAR(100),
                    key_encrypted TEXT,
                    secret_encrypted TEXT,
                    extra_json_encrypted TEXT,
                    is_enabled BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log("✅ Table 'api_credentials' created.");
        }

        // 3. Test Credential Insertion
        console.log("\n3️⃣  Testing Credential Storage...");
        const providerName = 'TEST_PROVIDER_' + Date.now();
        const testKey = 'test_key_value';
        const encKey = encrypt(testKey);

        const insertRes = await client.query(`
            INSERT INTO api_credentials (provider, label, key_encrypted)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [providerName, 'Test Label', encKey]);

        if (insertRes.rows.length > 0) {
            console.log("✅ Credential inserted successfully.");

            // Cleanup
            await client.query(`DELETE FROM api_credentials WHERE provider = $1`, [providerName]);
            console.log("✅ Test credential cleaned up.");
        } else {
            console.error("❌ Failed to insert credential.");
        }

    } catch (error) {
        console.error("❌ Database Error:", error);
    } finally {
        await client.end();
    }
}

testPhase1();
