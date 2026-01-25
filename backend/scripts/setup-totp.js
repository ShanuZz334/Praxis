import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

if (!globalThis.crypto) {
    globalThis.crypto = crypto;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupTOTP = async () => {
    const secret = generateSecret();
    const user = 'Admin';
    const service = 'Stocky';
    const otpauth = generateURI({ secret, label: user, issuer: service });

    console.log('--- STOCKY ADMIN TOTP SETUP ---');
    console.log('Secret:', secret);
    console.log('OTP Auth URI:', otpauth);
    console.log('\nScanning this QR code in Google Authenticator will set up the master TOTP.');

    try {
        const qrPath = path.join(__dirname, 'totp-qr.png');
        await QRCode.toFile(qrPath, otpauth);
        console.log(`\nQR Code saved to: ${qrPath}`);
        console.log('IMPORTANT: Delete this image after scanning. The secret should be stored securely in your .env file.');

        // Update .env safely
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        const secretKey = 'TOTP_MASTER_SECRET';
        const newSecretLine = `${secretKey}=${secret}`;

        if (envContent.includes(secretKey)) {
            // Replace existing
            const regex = new RegExp(`${secretKey}=.*`, 'g');
            envContent = envContent.replace(regex, newSecretLine);
            console.log(`.env updated: Replaced existing ${secretKey}`);
        } else {
            // Append
            envContent += `\n${newSecretLine}\n`;
            console.log(`.env updated: Appended new ${secretKey}`);
        }

        fs.writeFileSync(envPath, envContent);

    } catch (err) {
        console.error('Error generating QR code or saving secret:', err);
    }
};

setupTOTP();
