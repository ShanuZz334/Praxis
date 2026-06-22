import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

const secretKey = process.env.ENCRYPTION_KEY;

if (!secretKey || secretKey.length < 32) {
    console.warn("WARNING: ENCRYPTION_KEY is missing or too short. Credential encryption will fail.");
}

/**
 * Encrypts a text string using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted string format: iv:authTag:encryptedData
 */
export const encrypt = (text) => {
    if (!text) return null;
    if (!secretKey) throw new Error("Encryption key not configured");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey.substring(0, 32)), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts an encrypted string
 * @param {string} text - The encrypted string
 * @returns {string} - The decrypted text
 */
export const decrypt = (text) => {
    if (!text) return null;
    if (!secretKey) throw new Error("Encryption key not configured");

    const parts = text.split(':');
    if (parts.length !== 3) throw new Error("Invalid encrypted text format");

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey.substring(0, 32)), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
