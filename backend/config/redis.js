import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.REDIS_URL;

let connection = null;

if (connectionString) {
    connection = new IORedis(connectionString, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    });

    connection.on('error', (err) => {
        console.error('[Redis] Connection Error:', err.message);
    });

    connection.on('connect', () => {
        console.log('[Redis] Connected successfully.');
    });
} else {
    console.warn("⚠️  REDIS_URL is missing. Background queues will NOT function.");
}

export default connection;
