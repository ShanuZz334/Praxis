import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config(); // Ensures process.env is loaded

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export const encrypt = (text) => {
    if (!text) return null;
    const secretKey = process.env.ENCRYPTION_SECRET;
    if (!secretKey || secretKey.length < 32) throw new Error("ENCRYPTION_SECRET is missing or too short.");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey.substring(0, 32)), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decrypt = (text) => {
    if (!text) return null;
    const secretKey = process.env.ENCRYPTION_SECRET;
    if (!secretKey || secretKey.length < 32) throw new Error("ENCRYPTION_SECRET is missing or too short.");

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
