import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { Client } = pg;

const connectionString = process.env.NEON_POSTGRES_URI;
console.log("Testing Connection String:", connectionString ? "Found (Hidden)" : "MISSING");

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000, // 10s timeout
});

console.log("Attempting to connect...");

async function test() {
    try {
        await client.connect();
        console.log("✅ Connected successfully!");
        const res = await client.query('SELECT NOW() as now');
        console.log("✅ Query successful. Server Time:", res.rows[0].now);
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection failed:");
        console.error(err);
        process.exit(1);
    }
}

test();
