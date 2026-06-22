import dotenv from 'dotenv';
import axios from 'axios';
import { encrypt, decrypt } from './utils/encryption.js';
import { query } from './config/postgres.js';
import FMPProvider from './services/providers/fmp.provider.js';
import TwelveDataProvider from './services/providers/twelveData.provider.js';

dotenv.config();

async function runDiagnostics() {
    console.log("================================================");
    console.log("   STOCKY API SYSTEM DIAGNOSTICS");
    console.log("================================================");

    // 1. Environment Variable Check
    console.log("\n[1] Environment Variables Check:");
    const envVars = [
        'PORT', 'NEON_POSTGRES_URI', 'ENCRYPTION_KEY',
        'FMP_API_KEY', 'TWELVEDATA_API_KEY', 'UPSTOX_API_KEY'
    ];
    envVars.forEach(v => {
        const val = process.env[v];
        console.log(`   ${v.padEnd(20)}: ${val ? '✅ CONFIGURED' : '❌ MISSING'}`);
    });

    // 2. Encryption System Check
    console.log("\n[2] Encryption System Integrity:");
    try {
        const testPhrase = "Stocky_Test_123_!@#";
        const encrypted = encrypt(testPhrase);
        const decrypted = decrypt(encrypted);
        if (decrypted === testPhrase) {
            console.log("   AES-256-GCM      : ✅ WORKING (Round-trip success)");
        } else {
            console.log("   AES-256-GCM      : ❌ FAILED (Mismatch)");
        }
    } catch (err) {
        console.log("   AES-256-GCM      : ❌ FAILED (" + err.message + ")");
    }

    // 3. FMP Direct Connectivity (with fixed key)
    console.log("\n[3] FMP Provider Verification:");
    const fmp = new FMPProvider();
    await fmp.init({ key: process.env.FMP_API_KEY });
    const fmpHealth = await fmp.healthCheck();
    console.log(`   Connection Status: ${fmpHealth.status === 'UP' ? '✅ UP' : '❌ ' + (fmpHealth.error || 'DOWN')}`);
    if (fmpHealth.latency) console.log(`   Latency          : ${fmpHealth.latency}ms`);

    // 4. Twelve Data Direct Connectivity
    console.log("\n[4] Twelve Data Verification:");
    const twelve = new TwelveDataProvider();
    await twelve.init({ key: process.env.TWELVEDATA_API_KEY });
    const twelveHealth = await twelve.healthCheck();
    console.log(`   Connection Status: ${twelveHealth.status === 'UP' ? '✅ UP' : '❌ ' + (twelveHealth.error || 'DOWN')}`);
    if (twelveHealth.latency) console.log(`   Latency          : ${twelveHealth.latency}ms`);

    // 5. Database & Upstox Credential Check
    console.log("\n[5] Upstox Credential Integrity (DB):");
    try {
        const dbRes = await query("SELECT provider, key_encrypted, extra_json_encrypted FROM api_credentials WHERE provider = 'UPSTOX'");
        if (dbRes.rowCount > 0) {
            const row = dbRes.rows[0];
            const key = decrypt(row.key_encrypted);
            const extra = row.extra_json_encrypted ? JSON.parse(decrypt(row.extra_json_encrypted)) : null;

            console.log("   DB Record        : ✅ FOUND");
            console.log("   Decryption       : ✅ SUCCESS");
            console.log(`   Access Token     : ${extra?.access_token ? '✅ PRESENT' : '❌ MISSING (Needs OAuth)'}`);
        } else {
            console.log("   DB Record        : ❌ NOT FOUND (Connect via OAuth UI)");
        }
    } catch (err) {
        console.log("   DB/Decryption    : ❌ FAILED (" + err.message + ")");
    }

    console.log("\n================================================");
    process.exit(0);
}

runDiagnostics();
