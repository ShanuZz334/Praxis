import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root (one level up from config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

// Use NEON_POSTGRES_URI from env
const connectionString = process.env.NEON_POSTGRES_URI;

if (!connectionString) {
    console.error("CRITICAL: NEON_POSTGRES_URI is undefined. Check backend/.env file.");
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 20, // Max clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export const checkConnection = async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');

        // Ensure table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS chart_data (
                id SERIAL PRIMARY KEY,
                metric_key VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                value NUMERIC(10, 4) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(metric_key, date)
            );
        `);

        // Ensure events table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                date TIMESTAMP NOT NULL,
                category VARCHAR(50),
                impact_score NUMERIC(5, 2),
                consensus VARCHAR(100),
                previous VARCHAR(100),
                market_sensitivity VARCHAR(20),
                type VARCHAR(20) DEFAULT 'event',
                reliability NUMERIC(3, 2) DEFAULT 0.5,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Ensure options_chain table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS options_chain (
                id SERIAL PRIMARY KEY,
                symbol VARCHAR(20) NOT NULL,
                expiry DATE NOT NULL,
                strike NUMERIC(10, 2) NOT NULL,
                call_ltp NUMERIC(10, 2), call_oi INT, call_oi_chg NUMERIC(10, 2), call_vol INT, call_iv NUMERIC(5, 2), call_delta NUMERIC(5, 3), call_gamma NUMERIC(8, 6), call_theta NUMERIC(8, 3), call_vega NUMERIC(8, 3),
                put_ltp NUMERIC(10, 2), put_oi INT, put_oi_chg NUMERIC(10, 2), put_vol INT, put_iv NUMERIC(5, 2), put_delta NUMERIC(5, 3), put_gamma NUMERIC(8, 6), put_theta NUMERIC(8, 3), put_vega NUMERIC(8, 3),
                UNIQUE(symbol, expiry, strike)
            );
        `);

        // Ensure api_credentials table exists
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

        client.release();
        console.log(`Neon PostgreSQL Connected & Schema Verified`);
        return true;
    } catch (err) {
        console.error('Neon PostgreSQL Connection Error:', err);
        return false;
    }
};

export default pool;
