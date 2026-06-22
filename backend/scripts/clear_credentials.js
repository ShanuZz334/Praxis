import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

async function clearCredentials() {
    const client = new Client({
        connectionString: process.env.NEON_POSTGRES_URI,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        await client.connect();
        console.log("🌱 Connected to DB. Clearing Credentials...");

        await client.query(`DELETE FROM api_credentials;`);

        console.log("\n✨ All credentials cleared successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Clearing Failed:", err);
        process.exit(1);
    }
}

clearCredentials();
