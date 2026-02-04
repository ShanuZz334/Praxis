/**
 * @file encryption.js
 * @purpose AES-256-CBC encryption utility for sensitive data.
 * @responsibilities
 * - Encrypts sensitive data (broker API keys, secrets, client IDs)
 * - Decrypts encrypted data for use
 * - Uses AES-256-CBC algorithm with random IVs
 * - Stores IV with encrypted data for decryption
 * @key_exports
 * - encrypt - Encrypts plain text
 * - decrypt - Decrypts encrypted text
 * @dependencies
 * - crypto - Node.js crypto module
 * @lifecycle
 * - Used by brokerController for credential encryption
 * - Requires ENCRYPTION_KEY environment variable (32 bytes)
 * @date 2026-02-04
 */

// =============================
// Imports
// =============================
import crypto from 'crypto';

// =============================
// Configuration
// =============================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);
const IV_LENGTH = 16;

// =============================
// Encryption Functions
// =============================

function encrypt(text) {
    if (!text) return '';

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text) return '';

    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// =============================
// Exports
// =============================
export { encrypt, decrypt };
