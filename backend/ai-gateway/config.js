import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const AI_CONFIG = {
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    EMBEDDING_MODEL: 'nomic-embed-text',

    CIRCUIT_BREAKER: {
        MAX_FAILURES: 3,       
        RESET_TIMEOUT: 60000,  
    }
};
